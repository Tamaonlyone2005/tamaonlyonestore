
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    // Naikkan batas peringatan size agar tidak muncul warning kuning di Vercel
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        // Teknik Code Splitting: Memisahkan library pihak ketiga (vendor) dari kode aplikasi utama
        // Ini membuat loading web lebih cepat dan cache lebih efisien
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
