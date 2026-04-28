export function resolveShouldUseAppEntryWebMode(params: {
  mode: string;
  hostname: string | null | undefined;
}) {
  const hostname = (params.hostname ?? "").trim().toLowerCase();

  if (params.mode === "mobile-dev" || params.mode === "mobile-stage") {
    return true;
  }

  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function shouldUseAppEntryWebMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return resolveShouldUseAppEntryWebMode({
    mode: import.meta.env.MODE,
    hostname: window.location.hostname,
  });
}

export function shouldUsePublicWebsiteMode() {
  return !shouldUseAppEntryWebMode();
}
