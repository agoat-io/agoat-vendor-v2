import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'host-app',
      remotes: {
        'viewer-remote': {
          external: 'http://localhost:5175/assets/remoteEntry.js',
          from: 'vite',
          externalType: 'url'
        }
      },
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.0.0'
        },
        axios: {
          singleton: true
        },
        marked: {
          singleton: true
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        app: './index.html',
        'entry-server': './src/entry-server.ts'
      },
      external: [],
      output: {
        minifyInternalExports: false
      }
    }
  }
})
