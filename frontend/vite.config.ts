import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: true },
      injectRegister: false,
      manifest: {
        name: "PowerBeacon | Wake-On-Lan Orchestration Platform",
        short_name: "PowerBeacon",
        background_color: "#ffffff",
        theme_color: "#7008e7",
        orientation: "any",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        screenshots: [
          {
            src: "/screenshots/screen-1.png",
            sizes: "640x480",
            type: "image/png",
          },
          {
            src: "/screenshots/screen-2.png",
            form_factor: "wide",
            sizes: "1280x720",
            type: "image/png",
          },
        ],
      },
    }),
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
        target: "http://localhost:8000",
        // changeOrigin: true,
        // rewrite: (path) => path,
      },
    },
  },
});
