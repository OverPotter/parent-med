/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  hk?: { event?: (name: string, props?: Record<string, unknown>) => void };
}

interface ImportMetaEnv {
  /** Origin бэкенда без пути; в коде к нему добавляется `/api/v1` */
  readonly VITE_API_URL?: string;
  /** Полный URL скрипта HitKeep, например http://localhost:8080/hk.js. Без переменной аналитика отключена. */
  readonly VITE_HITKEEP_SCRIPT_URL?: string;
  /** Соль для SHA-256 user_hash / child_id_hash в событиях (рекомендуется задать в проде). */
  readonly VITE_HITKEEP_USER_HASH_SALT?: string;
}
