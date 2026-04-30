import { useEffect, useMemo, useState } from "react";
import { CalendarPickerDialog as SharedCalendarPickerDialog } from "@shared/components/CalendarPickerDialog";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n/types";
import {
  actionPrimaryClass,
  addDaysToIso,
  ChoiceButtons,
  CoursePreset,
  DayChip,
  editorSectionCardClass,
  EditorShell,
  FieldIcon,
  FlowScreenHeader,
  getMedicationDayLabel,
  getTodayIso,
  MedicationItem,
  medicationDays,
  tPillbox,
  TintedField,
  UtensilsBadge,
} from "./shared";

type PillboxMedicationScreenProps = {
  language: AppLanguage;
  activeMedication: MedicationItem;
  editorTitle: string;
  editorDose: string;
  editorTimes: string[];
  editorCoursePreset: CoursePreset;
  canSaveMedication: boolean;
  onBack: () => void;
  onTitleChange: (value: string) => void;
  onDoseChange: (value: string) => void;
  onUpdateEditorTimeAt: (index: number, value: string) => void;
  onFinalizeEditorTimeAt: (index: number) => void;
  onAddEditorTime: () => void;
  onRemoveEditorTime: (index: number) => void;
  onUpdateMedication: (id: string, patch: Partial<MedicationItem>) => void;
  onCoursePresetChange: (preset: CoursePreset) => void;
  onSaveMedication: () => void;
  underlaySnapshotKey?: string;
  enableBackGesture?: boolean;
};

export function PillboxMedicationScreen({
  language,
  activeMedication,
  editorTitle,
  editorDose,
  editorTimes,
  editorCoursePreset,
  canSaveMedication,
  onBack,
  onTitleChange,
  onDoseChange,
  onUpdateEditorTimeAt,
  onFinalizeEditorTimeAt,
  onAddEditorTime,
  onRemoveEditorTime,
  onUpdateMedication,
  onCoursePresetChange,
  onSaveMedication,
  underlaySnapshotKey,
  enableBackGesture = true,
}: PillboxMedicationScreenProps) {
  const editorFieldWrapClass = "mx-auto w-full max-w-[36rem]";
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [draftCoursePreset, setDraftCoursePreset] = useState<CoursePreset>(editorCoursePreset);
  const [draftCourseStartDate, setDraftCourseStartDate] = useState(
    activeMedication.courseStartDate
  );
  const [draftCourseEndDate, setDraftCourseEndDate] = useState(activeMedication.courseEndDate);

  useEffect(() => {
    setDraftCoursePreset(editorCoursePreset);
  }, [editorCoursePreset]);

  useEffect(() => {
    setDraftCourseStartDate(activeMedication.courseStartDate);
    setDraftCourseEndDate(activeMedication.courseEndDate);
  }, [activeMedication.courseEndDate, activeMedication.courseStartDate]);

  const openCourseDialog = () => {
    const today = getTodayIso();
    const startDate = activeMedication.courseStartDate || today;
    const endDate = activeMedication.courseEndDate || addDaysToIso(startDate, 13);
    setDraftCoursePreset(activeMedication.courseMode === "period" ? editorCoursePreset : "14");
    setDraftCourseStartDate(startDate);
    setDraftCourseEndDate(endDate);
    setIsCourseDialogOpen(true);
  };

  const applyCourseDialog = () => {
    const startDate = draftCourseStartDate || getTodayIso();
    const endDate = draftCourseEndDate || startDate;
    onCoursePresetChange(draftCoursePreset);
    onUpdateMedication(activeMedication.id, {
      courseMode: "period",
      courseStartDate: startDate <= endDate ? startDate : endDate,
      courseEndDate: startDate <= endDate ? endDate : startDate,
    });
    setIsCourseDialogOpen(false);
  };

  const courseSummary = useMemo(() => {
    if (activeMedication.courseMode !== "period") return null;
    if (editorCoursePreset === "7") return language === "ru" ? "Курс на 7 дней" : "7-day course";
    if (editorCoursePreset === "14") return language === "ru" ? "Курс на 14 дней" : "14-day course";
    if (editorCoursePreset === "30") return language === "ru" ? "Курс на 30 дней" : "30-day course";
    if (!activeMedication.courseStartDate || !activeMedication.courseEndDate) {
      return language === "ru" ? "Выберите даты курса" : "Choose course dates";
    }
    return language === "ru"
      ? `С ${activeMedication.courseStartDate} по ${activeMedication.courseEndDate}`
      : `From ${activeMedication.courseStartDate} to ${activeMedication.courseEndDate}`;
  }, [
    activeMedication.courseEndDate,
    activeMedication.courseMode,
    activeMedication.courseStartDate,
    editorCoursePreset,
    language,
  ]);

  const sectionTitleClass =
    "text-[0.9rem] font-semibold tracking-[-0.02em] text-foreground/88 sm:text-[0.94rem]";

  return (
    <EditorShell
      onBack={onBack}
      underlaySnapshotKey={underlaySnapshotKey}
      enableBackGesture={enableBackGesture}
    >
      <FlowScreenHeader
        backLabel={tPillbox(language, "medicationBack")}
        onBack={onBack}
        eyebrow=""
        title={
          language === "ru"
            ? `${tPillbox(language, "eyebrow")} · ${tPillbox(language, "medicationTitle")}`
            : `${tPillbox(language, "eyebrow")} · ${tPillbox(language, "medicationTitle")}`
        }
        subtitle={tPillbox(language, "medicationSubtitle")}
      />

      <div className="pt-2 space-y-4">
        <div className={editorSectionCardClass}>
          <div className="space-y-4.5">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <TintedField
                  label={tPillbox(language, "whatName")}
                  icon={<FieldIcon kind="pill" />}
                  placeholder={tPillbox(language, "whatNamePlaceholder")}
                  value={editorTitle}
                  onChange={onTitleChange}
                />
                <TintedField
                  label={tPillbox(language, "howMuch")}
                  icon={<FieldIcon kind="dose" />}
                  placeholder={tPillbox(language, "howMuchPlaceholder")}
                  value={editorDose}
                  onChange={onDoseChange}
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-3 pt-5">
              <div className="space-y-1">
                <h2 className={sectionTitleClass}>
                  {language === "ru" ? "Когда напоминать" : "When to remind"}
                </h2>
              </div>
              <div className={editorFieldWrapClass}>
                <div className="space-y-1.5">
                  {editorTimes.map((timeValue, index) => (
                    <div
                      key={`${activeMedication.id}-time-${index}`}
                      className="flex items-center gap-2"
                    >
                      <div className="relative min-w-0 flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={timeValue}
                          onChange={(event) => onUpdateEditorTimeAt(index, event.target.value)}
                          onBlur={() => onFinalizeEditorTimeAt(index)}
                          placeholder="08:30"
                          className="soft-input min-h-[2.82rem] w-full px-4 pr-11 text-left text-[16px] font-semibold tracking-[-0.03em] text-foreground placeholder:text-muted sm:min-h-[2.92rem] sm:pr-12 sm:text-[1rem]"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[color:var(--color-primary)] sm:right-4">
                          <span className="inline-flex h-4.5 w-4.5 items-center justify-center">
                            <FieldIcon kind="time" />
                          </span>
                        </span>
                      </div>
                      {editorTimes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => onRemoveEditorTime(index)}
                          className="inline-flex !min-h-[2.82rem] !min-w-[2.82rem] !h-[2.82rem] !w-[2.82rem] shrink-0 self-center items-center justify-center px-0 text-[0.82rem] text-muted transition hover:text-foreground sm:!min-h-[2.92rem] sm:!min-w-[2.92rem] sm:!h-[2.92rem] sm:!w-[2.92rem]"
                          aria-label={tPillbox(language, "removeTimeAria", {
                            index: index + 1,
                          })}
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={onAddEditorTime}
                    className="soft-pill app-profile-action inline-flex min-h-[2.36rem] w-full items-center justify-center px-3 text-[0.77rem] font-medium tracking-[-0.02em] text-foreground/84 sm:min-h-[2.46rem] sm:text-[0.8rem]"
                  >
                    {tPillbox(language, "addTime")}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-5">
              <div className="space-y-1">
                <h2 className={sectionTitleClass}>
                  {language === "ru" ? "В какие дни" : "Which days"}
                </h2>
              </div>
              <div className={editorFieldWrapClass}>
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5 lg:gap-2">
                  {medicationDays.map((day) => {
                    const selected = activeMedication.repeatDays.includes(day.value);
                    return (
                      <DayChip
                        key={day.value}
                        label={getMedicationDayLabel(day, language)}
                        selected={selected}
                        onClick={() =>
                          onUpdateMedication(activeMedication.id, {
                            repeatDays: selected
                              ? activeMedication.repeatDays.length > 1
                                ? activeMedication.repeatDays.filter((item) => item !== day.value)
                                : activeMedication.repeatDays
                              : [...activeMedication.repeatDays, day.value],
                          })
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-5">
              <div className="space-y-1">
                <h2 className={sectionTitleClass}>
                  {language === "ru" ? "Как долго принимать" : "How long to take it"}
                </h2>
              </div>
              <div
                className={`${editorFieldWrapClass} ${activeMedication.courseMode === "period" ? "space-y-3.5" : "space-y-3.5"}`}
              >
                <ChoiceButtons
                  value={activeMedication.courseMode}
                  onChange={(value) => {
                    if (value === "period") {
                      openCourseDialog();
                      return;
                    }

                    onUpdateMedication(activeMedication.id, {
                      courseMode: "continuous",
                      courseStartDate: "",
                      courseEndDate: "",
                    });
                    onCoursePresetChange("custom");
                  }}
                  columnsClassName="grid-cols-2"
                  options={[
                    { value: "continuous", label: tPillbox(language, "continuous") },
                    { value: "period", label: tPillbox(language, "course") },
                  ]}
                />
                {activeMedication.courseMode === "period" ? (
                  <button
                    type="button"
                    onClick={openCourseDialog}
                    className="soft-input inline-flex min-h-[3.08rem] w-full items-center justify-between gap-3 rounded-[22px] px-3.5 py-2.5 text-left tracking-[-0.02em] sm:min-h-[3.16rem]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[0.61rem] font-medium uppercase tracking-[0.06em] text-muted/70">
                        {language === "ru" ? "Период курса" : "Course period"}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.82rem] font-medium leading-[1.18] text-foreground/90 sm:text-[0.84rem]">
                        {courseSummary}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-surface)_76%,var(--color-background)_24%)] text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_38%,transparent)]"
                    >
                      ▾
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 pt-5">
              <div className="mx-auto flex w-full max-w-[36rem] flex-col gap-3.5">
                <div className="space-y-1">
                  <h2 className={sectionTitleClass}>
                    {language === "ru" ? "Как связать с едой" : "How it relates to meals"}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MealRuleChip
                    label={tPillbox(language, "beforeMeal")}
                    selected={activeMedication.mealRule === "before_meal"}
                    onClick={() =>
                      onUpdateMedication(activeMedication.id, {
                        mealRule: "before_meal",
                      })
                    }
                  />
                  <MealRuleChip
                    label={tPillbox(language, "duringMeal")}
                    selected={activeMedication.mealRule === "with_meal"}
                    onClick={() =>
                      onUpdateMedication(activeMedication.id, {
                        mealRule: "with_meal",
                      })
                    }
                  />
                  <MealRuleChip
                    label={tPillbox(language, "afterMeal")}
                    selected={activeMedication.mealRule === "after_meal"}
                    onClick={() =>
                      onUpdateMedication(activeMedication.id, {
                        mealRule: "after_meal",
                      })
                    }
                  />
                </div>
                <div className="border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={onSaveMedication}
                    disabled={!canSaveMedication}
                    className={`${actionPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {tPillbox(language, "saveMedication")}
                  </button>
                  {!canSaveMedication ? (
                    <p className="mt-1.5 text-[0.73rem] leading-5 text-muted/88">
                      {tPillbox(language, "saveMedicationRequiresTitle")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CoursePeriodDialog
        isOpen={isCourseDialogOpen}
        language={language}
        preset={draftCoursePreset}
        startDate={draftCourseStartDate}
        endDate={draftCourseEndDate}
        onPresetChange={(value) => {
          if (value === "custom") {
            setDraftCoursePreset("custom");
            return;
          }
          const today = getTodayIso();
          const durationDays = value === "7" ? 7 : value === "14" ? 14 : 30;
          setDraftCoursePreset(value);
          setDraftCourseStartDate(today);
          setDraftCourseEndDate(addDaysToIso(today, durationDays - 1));
        }}
        onStartDateChange={(nextValue) => {
          setDraftCourseStartDate(nextValue);
          if (draftCourseEndDate && nextValue && draftCourseEndDate < nextValue) {
            setDraftCourseEndDate(nextValue);
          }
        }}
        onEndDateChange={setDraftCourseEndDate}
        onCancel={() => setIsCourseDialogOpen(false)}
        onApply={applyCourseDialog}
      />
    </EditorShell>
  );
}

function CoursePeriodDialog({
  isOpen,
  language,
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onCancel,
  onApply,
}: {
  isOpen: boolean;
  language: AppLanguage;
  preset: CoursePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (value: CoursePreset) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [calendarEdge, setCalendarEdge] = useState<"start" | "end" | null>(null);
  const [isCustomDatesOpen, setIsCustomDatesOpen] = useState(false);
  const [calendarSource, setCalendarSource] = useState<"custom" | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCalendarEdge(null);
    setIsCustomDatesOpen(false);
    setCalendarSource(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const selectDate = (date: string) => {
    if (calendarEdge === "start") {
      onStartDateChange(date);
      if (parseLocalDate(date) > parseLocalDate(endDate)) onEndDateChange(date);
      setCalendarEdge(null);
      if (calendarSource === "custom") setIsCustomDatesOpen(true);
      return;
    }
    onEndDateChange(date);
    if (parseLocalDate(date) < parseLocalDate(startDate)) onStartDateChange(date);
    setCalendarEdge(null);
    if (calendarSource === "custom") setIsCustomDatesOpen(true);
  };

  return (
    <>
      <OverlayDialog
        isOpen={isOpen}
        onClose={onCancel}
        zIndexClassName="z-[180]"
        backdropAriaLabel={language === "ru" ? "Закрыть период курса" : "Close course period"}
        backdropClassName="bg-background"
      >
        <div className="soft-panel relative z-[1] w-full max-w-md rounded-[30px] border border-border bg-surface p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
          <div className="mb-4 h-1.5 w-14 rounded-full bg-primary/55" aria-hidden="true" />
          <div className="space-y-1.5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              {language === "ru" ? "Таблетница" : "Meds"}
            </p>
            <h2 className="app-card-title text-[1.15rem]">
              {language === "ru" ? "Период курса" : "Course period"}
            </h2>
            <p className="text-sm leading-5 text-muted">
              {language === "ru"
                ? "Выберите длительность курса или задайте свои даты."
                : "Choose course length or set custom dates."}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <CoursePresetChip
                label={tPillbox(language, "sevenDays")}
                selected={preset === "7"}
                onClick={() => onPresetChange("7")}
              />
              <CoursePresetChip
                label={tPillbox(language, "fourteenDays")}
                selected={preset === "14"}
                onClick={() => onPresetChange("14")}
              />
              <CoursePresetChip
                label={tPillbox(language, "thirtyDays")}
                selected={preset === "30"}
                onClick={() => onPresetChange("30")}
              />
              <CoursePresetChip
                label={tPillbox(language, "customDates")}
                selected={preset === "custom"}
                onClick={() => {
                  onPresetChange("custom");
                  setIsCustomDatesOpen(true);
                  setCalendarSource(null);
                }}
              />
            </div>

            {preset === "custom" ? (
              <button
                type="button"
                onClick={() => setIsCustomDatesOpen(true)}
                className="soft-input inline-flex min-h-[3.08rem] w-full items-center justify-between gap-3 rounded-[22px] px-3.5 py-2.5 text-left tracking-[-0.02em] sm:min-h-[3.16rem]"
              >
                <span className="min-w-0">
                  <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.07em] text-muted/72">
                    {language === "ru" ? "Свои даты" : "Custom dates"}
                  </span>
                  <span className="mt-1 block truncate text-[0.84rem] font-semibold leading-[1.18] text-foreground/92 sm:text-[0.86rem]">
                    {`${formatShortDate(parseLocalDate(startDate || getTodayIso()), language)} — ${formatShortDate(parseLocalDate(endDate || startDate || getTodayIso()), language)}`}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-surface)_76%,var(--color-background)_24%)] text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_38%,transparent)]"
                >
                  ▾
                </span>
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="soft-pill app-profile-action min-h-[2.9rem] px-4 text-sm font-extrabold"
            >
              {language === "ru" ? "Отмена" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={onApply}
              className="soft-pill-success app-profile-action app-profile-action--active min-h-[2.9rem] px-4 text-sm font-extrabold"
            >
              {language === "ru" ? "Применить" : "Apply"}
            </button>
          </div>
        </div>
      </OverlayDialog>

      <CalendarPickerDialog
        isOpen={calendarEdge !== null}
        title={
          calendarEdge === "start"
            ? language === "ru"
              ? "Дата начала"
              : "Start date"
            : language === "ru"
              ? "Дата окончания"
              : "End date"
        }
        language={language}
        startDate={startDate || getTodayIso()}
        endDate={endDate || startDate || getTodayIso()}
        selectedDate={
          calendarEdge === "start"
            ? startDate || getTodayIso()
            : endDate || startDate || getTodayIso()
        }
        onSelectDate={selectDate}
        onCancel={() => {
          setCalendarEdge(null);
          if (calendarSource === "custom") setIsCustomDatesOpen(true);
        }}
        onCloseComplete={() => {
          if (calendarSource !== "custom") return;
          setCalendarSource(null);
        }}
      />
      <CustomCourseDatesDialog
        isOpen={isCustomDatesOpen}
        language={language}
        startDate={startDate || getTodayIso()}
        endDate={endDate || startDate || getTodayIso()}
        onCancel={() => {
          setIsCustomDatesOpen(false);
          setCalendarEdge(null);
          setCalendarSource(null);
        }}
        onOpenEdge={(edge) => {
          setIsCustomDatesOpen(false);
          setCalendarSource("custom");
          setCalendarEdge(edge);
        }}
      />
    </>
  );
}

function CustomCourseDatesDialog({
  isOpen,
  language,
  startDate,
  endDate,
  onCancel,
  onOpenEdge,
}: {
  isOpen: boolean;
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  onCancel: () => void;
  onOpenEdge: (edge: "start" | "end") => void;
}) {
  if (!isOpen) return null;

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onCancel}
      zIndexClassName="z-[260]"
      backdropAriaLabel={language === "ru" ? "Закрыть свои даты" : "Close custom dates"}
      backdropClassName="bg-background"
    >
      <div className="soft-panel relative z-[1] w-full max-w-md rounded-[30px] border border-border bg-surface p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="mb-4 h-1.5 w-14 rounded-full bg-primary/55" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            {language === "ru" ? "Таблетница" : "Meds"}
          </p>
          <h2 className="app-card-title text-[1.15rem]">
            {language === "ru" ? "Свои даты" : "Custom dates"}
          </h2>
          <p className="text-sm leading-5 text-muted">
            {language === "ru"
              ? "Выберите начало и конец курса."
              : "Choose course start and end dates."}
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          <DateRangeButton
            label={language === "ru" ? "Дата начала" : "Start date"}
            value={formatShortDate(parseLocalDate(startDate), language)}
            onClick={() => onOpenEdge("start")}
          />
          <DateRangeButton
            label={language === "ru" ? "Дата окончания" : "End date"}
            value={formatShortDate(parseLocalDate(endDate), language)}
            onClick={() => onOpenEdge("end")}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="soft-pill app-profile-action min-h-[2.9rem] px-4 text-sm font-extrabold"
          >
            {language === "ru" ? "Назад" : "Back"}
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}

function MealRuleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-[20px] px-3 py-2 text-center text-[0.8rem] font-semibold leading-tight tracking-[-0.025em] transition sm:min-h-[2.6rem] sm:text-[0.82rem] ${
        selected
          ? "soft-pill-success app-profile-action app-profile-action--active"
          : "soft-pill app-profile-action"
      }`}
    >
      {selected ? (
        <span className="mr-1.5 inline-flex items-center justify-center" aria-hidden="true">
          <UtensilsBadge />
        </span>
      ) : null}
      {label}
    </button>
  );
}

function CoursePresetChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-[20px] px-3 py-2 text-center text-[0.8rem] font-semibold leading-tight tracking-[-0.025em] transition sm:min-h-[2.6rem] sm:text-[0.82rem] ${
        selected
          ? "soft-pill-primary app-profile-action app-profile-action--selected"
          : "soft-pill app-profile-action"
      }`}
    >
      {label}
    </button>
  );
}

function DateRangeButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[22px] border border-[color:color-mix(in_srgb,var(--color-border)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-3.5 py-2.5 text-left text-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)] transition hover:border-primary/30"
    >
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.08em] opacity-70">
          {label}
        </span>
        <span className="mt-1 block text-sm font-extrabold">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]"
      >
        ▾
      </span>
    </button>
  );
}

function CalendarPickerDialog({
  isOpen,
  title,
  language,
  startDate,
  endDate,
  selectedDate,
  onSelectDate,
  onCancel,
  onCloseComplete,
}: {
  isOpen: boolean;
  title: string;
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onCancel: () => void;
  onCloseComplete?: () => void;
}) {
  return (
    <SharedCalendarPickerDialog
      isOpen={isOpen}
      title={title}
      language={language}
      selectedDate={selectedDate}
      rangeStartDate={startDate}
      rangeEndDate={endDate}
      onSelectDate={onSelectDate}
      onCancel={onCancel}
      onCloseComplete={onCloseComplete}
    />
  );
}

function parseLocalDate(value: string) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0] ?? 1970, ((parts[1] ?? 1) || 1) - 1, (parts[2] ?? 1) || 1);
}

function formatShortDate(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
