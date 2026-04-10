import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Attendance Scanner',
        short_name: 'Scanner',
        description: 'Live OCR Attendance Scanner',
        theme_color: '#F0F4FC',
        background_color: '#F0F4FC',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3204/3204010.png', // Temporary generic icon
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
