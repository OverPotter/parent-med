import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { EpisodeMedicationPlan, HouseholdMedicine, IllnessEpisode } from "@shared/types/api";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  appBtnDangerClass,
  appPillActionClass,
  illnessCompactSecondaryButtonClass,
  illnessFlatBadgeClass,
  illnessFlatPanelClass,
  illnessFlatSurfaceClass,
} from "./shared";

export function ManualComposerOverview(props: {
  language: "ru" | "en";
  childId: string;
  canEditEpisode: boolean;
  onLockedActionAttempt: () => void;
}) {
  const { language, childId, canEditEpisode, onLockedActionAttempt } = props;
  const renderComposerAction = (to: string, label: string) =>
    canEditEpisode ? (
      <Link to={to} className={`${appPillActionClass} w-full`}>
        {label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={onLockedActionAttempt}
        className={`${appPillActionClass} w-full`}
      >
        {label}
      </button>
    );
  return (
    <section className={`${illnessFlatPanelClass} space-y-4 p-4 sm:p-5`}>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-foreground">
          {language === "ru" ? "Быстрые записи" : "Quick logs"}
        </h4>
        <p className="mt-1 text-sm text-muted">
          {language === "ru" ? "Температура, приёмы и заметки." : "Temperature, doses and notes."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {renderComposerAction(
          `/children/${childId}/illness?focus=temperature`,
          language === "ru" ? "+ Температура" : "+ Temperature"
        )}
        {renderComposerAction(
          `/children/${childId}/illness?focus=administration`,
          language === "ru" ? "+ Приём" : "+ Dose"
        )}
        {renderComposerAction(
          `/children/${childId}/illness?focus=comment`,
          language === "ru" ? "+ Заметка" : "+ Note"
        )}
      </div>
    </section>
  );
}

export function TimelineOverviewPanel(props: {
  language: "ru" | "en";
  childId: string;
  timelineCount: number;
}) {
  const { language, childId, timelineCount } = props;
  return (
    <section className={`${illnessFlatPanelClass} space-y-4 p-4 sm:p-5`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">
            {language === "ru" ? "Лента наблюдения" : "Tracking timeline"}
          </h4>
          <p className="mt-1 text-sm text-muted">
            {language === "ru"
              ? "Температуры, лекарства и заметки в одном месте."
              : "Temperatures, doses and notes in one place."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/children/${childId}/illness?focus=timeline`}
            className={`${appPillActionClass} px-4`}
          >
            {language === "ru" ? "К ленте" : "Open timeline"}
          </Link>
        </div>
      </div>

      {timelineCount > 0 ? (
        <div>
          <span className={`${illnessFlatBadgeClass} px-3 py-1.5 text-xs`}>
            {language === "ru" ? "Записей" : "Entries"}: {timelineCount}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export function ReminderOverviewPanel(props: {
  language: "ru" | "en";
  childId: string;
  episode: IllnessEpisode;
  medicationPlans: EpisodeMedicationPlan[];
  reminderLead: {
    plan: EpisodeMedicationPlan;
    medicine: HouseholdMedicine | null;
  } | null;
  canEditEpisode: boolean;
  onLockedActionAttempt: () => void;
}) {
  const {
    language,
    childId,
    episode,
    medicationPlans,
    reminderLead,
    canEditEpisode,
    onLockedActionAttempt,
  } = props;
  if (episode.medicationMode !== "guided") return null;

  return (
    <section className={`${illnessFlatPanelClass} space-y-4 p-4 sm:p-5`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">
            {language === "ru" ? "Напоминания о приёме" : "Dose reminders"}
          </h4>
          <p className="mt-1 text-sm text-muted">
            {language === "ru"
              ? "Приёмы по интервалу и статус на сейчас."
              : "Dose intervals and their current status."}
          </p>
        </div>
        {canEditEpisode ? (
          <Link
            to={
              medicationPlans.length > 0
                ? `/children/${childId}/illness?focus=reminders`
                : `/children/${childId}/illness?focus=reminder-create`
            }
            className={`${illnessCompactSecondaryButtonClass} w-full self-start sm:w-auto`}
          >
            {medicationPlans.length > 0
              ? language === "ru"
                ? "Напоминания"
                : "Reminders"
              : language === "ru"
                ? "Добавить напоминание"
                : "Add reminder"}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onLockedActionAttempt}
            className={`${illnessCompactSecondaryButtonClass} w-full self-start sm:w-auto`}
          >
            {medicationPlans.length > 0
              ? language === "ru"
                ? "Напоминания"
                : "Reminders"
              : language === "ru"
                ? "Добавить напоминание"
                : "Add reminder"}
          </button>
        )}
      </div>

      {reminderLead ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>
            {language === "ru" ? "Активных напоминаний" : "Active reminders"}:{" "}
            <span className="font-semibold text-foreground">{medicationPlans.length}</span>
          </span>
          <span className="text-foreground/80">
            {language === "ru" ? "Ближайшее" : "Next"}:{" "}
            {reminderLead.plan.customMedicineName ??
              reminderLead.medicine?.medicineName ??
              (language === "ru" ? "Лекарство" : "Medicine")}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export function EpisodeMainPanel(props: {
  language: "ru" | "en";
  childName: string;
  episode: IllnessEpisode;
  isCloseConfirmOpen: boolean;
  setIsCloseConfirmOpen: (open: boolean) => void;
  onClose: () => void;
  canEditEpisode: boolean;
  onLockedActionAttempt: () => void;
  manualComposerSection: ReactNode;
  reminderOverviewSection: ReactNode;
  timelineSection: ReactNode;
}) {
  const {
    language,
    childName,
    episode,
    isCloseConfirmOpen,
    setIsCloseConfirmOpen,
    onClose,
    canEditEpisode,
    onLockedActionAttempt,
    manualComposerSection,
    reminderOverviewSection,
    timelineSection,
  } = props;
  const isActive = episode.status === "active";

  return (
    <div className={`${illnessFlatPanelClass} rounded-[30px]`}>
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        title={
          language === "ru" ? `Закрыть наблюдение · ${childName}` : `Close tracking · ${childName}`
        }
        description={
          language === "ru"
            ? "Текущее наблюдение будет завершено и попадёт в историю. При необходимости новое наблюдение можно будет начать заново."
            : "This tracking session will be closed and moved to history. You can start a new one later if needed."
        }
        confirmLabel={language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
        confirmTone="danger"
        onCancel={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          onClose();
          setIsCloseConfirmOpen(false);
        }}
      />

      <div className={`${illnessFlatSurfaceClass} rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5`}>
        {isActive ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {childName}
              </p>
              {episode.title?.trim() ? (
                <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                  {episode.title.trim()}
                </h3>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                {language === "ru"
                  ? "Быстрые записи, напоминания и лента наблюдения."
                  : "Quick logs, reminders and the tracking timeline."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!canEditEpisode) {
                  onLockedActionAttempt();
                  return;
                }
                setIsCloseConfirmOpen(true);
              }}
              className={`${appBtnDangerClass} hidden sm:inline-flex`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {childName}
            </p>
            {episode.title?.trim() ? (
              <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                {episode.title.trim()}
              </h3>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              {language === "ru"
                ? "Быстрые записи, напоминания и лента наблюдения."
                : "Quick logs, reminders and the tracking timeline."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-7 px-5 py-5 sm:px-6 sm:py-6">
        <section>{manualComposerSection}</section>
        {reminderOverviewSection}
        {timelineSection}
        {isActive ? (
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => {
                if (!canEditEpisode) {
                  onLockedActionAttempt();
                  return;
                }
                setIsCloseConfirmOpen(true);
              }}
              className={`${appBtnDangerClass} w-full`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
