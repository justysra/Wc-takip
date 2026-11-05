import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  base: '/Wc-takip/',
  plugins: [react(), tailwindcss()],
=======
  plugins: [react(), tailwindcss()],
  base: '/tuvalet-takip/',
>>>>>>> f98c1c4eb418319d87baabf1f290ac06466feed2
})
