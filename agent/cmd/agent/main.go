package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/kotsios/powerbeacon-agent/internal/api"
	"github.com/kotsios/powerbeacon-agent/internal/client"
	"github.com/kotsios/powerbeacon-agent/internal/network"
)

const (
	// Version is the agent version
	Version = "1.0.0"
	// DefaultBackendURL is the default backend URL
	DefaultBackendURL = "http://localhost:8000"
	// DefaultPort is the default agent API port
	DefaultPort = "18080"
	// DefaultBindAddr is the default bind address so the backend can reach the agent.
	DefaultBindAddr = "0.0.0.0"
)

var (
	backendURL  = flag.String("backend", getEnv("BACKEND_URL", DefaultBackendURL), "Backend URL")
	port        = flag.String("port", getEnv("AGENT_PORT", DefaultPort), "Agent API port")
	bindAddr    = flag.String("bind", getEnv("AGENT_BIND", DefaultBindAddr), "Bind address")
	advertiseIP = flag.String("advertise-ip", getEnv("AGENT_ADVERTISE_IP", ""), "Explicit IP address to register with the backend")
	version     = flag.Bool("version", false, "Print version and exit")
)

func main() {
	flag.Parse()

	// Print version and exit
	if *version {
		fmt.Printf("PowerBeacon Agent v%s\n", Version)
		os.Exit(0)
	}

	log.Printf("PowerBeacon Agent v%s starting...", Version)
	if *advertiseIP != "" {
		if net.ParseIP(*advertiseIP) == nil {
			log.Fatalf("Invalid advertise IP %q", *advertiseIP)
		}
		log.Printf("Using configured advertise IP: %s", *advertiseIP)
	}

	// Display network information
	if err := displayNetworkInfo(); err != nil {
		log.Printf("Warning: could not display network info: %v", err)
	}

	// Parse listen port as integer for registration
	listenPort, err := strconv.Atoi(*port)
	if err != nil {
		log.Fatalf("Invalid port value %q: %v", *port, err)
	}

	// Create backend client
	backendClient := client.NewBackendClient(*backendURL, listenPort, Version, *advertiseIP)

	// Create stop channel for graceful shutdown
	stopCh := make(chan struct{})
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	// Register with backend (with retry)
	log.Printf("Registering with backend: %s", *backendURL)
	go func() {
		if err := backendClient.StartWithRetry(stopCh); err != nil {
			log.Printf("Registration failed: %v", err)
			return
		}

		// Start heartbeat loop after successful registration
		backendClient.StartHeartbeat(stopCh)
	}()

	// Create HTTP server
	router := mux.NewRouter()

	// Create WOL handler with live token authentication state.
	wolHandler := api.NewWOLHandler(backendClient.GetToken)

	// Register routes
	router.HandleFunc("/wol", wolHandler.HandleWOL).Methods("POST")
	router.HandleFunc("/health", wolHandler.HandleHealth).Methods("GET")
	router.HandleFunc("/info", wolHandler.HandleInfo).Methods("GET")

	// Add middleware
	router.Use(api.LoggingMiddleware)
	router.Use(api.CORSMiddleware)

	// Create HTTP server
	addr := fmt.Sprintf("%s:%s", *bindAddr, *port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start HTTP server in goroutine
	go func() {
		log.Printf("Starting HTTP API server on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	log.Printf("PowerBeacon Agent is running")
	log.Printf("  Backend: %s", *backendURL)
	log.Printf("  API: http://%s", addr)

	// Wait for shutdown signal
	<-sigCh
	log.Println("Shutdown signal received")

	// Stop background tasks
	close(stopCh)

	// Gracefully shutdown HTTP server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}

	log.Println("PowerBeacon Agent stopped")
}

// displayNetworkInfo displays information about network interfaces
func displayNetworkInfo() error {
	interfaces, err := network.GetNetworkInterfaces()
	if err != nil {
		return err
	}

	log.Println("Network Interfaces:")
	for _, iface := range interfaces {
		log.Printf("  %s: %s (Broadcast: %s)", iface.Name, iface.IPAddress, iface.Broadcast)
	}

	return nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
