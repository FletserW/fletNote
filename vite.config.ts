import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'


export default defineConfig({
  plugins: [
    react(),
    qrcode()
  ],
  server: {
    host: true
  }
})