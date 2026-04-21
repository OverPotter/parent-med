import type { AppLanguage } from "@shared/i18n";
import { EditorShell, FlowScreenHeader, tPillbox } from "./shared";

export function PillboxLoadingScreen({
  language,
  screen,
  onBack,
}: {
  language: AppLanguage;
  screen: "setup" | "medication" | "details";
  onBack: () => void;
}) {
  return (
    <EditorShell onBack={onBack}>
      <FlowScreenHeader
        backLabel={
          screen === "medication"
            ? tPillbox(language, "medicationBack")
            : screen === "details"
              ? tPillbox(language, "detailsBack")
              : tPillbox(language, "setupBack")
        }
        onBack={onBack}
        eyebrow={tPillbox(language, "eyebrow")}
        title={
          screen === "medication"
            ? tPillbox(language, "medicationTitle")
            : screen === "details"
              ? tPillbox(language, "detailsTitle")
              : tPillbox(language, "setupTitle")
        }
      />
      <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
        {language === "ru" ? "Загружаем план приёма..." : "Loading plan..."}
      </div>
    </EditorShell>
  );
}
