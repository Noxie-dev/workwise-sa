import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      host: 'localhost',
    },
    fs: {
      allow: [
        // Allow serving files from the project root
        '..',
        // Allow serving Font Awesome webfonts
        path.resolve(__dirname, '../node_modules/@fortawesome/fontawesome-free/webfonts'),
        // Allow serving from node_modules for Font Awesome
        path.resolve(__dirname, '../node_modules')
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    // Force Vite to resolve these dependencies from node_modules
    dedupe: ['react', 'react-dom', 'react-helmet-async', '@tanstack/react-query', '@tanstack/react-query-devtools']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
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
          'vendor': ['react', 'react-dom', 'react-helmet-async', '@tanstack/react-query', '@tanstack/react-query-devtools'],
          'contact': [
            './src/pages/Contact/components/ContactForm',
            './src/pages/Contact/components/ContactInformation', 
            './src/pages/Contact/components/SupportCategoriesDisplay'
          ]
        }
      }
    }
  },
});
