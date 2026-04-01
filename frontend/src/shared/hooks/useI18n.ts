import { useMemo } from "react";
import { interpolate, translations } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";

export function useI18n() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const copy = translations[language];

  const t = useMemo(
    () => (text: string, variables?: Record<string, string | number>) =>
      interpolate(text, variables),
    []
  );

  return {
    language,
    setLanguage,
    copy,
    t,
  };
}
