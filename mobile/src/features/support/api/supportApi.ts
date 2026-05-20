import { getMobileApiBaseUrl } from "../../../shared/config/mobileRuntimeConfig";

type RawPublicSupportRequestResponse = {
  id: string;
  reply_contact: string;
  message: string;
  client_request_id: string;
  created_at: string;
};

export class MobileSupportApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileSupportApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

const API_BASE_URL = getMobileApiBaseUrl();

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

function buildClientRequestId() {
  const chunk = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");

  return `${chunk()}-${chunk().slice(0, 4)}-4${chunk().slice(0, 3)}-a${chunk().slice(0, 3)}-${chunk()}${chunk().slice(0, 4)}`;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const { code, detail } = parseErrorPayload(payload);
    throw new MobileSupportApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

export async function submitPublicSupportRequest(payload: {
  replyContact: string;
  message: string;
}) {
  const response = await requestJson<RawPublicSupportRequestResponse>(
    "/public-support",
    {
      method: "POST",
      body: JSON.stringify({
        reply_contact: payload.replyContact,
        message: payload.message,
        client_request_id: buildClientRequestId(),
      }),
    },
  );

  return {
    id: response.id,
    replyContact: response.reply_contact,
    message: response.message,
    clientRequestId: response.client_request_id,
    createdAt: response.created_at,
  };
}
