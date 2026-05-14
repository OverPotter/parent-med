const PROD_API_ORIGIN = "https://parent-med-production.up.railway.app";
const DEV_API_ORIGIN = "http://localhost:8000";

export type MobileIllnessApiErrorOptions = {
  code?: string;
  detail?: string;
};

export function normalizeIllnessApiOrigin(raw: string | undefined) {
  const value = raw?.trim().replace(/\/+$/, "") ?? "";

  if (!value) {
    return __DEV__ ? DEV_API_ORIGIN : PROD_API_ORIGIN;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

const API_BASE_URL = `${normalizeIllnessApiOrigin(process.env.EXPO_PUBLIC_API_URL)}/api/v1`;

function parseErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const candidate = payload as {
    code?: unknown;
    detail?: unknown;
    message?: unknown;
  };

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    detail:
      typeof candidate.detail === "string"
        ? candidate.detail
        : typeof candidate.message === "string"
          ? candidate.message
          : undefined,
  };
}

export async function requestIllnessAuthedJson<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
  createError: (
    message: string,
    options?: MobileIllnessApiErrorOptions,
  ) => Error,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const { code, detail } = parseErrorPayload(payload);
    throw createError(detail ?? "Request failed", { code, detail });
  }

  return payload as T;
}
