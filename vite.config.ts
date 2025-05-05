import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "./client",
  plugins: [react()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    port: 5174, // Preferred port, but will try others if unavailable
    host: true, // To ensure proper network connections
    // strictPort removed to allow alternative ports
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      // port and clientPort removed to allow automatic port selection
      timeout: 120000, // Increase timeout for slower connections
      overlay: true, // Show errors as overlay
    },
    watch: {
      usePolling: true, // More reliable file watching
      interval: 1000, // Check for changes every second
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true, // Support websocket proxying
      },
      "/ws": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true, // Support websocket proxying
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared")
    }
  }
});
