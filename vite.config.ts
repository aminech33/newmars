import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Expose all env variables with VITE_ prefix
  envPrefix: 'VITE_',
  
  // Proxy API calls to backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  
  // Basic optimizations
  build: {
    minify: 'terser',
    sourcemap: false
  }
})
