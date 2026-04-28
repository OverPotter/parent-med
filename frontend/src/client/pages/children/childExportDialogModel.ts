import type { ChildExportKind, ChildExportPeriod } from "@shared/api/childExports";

export const allExportsOption = "all_exports" as const;
export type ExportSelection = ChildExportKind | typeof allExportsOption;
export const defaultExportSelection: ExportSelection = "analytics_summary";
export const defaultExportPeriod: ChildExportPeriod = "two_weeks";

export function resolvePrimaryExportAction(selection: ExportSelection): "single" | "archive" {
  return selection === allExportsOption ? "archive" : "single";
}

export function shouldDismissExportSheetSwipe(deltaX: number, deltaY: number): boolean {
  return deltaY >= 96 && andDominatesHorizontal(deltaX, deltaY);
}

export function shouldTrackExportSheetSwipe(deltaX: number, deltaY: number): boolean {
  return deltaY > 0 && deltaY >= Math.abs(deltaX) * 1.1;
}

export function clampExportSheetOffset(deltaY: number): number {
  return Math.min(Math.max(deltaY, 0), 260);
}

function andDominatesHorizontal(deltaX: number, deltaY: number): boolean {
  return deltaY >= Math.abs(deltaX) * 1.2;
}
