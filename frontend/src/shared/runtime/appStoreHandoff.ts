function isIosBrowserDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return true;
  }

  // iPadOS can identify itself as Macintosh in Safari while still using touch input.
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export function shouldAutoRedirectPublicPageToAppStore(params: {
  isPublicWebsiteMode: boolean;
  appStoreUrl: string;
  userAgent?: string;
  maxTouchPoints?: number;
}): boolean {
  if (!params.isPublicWebsiteMode || !params.appStoreUrl) {
    return false;
  }

  const userAgent = (params.userAgent ?? "").trim();
  const maxTouchPoints = params.maxTouchPoints ?? 0;
  return isIosBrowserDevice(userAgent, maxTouchPoints);
}
