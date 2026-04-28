/// <reference types="vite/client" />

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
  /** Public App Store URL for the iPhone app. */
  readonly VITE_APP_STORE_URL?: string;
  /** Полный URL скрипта HitKeep, например http://localhost:8080/hk.js. Без переменной аналитика отключена. */
  readonly VITE_HITKEEP_SCRIPT_URL?: string;
  /** Public iOS SDK key from RevenueCat project settings. */
  readonly VITE_REVENUECAT_IOS_API_KEY?: string;
  /** Enables backend entitlement sync from the native RevenueCat runtime. */
  readonly VITE_REVENUECAT_SYNC_BACKEND?: string;
  /** RevenueCat entitlement to sync into family access, defaults to "plus". */
  readonly VITE_REVENUECAT_ENTITLEMENT_CODE?: string;
  /** Optional preferred RevenueCat package id to purchase from the current offering. */
  readonly VITE_REVENUECAT_DEFAULT_PACKAGE_ID?: string;
}
