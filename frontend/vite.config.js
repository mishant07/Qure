import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // backend endpoints used by src/services/api.js (same-origin in dev)
      '^/(predict|benchmark|health)/?$': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-tabs', '@radix-ui/react-label', '@radix-ui/react-slot', 'lucide-react', 'sonner'],
        },
      },
    },
  },
})
