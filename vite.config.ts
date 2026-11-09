/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'] },
      manifest: {
        name: '라이프 RPG',
        short_name: '라이프RPG',
        description: '삶을 RPG로 바꾸는 자기계발 앱',
        lang: 'ko',
        display: 'standalone',
        start_url: './',
        scope: './',
        theme_color: '#14121f',
        background_color: '#14121f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'], environment: 'node' },
});
