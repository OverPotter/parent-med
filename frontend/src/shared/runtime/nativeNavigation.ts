export function normalizeNativeNavigationUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") {
    return null;
  }

  let url = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "pillpath:" && parsed.pathname.startsWith("/")) {
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } else if (parsed.pathname.startsWith("/")) {
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // noop: keep raw value
  }

  return url.startsWith("/") ? url : null;
}

export function normalizeAuthenticatedLaunchUrl(rawUrl: unknown): string | null {
  const normalizedUrl = normalizeNativeNavigationUrl(rawUrl);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsed = new URL(normalizedUrl, "https://pillpath.local");
    if (parsed.pathname === "/auth" || parsed.pathname === "/recover-password") {
      return null;
    }
  } catch {
    return null;
  }

  return normalizedUrl;
}
