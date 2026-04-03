import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createPillboxPlan,
  deletePillboxPlan,
  fetchPillboxPlan,
  fetchPillboxPlans,
  takePillboxDose,
  updatePillboxPlan,
} from "@shared/api/pillboxPlans";
import type {
  PillboxMealRule,
  PillboxPlan,
  PillboxPlanSummary,
  PillboxPlanWrite,
} from "@shared/api/pillboxPlans.contract";
import { fetchMyFamilyMembers } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { DateField } from "@shared/components/DateField";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";

type MedicationItem = {
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

type PillboxGroup = {
  id: string;
  title: string;
  status: PillboxPlanSummary["status"];
  activeCount: number;
  nextDoseAt: string | null;
  nextDose: string;
  nextMedicationId: string | null;
  members: string[];
  courseSummaryKind: "continuous" | "period" | "mixed" | null;
  dayLabel?: string;
  progress: number;
};

type SetupDraft = {
  id: string | null;
  title: string;
  members: string[];
  medications: MedicationItem[];
};

type CoursePreset = "7" | "14" | "30" | "custom";
type PillboxDeleteTarget =
  | { kind: "plan" }
  | { kind: "medication"; medicationId: string; medicationName: string };

type PillboxPlanActionTarget = "pause" | "resume" | null;

const pillboxCopy = {
  ru: {
    setupBack: "← К планам",
    detailsBack: "← К планам",
    medicationBack: "← К плану",
    setupTitle: "Настройка плана",
    detailsTitle: "План приёма",
    setupSubtitle:
      "Сначала соберите лекарства, потом назовите план и выберите, кому придут напоминания.",
    medicationTitle: "Настройка лекарства",
    medicationSubtitle:
      "Добавьте одно лекарство в план: когда принимать, как долго и как связать с едой.",
    eyebrow: "Таблетница",
    hubTitle: "Таблетница",
    hubSubtitle: "Семейные планы приёма: что принимать, когда напомнить и как идёт курс.",
    createPlan: "+ Создать план",
    analytics: "Аналитика",
    analyticsSoonTitle: "Аналитика в разработке",
    analyticsSoonDescription:
      "Скоро здесь появится сводка по приёмам и прогрессу планов. Пока раздел готовится.",
    analyticsSoonConfirm: "Понятно",
    editPlan: "Редактировать",
    pausePlan: "Поставить на паузу",
    resumePlan: "Возобновить план",
    save: "Сохранить",
    savePlan: "Сохранить план",
    createNewPlan: "Создать план",
    deletePlan: "Удалить план",
    deleteMedicine: "Удалить лекарство",
    delete: "Удалить",
    addMedicine: "+ Добавить лекарство",
    titleLabel: "Название плана",
    titlePlaceholder: "Название плана",
    medsTitle: "Что будем принимать",
    medsSubtitle: "У каждого лекарства можно отдельно задать время, срок и связь с едой.",
    membersTitle: "Кому напоминать",
    membersHint: "Если никого не выбрать, план останется только у того, кто его настроил.",
    doneTitle: "Сохранить план",
    doneSubtitle: "План появится в таблетнице, когда в нем есть хотя бы одно лекарство.",
    whatName: "Как называется",
    whatNamePlaceholder: "Название лекарства",
    howMuch: "Сколько принимать",
    howMuchPlaceholder: "Например, 1 таблетка",
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
    duringMeal: "Во время еды",
    afterMeal: "После еды",
    countUnit: "шт.",
    memberCount: "участников",
    medicineCount: "Количество лекарств",
    nextDoseShort: "Следующий приём",
    overdueDose: "Просрочен с",
    courseDuration: "Длительность курса",
    dueNow: "Сейчас можно отметить",
    tapToOpen: "Нажмите, чтобы открыть план",
    continuousPlan: "Постоянный",
    mixedPlan: "Курс + постоянный",
    markTaken: "Записать приём",
    taking: "Сохраняем...",
    noDeadline: "Без срока",
    archiveHint: "Когда курс закончится, план можно будет спокойно убрать в историю.",
    timeMissing: "Время не указано",
    unnamedMedicine: "Лекарство {{index}}",
    amountMissing: "Количество не указано",
    noMedicinesTitle: "Пока без лекарств",
    noMedicinesDescription: "Добавьте первое лекарство. Пока план пустой, сохранять его не нужно.",
    saveRequiresMedication: "Добавьте и сохраните хотя бы одно лекарство с названием.",
    saveMedication: "Сохранить лекарство",
    saveMedicationRequiresTitle: "Укажите название лекарства.",
    overdueState: "Просроченный приём",
    dueNowState: "Пора записать",
    planActiveState: "План активен",
    pausedPlanState: "План на паузе",
    archivedPlanState: "План в архиве",
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
    setupTitle: "Plan setup",
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
    createPlan: "+ Create plan",
    analytics: "Analytics",
    analyticsSoonTitle: "Analytics is in progress",
    analyticsSoonDescription:
      "A summary of doses and plan progress will appear here soon. This section is being built.",
    analyticsSoonConfirm: "Got it",
    editPlan: "Edit plan",
    pausePlan: "Pause plan",
    resumePlan: "Resume plan",
    save: "Save",
    savePlan: "Save plan",
    createNewPlan: "Create plan",
    deletePlan: "Delete plan",
    deleteMedicine: "Delete medicine",
    delete: "Delete",
    addMedicine: "+ Add medicine",
    titleLabel: "Plan name",
    titlePlaceholder: "Plan name",
    medsTitle: "What will be taken",
    medsSubtitle: "Each medicine can have its own time, duration and meal relation.",
    membersTitle: "Who to remind",
    membersHint: "If you select no one, the plan stays only with the person who created it.",
    doneTitle: "Save plan",
    doneSubtitle: "The plan appears in Pillbox once it has at least one medicine.",
    whatName: "Medicine name",
    whatNamePlaceholder: "Medicine name",
    howMuch: "How much to take",
    howMuchPlaceholder: "Example: 1 tablet",
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
    countUnit: "items",
    memberCount: "members",
    medicineCount: "Medicine count",
    nextDoseShort: "Next dose",
    overdueDose: "Overdue since",
    courseDuration: "Course length",
    dueNow: "Ready to confirm",
    tapToOpen: "Tap to open the plan",
    continuousPlan: "Continuous",
    mixedPlan: "Course + continuous",
    markTaken: "Log dose",
    taking: "Saving...",
    noDeadline: "No deadline",
    archiveHint: "When the course ends, the plan can be moved to history later.",
    timeMissing: "Time not set",
    unnamedMedicine: "Medicine {{index}}",
    amountMissing: "Amount not set",
    noMedicinesTitle: "No medicines yet",
    noMedicinesDescription:
      "Add the first medicine first. There is no draft to save while the plan is empty.",
    saveRequiresMedication: "Add and save at least one medicine with a name.",
    saveMedication: "Save medicine",
    saveMedicationRequiresTitle: "Add a medicine name.",
    overdueState: "Overdue dose",
    dueNowState: "Ready to log",
    planActiveState: "Plan active",
    pausedPlanState: "Plan is paused",
    archivedPlanState: "Plan is archived",
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

const medicationDays = [
  { value: 1, shortRu: "Пн", shortEn: "Mon" },
  { value: 2, shortRu: "Вт", shortEn: "Tue" },
  { value: 3, shortRu: "Ср", shortEn: "Wed" },
  { value: 4, shortRu: "Чт", shortEn: "Thu" },
  { value: 5, shortRu: "Пт", shortEn: "Fri" },
  { value: 6, shortRu: "Сб", shortEn: "Sat" },
  { value: 7, shortRu: "Вс", shortEn: "Sun" },
] as const;

const editorSectionCardClass =
  "app-section-surface soft-card rounded-[24px] shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:rounded-[26px] xl:px-5.5 xl:py-5.5";
const actionPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex w-full items-center justify-center rounded-[22px] font-semibold";
const actionSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex w-full items-center justify-center rounded-[22px] font-semibold";
const actionDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex w-full items-center justify-center rounded-[22px] font-semibold";
const actionCompactDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex min-h-[2.85rem] shrink-0 items-center justify-center rounded-[18px] px-3.5";
const flowShellClass =
  "app-section-surface soft-panel w-full rounded-[24px] sm:rounded-[26px] lg:px-6 lg:py-6";
const flowShellSpacingClass = "space-y-3 sm:space-y-3.5 lg:space-y-4";

function tPillbox(
  language: AppLanguage,
  key: keyof (typeof pillboxCopy)["ru"],
  variables?: Record<string, string | number>
) {
  const template = pillboxCopy[language][key];
  if (!variables) {
    return template;
  }
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replace(`{{${name}}}`, String(value)),
    template
  );
}

function createMedication(): MedicationItem {
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

function summarizeMedicationTimes(times: string[], language: AppLanguage) {
  const normalized = [...times].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (!normalized.length) return tPillbox(language, "timeMissing");
  if (normalized.length <= 2) return normalized.join(", ");
  return `${normalized[0]}, ${normalized[1]} +${normalized.length - 2}`;
}

function normalizeDisplayTime(value: string) {
  return value.trim().slice(0, 5);
}

function isMedicationReady(item: MedicationItem) {
  return Boolean(item.title.trim()) && item.times.some((value) => value.trim());
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getCoursePreset(medication: MedicationItem): CoursePreset {
  if (
    medication.courseMode !== "period" ||
    !medication.courseStartDate ||
    !medication.courseEndDate
  ) {
    return "custom";
  }

  const today = getTodayIso();
  if (medication.courseStartDate !== today) {
    return "custom";
  }

  if (medication.courseEndDate === addDaysToIso(today, 6)) return "7";
  if (medication.courseEndDate === addDaysToIso(today, 13)) return "14";
  if (medication.courseEndDate === addDaysToIso(today, 29)) return "30";

  return "custom";
}

function UtensilsBadge() {
  return (
    <span className="inline-flex h-4.5 w-4.5 items-center justify-center text-[0.95rem] leading-none">
      🍴
    </span>
  );
}

function FieldIcon({ kind }: { kind: "pill" | "dose" | "time" }) {
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

function EditorShell({ children }: { children: ReactNode }) {
  return (
    <div className={flowShellClass} style={{ boxShadow: "0 14px 44px rgba(15,23,42,0.1)" }}>
      <div className={flowShellSpacingClass}>{children}</div>
    </div>
  );
}

function FlowScreenHeader({
  backLabel,
  onBack,
  eyebrow,
  title,
  subtitle,
}: {
  backLabel: string;
  onBack: () => void;
  eyebrow: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2 px-1">
      <BackLinkButton label={backLabel} onClick={onBack} />
      <div className="space-y-1">
        <p className="soft-field-label">{eyebrow}</p>
        {title ? (
          <h1 className="app-page-title text-[1.34rem] tracking-[-0.04em] sm:text-[1.64rem]">
            {title}
          </h1>
        ) : null}
        {subtitle ? <p className="text-[0.8rem] leading-5 text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function TintedField({
  label,
  icon,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="soft-field-label">{label}</span>
      <span className="group relative block">
        {icon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 z-[1] inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_10%,white)] text-muted transition-colors group-focus-within:bg-[color:color-mix(in_srgb,var(--color-primary)_16%,white)] group-focus-within:text-[color:var(--color-primary)] sm:left-3 sm:right-auto">
            <span className="inline-flex h-4.5 w-4.5 items-center justify-center">{icon}</span>
          </span>
        ) : null}
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          className={`soft-input min-h-[3.05rem] w-full px-4 text-[0.96rem] placeholder:text-muted sm:min-h-[3.15rem] ${icon ? "pr-14 sm:pr-4 sm:pl-14" : ""}`.trim()}
        />
      </span>
    </label>
  );
}

function DayChip({
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
        selected ? "soft-button-primary min-h-0" : "soft-button-secondary min-h-0"
      }`}
    >
      {label}
    </button>
  );
}

function ChoiceButtons<T extends string>({
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
            className={`inline-flex min-h-[3.05rem] w-full items-center justify-center rounded-[22px] px-4 py-3 text-center text-[0.88rem] font-semibold leading-tight tracking-[-0.025em] whitespace-normal sm:min-h-[3.15rem] ${
              selected ? "soft-button-primary" : "soft-button-secondary"
            } ${buttonClassName ?? ""}`.trim()}
          >
            {selected && option.icon ? <span className="mr-1.5">{option.icon}</span> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function BackLinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex text-sm text-primary hover:underline"
    >
      {label}
    </button>
  );
}

function handleCardKeyDown(event: React.KeyboardEvent<HTMLDivElement>, onOpen: () => void) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  onOpen();
}

function normalizeTimePart(raw: string, max: number) {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  const bounded = Math.min(Number(digits), max);
  return String(bounded).padStart(2, "0");
}

function normalizeTimeInput(raw: string) {
  const cleaned = raw.replace(/[^\d:]/g, "");
  const hasColon = cleaned.includes(":");
  const digits = cleaned.replace(/:/g, "").slice(0, 4);

  if (!digits) return "";

  const hourDigits = digits.slice(0, 2);
  const minuteDigits = digits.slice(2, 4);

  if (hasColon) {
    return `${hourDigits}${cleaned.endsWith(":") && !minuteDigits ? ":" : minuteDigits ? `:${minuteDigits}` : ""}`;
  }

  if (digits.length <= 2) {
    return hourDigits;
  }

  return `${hourDigits}:${minuteDigits}`;
}

function finalizeTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);

  if (!digits) return "08:30";
  if (digits.length <= 2) return `${normalizeTimePart(digits, 23) || "08"}:00`;

  return `${normalizeTimePart(digits.slice(0, 2), 23) || "08"}:${normalizeTimePart(digits.slice(2), 59) || "00"}`;
}

function resetMedicationEditorFields(
  setEditorTitle: Dispatch<SetStateAction<string>>,
  setEditorDose: Dispatch<SetStateAction<string>>,
  setEditorTimes: Dispatch<SetStateAction<string[]>>
) {
  setEditorTitle("");
  setEditorDose("");
  setEditorTimes([""]);
}

function displayPillboxText(value: string) {
  return value;
}

function formatPillboxNextDoseLabel(
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

function formatMealRule(mealRule: PillboxMealRule, language: AppLanguage) {
  if (mealRule === "before_meal") {
    return tPillbox(language, "beforeMeal");
  }
  if (mealRule === "with_meal") {
    return tPillbox(language, "duringMeal");
  }
  return tPillbox(language, "afterMeal");
}

function canMarkGroupDose(group: PillboxGroup) {
  return Boolean(
    group.status === "active" &&
    group.nextMedicationId &&
    group.nextDoseAt &&
    new Date(group.nextDoseAt).getTime() <= Date.now() + 60_000
  );
}

function isOverdueDose(nextDoseAt: string | null, status: PillboxGroup["status"]) {
  if (status !== "active" || !nextDoseAt) {
    return false;
  }
  const scheduledAt = new Date(nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return false;
  }
  return scheduledAt.getTime() < Date.now();
}

function getPlanStateHeadline(
  status: PillboxGroup["status"],
  isOverdue: boolean,
  canMarkNow: boolean,
  language: AppLanguage
) {
  if (status === "paused") {
    return tPillbox(language, "pausedPlanState");
  }
  if (status === "archived") {
    return tPillbox(language, "archivedPlanState");
  }
  if (isOverdue) {
    return tPillbox(language, "overdueState");
  }
  if (canMarkNow) {
    return tPillbox(language, "dueNowState");
  }
  return tPillbox(language, "planActiveState");
}

function formatCourseDayLabel(rawLabel: string, language: AppLanguage) {
  const normalized = rawLabel.trim();
  if (language !== "ru") {
    return normalized;
  }
  const englishMatch = normalized.match(/^Day\s+(\d+)\s+of\s+(\d+)$/i);
  if (englishMatch) {
    return `День ${englishMatch[1]} из ${englishMatch[2]}`;
  }
  return normalized;
}

function getCourseSummaryLabel(group: PillboxGroup, language: AppLanguage) {
  if (group.courseSummaryKind === "period" && group.dayLabel) {
    return displayPillboxText(formatCourseDayLabel(group.dayLabel, language));
  }
  if (group.courseSummaryKind === "continuous") {
    return tPillbox(language, "continuousPlan");
  }
  if (group.courseSummaryKind === "mixed") {
    return tPillbox(language, "mixedPlan");
  }
  return tPillbox(language, "noDeadline");
}

function getMedicationDayLabel(day: (typeof medicationDays)[number], language: AppLanguage) {
  return language === "ru" ? day.shortRu : day.shortEn;
}

function buildDraft(accountId: string | null, plan?: PillboxPlan): SetupDraft {
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

function toPlanWrite(draft: SetupDraft): PillboxPlanWrite {
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

function toPlanWriteFromPlan(plan: PillboxPlan, status?: PillboxPlan["status"]): PillboxPlanWrite {
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

function toGroupSummary(summary: PillboxPlanSummary, language: AppLanguage): PillboxGroup {
  return {
    id: summary.id,
    title: summary.title,
    status: summary.status,
    activeCount: summary.activeMedicationCount,
    nextDoseAt: summary.nextDoseAt,
    nextDose: formatPillboxNextDoseLabel(summary.nextDoseAt, summary.nextDoseLabel, language),
    nextMedicationId: summary.nextMedicationId,
    members: summary.memberAccountIds,
    courseSummaryKind: summary.courseSummaryKind,
    dayLabel: summary.courseDayLabel ?? undefined,
    progress: summary.courseProgressRatio ?? 0,
  };
}

export function PillboxPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDose, setEditorDose] = useState("");
  const [editorTimes, setEditorTimes] = useState<string[]>([""]);
  const [editorCoursePreset, setEditorCoursePreset] = useState<CoursePreset>("custom");
  const [deleteTarget, setDeleteTarget] = useState<PillboxDeleteTarget | null>(null);
  const [planActionTarget, setPlanActionTarget] = useState<PillboxPlanActionTarget>(null);
  const [pendingNewMedicationId, setPendingNewMedicationId] = useState<string | null>(null);
  const [editorMedicationBaseline, setEditorMedicationBaseline] = useState<MedicationItem | null>(
    null
  );
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [savePlanError, setSavePlanError] = useState<string | null>(null);
  const [isAnalyticsSoonOpen, setIsAnalyticsSoonOpen] = useState(false);
  const screen =
    searchParams.get("mode") === "setup" ||
    searchParams.get("mode") === "medication" ||
    searchParams.get("mode") === "details"
      ? (searchParams.get("mode") as "setup" | "medication" | "details")
      : "hub";
  const previousScreenRef = useRef(screen);
  const activeMedicationId = searchParams.get("med");
  const selectedPlanId = searchParams.get("plan");
  const highlightedPlanId = screen === "hub" ? searchParams.get("highlightPlan") : null;
  const isCreating = selectedPlanId === "new" || (screen !== "hub" && !selectedPlanId);

  const isEditing = Boolean(draft?.id);
  const hasReadyMedication = Boolean(draft?.medications.some(isMedicationReady));
  const canSavePlan = hasReadyMedication;
  const saveBlockedReason = !hasReadyMedication
    ? tPillbox(language, "saveRequiresMedication")
    : null;
  const activeMedication =
    draft?.medications.find((medication) => medication.id === activeMedicationId) ?? null;
  const canSaveMedication = Boolean(editorTitle.trim());

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["families", "me", "members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(currentFamilyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: planSummaries = [], isLoading: plansLoading } = useQuery({
    queryKey: ["pillbox-plans", currentFamilyId, language],
    queryFn: fetchPillboxPlans,
    enabled: Boolean(currentFamilyId),
  });

  const { data: selectedPlan, isLoading: selectedPlanLoading } = useQuery({
    queryKey: ["pillbox-plan", selectedPlanId],
    queryFn: () => fetchPillboxPlan(selectedPlanId!),
    enabled: Boolean(selectedPlanId && selectedPlanId !== "new"),
  });

  const groups = useMemo(() => {
    const mapped = planSummaries.map((summary) => toGroupSummary(summary, language));
    if (!highlightedPlanId) {
      return mapped;
    }
    return mapped.sort((left, right) => {
      const leftRank = left.id === highlightedPlanId ? 0 : 1;
      const rightRank = right.id === highlightedPlanId ? 0 : 1;
      return leftRank - rightRank;
    });
  }, [highlightedPlanId, language, planSummaries]);

  const createPlanMutation = useMutation({
    mutationFn: createPillboxPlan,
    onSuccess: async () => {
      setSavePlanError(null);
      await queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
      goToHub();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setSavePlanError(detail || tPillbox(language, "savePlanFailed"));
        return;
      }
      setSavePlanError(tPillbox(language, "savePlanFailed"));
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PillboxPlanWrite }) =>
      updatePillboxPlan(planId, payload),
    onSuccess: async (plan) => {
      setSavePlanError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.invalidateQueries({ queryKey: ["pillbox-plan", plan.id] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plan", plan.id] }),
      ]);
      goToHub();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setSavePlanError(detail || tPillbox(language, "savePlanFailed"));
        return;
      }
      setSavePlanError(tPillbox(language, "savePlanFailed"));
    },
  });

  const togglePlanStatusMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PillboxPlanWrite }) =>
      updatePillboxPlan(planId, payload),
    onSuccess: async (plan) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.invalidateQueries({ queryKey: ["pillbox-plan", plan.id] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plan", plan.id] }),
      ]);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deletePillboxPlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
      goToHub();
    },
  });

  const takeDoseMutation = useMutation({
    mutationFn: ({
      planId,
      medicationId,
      scheduledFor,
    }: {
      planId: string;
      medicationId: string;
      scheduledFor: string | null;
    }) =>
      takePillboxDose(planId, medicationId, {
        source: "manual",
        scheduled_for: scheduledFor,
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.invalidateQueries({ queryKey: ["pillbox-plan", variables.planId] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
        queryClient.refetchQueries({ queryKey: ["pillbox-plan", variables.planId] }),
      ]);
    },
  });

  useEffect(() => {
    if (screen !== "hub" && !draft) {
      if (isCreating) {
        setDraft(buildDraft(accountId, undefined));
      } else if (!selectedPlanLoading && !selectedPlanId) {
        navigate("/pillbox", { replace: true });
      }
      return;
    }

    if (screen === "medication" && draft && !activeMedication) {
      navigate(`/pillbox?mode=setup${draft.id ? `&plan=${draft.id}` : "&plan=new"}`, {
        replace: true,
      });
    }
  }, [
    accountId,
    activeMedication,
    draft,
    isCreating,
    navigate,
    screen,
    selectedPlanId,
    selectedPlanLoading,
  ]);

  useEffect(() => {
    if (screen === "hub") {
      return;
    }
    if (isCreating) {
      setDraft((current) => current ?? buildDraft(accountId, undefined));
      return;
    }
    if (selectedPlan && selectedPlanId && draft?.id !== selectedPlanId) {
      setDraft(buildDraft(accountId, selectedPlan));
    }
  }, [accountId, draft?.id, isCreating, screen, selectedPlan, selectedPlanId]);

  useEffect(() => {
    if (screen !== "medication" || !activeMedicationId) {
      resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
      setEditorCoursePreset("custom");
      setEditorMedicationBaseline(null);
      return;
    }

    const medication = draft?.medications.find((item) => item.id === activeMedicationId) ?? null;
    setEditorTitle(medication ? displayPillboxText(medication.title) : "");
    setEditorDose(medication ? displayPillboxText(medication.dose) : "");
    setEditorTimes(medication?.times.length ? [...medication.times] : [""]);
    setEditorCoursePreset(medication ? getCoursePreset(medication) : "custom");
    setEditorMedicationBaseline(
      medication
        ? {
            ...medication,
            times: [...medication.times],
            repeatDays: [...medication.repeatDays],
          }
        : null
    );
  }, [activeMedicationId, draft?.id, screen]);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;

    if (previousScreen !== "medication" || screen === "medication") {
      return;
    }

    if (pendingNewMedicationId) {
      setDraft((current) => {
        if (!current) return current;
        const pendingMedication = current.medications.find(
          (item) => item.id === pendingNewMedicationId
        );
        if (!pendingMedication || isMedicationReady(pendingMedication)) {
          return current;
        }
        return {
          ...current,
          medications: current.medications.filter((item) => item.id !== pendingNewMedicationId),
        };
      });
      setPendingNewMedicationId(null);
      setEditorMedicationBaseline(null);
      return;
    }

    if (!editorMedicationBaseline) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            medications: current.medications.map((item) =>
              item.id === editorMedicationBaseline.id ? editorMedicationBaseline : item
            ),
          }
        : current
    );
    setEditorMedicationBaseline(null);
  }, [editorMedicationBaseline, pendingNewMedicationId, screen]);

  const openCreate = () => {
    setDraft(buildDraft(accountId, undefined));
    navigate("/pillbox?mode=setup&plan=new");
  };

  const openDetails = (group: PillboxGroup) => {
    setDraft(null);
    navigate(`/pillbox?mode=details&plan=${group.id}`);
  };

  const discardUnsavedNewMedication = () => {
    const targetMedicationId = pendingNewMedicationId ?? activeMedication?.id ?? null;
    if (screen !== "medication" || !targetMedicationId) {
      return;
    }

    setDraft((current) =>
      current
        ? (() => {
            const medication = current.medications.find((item) => item.id === targetMedicationId);
            if (!medication || !medication.id.startsWith("new-") || isMedicationReady(medication)) {
              return current;
            }
            return {
              ...current,
              medications: current.medications.filter((item) => item.id !== targetMedicationId),
            };
          })()
        : current
    );
    setPendingNewMedicationId(null);
  };

  const goToHub = () => {
    discardUnsavedNewMedication();
    setDraft(null);
    setSaveAttempted(false);
    setSavePlanError(null);
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    navigate("/pillbox");
  };

  const goToSetup = () => {
    const targetPlanId = draft?.id ?? selectedPlanId;
    navigate(`/pillbox?mode=setup${targetPlanId ? `&plan=${targetPlanId}` : "&plan=new"}`);
  };

  const goToSetupFromMedication = () => {
    discardUnsavedNewMedication();
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    setEditorCoursePreset("custom");
    const targetPlanId = draft?.id ?? selectedPlanId;
    navigate(`/pillbox?mode=setup${targetPlanId ? `&plan=${targetPlanId}` : "&plan=new"}`);
  };

  const closeMedicationEditor = () => {
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    setEditorCoursePreset("custom");
    setEditorMedicationBaseline(null);
    const targetPlanId = draft?.id ?? selectedPlanId;
    navigate(`/pillbox?mode=setup${targetPlanId ? `&plan=${targetPlanId}` : "&plan=new"}`);
  };

  const goToMedication = (medicationId: string) => {
    navigate(
      `/pillbox?mode=medication&med=${medicationId}${draft?.id ? `&plan=${draft.id}` : "&plan=new"}`
    );
  };

  const addMedication = () => {
    const nextMedication = createMedication();
    setPendingNewMedicationId(nextMedication.id);
    setDraft((current) =>
      current
        ? {
            ...current,
            medications: [...current.medications, nextMedication],
          }
        : current
    );
    goToMedication(nextMedication.id);
  };

  const updateMedication = (id: string, patch: Partial<MedicationItem>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            medications: current.medications.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          }
        : current
    );
  };

  const updateEditorTimeAt = (index: number, nextValue: string) => {
    setEditorTimes((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index ? normalizeTimeInput(nextValue) : value
      )
    );
  };

  const finalizeEditorTimeAt = (index: number) => {
    setEditorTimes((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index ? (value.trim() ? finalizeTimeInput(value) : "") : value
      )
    );
  };

  const addEditorTime = () => {
    setEditorTimes((current) => [...current, ""]);
  };

  const removeEditorTime = (index: number) => {
    setEditorTimes((current) => {
      if (current.length <= 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const saveGroup = () => {
    setSaveAttempted(true);
    setSavePlanError(null);
    if (!draft || !canSavePlan) return;
    const payload = toPlanWrite(draft);
    if (draft.id) {
      updatePlanMutation.mutate({ planId: draft.id, payload });
      return;
    }
    createPlanMutation.mutate(payload);
  };

  const deleteGroup = () => {
    const targetPlanId = draft?.id ?? selectedPlanId;
    if (!targetPlanId) {
      goToHub();
      return;
    }
    deletePlanMutation.mutate(targetPlanId);
  };

  const deleteMedication = (medicationId: string) => {
    if (pendingNewMedicationId === medicationId) {
      setPendingNewMedicationId(null);
    }
    if (editorMedicationBaseline?.id === medicationId) {
      setEditorMedicationBaseline(null);
    }
    setDraft((current) => {
      if (!current) return current;

      const nextMedications = current.medications.filter((item) => item.id !== medicationId);
      return {
        ...current,
        medications: nextMedications,
      };
    });

    if (screen === "medication") {
      goToSetup();
    }
  };

  const requestDeleteMedication = (medicationId: string, medicationName: string) => {
    setDeleteTarget({ kind: "medication", medicationId, medicationName });
  };

  const requestDeletePlan = () => {
    setDeleteTarget({ kind: "plan" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "plan") {
      deleteGroup();
      setDeleteTarget(null);
      return;
    }

    deleteMedication(deleteTarget.medicationId);
    setDeleteTarget(null);
  };

  const markNextDoseTaken = (group: PillboxGroup) => {
    if (!group.nextMedicationId || takeDoseMutation.isPending) {
      return;
    }
    takeDoseMutation.mutate({
      planId: group.id,
      medicationId: group.nextMedicationId,
      scheduledFor: group.nextDoseAt,
    });
  };

  const toggleSelectedPlanStatus = () => {
    if (!selectedPlan || togglePlanStatusMutation.isPending) {
      return;
    }
    setPlanActionTarget(selectedPlan.status === "active" ? "pause" : "resume");
  };

  const confirmPlanAction = () => {
    if (
      !selectedPlanId ||
      !selectedPlan ||
      !planActionTarget ||
      togglePlanStatusMutation.isPending
    ) {
      return;
    }

    const nextStatus = planActionTarget === "pause" ? "paused" : "active";
    togglePlanStatusMutation.mutate({
      planId: selectedPlanId,
      payload: toPlanWriteFromPlan(selectedPlan, nextStatus),
    });
    setPlanActionTarget(null);
  };

  const openAnalytics = () => {
    setIsAnalyticsSoonOpen(true);
  };

  if (screen === "hub" && plansLoading) {
    return (
      <div className="space-y-6">
        <PageIntro
          title={tPillbox(language, "hubTitle")}
          subtitle={tPillbox(language, "hubSubtitle")}
          compactOnMobile
          hideOnMobile
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={openAnalytics} className={actionSecondaryClass}>
                {tPillbox(language, "analytics")}
              </button>
              <button type="button" disabled className={actionPrimaryClass}>
                {tPillbox(language, "createPlan")}
              </button>
            </div>
          }
          className="[&_.app-title]:text-[1.72rem] [&_.app-title]:tracking-[-0.05em] sm:[&_.app-title]:text-[2.1rem] [&_.app-subtitle]:text-[0.93rem] sm:[&_.app-subtitle]:text-[0.98rem]"
        />
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <h1 className="app-title text-[1.52rem] tracking-[-0.045em]">
              {tPillbox(language, "hubTitle")}
            </h1>
          </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAnalytics}
            className="app-btn-secondary-md soft-button-secondary inline-flex min-h-[2.5rem] w-auto items-center justify-center px-3 text-[0.8rem] font-semibold tracking-[-0.02em]"
          >
            {tPillbox(language, "analytics")}
          </button>
          <button
            type="button"
            disabled
            className="soft-button-primary inline-flex min-h-[2.8rem] shrink-0 items-center justify-center rounded-[18px] px-3.5 text-[0.82rem] font-semibold tracking-[-0.025em] opacity-70"
          >
            {tPillbox(language, "createPlan")}
          </button>
        </div>
      </div>
        <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
          {language === "ru" ? "Загружаем планы приёма..." : "Loading medication plans..."}
        </div>
        <ConfirmDialog
          isOpen={isAnalyticsSoonOpen}
          title={tPillbox(language, "analyticsSoonTitle")}
          description={tPillbox(language, "analyticsSoonDescription")}
          confirmLabel={tPillbox(language, "analyticsSoonConfirm")}
          cancelLabel={tPillbox(language, "cancel")}
          onConfirm={() => setIsAnalyticsSoonOpen(false)}
          onCancel={() => setIsAnalyticsSoonOpen(false)}
        />
      </div>
    );
  }

  if (screen !== "hub" && !isCreating && selectedPlanLoading && !draft) {
    return (
      <EditorShell>
        <FlowScreenHeader
          backLabel={
            screen === "medication"
              ? tPillbox(language, "medicationBack")
              : screen === "details"
                ? tPillbox(language, "detailsBack")
                : tPillbox(language, "setupBack")
          }
          onBack={goToHub}
          eyebrow={tPillbox(language, "eyebrow")}
          title={
            screen === "medication"
              ? tPillbox(language, "medicationTitle")
              : screen === "details"
                ? tPillbox(language, "detailsTitle")
                : tPillbox(language, "setupTitle")
          }
          subtitle={undefined}
        />
        <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
          {language === "ru" ? "Загружаем план..." : "Loading plan..."}
        </div>
      </EditorShell>
    );
  }

  if (screen === "medication" && draft && activeMedication) {
    const showCourseDates = activeMedication.courseMode === "period";
    const editorFieldWrapClass = "mx-auto w-full max-w-[36rem]";

    return (
      <EditorShell>
        <FlowScreenHeader
          backLabel={tPillbox(language, "medicationBack")}
          onBack={goToSetupFromMedication}
          eyebrow={tPillbox(language, "eyebrow")}
          title={tPillbox(language, "medicationTitle")}
        />

        <div className="space-y-3.5 sm:space-y-4">
          <div className="space-y-3.5 sm:space-y-4">
            <div className={editorSectionCardClass}>
              <div className="space-y-4.5 sm:space-y-5">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <TintedField
                      label={tPillbox(language, "whatName")}
                      icon={<FieldIcon kind="pill" />}
                      placeholder={tPillbox(language, "whatNamePlaceholder")}
                      value={editorTitle}
                      onChange={setEditorTitle}
                    />
                    <TintedField
                      label={tPillbox(language, "howMuch")}
                      icon={<FieldIcon kind="dose" />}
                      placeholder={tPillbox(language, "howMuchPlaceholder")}
                      value={editorDose}
                      onChange={setEditorDose}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-1 sm:pt-2">
                  <div className={editorFieldWrapClass}>
                    <div className="space-y-2">
                      {editorTimes.map((timeValue, index) => (
                        <div key={`${activeMedication.id}-time-${index}`} className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={timeValue}
                              onChange={(event) => updateEditorTimeAt(index, event.target.value)}
                              onBlur={() => finalizeEditorTimeAt(index)}
                              placeholder="08:30"
                              className="soft-input min-h-[3.15rem] w-full px-4 pr-11 text-center text-[1.08rem] font-semibold tracking-[-0.04em] text-foreground placeholder:text-muted sm:min-h-[3.3rem] sm:pr-12 sm:text-[1.26rem]"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_12%,white)] text-[color:var(--color-primary)] sm:h-9 sm:w-9">
                              <FieldIcon kind="time" />
                            </span>
                          </div>
                          {editorTimes.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeEditorTime(index)}
                              className="soft-button-secondary inline-flex h-[3.15rem] w-[3.15rem] shrink-0 items-center justify-center rounded-[18px] px-0 text-[1.15rem] leading-none sm:h-[3.3rem] sm:w-[3.3rem]"
                              aria-label={tPillbox(language, "removeTimeAria", {
                                index: index + 1,
                              })}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addEditorTime}
                        className="soft-button-secondary inline-flex min-h-[2.9rem] w-full items-center justify-center rounded-[18px] px-4 text-[0.84rem] font-semibold tracking-[-0.025em]"
                      >
                        {tPillbox(language, "addTime")}
                      </button>
                    </div>
                  </div>

                  <div className={`${editorFieldWrapClass} space-y-4`}>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-7 gap-2 sm:gap-2.5 lg:gap-2">
                        {medicationDays.map((day) => {
                          const selected = activeMedication.repeatDays.includes(day.value);
                          return (
                            <DayChip
                              key={day.value}
                              label={getMedicationDayLabel(day, language)}
                              selected={selected}
                              onClick={() =>
                                updateMedication(activeMedication.id, {
                                  repeatDays: selected
                                    ? activeMedication.repeatDays.filter(
                                        (item) => item !== day.value
                                      )
                                    : [...activeMedication.repeatDays, day.value],
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <ChoiceButtons
                        value={activeMedication.courseMode}
                        onChange={(value) => {
                          if (value === "period") {
                            const today = getTodayIso();
                            setEditorCoursePreset("14");
                            updateMedication(activeMedication.id, {
                              courseMode: "period",
                              courseStartDate: activeMedication.courseStartDate || today,
                              courseEndDate:
                                activeMedication.courseEndDate || addDaysToIso(today, 13),
                            });
                            return;
                          }

                          updateMedication(activeMedication.id, {
                            courseMode: "continuous",
                            courseStartDate: "",
                            courseEndDate: "",
                          });
                          setEditorCoursePreset("custom");
                        }}
                        columnsClassName="grid-cols-1 sm:grid-cols-2"
                        options={[
                          { value: "continuous", label: tPillbox(language, "continuous") },
                          { value: "period", label: tPillbox(language, "course") },
                        ]}
                      />
                      {showCourseDates ? (
                        <div className="space-y-3">
                          <ChoiceButtons
                            value={editorCoursePreset}
                            onChange={(value) => {
                              if (value === "custom") {
                                setEditorCoursePreset("custom");
                                const today = getTodayIso();
                                updateMedication(activeMedication.id, {
                                  courseStartDate: activeMedication.courseStartDate || today,
                                  courseEndDate:
                                    activeMedication.courseEndDate || addDaysToIso(today, 13),
                                });
                                return;
                              }

                              const today = getTodayIso();
                              const durationDays = value === "7" ? 7 : value === "14" ? 14 : 30;
                              setEditorCoursePreset(value);
                              updateMedication(activeMedication.id, {
                                courseStartDate: today,
                                courseEndDate: addDaysToIso(today, durationDays - 1),
                              });
                            }}
                            columnsClassName="grid-cols-2 sm:grid-cols-4"
                            buttonClassName="text-[0.82rem] sm:text-[0.86rem]"
                            options={[
                              { value: "7", label: tPillbox(language, "sevenDays") },
                              { value: "14", label: tPillbox(language, "fourteenDays") },
                              { value: "30", label: tPillbox(language, "thirtyDays") },
                              { value: "custom", label: tPillbox(language, "customDates") },
                            ]}
                          />
                          {editorCoursePreset === "custom" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block space-y-1.5">
                                <span className="soft-field-label">
                                  {tPillbox(language, "startCourse")}
                                </span>
                                <DateField
                                  value={activeMedication.courseStartDate}
                                  onChange={(nextValue) =>
                                    updateMedication(activeMedication.id, {
                                      courseStartDate: nextValue,
                                      courseEndDate:
                                        activeMedication.courseEndDate &&
                                        nextValue &&
                                        activeMedication.courseEndDate < nextValue
                                          ? nextValue
                                          : activeMedication.courseEndDate,
                                    })
                                  }
                                  placeholder={tPillbox(language, "startDatePlaceholder")}
                                  language={language}
                                />
                              </label>
                              <label className="block space-y-1.5">
                                <span className="soft-field-label">
                                  {tPillbox(language, "endCourse")}
                                </span>
                                <DateField
                                  value={activeMedication.courseEndDate}
                                  onChange={(nextValue) =>
                                    updateMedication(activeMedication.id, {
                                      courseEndDate: nextValue,
                                    })
                                  }
                                  placeholder={tPillbox(language, "endDatePlaceholder")}
                                  language={language}
                                  min={activeMedication.courseStartDate || undefined}
                                />
                              </label>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            <div className={editorSectionCardClass}>
              <div className="mx-auto w-full max-w-[36rem]">
                <ChoiceButtons
                  value={activeMedication.mealRule}
                  onChange={(value) =>
                    updateMedication(activeMedication.id, {
                      mealRule: value as MedicationItem["mealRule"],
                    })
                  }
                  columnsClassName="grid-cols-1 sm:grid-cols-3"
                  buttonClassName="text-[0.84rem] sm:text-[0.86rem]"
                  options={[
                    {
                      value: "before_meal",
                      label: tPillbox(language, "beforeMeal"),
                      icon: <UtensilsBadge />,
                    },
                    {
                      value: "with_meal",
                      label: tPillbox(language, "duringMeal"),
                      icon: <UtensilsBadge />,
                    },
                    {
                      value: "after_meal",
                      label: tPillbox(language, "afterMeal"),
                      icon: <UtensilsBadge />,
                    },
                  ]}
                />
              </div>
            </div>

            <div className={editorSectionCardClass}>
              <div className="mx-auto flex w-full max-w-[36rem] flex-col gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!canSaveMedication) return;
                    const normalizedTimes = editorTimes
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((value) => finalizeTimeInput(value));

                    updateMedication(activeMedication.id, {
                      title: editorTitle.trim(),
                      dose: editorDose.trim(),
                      times: normalizedTimes.length ? normalizedTimes : ["08:30"],
                    });
                    if (pendingNewMedicationId === activeMedication.id) {
                      setPendingNewMedicationId(null);
                    }
                    setEditorMedicationBaseline(null);
                    closeMedicationEditor();
                  }}
                  disabled={!canSaveMedication}
                  className={`${actionPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {tPillbox(language, "saveMedication")}
                </button>
                {!canSaveMedication ? (
                  <p className="text-[0.78rem] leading-5 text-muted">
                    {tPillbox(language, "saveMedicationRequiresTitle")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          title={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanTitle")
              : tPillbox(language, "confirmDeleteMedicineTitle")
          }
          description={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanDescription")
              : tPillbox(language, "confirmDeleteMedicineDescription")
          }
          confirmLabel={tPillbox(language, "delete")}
          cancelLabel={tPillbox(language, "cancel")}
          confirmTone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </EditorShell>
    );
  }

  if (screen === "details" && selectedPlan && selectedPlanId) {
    const selectedGroup = groups.find((group) => group.id === selectedPlanId) ?? null;
    const selectedGroupOverdue = selectedGroup
      ? isOverdueDose(selectedGroup.nextDoseAt, selectedGroup.status)
      : false;
    const canLogSelectedGroup = selectedGroup ? canMarkGroupDose(selectedGroup) : false;
    const sortedMedications = [...selectedPlan.medications].sort(
      (left, right) => left.position - right.position
    );

    return (
      <EditorShell>
        <FlowScreenHeader
          backLabel={tPillbox(language, "detailsBack")}
          onBack={goToHub}
          eyebrow={tPillbox(language, "eyebrow")}
          title={undefined}
        />

        <RowSurface className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    selectedPlan.status === "active"
                      ? "bg-[color:var(--color-success)]"
                      : selectedPlan.status === "paused"
                        ? "bg-[color:var(--color-warning)]"
                        : "bg-[color:var(--color-danger)]"
                  }`}
                />
                <p className="app-card-title">
                  {displayPillboxText(selectedPlan.title)}
                </p>
              </div>
              <p
                className={`mt-2 text-[0.92rem] leading-6 ${
                  selectedPlan.status === "paused" || selectedPlan.status === "archived"
                    ? "font-semibold text-muted"
                    : selectedGroupOverdue
                      ? "font-semibold text-[color:var(--color-danger)]"
                      : canLogSelectedGroup
                        ? "font-semibold text-[color:var(--color-success)]"
                        : "font-semibold text-foreground"
                }`}
              >
                {getPlanStateHeadline(
                  selectedPlan.status,
                  selectedGroupOverdue,
                  canLogSelectedGroup,
                  language
                )}
              </p>
            </div>

            <div className="grid gap-2 text-left sm:min-w-[13.5rem]">
              <div className="soft-panel-muted rounded-[18px] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`text-[0.76rem] leading-5 ${
                      selectedGroupOverdue
                        ? "font-semibold text-[color:var(--color-danger)]"
                        : "text-muted"
                    }`}
                  >
                    {selectedGroupOverdue
                      ? tPillbox(language, "overdueDose")
                      : tPillbox(language, "nextDoseShort")}
                  </p>
                  <p
                    className={`text-right text-[0.82rem] font-semibold ${
                      selectedGroupOverdue ? "text-[color:var(--color-danger)]" : "text-foreground"
                    }`}
                  >
                    {selectedGroup?.nextDose ?? "—"}
                  </p>
                </div>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-[0.76rem] leading-5 text-muted">
                    {tPillbox(language, "courseDuration")}
                  </p>
                  <p className="text-right text-[0.82rem] font-semibold text-foreground">
                    {selectedGroup
                      ? getCourseSummaryLabel(selectedGroup, language)
                      : tPillbox(language, "noDeadline")}
                  </p>
                </div>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-[0.76rem] leading-5 text-muted">
                    {tPillbox(language, "medicineCount")}
                  </p>
                  <p className="text-right text-[0.82rem] font-semibold text-foreground">
                    {sortedMedications.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
            {sortedMedications.map((medication, index) => (
              <div
                key={medication.id}
                className="bg-[color:color-mix(in_srgb,var(--color-surface)_78%,white)] px-3.5 py-2.5 first:rounded-t-[20px] last:rounded-b-[20px] [&+&]:border-t [&+&]:border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold tracking-[-0.025em] text-foreground">
                      {displayPillboxText(
                        medication.customMedicineName ||
                          tPillbox(language, "unnamedMedicine", { index: index + 1 })
                      )}
                    </p>
                    <p className="mt-1 text-[0.78rem] leading-5 text-muted">
                      {displayPillboxText(
                        medication.doseAmount || tPillbox(language, "amountMissing")
                      )}{" "}
                      ·{" "}
                      {summarizeMedicationTimes(
                        medication.times.map(normalizeDisplayTime),
                        language
                      )}
                    </p>
                    <p className="mt-1 text-[0.76rem] leading-5 text-muted">
                      {formatMealRule(medication.mealRule, language)}
                    </p>
                  </div>
                  <span className="soft-pill shrink-0 rounded-full px-2 py-1 text-[10px]">
                    {medication.courseMode === "period"
                      ? `${medication.courseStartDate ?? "—"} → ${medication.courseEndDate ?? "—"}`
                      : tPillbox(language, "continuous")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-3.5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <button type="button" onClick={goToSetup} className={actionSecondaryClass}>
                {tPillbox(language, "editPlan")}
              </button>
              <button
                type="button"
                onClick={toggleSelectedPlanStatus}
                disabled={togglePlanStatusMutation.isPending}
                className={`${actionSecondaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {togglePlanStatusMutation.isPending
                  ? tPillbox(language, "save")
                  : selectedPlan.status === "active"
                    ? tPillbox(language, "pausePlan")
                    : tPillbox(language, "resumePlan")}
              </button>
              <button
                type="button"
                onClick={requestDeletePlan}
                disabled={deletePlanMutation.isPending}
                className={`${actionDangerClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {tPillbox(language, "deletePlan")}
              </button>
            </div>
          </div>
        </RowSurface>
        <ConfirmDialog
          isOpen={planActionTarget !== null}
          title={
            planActionTarget === "pause"
              ? tPillbox(language, "confirmPausePlanTitle")
              : tPillbox(language, "confirmResumePlanTitle")
          }
          description={
            planActionTarget === "pause"
              ? tPillbox(language, "confirmPausePlanDescription")
              : tPillbox(language, "confirmResumePlanDescription")
          }
          confirmLabel={
            planActionTarget === "pause"
              ? tPillbox(language, "pausePlan")
              : tPillbox(language, "resumePlan")
          }
          cancelLabel={tPillbox(language, "cancel")}
          confirmTone="primary"
          isPending={togglePlanStatusMutation.isPending}
          onConfirm={confirmPlanAction}
          onCancel={() => setPlanActionTarget(null)}
        />
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          title={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanTitle")
              : tPillbox(language, "confirmDeleteMedicineTitle")
          }
          description={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanDescription")
              : tPillbox(language, "confirmDeleteMedicineDescription")
          }
          confirmLabel={tPillbox(language, "delete")}
          cancelLabel={tPillbox(language, "cancel")}
          confirmTone="danger"
          isPending={deletePlanMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </EditorShell>
    );
  }

  if (screen === "setup" && draft) {
    return (
      <EditorShell>
        <FlowScreenHeader
          backLabel={tPillbox(language, "setupBack")}
          onBack={goToHub}
          eyebrow={tPillbox(language, "eyebrow")}
          title={tPillbox(language, "setupTitle")}
        />

        <div className="mx-auto grid w-full max-w-5xl gap-3.5 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.92fr)] xl:gap-4.5">
          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="app-card-title">
                    {tPillbox(language, "medsTitle")}
                  </h1>
                  <p className="mt-1 text-[0.8rem] leading-5 text-muted">
                    {tPillbox(language, "medsSubtitle")}
                  </p>
                </div>
                <span className="soft-pill rounded-full px-2.5 py-1 text-[10px]">
                  {draft.medications.length} {tPillbox(language, "countUnit")}
                </span>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
                {draft.medications.length ? (
                  draft.medications.map((medication, index) => (
                    <div
                      key={medication.id}
                      className="bg-[color:color-mix(in_srgb,var(--color-surface)_78%,white)] px-3.5 py-3 [&+&]:border-t [&+&]:border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => goToMedication(medication.id)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left transition hover:translate-y-[-1px]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[0.95rem] font-semibold tracking-[-0.025em] text-foreground">
                                {displayPillboxText(
                                  medication.title ||
                                    tPillbox(language, "unnamedMedicine", { index: index + 1 })
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-[0.78rem] text-muted">
                              {displayPillboxText(
                                medication.dose || tPillbox(language, "amountMissing")
                              )}{" "}
                              · {summarizeMedicationTimes(medication.times, language)}
                            </p>
                          </div>
                          <span className="text-[1.1rem] leading-none text-[color:var(--color-primary)]">
                            ›
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDeleteMedication(
                              medication.id,
                              displayPillboxText(
                                medication.title ||
                                  tPillbox(language, "unnamedMedicine", { index: index + 1 })
                              )
                            )
                          }
                          className={actionCompactDangerClass}
                          aria-label={`${tPillbox(language, "delete")} ${displayPillboxText(
                            medication.title ||
                              tPillbox(language, "unnamedMedicine", { index: index + 1 })
                          )}`}
                        >
                          {tPillbox(language, "delete")}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[color:color-mix(in_srgb,var(--color-surface)_78%,white)] px-4 py-4 text-sm text-muted">
                    <p className="font-semibold text-foreground">
                      {tPillbox(language, "noMedicinesTitle")}
                    </p>
                    <p className="mt-1 leading-6">{tPillbox(language, "noMedicinesDescription")}</p>
                  </div>
                )}
              </div>

              <button type="button" onClick={addMedication} className={actionSecondaryClass}>
                {tPillbox(language, "addMedicine")}
              </button>
            </RowSurface>

            <RowSurface className="px-4 py-4 sm:px-5 sm:py-5">
              <label className="block space-y-1.5" htmlFor="pillbox-group-title">
                <span className="soft-field-label">{tPillbox(language, "titleLabel")}</span>
                <input
                  id="pillbox-group-title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, title: event.target.value } : current
                    )
                  }
                  placeholder={tPillbox(language, "titlePlaceholder")}
                  className="soft-input w-full px-4"
                />
              </label>
            </RowSurface>
          </div>

          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5">
              <div className="space-y-1">
                <h2 className="app-card-title">{tPillbox(language, "membersTitle")}</h2>
                <p className="text-[0.8rem] leading-5 text-muted">
                  {tPillbox(language, "membersHint")}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {familyMembers.map((member) => {
                  const selected = draft.members.includes(member.id);
                  const memberLabel = member.displayName || member.login || member.id;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        setDraft((current) => {
                          if (!current) return current;
                          const hasMember = current.members.includes(member.id);
                          return {
                            ...current,
                            members: hasMember
                              ? current.members.filter((item) => item !== member.id)
                              : [...current.members, member.id],
                          };
                        })
                      }
                      className={`group flex w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition ${
                        selected ? "soft-panel" : "soft-panel-muted"
                      }`}
                      style={{
                        border: selected
                          ? "1.5px solid color-mix(in srgb, var(--color-primary) 38%, white)"
                          : undefined,
                      }}
                    >
                      <span
                        className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                          selected
                            ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,white)] text-[color:var(--color-primary)]"
                            : "bg-[color:color-mix(in_srgb,var(--color-primary)_8%,white)] text-muted"
                        }`}
                      >
                        <span className="text-[0.9rem] font-semibold">
                          {memberLabel.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.86rem] font-semibold text-foreground">
                          {memberLabel}
                        </span>
                        <span className="mt-0.5 block text-[0.74rem] leading-5 text-muted">
                          {selected
                            ? language === "ru"
                              ? "Напоминания включены"
                              : "Reminders enabled"
                            : language === "ru"
                              ? "Пока без напоминаний"
                              : "No reminders yet"}
                        </span>
                      </span>
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.72rem] font-semibold transition ${
                          selected
                            ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white"
                            : "border-[color:color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-white/70 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-3.5">
                <div className="space-y-1">
                  <h2 className="app-card-title">{tPillbox(language, "doneTitle")}</h2>
                  <p className="text-[0.84rem] leading-5 text-muted">
                    {tPillbox(language, "doneSubtitle")}
                  </p>
                </div>
                {!canSavePlan && saveBlockedReason && saveAttempted ? (
                  <p className="text-[0.78rem] leading-5 text-[color:var(--color-danger)]">
                    {saveBlockedReason}
                  </p>
                ) : null}
                {savePlanError ? (
                  <p className="text-[0.78rem] leading-5 text-[color:var(--color-danger)]">
                    {savePlanError}
                  </p>
                ) : null}
                <div className="mt-3 grid gap-2.5">
                  <button type="button" onClick={saveGroup} className={actionPrimaryClass}>
                    {isEditing
                      ? tPillbox(language, "savePlan")
                      : tPillbox(language, "createNewPlan")}
                  </button>
                </div>
              </div>
            </RowSurface>
          </div>
        </div>
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          title={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanTitle")
              : tPillbox(language, "confirmDeleteMedicineTitle")
          }
          description={
            deleteTarget?.kind === "plan"
              ? tPillbox(language, "confirmDeletePlanDescription")
              : tPillbox(language, "confirmDeleteMedicineDescription")
          }
          confirmLabel={tPillbox(language, "delete")}
          cancelLabel={tPillbox(language, "cancel")}
          confirmTone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </EditorShell>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title={tPillbox(language, "hubTitle")}
        subtitle={tPillbox(language, "hubSubtitle")}
        compactOnMobile
        hideOnMobile
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={openAnalytics} className={actionSecondaryClass}>
              {tPillbox(language, "analytics")}
            </button>
            <button type="button" onClick={openCreate} className={actionPrimaryClass}>
              {tPillbox(language, "createPlan")}
            </button>
          </div>
        }
        className="[&_.app-title]:text-[1.72rem] [&_.app-title]:tracking-[-0.05em] sm:[&_.app-title]:text-[2.1rem] [&_.app-subtitle]:text-[0.93rem] sm:[&_.app-subtitle]:text-[0.98rem]"
      />

      <div className="flex items-center justify-between gap-3 sm:hidden">
        <div className="min-w-0">
          <h1 className="app-title text-[1.52rem] tracking-[-0.045em]">
            {tPillbox(language, "hubTitle")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAnalytics}
            className="app-btn-secondary-md soft-button-secondary inline-flex min-h-[2.5rem] w-auto items-center justify-center px-3 text-[0.8rem] font-semibold tracking-[-0.02em]"
          >
            {tPillbox(language, "analytics")}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.5rem] w-auto items-center justify-center px-3 text-[0.8rem] font-semibold tracking-[-0.02em]"
          >
            {tPillbox(language, "createPlan")}
          </button>
        </div>
      </div>

      <ul className="grid gap-3.5">
        {groups.map((group) => {
          const canMarkNow = canMarkGroupDose(group);
          const isOverdue = isOverdueDose(group.nextDoseAt, group.status);
          const isHighlighted = group.id === highlightedPlanId;
          return (
            <li key={group.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openDetails(group)}
                onKeyDown={(event) => handleCardKeyDown(event, () => openDetails(group))}
                className="block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <RowSurface
                  className={`app-section-surface rounded-[24px] py-3.5 transition hover:translate-y-[-1px] sm:rounded-[26px] sm:py-4 ${
                    isHighlighted
                      ? "ring-2 ring-[color:color-mix(in_srgb,var(--color-primary)_52%,white)] ring-offset-2 ring-offset-transparent"
                      : ""
                  }`}
                >
                  <div className="grid gap-2.5 sm:gap-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                              group.status === "active"
                                ? "bg-[color:var(--color-success)]"
                                : group.status === "paused"
                                  ? "bg-[color:var(--color-warning)]"
                                  : "bg-[color:var(--color-danger)]"
                            }`}
                            aria-hidden="true"
                          />
                          <h2 className="app-card-title min-w-0">
                            {displayPillboxText(group.title)}
                          </h2>
                        </div>
                        <p
                          className={`mt-2 text-[0.83rem] leading-5 ${
                            group.status === "paused" || group.status === "archived"
                              ? "font-medium text-muted"
                              : isOverdue
                                ? "font-semibold text-[color:var(--color-danger)]"
                                : canMarkNow
                                  ? "font-semibold text-[color:var(--color-success)]"
                                  : "font-medium text-foreground"
                          }`}
                        >
                          {getPlanStateHeadline(group.status, isOverdue, canMarkNow, language)}
                        </p>
                      </div>

                      <div className="soft-panel-muted min-w-[10rem] rounded-[18px] px-3 py-2.5">
                        <div className="grid gap-1.75 text-right">
                          <div className="flex items-start justify-between gap-3 text-[0.76rem] leading-4">
                            <span className="text-muted">
                              {tPillbox(language, "courseDuration")}
                            </span>
                            <span
                              className={`font-medium ${
                                canMarkNow ? "text-[color:var(--color-success)]" : "text-foreground"
                              }`}
                            >
                              {getCourseSummaryLabel(group, language)}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3 text-[0.76rem] leading-4">
                            <span className="text-muted">
                              {tPillbox(language, "medicineCount")}
                            </span>
                            <span className="font-medium text-foreground">{group.activeCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 text-[0.8rem] leading-5">
                      <span
                        className={`shrink-0 ${
                          isOverdue
                            ? "font-semibold text-[color:var(--color-danger)]"
                            : "text-muted"
                        }`}
                      >
                        {isOverdue
                          ? tPillbox(language, "overdueDose")
                          : tPillbox(language, "nextDoseShort")}
                      </span>
                      <span
                        className={`text-right font-semibold ${
                          isOverdue ? "text-[color:var(--color-danger)]" : "text-foreground"
                        }`}
                      >
                        {group.nextDose}
                      </span>
                    </div>

                    {canMarkNow ? (
                      <div className="flex justify-start sm:justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            markNextDoseTaken(group);
                          }}
                          disabled={takeDoseMutation.isPending}
                          className={`${actionPrimaryClass} min-h-[2.85rem] w-full px-3.5 text-center leading-[1.05] sm:w-auto sm:min-w-[12.5rem] sm:px-4 disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {takeDoseMutation.isPending
                            ? tPillbox(language, "taking")
                            : tPillbox(language, "markTaken")}
                        </button>
                      </div>
                    ) : (
                      <div className="hidden items-center justify-between gap-3 sm:flex">
                        <span className="text-[0.76rem] leading-5 text-muted">
                          {tPillbox(language, "tapToOpen")}
                        </span>
                      </div>
                    )}
                  </div>
                </RowSurface>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="soft-panel-muted rounded-[22px] px-4 py-3 text-sm text-muted">
        {tPillbox(language, "archiveHint")}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.kind === "plan"
            ? tPillbox(language, "confirmDeletePlanTitle")
            : tPillbox(language, "confirmDeleteMedicineTitle")
        }
        description={
          deleteTarget?.kind === "plan"
            ? tPillbox(language, "confirmDeletePlanDescription")
            : tPillbox(language, "confirmDeleteMedicineDescription")
        }
        confirmLabel={tPillbox(language, "delete")}
        cancelLabel={tPillbox(language, "cancel")}
        confirmTone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        isOpen={isAnalyticsSoonOpen}
        title={tPillbox(language, "analyticsSoonTitle")}
        description={tPillbox(language, "analyticsSoonDescription")}
        confirmLabel={tPillbox(language, "analyticsSoonConfirm")}
        cancelLabel={tPillbox(language, "cancel")}
        onConfirm={() => setIsAnalyticsSoonOpen(false)}
        onCancel={() => setIsAnalyticsSoonOpen(false)}
      />
    </div>
  );
}
