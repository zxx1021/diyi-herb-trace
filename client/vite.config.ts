import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/diyi-herb-trace/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/trace': 'http://localhost:3001'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
