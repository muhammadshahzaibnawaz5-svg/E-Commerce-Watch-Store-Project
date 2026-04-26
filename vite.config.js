import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'src/Pages/Products.html'),
        contact:  resolve(__dirname, 'src/Pages/Contact-Us.html'),
        signin:   resolve(__dirname, 'src/Pages/Sign-in.html'),
        admin:    resolve(__dirname, 'src/Pages/Admin.html'),
      },
    },
  },
})