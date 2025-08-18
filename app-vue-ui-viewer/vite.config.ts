import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'viewer-remote',
      filename: 'remoteEntry.js',
      exposes: {
        './PostViewer': './src/components/PostViewer.vue',
        './PostsList': './src/components/PostsList.vue',
        './ViewerApp': './src/App.vue'
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
    }
  },
  server: {
    port: 5175,
    cors: true,
    host: '0.0.0.0'
  },
  preview: {
    port: 5175,
    host: '0.0.0.0'
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        minifyInternalExports: false
      }
    }
  }
})
