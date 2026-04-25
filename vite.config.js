import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        // Root entry
        main: resolve(__dirname, 'index.html'),
        // All sub-pages — adjust paths to match exactly what's in your /src/Pages/ folder
        products:  resolve(__dirname, 'src/Pages/Products.html'),
        contact:   resolve(__dirname, 'src/Pages/Contact-Us.html'),
        signin:    resolve(__dirname, 'src/Pages/Sign-in.html'),
        // Add any Admin pages here too, e.g.:
        // admin: resolve(__dirname, 'src/Pages/Admin/index.html'),
      },
    },
  },
})