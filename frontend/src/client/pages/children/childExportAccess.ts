import type { FamilySubscriptionAccess } from "@shared/types/api";

export type ChildExportGateState = "loading" | "allowed" | "locked";

export function resolveChildExportGateState(args: {
  familyAccess: FamilySubscriptionAccess | null | undefined;
  isLoading: boolean;
}): ChildExportGateState {
  if (args.isLoading) {
    return "loading";
  }
  return args.familyAccess?.canExportCsv ? "allowed" : "locked";
}
