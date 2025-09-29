import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 443,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('../certs/dev.np-topvitaminsupply.com.key'),
      cert: fs.readFileSync('../certs/dev.np-topvitaminsupply.com.crt'),
    },
    hmr: {
      port: 443,
      host: 'dev.np-topvitaminsupply.com',
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: 'https://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
