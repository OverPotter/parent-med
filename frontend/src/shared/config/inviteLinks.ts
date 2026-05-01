const DEFAULT_DEV_INVITE_BASE_URL = "https://192.168.0.160:5173";
export const DEV_LATEST_FAMILY_INVITE_PATH = "/join-family?dev-latest=1";

function normalizeAbsoluteBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return "";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

type InviteLinkEnv = Partial<
  Record<
    "VITE_API_URL" | "VITE_APP_SITE_URL" | "VITE_MARKETING_SITE_URL" | "VITE_DEV_INVITE_SITE_URL",
    string
  > & { DEV: boolean; MODE: string }
>;

function readEnvValue(
  key:
    | "VITE_API_URL"
    | "VITE_APP_SITE_URL"
    | "VITE_MARKETING_SITE_URL"
    | "VITE_DEV_INVITE_SITE_URL",
  envOverrides?: InviteLinkEnv
): string {
  if (envOverrides && typeof envOverrides[key] === "string") {
    return envOverrides[key] ?? "";
  }
  const env = (
    import.meta as ImportMeta & {
      env?: InviteLinkEnv;
    }
  ).env;
  return env?.[key] ?? "";
}

function normalizeApiOrigin(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isPrivateHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true;
  }
  const private172Match = hostname.match(/^172\.(\d{1,3})\./);
  if (!private172Match) {
    return false;
  }
  const secondOctet = Number.parseInt(private172Match[1] ?? "", 10);
  return secondOctet >= 16 && secondOctet <= 31;
}

export function resolveInvitePublicBaseUrl(
  currentOrigin?: string,
  envOverrides?: InviteLinkEnv
): string {
  const runtimeOrigin = (currentOrigin ?? "").trim();
  const env = (
    import.meta as ImportMeta & {
      env?: {
        DEV?: boolean;
        MODE?: string;
      } & InviteLinkEnv;
    }
  ).env;
  const isDevMode = Boolean(envOverrides?.DEV ?? env?.DEV ?? env?.MODE === "mobile-dev");
  const configuredDevInviteUrl = normalizeAbsoluteBaseUrl(
    readEnvValue("VITE_DEV_INVITE_SITE_URL", envOverrides)
  );
  const configuredApiUrl = normalizeApiOrigin(readEnvValue("VITE_API_URL", envOverrides));
  const apiHostname = configuredApiUrl ? new URL(configuredApiUrl).hostname : "";

  if (isDevMode || (apiHostname && isPrivateHost(apiHostname))) {
    return configuredDevInviteUrl || DEFAULT_DEV_INVITE_BASE_URL;
  }

  const configuredAppUrl = normalizeAbsoluteBaseUrl(
    readEnvValue("VITE_APP_SITE_URL", envOverrides)
  );
  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const configuredMarketingUrl = normalizeAbsoluteBaseUrl(
    readEnvValue("VITE_MARKETING_SITE_URL", envOverrides)
  );
  if (configuredMarketingUrl) {
    return configuredMarketingUrl;
  }

  if (/^https?:\/\//i.test(runtimeOrigin)) {
    return runtimeOrigin;
  }

  return "";
}

export function buildShareableInviteUrl(
  invitePath: string,
  currentOrigin?: string,
  envOverrides?: InviteLinkEnv
): string {
  const normalizedPath = invitePath.startsWith("/") ? invitePath : `/${invitePath}`;
  const baseUrl = resolveInvitePublicBaseUrl(currentOrigin, envOverrides);
  if (!baseUrl) {
    return "";
  }
  return `${baseUrl}${normalizedPath}`;
}

export function buildLatestDevInviteUrl(
  currentOrigin?: string,
  envOverrides?: InviteLinkEnv
): string {
  return buildShareableInviteUrl(DEV_LATEST_FAMILY_INVITE_PATH, currentOrigin, envOverrides);
}
