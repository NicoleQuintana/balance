import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: { chunkSizeWarningLimit: 1500 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'logos/*'],
      manifest: {
        name: 'Balance Uber/Didi',
        short_name: 'Balance',
        description: 'Lo que gano y lo que gasto haciendo Uber y Didi',
        lang: 'es-AR',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0b',
        theme_color: '#0a0a0b',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Las rutas del login de Google (/__/auth/...) no las tiene que atender la app.
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
})
