import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  
  // Configuración de resolución de rutas
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  // Configuración de compilación
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['date-fns', 'uuid'],
          pdf: ['jspdf', 'html2canvas'],
          qr: ['qrcode', 'qr-scanner']
        },
      },
    },
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // Configuración base para rutas
  base: '/',
  
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  
  // Configuración de preview
  preview: {
    port: 4173,
    host: true,
  },
});