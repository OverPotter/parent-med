import type { AppLanguage } from "@shared/i18n";
import { getAccountDisplayLabel } from "@shared/utils/accountLabels";

type FamilyMemberLike = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  relationshipLabel?: string | null;
};

export function buildPillboxPlanTargetLabel(member: FamilyMemberLike): string {
  const name = member.displayName?.trim() ?? member.email?.trim() ?? "";
  const role = member.relationshipLabel?.trim() ?? "";
  return name || role || getAccountDisplayLabel(member);
}

export function buildPillboxPlanTargetTitle(
  member: FamilyMemberLike,
  language: AppLanguage
): string {
  const suffix = buildPillboxPlanTargetLabel(member);
  return language === "ru" ? `Для ${suffix}` : `For ${suffix}`;
}
