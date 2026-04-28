import type { AppLanguage } from "@shared/i18n";
import type { FamilyAccessPolicy } from "@shared/types/api";
import {
  cabinetAccessRoleLabel,
  childrenAccessRoleLabel,
  pillboxAccessRoleLabel,
  tFamily,
} from "./copy";
import { normalizeFamilyAccessPolicy } from "@shared/familyAccess/policy";
import { hasAnyChildAccess } from "@shared/familyAccess/policy";

export function toFamilyAccessUpdatePayload(policy: FamilyAccessPolicy) {
  const normalized = normalizeFamilyAccessPolicy(policy);
  return {
    all_children: normalized.allChildren,
    child_ids: normalized.childIds,
    children_access: normalized.childrenAccess,
    cabinet_access: normalized.cabinetAccess,
    pillbox_access: normalized.pillboxAccess,
    cabinet_push_enabled: normalized.cabinetPushEnabled,
  };
}

export function buildMemberAccessSummaryItems(
  accessPolicy: FamilyAccessPolicy,
  language: AppLanguage
) {
  const hasChildAccess = hasAnyChildAccess(accessPolicy);
  const selectedChildrenCount = accessPolicy.childIds.length;

  return [
    ...(hasChildAccess
      ? [
          {
            key: "children-scope",
            label: accessPolicy.allChildren
              ? tFamily(language, "accessSummaryAllChildren")
              : `${tFamily(language, "accessSummarySelectedChildren")}: ${selectedChildrenCount}`,
            toneClass:
              "bg-[color:color-mix(in_srgb,var(--color-primary)_8%,transparent)] text-[color:color-mix(in_srgb,var(--color-primary)_84%,var(--color-foreground))]",
          },
        ]
      : []),
    {
      key: "children-access",
      label: `${tFamily(language, "childrenAccess")}: ${
        hasChildAccess
          ? childrenAccessRoleLabel(accessPolicy.childrenAccess, language)
          : tFamily(language, "hidden")
      }`,
      toneClass: !hasChildAccess
        ? "bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[color:color-mix(in_srgb,var(--color-danger)_82%,var(--color-foreground))]"
        : accessPolicy.childrenAccess === "edit"
          ? "bg-[color:color-mix(in_srgb,#10b981_12%,transparent)] text-[color:color-mix(in_srgb,#059669_86%,var(--color-foreground))]"
          : "bg-[color:color-mix(in_srgb,#f59e0b_12%,transparent)] text-[color:color-mix(in_srgb,#b45309_86%,var(--color-foreground))]",
    },
    {
      key: "cabinet-access",
      label: `${tFamily(language, "cabinetAccess")}: ${cabinetAccessRoleLabel(accessPolicy.cabinetAccess, language)}`,
      toneClass:
        accessPolicy.cabinetAccess === "none"
          ? "bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[color:color-mix(in_srgb,var(--color-danger)_82%,var(--color-foreground))]"
          : accessPolicy.cabinetAccess === "edit"
            ? "bg-[color:color-mix(in_srgb,#10b981_12%,transparent)] text-[color:color-mix(in_srgb,#059669_86%,var(--color-foreground))]"
            : "bg-[color:color-mix(in_srgb,#f59e0b_12%,transparent)] text-[color:color-mix(in_srgb,#b45309_86%,var(--color-foreground))]",
    },
    {
      key: "pillbox-access",
      label: `${tFamily(language, "pillboxAccess")}: ${pillboxAccessRoleLabel(accessPolicy.pillboxAccess, language)}`,
      toneClass:
        accessPolicy.pillboxAccess === "none"
          ? "bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[color:color-mix(in_srgb,var(--color-danger)_82%,var(--color-foreground))]"
          : accessPolicy.pillboxAccess === "act"
            ? "bg-[color:color-mix(in_srgb,#0ea5e9_12%,transparent)] text-[color:color-mix(in_srgb,#0369a1_86%,var(--color-foreground))]"
            : accessPolicy.pillboxAccess === "edit"
              ? "bg-[color:color-mix(in_srgb,#10b981_12%,transparent)] text-[color:color-mix(in_srgb,#059669_86%,var(--color-foreground))]"
              : "bg-[color:color-mix(in_srgb,#f59e0b_12%,transparent)] text-[color:color-mix(in_srgb,#b45309_86%,var(--color-foreground))]",
    },
  ];
}
