import { EmptyState } from "./Surface";
import type { AppLanguage } from "@shared/i18n";

export function ModuleOfflineState({ language }: { language: AppLanguage }) {
  const title = language === "ru" ? "Нет сети" : "No connection";
  const description =
    language === "ru"
      ? "Подключитесь к интернету и попробуйте снова."
      : "Reconnect to the internet and try again.";

  return (
    <EmptyState className="text-foreground">
      <div className="space-y-3">
        <p className="app-card-title">{title}</p>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>
    </EmptyState>
  );
}
