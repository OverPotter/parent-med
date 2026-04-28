export type ChildExportKind = "analytics_summary" | "child_care" | "child_illness";
export type ChildExportPeriod = "all" | "two_weeks" | "month" | "half_year";
export type ChildExportDeliveryResult =
  | { status: "shared"; filename: string }
  | { status: "cancelled"; filename: string }
  | { status: "downloaded"; filename: string };

export function buildChildExportFilename(
  childName: string,
  exportKind: ChildExportKind,
  extension: "csv" | "xlsx" = "csv"
): string {
  const safeName = childName.trim().split(/\s+/).filter(Boolean).join("_") || "child";
  return `${safeName}_${exportKind}.${extension}`;
}

export function buildChildExportArchiveFilename(
  childName: string,
  extension: "zip" | "xlsx" = "zip"
): string {
  const safeName = childName.trim().split(/\s+/).filter(Boolean).join("_") || "child";
  return `${safeName}_exports.${extension}`;
}

export function extractFilenameFromContentDisposition(
  contentDisposition: string | null | undefined
): string | null {
  if (!contentDisposition) {
    return null;
  }
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const plainMatch = contentDisposition.match(/filename="([^"]+)"/i);
  return plainMatch?.[1] ?? null;
}

export function isNativeIosExportRuntime(args: {
  isNativePlatform: boolean;
  platform: string;
}): boolean {
  return args.isNativePlatform && args.platform === "ios";
}

export function resolveChildExportApiPeriod(
  period: ChildExportPeriod,
  now = new Date()
):
  | { period: "all" }
  | {
      period: "custom";
      startDate: string;
      endDate: string;
    } {
  if (period === "all") {
    return { period: "all" };
  }

  const endDate = toLocalIsoDate(now);
  const startDate = new Date(now);
  const daysBack = period === "two_weeks" ? 13 : period === "month" ? 29 : 182;
  startDate.setDate(startDate.getDate() - daysBack);

  return {
    period: "custom",
    startDate: toLocalIsoDate(startDate),
    endDate,
  };
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
