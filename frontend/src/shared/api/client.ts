/** Axios: baseURL, Bearer, 401 → refresh / logout. */

import axios, { type AxiosError } from "axios";
import { isCookieSessionMarker, sanitizeBearerToken } from "@shared/security/authSession";
import { useAppStore } from "@shared/store/useAppStore";
import type { AuthSessionResponse } from "@shared/types/api";
import { appLog } from "@shared/utils/appLog";

/** Origin API; без схемы — https:// префикс. */
function normalizeApiOrigin(raw: string): string {
  const s = raw.trim().replace(/\/+$/, "");
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_URL ?? "");
const baseURL = apiOrigin ? `${apiOrigin}/api/v1` : "/api/v1";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let bearerToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setBearerToken(token: string | null): void {
  bearerToken = token;
}

export function applySessionToClient(session: AuthSessionResponse): void {
  useAppStore.getState().setSession(session);
  setBearerToken(session.accessToken);
}

export function broadcastAuthLogout(): void {
  setBearerToken(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

export function resolveRequestBearerToken(args: {
  storeToken: string | null;
  inMemoryToken: string | null;
}): string | null {
  return sanitizeBearerToken(args.storeToken) ?? sanitizeBearerToken(args.inMemoryToken);
}

apiClient.interceptors.request.use((config) => {
  if (shouldSkipRefresh(config.url)) {
    if (config.headers && "Authorization" in config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  }

  const token = resolveRequestBearerToken({
    storeToken: useAppStore.getState().authToken,
    inMemoryToken: bearerToken,
  });
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
    url.includes("/auth/native/signin") ||
    url.includes("/auth/register") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/native/signup") ||
    url.includes("/auth/recover-password/verify") ||
    url.includes("/auth/recover-password/reset") ||
    url.includes("/auth/recover-password/code/reset") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/native/refresh")
  );
}

function shouldBroadcastLogoutFor401(url?: string): boolean {
  return !shouldSkipRefresh(url);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const failedUrl = `${originalRequest?.baseURL ?? ""}${originalRequest?.url ?? ""}`;
    const status = error.response?.status;
    const willRetry =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url);

    if (status !== undefined && status < 500 && !willRetry) {
      appLog.warn(`API ${status} ${failedUrl}`, error.response?.data ?? error.message);
    } else if (!willRetry) {
      appLog.error(`API ${status ?? "?"} ${failedUrl}`, error.response?.data ?? error.message);
    }

    if (willRetry) {
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
        if (isCookieSessionMarker(nextToken)) {
          if ("Authorization" in originalRequest.headers) {
            delete originalRequest.headers.Authorization;
          }
        } else {
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        appLog.warn("Сессия: refresh не удался, выход");
        broadcastAuthLogout();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && shouldBroadcastLogoutFor401(originalRequest?.url)) {
      broadcastAuthLogout();
    }
    return Promise.reject(error);
  }
);
