import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { KeyboardEvent } from "react";
import { useRef } from "react";
import type {
  PillboxMealRule,
  PillboxPlan,
  PillboxPlanSummary,
  PillboxPlanWrite,
  PillboxPlanWritableStatus,
} from "@shared/api/pillboxPlans.contract";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import type { AppLanguage } from "@shared/i18n";
import { getLocalIsoDate } from "@shared/utils/date";

export type MedicationItem = {
  id: string;
  title: string;
  dose: string;
  times: string[];
  mealRule: PillboxMealRule;
  repeatDays: number[];
  courseMode: "continuous" | "period";
  courseStartDate: string;
  courseEndDate: string;
};

export type PillboxGroup = {
  id: string;
  title: string;
  status: PillboxPlanSummary["status"];
  activeCount: number;
  nextDoseAt: string | null;
  nextDose: string;
  nextMedicationId: string | null;
  nextMedicationTitle: string | null;
  members: string[];
  courseSummaryKind: "continuous" | "period" | "mixed" | null;
  dayLabel?: string;
  progress: number;
};

export type SetupDraft = {
  id: string | null;
  title: string;
  members: string[];
  medications: MedicationItem[];
};

export type CoursePreset = "7" | "14" | "30" | "custom";
export type PillboxDeleteTarget =
  | { kind: "plan" }
  | { kind: "medication"; medicationId: string; medicationName: string };

export type PillboxPlanActionTarget = "pause" | "resume" | null;
export type PillboxPlanListFilter = "active" | "completed";

export const pillboxCopy = {
  ru: {
    setupBack: "← К приёмам",
    detailsBack: "← К приёмам",
    medicationBack: "← К плану",
    setupTitle: "Настройки плана",
    detailsTitle: "План приёма",
    setupSubtitle:
      "Сначала соберите лекарства, потом назовите план и выберите, кому придут напоминания.",
    medicationTitle: "Настройка лекарства",
    medicationSubtitle:
      "Добавьте одно лекарство в план: когда принимать, как долго и как связать с едой.",
    eyebrow: "Приёмы",
    hubTitle: "Приёмы",
    hubSubtitle: "Семейные планы приёма: что принимать, когда напомнить и как идёт курс.",
    hubMobileHint: "Планы приёма, напоминания и быстрые действия для семьи.",
    hubEmpty:
      "Планов пока нет. Создайте первый план, чтобы видеть приёмы, напоминания и аналитику.",
    createPlan: "Создать план",
    analytics: "Аналитика",
    activeFilter: "Активные",
    archiveFilter: "Завершённые",
    analyticsBack: "← К планам",
    editPlan: "Редактировать",
    pausePlan: "Поставить на паузу",
    resumePlan: "Возобновить план",
    save: "Сохранить",
    savePlan: "Сохранить план",
    createNewPlan: "Создать план",
    deletePlan: "Удалить план",
    deleteMedicine: "Удалить лекарство",
    delete: "Удалить",
    addMedicine: "Добавить лекарство",
    titleLabel: "Название плана",
    medsTitle: "Что будем принимать",
    membersTitle: "Кому напоминать",
    whatName: "Как называется",
    whatNamePlaceholder: "Название лекарства",
    howMuch: "Сколько принимать",
    howMuchPlaceholder: "Например: 2",
    addTime: "+ Добавить время",
    removeTimeAria: "Удалить время {{index}}",
    continuous: "Постоянно принимать",
    course: "Курсом",
    startCourse: "Начало курса",
    endCourse: "Окончание",
    startDatePlaceholder: "Дата начала",
    endDatePlaceholder: "Дата окончания",
    sevenDays: "7 дней",
    fourteenDays: "14 дней",
    thirtyDays: "30 дней",
    customDates: "Свои даты",
    beforeMeal: "До еды",
    duringMeal: "С едой",
    afterMeal: "После еды",
    memberCount: "участников",
    medicineCount: "Количество лекарств",
    nextDoseShort: "Ближайший приём",
    overdueDose: "Пропущен с",
    courseDuration: "Длительность курса",
    dueNow: "Сейчас можно отметить",
    tapToOpen: "Нажмите, чтобы открыть план",
    continuousPlan: "Постоянный",
    mixedPlan: "Курс + постоянный",
    markTaken: "Записать приём",
    taking: "Сохраняем...",
    noDeadline: "Без срока",
    timeMissing: "Время не указано",
    unnamedMedicine: "Лекарство {{index}}",
    amountMissing: "Количество не указано",
    saveRequiresMedication: "Добавьте и сохраните хотя бы одно лекарство с названием.",
    saveMedication: "Сохранить лекарство",
    saveMedicationRequiresTitle: "Укажите название лекарства.",
    overdueState: "Приём пропущен",
    dueNowState: "Пора отметить приём",
    planActiveState: "Приём по графику",
    pausedPlanState: "План на паузе",
    completedPlanState: "Курс завершён",
    archivedPlanState: "Завершённый план",
    savePlanFailed: "Не удалось сохранить план. Попробуйте ещё раз.",
    confirmDeletePlanTitle: "Точно удалить план?",
    confirmDeletePlanDescription:
      "План приёма исчезнет целиком. Восстановить его потом не получится.",
    confirmDeleteMedicineTitle: "Точно удалить лекарство?",
    confirmDeleteMedicineDescription: "Лекарство исчезнет из этого плана приёма.",
    confirmPausePlanTitle: "Поставить план на паузу?",
    confirmPausePlanDescription:
      "Напоминания по этому плану временно перестанут приходить всем участникам.",
    confirmResumePlanTitle: "Возобновить план?",
    confirmResumePlanDescription: "Напоминания по этому плану снова начнут приходить участникам.",
    cancel: "Отмена",
  },
  en: {
    setupBack: "← Back to plans",
    detailsBack: "← Back to plans",
    medicationBack: "← Back to plan",
    setupTitle: "Plan settings",
    detailsTitle: "Medication plan",
    setupSubtitle:
      "First add medicines, then name the plan and choose who should receive reminders.",
    medicationTitle: "Medicine setup",
    medicationSubtitle:
      "Add one medicine to the plan: when to take it, how long it lasts and how it relates to meals.",
    eyebrow: "Pillbox",
    hubTitle: "Pillbox",
    hubSubtitle:
      "Family medication plans: what to take, when to remind and how the course is going.",
    hubMobileHint: "Medication plans and reminders for the family.",
    hubEmpty:
      "There are no plans yet. Create the first plan to see doses, reminders and analytics.",
    createPlan: "Create plan",
    analytics: "Analytics",
    activeFilter: "Active",
    archiveFilter: "Completed",
    analyticsBack: "← Back to plans",
    editPlan: "Edit plan",
    pausePlan: "Pause plan",
    resumePlan: "Resume plan",
    save: "Save",
    savePlan: "Save plan",
    createNewPlan: "Create plan",
    deletePlan: "Delete plan",
    deleteMedicine: "Delete medicine",
    delete: "Delete",
    addMedicine: "Add medicine",
    titleLabel: "Plan name",
    medsTitle: "What will be taken",
    membersTitle: "Who to remind",
    whatName: "Medicine name",
    whatNamePlaceholder: "Medicine name",
    howMuch: "How much to take",
    howMuchPlaceholder: "Example: 2",
    addTime: "+ Add time",
    removeTimeAria: "Remove time {{index}}",
    continuous: "Take continuously",
    course: "Course",
    startCourse: "Course start",
    endCourse: "End date",
    startDatePlaceholder: "Start date",
    endDatePlaceholder: "End date",
    sevenDays: "7 days",
    fourteenDays: "14 days",
    thirtyDays: "30 days",
    customDates: "Custom dates",
    beforeMeal: "Before meal",
    duringMeal: "With meal",
    afterMeal: "After meal",
    memberCount: "members",
    medicineCount: "Medicine count",
    nextDoseShort: "Next dose",
    overdueDose: "Missed since",
    courseDuration: "Course length",
    dueNow: "Ready to confirm",
    tapToOpen: "Tap to open the plan",
    continuousPlan: "Continuous",
    mixedPlan: "Course + continuous",
    markTaken: "Log dose",
    taking: "Saving...",
    noDeadline: "No deadline",
    timeMissing: "Time not set",
    unnamedMedicine: "Medicine {{index}}",
    amountMissing: "Amount not set",
    saveRequiresMedication: "Add and save at least one medicine with a name.",
    saveMedication: "Save medicine",
    saveMedicationRequiresTitle: "Add a medicine name.",
    overdueState: "Dose missed",
    dueNowState: "Time to log dose",
    planActiveState: "On schedule",
    pausedPlanState: "Plan is paused",
    completedPlanState: "Course completed",
    archivedPlanState: "Completed plan",
    savePlanFailed: "Could not save the plan. Please try again.",
    confirmDeletePlanTitle: "Delete this plan?",
    confirmDeletePlanDescription:
      "The whole medication plan will be removed. It cannot be restored later.",
    confirmDeleteMedicineTitle: "Delete this medicine?",
    confirmDeleteMedicineDescription: "This medicine will be removed from the plan.",
    confirmPausePlanTitle: "Pause this plan?",
    confirmPausePlanDescription:
      "Reminders for this plan will temporarily stop for all participants.",
    confirmResumePlanTitle: "Resume this plan?",
    confirmResumePlanDescription:
      "Reminders for this plan will start coming again for participants.",
    cancel: "Cancel",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export const medicationDays = [
  { value: 1, shortRu: "Пн", shortEn: "Mon" },
  { value: 2, shortRu: "Вт", shortEn: "Tue" },
  { value: 3, shortRu: "Ср", shortEn: "Wed" },
  { value: 4, shortRu: "Чт", shortEn: "Thu" },
  { value: 5, shortRu: "Пт", shortEn: "Fri" },
  { value: 6, shortRu: "Сб", shortEn: "Sat" },
  { value: 7, shortRu: "Вс", shortEn: "Sun" },
] as const;

export const editorSectionCardClass = "soft-panel rounded-[30px] px-5 py-5 sm:px-6 sm:py-6";
export const actionPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected inline-flex min-h-[2.5rem] w-full items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const actionSecondaryClass =
  "soft-pill app-profile-action inline-flex min-h-[2.5rem] w-full items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const actionCompactSecondaryClass =
  "soft-pill app-profile-action inline-flex min-h-[2.5rem] shrink-0 items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const actionCompactDangerClass =
  "soft-pill-danger app-profile-action inline-flex min-h-[2.5rem] shrink-0 items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const actionFilterClass =
  "soft-pill app-profile-action inline-flex min-h-[2.5rem] shrink-0 items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const segmentedControlClass = "grid w-full grid-cols-2 gap-2";
export const segmentedButtonClass =
  "soft-pill app-profile-action inline-flex min-h-[2.5rem] items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const segmentedButtonActiveClass =
  "soft-pill-primary app-profile-action app-profile-action--selected inline-flex min-h-[2.5rem] items-center justify-center px-3.25 text-[0.8rem] font-semibold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const flowShellClass = "mx-auto w-full max-w-2xl";
export const flowShellSpacingClass = "space-y-4 sm:space-y-5";
export const PILLBOX_ON_TIME_WINDOW_MS = 30 * 60_000;
export const PILLBOX_LATE_WINDOW_MS = 4 * 60 * 60_000;

export function tPillbox(
  language: AppLanguage,
  key: keyof (typeof pillboxCopy)["ru"],
  variables?: Record<string, string | number>
) {
  const template = pillboxCopy[language][key];
  if (!variables) return template;
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replace(`{{${name}}}`, String(value)),
    template
  );
}

export function createMedication(): MedicationItem {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    dose: "",
    times: [""],
    mealRule: "after_meal",
    repeatDays: medicationDays.map((day) => day.value),
    courseMode: "continuous",
    courseStartDate: "",
    courseEndDate: "",
  };
}

export function summarizeMedicationTimes(times: string[], language: AppLanguage) {
  const normalized = [...times].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (!normalized.length) return tPillbox(language, "timeMissing");
  if (normalized.length <= 2) return normalized.join(", ");
  return `${normalized[0]}, ${normalized[1]} +${normalized.length - 2}`;
}

export function normalizeDisplayTime(value: string) {
  return value.trim().slice(0, 5);
}

export function isMedicationReady(item: MedicationItem) {
  return Boolean(item.title.trim()) && item.times.some((value) => value.trim());
}

export function getTodayIso() {
  return getLocalIsoDate();
}

export function addDaysToIso(isoDate: string, days: number) {
  const parts = isoDate.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : new Date();
  date.setDate(date.getDate() + days);
  return getLocalIsoDate(date);
}

export function getCoursePreset(medication: MedicationItem): CoursePreset {
  if (
    medication.courseMode !== "period" ||
    !medication.courseStartDate ||
    !medication.courseEndDate
  ) {
    return "custom";
  }
  const today = getTodayIso();
  if (medication.courseStartDate !== today) return "custom";
  if (medication.courseEndDate === addDaysToIso(today, 6)) return "7";
  if (medication.courseEndDate === addDaysToIso(today, 13)) return "14";
  if (medication.courseEndDate === addDaysToIso(today, 29)) return "30";
  return "custom";
}

export function UtensilsBadge() {
  return (
    <span className="inline-flex h-4.5 w-4.5 items-center justify-center text-[0.95rem] leading-none">
      🍴
    </span>
  );
}

export function FieldIcon({ kind }: { kind: "pill" | "dose" | "time" }) {
  if (kind === "time") {
    return (
      <span className="inline-flex h-4.5 w-4.5 items-center justify-center text-[0.95rem] leading-none">
        ⏰
      </span>
    );
  }
  if (kind === "dose") {
    return (
      <span className="inline-flex h-4.5 w-4.5 items-center justify-center text-[0.95rem] leading-none">
        🔢
      </span>
    );
  }
  return (
    <span className="inline-flex h-4.5 w-4.5 items-center justify-center text-[0.95rem] leading-none">
      💊
    </span>
  );
}

export function EditorShell({
  children,
  maxWidthClassName = flowShellClass,
  onBack,
}: {
  children: ReactNode;
  maxWidthClassName?: string;
  onBack?: () => void;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const isIosShell = useIsIosShell();

  return (
    <div ref={shellRef} className={`child-profile-shell ${flowShellSpacingClass}`}>
      {onBack ? (
        <IosEdgeBackGesture isEnabled={isIosShell} onBack={onBack} targetRef={shellRef} />
      ) : null}
      <div className={`mx-auto w-full ${maxWidthClassName}`}>{children}</div>
    </div>
  );
}

export function FlowScreenHeader({
  backLabel,
  onBack,
  eyebrow,
  title,
  subtitle,
  containerClassName,
}: {
  backLabel: string;
  onBack: () => void;
  eyebrow: string;
  title?: string;
  subtitle?: string;
  containerClassName?: string;
}) {
  return (
    <ChildSectionTopBar
      onBack={onBack}
      backLabel={backLabel}
      containerClassName={containerClassName}
      title={
        title ? (
          <>
            {eyebrow ? <span className="soft-field-label block">{eyebrow}</span> : null}
            <span className="block">{title}</span>
          </>
        ) : eyebrow ? (
          eyebrow
        ) : undefined
      }
      hint={subtitle}
    />
  );
}

export function TintedField({
  label,
  icon,
  placeholder,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  icon?: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric" | "decimal";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="soft-field-label">{label}</span>
      <span className="group relative block">
        {icon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 z-[1] inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted transition-colors group-focus-within:text-[color:var(--color-primary)] sm:left-4 sm:right-auto">
            <span className="inline-flex h-4.5 w-4.5 items-center justify-center">{icon}</span>
          </span>
        ) : null}
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          className={`soft-input min-h-[2.82rem] w-full px-4 py-0 text-left text-[16px] leading-[1.15] placeholder:text-left sm:min-h-[2.92rem] ${icon ? "pr-14 sm:pr-4 sm:pl-14" : ""}`.trim()}
        />
      </span>
    </label>
  );
}

export function DayChip({
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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full px-0 text-[11px] font-semibold tracking-[-0.03em] transition sm:h-10 sm:w-10 sm:text-[12px] ${
        selected
          ? "soft-pill-success app-profile-action app-profile-action--active min-h-0"
          : "soft-pill app-profile-action min-h-0"
      }`}
    >
      {label}
    </button>
  );
}

export function ChoiceButtons<T extends string>({
  value,
  onChange,
  options,
  columnsClassName,
  buttonClassName,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  columnsClassName?: string;
  buttonClassName?: string;
}) {
  const defaultColumnsClassName =
    options.length === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : options.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : options.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`grid gap-2 ${columnsClassName ?? defaultColumnsClassName}`.trim()}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-[20px] px-3.25 py-2.5 text-center text-[0.8rem] font-semibold leading-tight tracking-[-0.025em] whitespace-normal sm:min-h-[2.6rem] sm:text-[0.82rem] ${
              selected
                ? "soft-pill-primary app-profile-action app-profile-action--selected"
                : "soft-pill app-profile-action"
            } ${buttonClassName ?? ""}`.trim()}
          >
            {option.icon && selected ? (
              <span className="mr-1.5 inline-flex items-center justify-center" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BackLinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[2.35rem] min-w-0 items-center text-sm text-primary hover:underline"
    >
      {label}
    </button>
  );
}

export function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, onOpen: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onOpen();
}

export function normalizeTimePart(raw: string, max: number) {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  const bounded = Math.min(Number(digits), max);
  return String(bounded).padStart(2, "0");
}

export function normalizeTimeInput(raw: string) {
  const cleaned = raw.replace(/[^\d:]/g, "");
  const hasColon = cleaned.includes(":");
  const digits = cleaned.replace(/:/g, "").slice(0, 4);
  if (!digits) return "";
  const hourDigits = digits.slice(0, 2);
  const minuteDigits = digits.slice(2, 4);
  if (hasColon) {
    return `${hourDigits}${cleaned.endsWith(":") && !minuteDigits ? ":" : minuteDigits ? `:${minuteDigits}` : ""}`;
  }
  if (digits.length <= 2) return hourDigits;
  return `${hourDigits}:${minuteDigits}`;
}

export function finalizeTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "08:30";
  if (digits.length <= 2) return `${normalizeTimePart(digits, 23) || "08"}:00`;
  return `${normalizeTimePart(digits.slice(0, 2), 23) || "08"}:${normalizeTimePart(digits.slice(2), 59) || "00"}`;
}

export function resetMedicationEditorFields(
  setEditorTitle: Dispatch<SetStateAction<string>>,
  setEditorDose: Dispatch<SetStateAction<string>>,
  setEditorTimes: Dispatch<SetStateAction<string[]>>
) {
  setEditorTitle("");
  setEditorDose("");
  setEditorTimes([""]);
}

export function displayPillboxText(value: string) {
  return value;
}

export function formatPillboxDoseAmount(value: string, language: AppLanguage) {
  const dose = displayPillboxText(value).trim();
  if (!dose) return dose;
  return language === "ru" ? `${dose} шт` : `${dose} pcs`;
}

export function formatPillboxNextDoseLabel(
  nextDoseAt: string | null,
  fallbackLabel: string | null,
  language: AppLanguage
) {
  if (nextDoseAt) {
    const scheduledAt = new Date(nextDoseAt);
    if (!Number.isNaN(scheduledAt.getTime())) {
      const locale = language === "ru" ? "ru-RU" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(scheduledAt);
    }
  }
  return fallbackLabel ?? "—";
}

export function formatMealRule(mealRule: PillboxMealRule, language: AppLanguage) {
  if (mealRule === "before_meal") return tPillbox(language, "beforeMeal");
  if (mealRule === "with_meal") return tPillbox(language, "duringMeal");
  return tPillbox(language, "afterMeal");
}

export function canMarkGroupDose(group: PillboxGroup) {
  if (
    group.status !== "active" ||
    !group.nextMedicationId ||
    !group.nextDoseAt ||
    Number.isNaN(new Date(group.nextDoseAt).getTime())
  ) {
    return false;
  }
  const now = Date.now();
  const scheduledAt = new Date(group.nextDoseAt).getTime();
  return now >= scheduledAt && now <= scheduledAt + PILLBOX_LATE_WINDOW_MS;
}

export function isOverdueDose(nextDoseAt: string | null, status: PillboxGroup["status"]) {
  if (status !== "active" || !nextDoseAt) return false;
  const scheduledAt = new Date(nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  return Date.now() - scheduledAt.getTime() > PILLBOX_LATE_WINDOW_MS;
}

export function isLateDose(nextDoseAt: string | null, status: PillboxGroup["status"]) {
  if (status !== "active" || !nextDoseAt) return false;
  const scheduledAt = new Date(nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  const diffMs = Date.now() - scheduledAt.getTime();
  return diffMs > PILLBOX_ON_TIME_WINDOW_MS && diffMs <= PILLBOX_LATE_WINDOW_MS;
}

export function getPlanStateCompact(
  status: PillboxPlanSummary["status"],
  isOverdue: boolean,
  canMarkNow: boolean,
  isLate: boolean,
  language: AppLanguage
) {
  if (status === "paused") return language === "ru" ? "На паузе" : "Paused";
  if (status === "completed") return language === "ru" ? "Завершён" : "Completed";
  if (status === "archived") return language === "ru" ? "Завершён" : "Completed";
  if (isOverdue || isLate) return language === "ru" ? "Пропущен" : "Missed";
  if (canMarkNow) return language === "ru" ? "Пора отметить" : "Ready to log";
  return language === "ru" ? "Активен" : "Active";
}

export function getMedicationDayLabel(day: (typeof medicationDays)[number], language: AppLanguage) {
  return language === "ru" ? day.shortRu : day.shortEn;
}

export function buildDraft(accountId: string | null, plan?: PillboxPlan): SetupDraft {
  if (!plan) {
    return {
      id: null,
      title: "",
      members: accountId ? [accountId] : [],
      medications: [],
    };
  }
  return {
    id: plan.id,
    title: plan.title,
    members: [...plan.memberAccountIds],
    medications: plan.medications
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => ({
        id: item.id,
        title: item.customMedicineName ?? "",
        dose: item.doseAmount,
        times: item.times.map(normalizeDisplayTime),
        mealRule: item.mealRule,
        repeatDays: [...item.repeatDays],
        courseMode: item.courseMode,
        courseStartDate: item.courseStartDate ?? "",
        courseEndDate: item.courseEndDate ?? "",
      })),
  };
}

export function toPlanWrite(draft: SetupDraft): PillboxPlanWrite {
  return {
    title: draft.title.trim() || "Новый план",
    memberAccountIds: draft.members,
    medications: draft.medications.map((item, index) => ({
      id: item.id.startsWith("new-") ? null : item.id,
      householdMedicineId: null,
      customMedicineName: item.title.trim() || null,
      doseAmount: item.dose.trim(),
      mealRule: item.mealRule,
      repeatDays: [...item.repeatDays],
      times: item.times.map((value) => finalizeTimeInput(value)),
      courseMode: item.courseMode,
      courseStartDate: item.courseMode === "period" ? item.courseStartDate || null : null,
      courseEndDate: item.courseMode === "period" ? item.courseEndDate || null : null,
      position: index,
    })),
  };
}

export function toPlanWriteFromPlan(
  plan: PillboxPlan,
  status?: PillboxPlanWritableStatus
): PillboxPlanWrite {
  return {
    title: plan.title,
    memberAccountIds: [...plan.memberAccountIds],
    medications: plan.medications
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => ({
        id: item.id,
        householdMedicineId: item.householdMedicineId,
        customMedicineName: item.customMedicineName,
        doseAmount: item.doseAmount,
        mealRule: item.mealRule,
        repeatDays: [...item.repeatDays],
        times: item.times.map(normalizeDisplayTime),
        courseMode: item.courseMode,
        courseStartDate: item.courseStartDate,
        courseEndDate: item.courseEndDate,
        position: item.position,
      })),
    ...(status ? { status } : {}),
  };
}

export function toGroupSummary(summary: PillboxPlanSummary, language: AppLanguage): PillboxGroup {
  return {
    id: summary.id,
    title: summary.title,
    status: summary.status,
    activeCount: summary.activeMedicationCount,
    nextDoseAt: summary.nextDoseAt,
    nextDose: formatPillboxNextDoseLabel(summary.nextDoseAt, summary.nextDoseLabel, language),
    nextMedicationId: summary.nextMedicationId,
    nextMedicationTitle: summary.nextMedicationTitle,
    members: summary.memberAccountIds,
    courseSummaryKind: summary.courseSummaryKind,
    dayLabel: summary.courseDayLabel ?? undefined,
    progress: summary.courseProgressRatio ?? 0,
  };
}
