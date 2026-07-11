import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // El plugin de devtools SOLO se carga en desarrollo
    ...(mode === 'development' ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // El proxy solo aplica a `npm run dev`, no afecta al build de producción
    proxy: {
      '/api': {
        target: 'https://localhost:7073',
        secure: false,
      }
    }
  }
}))
