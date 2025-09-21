import { defineConfig } from 'vite'
import pages from '@hono/vite-build/cloudflare-pages'

export default defineConfig({
  plugins: [
    pages({
      entry: 'src/index.tsx'
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})