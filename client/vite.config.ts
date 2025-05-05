import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
  },
  build: {
    rollupOptions: {
      external: [
        'react-helmet-async',
        '@tanstack/react-query',
        '@tanstack/react-query-devtools'
      ]
    }
  },
});
