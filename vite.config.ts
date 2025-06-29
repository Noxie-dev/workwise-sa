import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "./client",
  plugins: [react()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 600, // Increase the warning limit slightly
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-helmet-async'],
          'vendor-ui': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-scroll-area',
                        '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot',
                        '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toast',
                        '@radix-ui/react-tooltip'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'vendor-router': ['wouter'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  server: {
    port: 5174, // Preferred port, but will try others if unavailable
    host: true, // To ensure proper network connections
    strictPort: true, // Force the specified port
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678, // Dedicated port for HMR
      clientPort: 24678, // Ensure client connects to same port
      timeout: 120000, // Increase timeout for slower connections
      overlay: true, // Show errors as overlay
      reconnect: 10, // Retry connection 10 times
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
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      "/ws": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true, // Support websocket proxying
      }
    },
    cors: true, // Enable CORS for all origins
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared")
    },
    // Force Vite to resolve these dependencies from node_modules
    dedupe: ['react', 'react-dom', 'react-helmet-async', '@tanstack/react-query', '@tanstack/react-query-devtools']
  }
});
