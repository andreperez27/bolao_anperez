import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/bolao-copa-2026/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Bolão da Copa 2026",
        short_name: "Bolão 2026",
        description: "Sistema de bolão para a Copa do Mundo 2026",
        theme_color: "#0A0E1A",
        background_color: "#0A0E1A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/bolao-copa-2026/",
        scope: "/bolao-copa-2026/",
        icons: [
          { src: "icons/192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "flag-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/sjleucelnptbgyjofhnz\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
