import type { AppLanguage } from "@shared/i18n";

export function localizeGenericFamilyName(
  name: string | null | undefined,
  language: AppLanguage
): string {
  const trimmed = name?.trim() ?? "";
  const normalized = trimmed.toLowerCase();
  if (!normalized) {
    return "";
  }
  if (normalized === "моя семья" || normalized === "my family") {
    return language === "ru" ? "Моя семья" : "My family";
  }
  return trimmed;
}

export function localizeGenericAccountDisplayName(
  name: string | null | undefined,
  language: AppLanguage
): string {
  const trimmed = name?.trim() ?? "";
  const normalized = trimmed.toLowerCase();
  if (!normalized) {
    return "";
  }
  if (normalized === "участник семьи" || normalized === "family member") {
    return language === "ru" ? "Участник семьи" : "Family member";
  }
  return trimmed;
}
