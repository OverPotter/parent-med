/**
 * Главная страница админки (MVP: заглушка).
 */

import { useI18n } from "@shared/hooks/useI18n";

export function AdminHomePage() {
  const { language } = useI18n();
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        {language === "ru" ? "Админ-панель" : "Admin panel"}
      </h1>
      <p className="mt-2 text-muted">
        {language === "ru" ? "Раздел в разработке." : "This section is in progress."}
      </p>
    </div>
  );
}
