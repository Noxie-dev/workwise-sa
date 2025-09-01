import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { bundleAnalyzer } from "./scripts/vite-bundle-analyzer.js";

export default defineConfig(({ mode }) => ({
  root: "./client",
  plugins: [
    react(),
    mode === 'analyze' && bundleAnalyzer(),
  ].filter(Boolean),
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200, // Increased warning limit to reduce noise
    minify: 'terser', // Better minification than esbuild for production
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    // Split vendor chunks more aggressively
    splitVendorChunkPlugin: true,
    rollupOptions: {
      output: {
        // Ensure chunks are properly named and hashed
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Improved code splitting strategy with smaller chunks
        manualChunks: (id) => {
          // Core React libraries - keep together for better caching
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          
          // Firebase - split into smaller chunks
          if (id.includes('node_modules/firebase/')) {
            if (id.includes('auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firestore')) {
              return 'vendor-firebase-firestore';
            }
            if (id.includes('storage')) {
              return 'vendor-firebase-storage';
            }
            if (id.includes('functions')) {
              return 'vendor-firebase-functions';
            }
            if (id.includes('analytics')) {
              return 'vendor-firebase-analytics';
            }
            return 'vendor-firebase-other';
          }
          
          // Radix UI components - more granular splitting
          if (id.includes('node_modules/@radix-ui/react-')) {
            if (id.includes('dialog') || id.includes('alert-dialog')) {
              return 'vendor-radix-dialogs';
            }
            if (id.includes('popover') || id.includes('tooltip') || id.includes('dropdown-menu')) {
              return 'vendor-radix-overlays';
            }
            if (id.includes('accordion') || id.includes('tabs') || id.includes('scroll-area')) {
              return 'vendor-radix-navigation';
            }
            if (id.includes('checkbox') || id.includes('switch') || id.includes('select') || 
                id.includes('label') || id.includes('progress')) {
              return 'vendor-radix-inputs';
            }
            return 'vendor-radix-other';
          }
          
          // Heavy libraries that should be separate
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }
          
          // PDF and document handling - these are heavy
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-document';
          }
          
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform/resolvers') || 
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          
          // React Query - separate devtools
          if (id.includes('node_modules/@tanstack/react-query')) {
            return id.includes('devtools') ? 'vendor-query-devtools' : 'vendor-query';
          }
          
          // Styling libraries
          if (id.includes('node_modules/styled-components') || 
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-styling';
          }
          
          // Icons and UI utilities
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          
          // Router
          if (id.includes('node_modules/wouter') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          
          // HTTP and API libraries
          if (id.includes('node_modules/axios') || id.includes('node_modules/node-fetch')) {
            return 'vendor-http';
          }
          
          // Helmet for SEO
          if (id.includes('node_modules/react-helmet')) {
            return 'vendor-helmet';
          }
          
          // AI/ML libraries
          if (id.includes('node_modules/@anthropic-ai/sdk') || 
              id.includes('node_modules/@google/generative-ai')) {
            return 'vendor-ai';
          }
          
          // Database libraries
          if (id.includes('node_modules/drizzle-orm') || 
              id.includes('node_modules/@prisma/client') ||
              id.includes('node_modules/better-sqlite3')) {
            return 'vendor-database';
          }
          
          // UI component libraries
          if (id.includes('node_modules/@headlessui') || 
              id.includes('node_modules/@floating-ui')) {
            return 'vendor-ui-components';
          }
          
          // Date libraries
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/dayjs') ||
              id.includes('node_modules/moment')) {
            return 'vendor-date';
          }
          
          // Utility libraries
          if (id.includes('node_modules/lodash') || 
              id.includes('node_modules/ramda')) {
            return 'vendor-utils-core';
          }
          
          // Other node_modules - split by size
          if (id.includes('node_modules')) {
            // Get the package name from the path
            const packageMatch = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (packageMatch) {
              const packageName = packageMatch[1];
              // Group smaller packages together
              return `vendor-${packageName.replace('@', '').split('/')[0]}`;
            }
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: true, // More reliable file watching
      interval: 1000, // Check for changes every second
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001", // Match the PORT in .env
        changeOrigin: true,
        secure: false,
        ws: true, // Support websocket proxying
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      "/ws": {
        target: "http://localhost:3001", // Match the PORT in .env
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
  },
  define: {
    // Ensure React is available globally for libraries that expect it
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  }
}));
