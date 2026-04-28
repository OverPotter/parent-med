import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const devCertDir = path.resolve(__dirname, "./dev-certs");
const devKeyPath = path.join(devCertDir, "local-dev-key.pem");
const devCertPath = path.join(devCertDir, "local-dev-cert.pem");
const hasDevHttpsCert = fs.existsSync(devKeyPath) && fs.existsSync(devCertPath);

/** Конфигурация Vite: алиасы и обычный web build для public website / iOS shell assets. */
export default defineConfig({
  plugins: [react()],
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
  build: {
    outDir: "www",
    emptyOutDir: true,
  },
});
