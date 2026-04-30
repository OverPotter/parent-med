import type { AppLanguage } from "@shared/i18n";
import { EditorShell, FlowScreenHeader, tPillbox } from "./shared";

export function PillboxLoadingScreen({
  language,
  screen,
  onBack,
  underlaySnapshotKey,
  enableBackGesture = true,
  backLabel,
}: {
  language: AppLanguage;
  screen: "setup" | "medication" | "details";
  onBack: () => void;
  underlaySnapshotKey?: string;
  enableBackGesture?: boolean;
  backLabel?: string;
}) {
  return (
    <EditorShell
      onBack={onBack}
      underlaySnapshotKey={underlaySnapshotKey}
      enableBackGesture={enableBackGesture}
    >
      <FlowScreenHeader
        backLabel={
          backLabel ??
          (screen === "medication"
            ? tPillbox(language, "medicationBack")
            : screen === "details"
              ? tPillbox(language, "detailsBack")
              : tPillbox(language, "setupBack"))
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
        {language === "ru" ? "Загружаем план лекарств..." : "Loading plan..."}
      </div>
    </EditorShell>
  );
}
