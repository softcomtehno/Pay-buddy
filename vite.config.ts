import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolve } from 'path'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = resolve(os.tmpdir(), 'pay-buddy-vite-cache')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
  cacheDir: cacheDir,
  optimizeDeps: {
    force: false,
  },
})

