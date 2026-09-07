import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '編みもの記録',
        short_name: '編みもの記録',
        description: '個人用の編み物制作管理アプリ',
        theme_color: '#fdfaf7',
        background_color: '#fdfaf7',
        display: 'standalone',
        lang: 'ja',
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
