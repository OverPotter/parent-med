/**
 * Единый axios-клиент: baseURL, Bearer token, обработка 401.
 */

import axios, { type AxiosError } from "axios";

const baseURL = "/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** Токен для авторизации (MVP: можно хранить в Zustand или localStorage). */
let bearerToken: string | null = null;

export function setBearerToken(token: string | null): void {
  bearerToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (bearerToken) {
    config.headers.Authorization = `Bearer ${bearerToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setBearerToken(null);
      // При необходимости: редирект на логин или обновление токена
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  }
);
