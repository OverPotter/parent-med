import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const devCertDir = path.resolve(__dirname, "./dev-certs");
const devKeyPath = path.join(devCertDir, "local-dev-key.pem");
const devCertPath = path.join(devCertDir, "local-dev-cert.pem");
const hasDevHttpsCert = fs.existsSync(devKeyPath) && fs.existsSync(devCertPath);

/** Конфигурация Vite: алиасы, PWA (manifest + service worker). */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "pwa-icon.svg"],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "PillPath",
        short_name: "PillPath",
        description: "Family health tracking, medication plans and first aid kit",
        id: "/",
        scope: "/",
        theme_color: "#ebe4ff",
        background_color: "#ebe4ff",
        display: "standalone",
        display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
        orientation: "portrait",
        lang: "ru",
        start_url: "/",
        categories: ["medical", "health"],
        shortcuts: [
          {
            name: "Дети",
            short_name: "Дети",
            url: "/children",
          },
          {
            name: "Активные болезни",
            short_name: "Активные",
            url: "/illnesses/active",
          },
          {
            name: "Аптечка",
            short_name: "Аптечка",
            url: "/medicine-cabinet",
          },
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        importScripts: ["sw-custom.js"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@admin": path.resolve(__dirname, "./src/admin"),
      "@client": path.resolve(__dirname, "./src/client"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    https: hasDevHttpsCert
      ? {
          key: fs.readFileSync(devKeyPath),
          cert: fs.readFileSync(devCertPath),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    allowedHosts: [
      "parent-med-production-frontend.up.railway.app",
      "pillpath-production-frontend.up.railway.app",
    ],
    https: hasDevHttpsCert
      ? {
          key: fs.readFileSync(devKeyPath),
          cert: fs.readFileSync(devCertPath),
        }
      : undefined,
  },
});
