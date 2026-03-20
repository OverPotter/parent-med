/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Origin бэкенда без пути; в коде к нему добавляется `/api/v1` */
  readonly VITE_API_URL?: string;
}
