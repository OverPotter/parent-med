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

type InviteLinkEnv = Partial<Record<"VITE_APP_SITE_URL" | "VITE_MARKETING_SITE_URL", string>>;

function readEnvValue(
  key: "VITE_APP_SITE_URL" | "VITE_MARKETING_SITE_URL",
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

export function resolveInvitePublicBaseUrl(
  currentOrigin?: string,
  envOverrides?: InviteLinkEnv
): string {
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

  const runtimeOrigin = (currentOrigin ?? "").trim();
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
