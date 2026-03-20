/**
 * Единый axios-клиент: baseURL, Bearer token, обработка 401.
 */

import axios, { type AxiosError } from "axios";
import { useAppStore } from "@shared/store/useAppStore";

/**
 * VITE_API_URL — только origin бэкенда (https://api.example.com).
 * Пусто → относительный /api/v1 и прокси Vite на localhost:8000.
 */
const apiOrigin = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
const baseURL = apiOrigin ? `${apiOrigin}/api/v1` : "/api/v1";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Токен для авторизации (MVP: можно хранить в Zustand или localStorage). */
let bearerToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setBearerToken(token: string | null): void {
  bearerToken = token;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = bearerToken ?? useAppStore.getState().authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function shouldSkipRefresh(url?: string): boolean {
  return (
    !url ||
    url.includes("/auth/login") ||
    url.includes("/auth/signin") ||
    url.includes("/auth/register") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/refresh")
  );
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshHandler) {
          throw error;
        }
        refreshPromise ??= refreshHandler().finally(() => {
          refreshPromise = null;
        });
        const nextToken = await refreshPromise;
        if (!nextToken) {
          throw error;
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(originalRequest);
      } catch {
        setBearerToken(null);
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      setBearerToken(null);
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  }
);
