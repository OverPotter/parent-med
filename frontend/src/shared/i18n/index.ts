import { en } from "./en";
import { ru } from "./ru";
import type { AppLanguage, Translations } from "./types";

export type { AppLanguage, Translations } from "./types";

export const translations: Record<AppLanguage, Translations> = {
  ru,
  en,
};

function parseLanguageTag(tag: string | null | undefined): AppLanguage | null {
  if (!tag) {
    return null;
  }

  const normalized = tag.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized.startsWith("ru") ? "ru" : "en";
}

export function detectPreferredLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return "en";
  }

  for (const tag of navigator.languages ?? []) {
    const language = parseLanguageTag(tag);
    if (language) {
      return language;
    }
  }

  return parseLanguageTag(navigator.language) ?? "en";
}

export function applyLanguageToDocument(language: AppLanguage) {
  document.documentElement.lang = language;
}

export function interpolate(text: string, variables?: Record<string, string | number>) {
  if (!variables) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? ""));
}
