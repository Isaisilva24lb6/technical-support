import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy para desarrollo local (SIN Docker)
    // Redirige peticiones /api/* a Express (puerto 3000)
    // NOTA: Esta configuración NO afecta cuando usas Docker
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
