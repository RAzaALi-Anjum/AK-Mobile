import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Development server settings
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://ak-mobile.onrender.com', // Render backend URL
        changeOrigin: true,
      },
    },
  },

  // Build settings for production
  build: {
    outDir: 'dist',       // production build folder
    emptyOutDir: true,    // clean folder before build
  },

  // IMPORTANT: Use '/' (absolute), NOT './' (relative).
  // './' causes MIME type errors on sub-routes because browsers
  // resolve './assets/index.js' relative to the current URL path,
  // which returns text/html instead of the actual JS file.
  base: '/',
});