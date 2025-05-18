import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: '19' }],
          "@babel/plugin-transform-class-properties",
          "@babel/plugin-transform-object-rest-spread"
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
    // Force Vite to resolve these dependencies from node_modules
    dedupe: ['react', 'react-dom', 'react-helmet-async', '@tanstack/react-query', '@tanstack/react-query-devtools']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-helmet-async', '@tanstack/react-query', '@tanstack/react-query-devtools']
        }
      }
    }
  },
});
