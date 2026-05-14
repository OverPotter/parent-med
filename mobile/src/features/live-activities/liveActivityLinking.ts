export type LiveActivityAction = "sleep" | "feeding" | "illness";

export function buildLiveActivityUrl(
  childId: string,
  action: LiveActivityAction,
) {
  return `pillpath://children?liveChild=${encodeURIComponent(childId)}&liveAction=${encodeURIComponent(action)}`;
}

export function parseLiveActivityNavigation(url: string): {
  childId: string;
  action: LiveActivityAction;
} | null {
  try {
    const parsed = new URL(url);
    const childId = parsed.searchParams.get("liveChild")?.trim() ?? "";
    const action = parsed.searchParams.get("liveAction")?.trim() ?? "";

    if (!childId) {
      return null;
    }

    if (action !== "sleep" && action !== "feeding" && action !== "illness") {
      return null;
    }

    return { childId, action };
  } catch {
    return null;
  }
}
