import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

//port lock
  server: {
    port: 5173,
    strictPort: true 



 
  },
  build: {
    outDir: 'dist',
  },
  // ✅ client-side routing fallback
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      '@': '/src',
    },
  },
  base: '/',
});
