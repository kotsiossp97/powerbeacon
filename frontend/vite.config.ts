import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.png", "robots.txt", "apple-touch-icon.png"],
    //   workbox: {
    //     navigateFallbackDenylist: [
    //       /^\/api(?:\/.*)?$/,
    //       /^\/health$/,
    //       /^\/install-agent\.(?:sh|ps1)$/,
    //       /^\/agents(?:\/.*)?$/,
    //       /^\/docs\/oauth2-redirect$/,
    //     ],
    //   },
    //   manifest: {
    //     name: "PowerBeacon | Wake-On-Lan Orchestration Platform",
    //     short_name: "PowerBeacon",
    //     start_url: "/",
    //     scope: "/",
    //     display: "standalone",
    //     background_color: "#ffffff",
    //     theme_color: "#434ae6",
    //     icons: [
    //       { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
    //       { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    //       {
    //         src: "/pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any maskable",
    //       },
    //     ],
    //   },
    // }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
