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

const russianRoleGenitiveMap: Record<string, string> = {
  мама: "мамы",
  папа: "папы",
  бабушка: "бабушки",
  дедушка: "дедушки",
  няня: "няни",
  сестра: "сестры",
  брат: "брата",
  тетя: "тети",
  "тётя": "тёти",
  дядя: "дяди",
  сын: "сына",
  дочь: "дочери",
  жена: "жены",
  муж: "мужа",
  опекун: "опекуна",
};

function toRussianGenitive(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (russianRoleGenitiveMap[lower]) {
    return russianRoleGenitiveMap[lower];
  }

  if (/[бвгджзйклмнпрстфхцчшщ]$/i.test(trimmed)) {
    return `${trimmed}а`;
  }
  if (/а$/i.test(trimmed)) {
    return `${trimmed.slice(0, -1)}${/[гкхжчшщ]$/i.test(trimmed.slice(0, -1)) ? "и" : "ы"}`;
  }
  if (/[яь]$/i.test(trimmed)) {
    return `${trimmed.slice(0, -1)}и`;
  }
  return trimmed;
}

export function buildPillboxPlanTargetTitle(
  member: FamilyMemberLike,
  language: AppLanguage
): string {
  const role = member.relationshipLabel?.trim() ?? "";
  const name = member.displayName?.trim() ?? member.email?.trim() ?? "";
  if (language === "ru") {
    if (role && name) return `Для ${toRussianGenitive(role)} ${toRussianGenitive(name)}`;
    if (role) return `Для ${toRussianGenitive(role)}`;
    if (name) return `Для ${toRussianGenitive(name)}`;
    return `Для ${toRussianGenitive(getAccountDisplayLabel(member))}`;
  }
  return `For ${buildPillboxPlanTargetLabel(member)}`;
}
