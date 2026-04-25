/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  hk?: { event?: (name: string, props?: Record<string, unknown>) => void };
}

interface ImportMetaEnv {
  /** Origin бэкенда без пути; в коде к нему добавляется `/api/v1` */
  readonly VITE_API_URL?: string;
  /** Публичный origin клиентского приложения для ссылок шаринга и deep-link gateway. */
  readonly VITE_APP_SITE_URL?: string;
  /** Маркетинговый лендинг (абсолютный URL) для открытия из native auth-экрана. */
  readonly VITE_MARKETING_SITE_URL?: string;
  /** Полный URL скрипта HitKeep, например http://localhost:8080/hk.js. Без переменной аналитика отключена. */
  readonly VITE_HITKEEP_SCRIPT_URL?: string;
}
