import type { PillboxPlanListFilter } from "./shared";

export type PillboxScreen = "hub" | "setup" | "medication" | "details" | "analytics";
export type PillboxBackSource = "hub" | "details" | "setup";
export type PillboxRouteOrigin = "hub" | "details";

export function getPillboxScreen(searchParams: URLSearchParams): PillboxScreen {
  const mode = searchParams.get("mode");
  if (
    mode === "setup" ||
    mode === "medication" ||
    mode === "details" ||
    mode === "analytics"
  ) {
    return mode;
  }
  return "hub";
}

export function getPillboxBackSource(searchParams: URLSearchParams): PillboxBackSource {
  const back = searchParams.get("back");
  if (back === "details" || back === "setup") {
    return back;
  }
  return "hub";
}

export function getPillboxRouteOrigin(searchParams: URLSearchParams): PillboxRouteOrigin {
  return searchParams.get("origin") === "details" ? "details" : "hub";
}

export function getPillboxListFilter(searchParams: URLSearchParams): PillboxPlanListFilter {
  return searchParams.get("tab") === "archive" || searchParams.get("tab") === "completed"
    ? "completed"
    : "active";
}

export function buildPillboxHubRoute(listFilter: PillboxPlanListFilter): string {
  return listFilter === "completed" ? "/pillbox?tab=completed" : "/pillbox";
}

export function buildPillboxDetailsRoute(
  planId: string,
  listFilter: PillboxPlanListFilter
): string {
  const filterSuffix = listFilter === "completed" ? "&tab=completed" : "";
  return `/pillbox?mode=details&plan=${planId}${filterSuffix}`;
}

export function buildPillboxSetupRoute(
  planId: string | null | undefined,
  source: Exclude<PillboxBackSource, "setup">
): string {
  return `/pillbox?mode=setup${planId ? `&plan=${planId}` : "&plan=new"}&back=${source}`;
}

export function buildPillboxMedicationRoute(
  medicationId: string,
  planId: string | null | undefined,
  source: Extract<PillboxBackSource, "setup" | "details">,
  origin: PillboxRouteOrigin
): string {
  return `/pillbox?mode=medication&med=${medicationId}${planId ? `&plan=${planId}` : "&plan=new"}&back=${source}&origin=${origin}`;
}

export function buildPillboxAnalyticsRoute(
  planId: string | null | undefined,
  listFilter: PillboxPlanListFilter
): string {
  return `/pillbox?mode=analytics${planId ? `&plan=${planId}` : ""}${listFilter === "completed" ? "&tab=completed" : ""}`;
}

export function resolvePillboxSetupUnderlaySnapshotKey(args: {
  backSource: PillboxBackSource;
  selectedPlanId: string | null;
  listFilter: PillboxPlanListFilter;
}): string {
  const { backSource, selectedPlanId, listFilter } = args;
  return backSource === "details" && selectedPlanId
    ? buildPillboxDetailsRoute(selectedPlanId, listFilter)
    : buildPillboxHubRoute(listFilter);
}

export function resolvePillboxMedicationUnderlaySnapshotKey(args: {
  editorPlanId: string | null;
  backSource: PillboxBackSource;
  routeOrigin: PillboxRouteOrigin;
  listFilter: PillboxPlanListFilter;
}): string {
  const { editorPlanId, backSource, routeOrigin, listFilter } = args;
  if (!editorPlanId) {
    return buildPillboxSetupRoute(null, "hub");
  }
  return backSource === "details"
    ? buildPillboxDetailsRoute(editorPlanId, listFilter)
    : buildPillboxSetupRoute(editorPlanId, routeOrigin);
}
