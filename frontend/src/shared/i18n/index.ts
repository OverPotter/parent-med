import { en } from "./en";
import { ru } from "./ru";
import type { AppLanguage, Translations } from "./types";

export type { AppLanguage, Translations } from "./types";

export const translations: Record<AppLanguage, Translations> = {
  ru,
  en,
};

export function applyLanguageToDocument(language: AppLanguage) {
  document.documentElement.lang = language;
}

export function interpolate(text: string, variables?: Record<string, string | number>) {
  if (!variables) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? ""));
}
