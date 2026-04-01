import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { DateField } from "@shared/components/DateField";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";

type MedicationItem = {
  id: string;
  title: string;
  dose: string;
  times: string[];
  mealRule: string;
  repeatDays: string[];
  courseMode: "continuous" | "period";
  courseStartDate: string;
  courseEndDate: string;
};

type PillboxGroup = {
  id: string;
  title: string;
  activeCount: number;
  nextDose: string;
  members: string[];
  dayLabel?: string;
  progress: number;
  medications: MedicationItem[];
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

const PILLBOX_EDITOR_STATE_KEY = "pillbox-editor-state";

const pillboxCopy = {
  ru: {
    setupBack: "← К планам",
    medicationBack: "← К плану",
    setupTitle: "Настройка плана",
    setupSubtitle: "Соберите план: как он называется, что в него входит и кому придут напоминания.",
    medicationTitle: "Настройка приёма",
    medicationSubtitle:
      "Здесь можно спокойно настроить время, срок и связь с едой для одного лекарства.",
    eyebrow: "Таблетница",
    hubTitle: "Таблетница",
    hubSubtitle: "Семейные планы приёма: что принимать, когда напомнить и как идёт курс.",
    createPlan: "+ Создать план",
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
    membersTitle: "Кому придут напоминания",
    membersHint: "Если никого не выбрать, план останется только у того, кто его настроил.",
    doneTitle: "Готово",
    doneSubtitle: "Сохраните план сейчас или вернитесь позже и спокойно продолжите настройку.",
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
    medicinesInPlan: "лекарства в плане",
    nextShort: "След",
    nextDose: "Следующий приём",
    courseActive: "Курс активен",
    noDeadline: "Без срока",
    archiveHint: "Когда курс закончится, план можно будет спокойно убрать в историю.",
    untitledPlan: "Новый план",
    timeMissing: "Время не указано",
    unnamedMedicine: "Лекарство {{index}}",
    amountMissing: "Количество не указано",
    noMedicinesTitle: "Пока без лекарств",
    noMedicinesDescription:
      "План уже можно назвать и сохранить позже. Когда будете готовы, добавьте первое лекарство.",
    confirmDeletePlanTitle: "Точно удалить план?",
    confirmDeletePlanDescription:
      "План приёма исчезнет целиком. Восстановить его потом не получится.",
    confirmDeleteMedicineTitle: "Точно удалить лекарство?",
    confirmDeleteMedicineDescription: "Лекарство исчезнет из этого плана приёма.",
    cancel: "Отмена",
  },
  en: {
    setupBack: "← Back to plans",
    medicationBack: "← Back to plan",
    setupTitle: "Plan setup",
    setupSubtitle:
      "Build the plan: what it is called, what it includes and who will get reminders.",
    medicationTitle: "Dose setup",
    medicationSubtitle: "Set the time, duration and meal relation for one medicine here.",
    eyebrow: "Pillbox",
    hubTitle: "Pillbox",
    hubSubtitle:
      "Family medication plans: what to take, when to remind and how the course is going.",
    createPlan: "+ Create plan",
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
    membersTitle: "Who gets reminders",
    membersHint: "If you select no one, the plan stays only with the person who created it.",
    doneTitle: "Done",
    doneSubtitle: "Save the plan now or come back later and continue calmly.",
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
    medicinesInPlan: "medicines in plan",
    nextShort: "Next",
    nextDose: "Next dose",
    courseActive: "Course active",
    noDeadline: "No deadline",
    archiveHint: "When the course ends, the plan can be moved to history later.",
    untitledPlan: "New plan",
    timeMissing: "Time not set",
    unnamedMedicine: "Medicine {{index}}",
    amountMissing: "Amount not set",
    noMedicinesTitle: "No medicines yet",
    noMedicinesDescription:
      "You can still name the plan and save it later. Add the first medicine when you are ready.",
    confirmDeletePlanTitle: "Delete this plan?",
    confirmDeletePlanDescription:
      "The whole medication plan will be removed. It cannot be restored later.",
    confirmDeleteMedicineTitle: "Delete this medicine?",
    confirmDeleteMedicineDescription: "This medicine will be removed from the plan.",
    cancel: "Cancel",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

const familyMembers = ["Мама", "Папа", "Бабушка"];
const medicationDays = [
  { full: "Пн", short: "Пн" },
  { full: "Вт", short: "Вт" },
  { full: "Ср", short: "Ср" },
  { full: "Чт", short: "Чт" },
  { full: "Пт", short: "Пт" },
  { full: "Сб", short: "Сб" },
  { full: "Вс", short: "Вс" },
] as const;
const initialGroups: PillboxGroup[] = [
  {
    id: "grandma",
    title: "Таблетки бабушки",
    activeCount: 3,
    nextDose: "14:00",
    members: ["Мама", "Папа"],
    dayLabel: "День 5 из 14",
    progress: 0.58,
    medications: [
      {
        id: "g1",
        title: "Магний B6",
        dose: "1 таблетка",
        times: ["08:30"],
        mealRule: "Во время еды",
        repeatDays: medicationDays.map((day) => day.full),
        courseMode: "continuous",
        courseStartDate: "",
        courseEndDate: "",
      },
      {
        id: "g2",
        title: "Омега-3",
        dose: "1 капсула",
        times: ["08:30", "14:00", "20:00"],
        mealRule: "После еды",
        repeatDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
        courseMode: "period",
        courseStartDate: "",
        courseEndDate: "",
      },
      {
        id: "g3",
        title: "Витамин D3",
        dose: "4 капли",
        times: ["20:00"],
        mealRule: "После еды",
        repeatDays: ["Пн", "Ср", "Пт"],
        courseMode: "continuous",
        courseStartDate: "",
        courseEndDate: "",
      },
    ],
  },
  {
    id: "recovery",
    title: "Восстановление после операции",
    activeCount: 2,
    nextDose: "14:00",
    members: ["Папа"],
    progress: 0.44,
    medications: [
      {
        id: "r1",
        title: "Амоксиклав",
        dose: "1 таблетка",
        times: ["09:00", "21:00"],
        mealRule: "После еды",
        repeatDays: medicationDays.map((day) => day.full),
        courseMode: "period",
        courseStartDate: "2026-03-28",
        courseEndDate: "2026-04-06",
      },
      {
        id: "r2",
        title: "Пробиотик",
        dose: "1 капсула",
        times: ["21:00"],
        mealRule: "После еды",
        repeatDays: medicationDays.map((day) => day.full),
        courseMode: "continuous",
        courseStartDate: "",
        courseEndDate: "",
      },
    ],
  },
  {
    id: "family",
    title: "Семейный курс витаминов",
    activeCount: 4,
    nextDose: "14:00",
    members: ["Мама"],
    progress: 0.72,
    medications: [
      {
        id: "f1",
        title: "Витамин C",
        dose: "1 шипучая таблетка",
        times: ["07:30"],
        mealRule: "До еды",
        repeatDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
        courseMode: "continuous",
        courseStartDate: "",
        courseEndDate: "",
      },
      {
        id: "f2",
        title: "Мультивитамины",
        dose: "1 жевательная пастилка",
        times: ["08:00", "13:00"],
        mealRule: "После еды",
        repeatDays: medicationDays.map((day) => day.full),
        courseMode: "continuous",
        courseStartDate: "",
        courseEndDate: "",
      },
    ],
  },
];

const editorSectionCardClass =
  "soft-card rounded-[24px] px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:px-5 sm:py-5 xl:px-6 xl:py-6";
const actionPrimaryClass =
  "soft-button-primary inline-flex min-h-[3.05rem] w-full items-center justify-center rounded-[22px] px-4 text-[0.9rem] font-semibold tracking-[-0.025em] sm:min-h-[3.15rem] sm:px-5 sm:text-[0.94rem]";
const actionSecondaryClass =
  "soft-button-secondary inline-flex min-h-[3.05rem] w-full items-center justify-center rounded-[22px] px-4 text-[0.88rem] font-semibold tracking-[-0.025em] sm:min-h-[3.15rem] sm:px-5 sm:text-[0.92rem]";
const actionDangerClass =
  "soft-button-danger inline-flex min-h-[3.05rem] w-full items-center justify-center rounded-[22px] px-4 text-[0.88rem] font-semibold tracking-[-0.025em] sm:min-h-[3.15rem] sm:px-5 sm:text-[0.92rem]";
const actionCompactDangerClass =
  "soft-button-danger inline-flex min-h-[3.05rem] shrink-0 items-center justify-center rounded-[18px] px-3.5 text-[0.84rem] tracking-[-0.02em]";

function memberInitial(member: string) {
  return member.slice(0, 1).toUpperCase();
}

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

function translateSeedValue(value: string, language: AppLanguage) {
  if (language === "ru") {
    return value;
  }

  const map: Record<string, string> = {
    Мама: "Mom",
    Папа: "Dad",
    Бабушка: "Grandma",
    Пн: "Mon",
    Вт: "Tue",
    Ср: "Wed",
    Чт: "Thu",
    Пт: "Fri",
    Сб: "Sat",
    Вс: "Sun",
    "Магний B6": "Magnesium B6",
    "Омега-3": "Omega-3",
    "Витамин D3": "Vitamin D3",
    Пробиотик: "Probiotic",
    Амоксиклав: "Amoxiclav",
    "Витамин C": "Vitamin C",
    Мультивитамины: "Multivitamins",
    "Таблетки бабушки": "Grandma's pills",
    "Восстановление после операции": "Post-surgery recovery",
    "Семейный курс витаминов": "Family vitamin course",
    "1 таблетка": "1 tablet",
    "1 капсула": "1 capsule",
    "4 капли": "4 drops",
    "1 шипучая таблетка": "1 effervescent tablet",
    "1 жевательная пастилка": "1 chewable lozenge",
    "Во время еды": "With meal",
    "После еды": "After meal",
    "До еды": "Before meal",
    "День 5 из 14": "Day 5 of 14",
  };

  return map[value] ?? value;
}

function createMedication(): MedicationItem {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    dose: "",
    times: [""],
    mealRule: "После еды",
    repeatDays: medicationDays.map((day) => day.full),
    courseMode: "continuous",
    courseStartDate: "",
    courseEndDate: "",
  };
}

function buildDraft(group?: PillboxGroup): SetupDraft {
  if (!group) {
    return {
      id: null,
      title: "",
      members: ["Мама"],
      medications: [],
    };
  }

  return {
    id: group.id,
    title: group.title,
    members: [...group.members],
    medications: group.medications.map((item) => ({ ...item })),
  };
}

function buildGroupFromDraft(
  draft: SetupDraft,
  language: AppLanguage,
  previous?: PillboxGroup
): PillboxGroup {
  const nextDose =
    draft.medications.flatMap((item) => item.times).sort((a, b) => a.localeCompare(b))[0] ??
    "08:30";

  return {
    id: previous?.id ?? `group-${Date.now()}`,
    title: draft.title.trim() || tPillbox(language, "untitledPlan"),
    activeCount: draft.medications.length,
    nextDose,
    members: draft.members,
    dayLabel: previous?.dayLabel,
    progress: previous?.progress ?? 0.35,
    medications: draft.medications,
  };
}

function summarizeMedicationTimes(times: string[], language: AppLanguage) {
  const normalized = [...times].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (!normalized.length) return tPillbox(language, "timeMissing");
  if (normalized.length <= 2) return normalized.join(", ");
  return `${normalized[0]}, ${normalized[1]} +${normalized.length - 2}`;
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
    <div
      className="soft-panel w-full rounded-[26px] px-3 py-3 sm:rounded-[28px] sm:px-6 sm:py-6 lg:px-7 lg:py-7"
      style={{ boxShadow: "0 16px 56px rgba(15,23,42,0.12)" }}
    >
      <div className="space-y-3.5 sm:space-y-4 lg:space-y-5">{children}</div>
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

function displayPillboxText(value: string, language: AppLanguage) {
  return translateSeedValue(value, language);
}

export function PillboxPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState(initialGroups);
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDose, setEditorDose] = useState("");
  const [editorTimes, setEditorTimes] = useState<string[]>([""]);
  const [editorCoursePreset, setEditorCoursePreset] = useState<CoursePreset>("custom");
  const [deleteTarget, setDeleteTarget] = useState<PillboxDeleteTarget | null>(null);
  const screen =
    searchParams.get("mode") === "setup" || searchParams.get("mode") === "medication"
      ? (searchParams.get("mode") as "setup" | "medication")
      : "hub";
  const activeMedicationId = searchParams.get("med");

  const isEditing = Boolean(draft?.id);
  const activeMedication =
    draft?.medications.find((medication) => medication.id === activeMedicationId) ?? null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.sessionStorage.getItem(PILLBOX_EDITOR_STATE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        groups?: PillboxGroup[];
        draft?: SetupDraft | null;
        editorTitle?: string;
        editorDose?: string;
        editorTimes?: string[];
      };

      if (parsed.groups) setGroups(parsed.groups);
      if ("draft" in parsed) setDraft(parsed.draft ?? null);
      if (typeof parsed.editorTitle === "string") setEditorTitle(parsed.editorTitle);
      if (typeof parsed.editorDose === "string") setEditorDose(parsed.editorDose);
      if (Array.isArray(parsed.editorTimes)) setEditorTimes(parsed.editorTimes);
    } catch {
      window.sessionStorage.removeItem(PILLBOX_EDITOR_STATE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (screen === "hub" && !draft) {
      window.sessionStorage.removeItem(PILLBOX_EDITOR_STATE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      PILLBOX_EDITOR_STATE_KEY,
      JSON.stringify({
        groups,
        draft,
        editorTitle,
        editorDose,
        editorTimes,
      })
    );
  }, [draft, editorDose, editorTimes, editorTitle, groups, screen]);

  useEffect(() => {
    if (screen !== "hub" && !draft) {
      navigate("/pillbox", { replace: true });
      return;
    }

    if (screen === "medication" && draft && !activeMedication) {
      navigate("/pillbox?mode=setup", { replace: true });
    }
  }, [activeMedication, draft, navigate, screen]);

  useEffect(() => {
    if (screen !== "medication" || !activeMedicationId) {
      resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
      setEditorCoursePreset("custom");
      return;
    }

    const medication = draft?.medications.find((item) => item.id === activeMedicationId) ?? null;
    setEditorTitle(medication ? displayPillboxText(medication.title, language) : "");
    setEditorDose(medication ? displayPillboxText(medication.dose, language) : "");
    setEditorTimes(medication?.times.length ? [...medication.times] : [""]);
    setEditorCoursePreset(medication ? getCoursePreset(medication) : "custom");
  }, [activeMedicationId, draft?.id, language, screen]);

  const openCreate = () => {
    setDraft(buildDraft());
    navigate("/pillbox?mode=setup");
  };

  const openEdit = (group: PillboxGroup) => {
    setDraft(buildDraft(group));
    navigate("/pillbox?mode=setup");
  };

  const goToHub = () => {
    setDraft(null);
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    navigate("/pillbox");
  };

  const goToSetup = () => {
    navigate("/pillbox?mode=setup");
  };

  const closeMedicationEditor = () => {
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    setEditorCoursePreset("custom");
    goToSetup();
  };

  const goToMedication = (medicationId: string) => {
    navigate(`/pillbox?mode=medication&med=${medicationId}`);
  };

  const addMedication = () => {
    const nextMedication = createMedication();
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
    if (!draft) return;

    const previous = groups.find((group) => group.id === draft.id);
    const nextGroup = buildGroupFromDraft(draft, language, previous);

    setGroups((current) => {
      if (draft.id) {
        return current.map((group) => (group.id === draft.id ? nextGroup : group));
      }

      return [nextGroup, ...current];
    });

    goToHub();
  };

  const deleteGroup = () => {
    if (!draft?.id) return;

    setGroups((current) => current.filter((group) => group.id !== draft.id));
    goToHub();
  };

  const deleteMedication = (medicationId: string) => {
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

  if (screen === "medication" && draft && activeMedication) {
    const showCourseDates = activeMedication.courseMode === "period";
    const editorFieldWrapClass = "mx-auto w-full max-w-[36rem]";

    return (
      <EditorShell>
        <div className="space-y-3 px-1">
          <BackLinkButton label={tPillbox(language, "medicationBack")} onClick={goToSetup} />
          <div>
            <h1 className="app-page-title text-[1.62rem] tracking-[-0.05em] sm:text-[2rem]">
              {tPillbox(language, "medicationTitle")}
            </h1>
            <p className="mt-1 text-[0.9rem] leading-5 text-muted">
              {tPillbox(language, "medicationSubtitle")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:gap-5">
          <div className="space-y-4 xl:space-y-5">
            <div className={editorSectionCardClass}>
              <div className="space-y-5 sm:space-y-6">
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
                    <div className="space-y-2.5">
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
                              className="soft-input w-full px-5 pr-12 text-center text-[1.3rem] font-semibold tracking-[-0.05em] text-foreground placeholder:text-muted sm:pr-14 sm:text-[1.65rem]"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_12%,white)] text-[color:var(--color-primary)] sm:h-9 sm:w-9">
                              <FieldIcon kind="time" />
                            </span>
                          </div>
                          {editorTimes.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeEditorTime(index)}
                              className="soft-button-secondary inline-flex h-[3.6rem] w-[3.6rem] shrink-0 items-center justify-center px-0 text-[1.2rem] leading-none"
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
                        className="soft-button-secondary inline-flex min-h-[3rem] w-full items-center justify-center px-4 text-[0.88rem] font-semibold tracking-[-0.025em]"
                      >
                        {tPillbox(language, "addTime")}
                      </button>
                    </div>
                  </div>

                  <div className={`${editorFieldWrapClass} space-y-4`}>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-7 gap-2 sm:gap-2.5 lg:gap-2">
                        {medicationDays.map((day) => {
                          const selected = activeMedication.repeatDays.includes(day.full);
                          return (
                            <DayChip
                              key={day.full}
                              label={displayPillboxText(day.short, language)}
                              selected={selected}
                              onClick={() =>
                                updateMedication(activeMedication.id, {
                                  repeatDays: selected
                                    ? activeMedication.repeatDays.filter(
                                        (item) => item !== day.full
                                      )
                                    : [...activeMedication.repeatDays, day.full],
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

          <div className="space-y-4 xl:space-y-5">
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
                      value: "До еды",
                      label: tPillbox(language, "beforeMeal"),
                      icon: <UtensilsBadge />,
                    },
                    {
                      value: "Во время еды",
                      label: tPillbox(language, "duringMeal"),
                      icon: <UtensilsBadge />,
                    },
                    {
                      value: "После еды",
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
                    const normalizedTimes = editorTimes
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((value) => finalizeTimeInput(value));

                    updateMedication(activeMedication.id, {
                      title: editorTitle.trim(),
                      dose: editorDose.trim(),
                      times: normalizedTimes.length ? normalizedTimes : ["08:30"],
                    });
                    closeMedicationEditor();
                  }}
                  className={actionPrimaryClass}
                >
                  {tPillbox(language, "save")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestDeleteMedication(
                      activeMedication.id,
                      editorTitle.trim() ||
                        activeMedication.title ||
                        tPillbox(language, "unnamedMedicine", { index: 1 })
                    )
                  }
                  className={actionDangerClass}
                >
                  {tPillbox(language, "deleteMedicine")}
                </button>
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

  if (screen === "setup" && draft) {
    return (
      <div className="min-w-0 space-y-6">
        <BackLinkButton label={tPillbox(language, "setupBack")} onClick={goToHub} />
        <PageIntro
          title={tPillbox(language, "setupTitle")}
          subtitle={tPillbox(language, "setupSubtitle")}
          eyebrow={tPillbox(language, "eyebrow")}
          compactOnMobile
        />

        <div className="mx-auto grid w-full max-w-5xl gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.92fr)] xl:gap-5">
          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="sm:px-5 sm:py-5">
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

            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="app-card-title text-[1rem]">{tPillbox(language, "medsTitle")}</h2>
                  <p className="mt-1 text-[0.84rem] leading-5 text-muted">
                    {tPillbox(language, "medsSubtitle")}
                  </p>
                </div>
                <span className="soft-pill rounded-full px-2.5 py-1 text-[10px]">
                  {draft.medications.length} {tPillbox(language, "countUnit")}
                </span>
              </div>

              <div className="grid gap-2.5">
                {draft.medications.length ? (
                  draft.medications.map((medication, index) => (
                    <div
                      key={medication.id}
                      className="soft-panel-muted flex items-center gap-3 rounded-[18px] px-3.5 py-3"
                    >
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
                                  tPillbox(language, "unnamedMedicine", { index: index + 1 }),
                                language
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-[0.78rem] text-muted">
                            {displayPillboxText(
                              medication.dose || tPillbox(language, "amountMissing"),
                              language
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
                                tPillbox(language, "unnamedMedicine", { index: index + 1 }),
                              language
                            )
                          )
                        }
                        className={actionCompactDangerClass}
                        aria-label={`${tPillbox(language, "delete")} ${displayPillboxText(
                          medication.title ||
                            tPillbox(language, "unnamedMedicine", { index: index + 1 }),
                          language
                        )}`}
                      >
                        {tPillbox(language, "delete")}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="soft-panel-muted rounded-[18px] px-4 py-4 text-sm text-muted">
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
          </div>

          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <h2 className="app-card-title text-[1rem]">{tPillbox(language, "membersTitle")}</h2>

              <div className="flex items-start gap-3">
                {familyMembers.map((member) => {
                  const selected = draft.members.includes(member);

                  return (
                    <button
                      key={member}
                      type="button"
                      onClick={() =>
                        setDraft((current) => {
                          if (!current) return current;
                          const hasMember = current.members.includes(member);
                          return {
                            ...current,
                            members: hasMember
                              ? current.members.filter((item) => item !== member)
                              : [...current.members, member],
                          };
                        })
                      }
                      className="grid justify-items-center gap-2 text-center"
                    >
                      <span
                        className={`relative inline-flex h-[58px] w-[58px] items-center justify-center rounded-full transition ${
                          selected ? "soft-panel" : "soft-panel-muted"
                        }`}
                        style={{
                          border: selected
                            ? "2px solid color-mix(in srgb, var(--color-primary) 55%, white)"
                            : undefined,
                        }}
                      >
                        {selected ? (
                          <span
                            className="absolute right-[4px] top-[4px] h-2.5 w-2.5 rounded-full"
                            style={{ background: "var(--color-primary)" }}
                          />
                        ) : null}
                        <span className="text-[0.95rem] font-semibold text-[color:var(--color-primary)]">
                          {memberInitial(member)}
                        </span>
                      </span>
                      <span className="text-[0.78rem] font-medium text-foreground">
                        {displayPillboxText(member, language)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="soft-panel-muted rounded-[18px] px-3 py-2 text-[0.72rem] leading-5 text-[color:var(--color-primary)]">
                {tPillbox(language, "membersHint")}
              </div>
            </RowSurface>

            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <div className="space-y-1">
                <h2 className="app-card-title text-[1rem]">{tPillbox(language, "doneTitle")}</h2>
                <p className="text-[0.84rem] leading-5 text-muted">
                  {tPillbox(language, "doneSubtitle")}
                </p>
              </div>
              <div className="grid gap-2.5">
                <button type="button" onClick={saveGroup} className={actionPrimaryClass}>
                  {isEditing ? tPillbox(language, "savePlan") : tPillbox(language, "createNewPlan")}
                </button>
                {isEditing ? (
                  <button type="button" onClick={requestDeletePlan} className={actionDangerClass}>
                    {tPillbox(language, "deletePlan")}
                  </button>
                ) : null}
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title={tPillbox(language, "hubTitle")}
        subtitle={tPillbox(language, "hubSubtitle")}
        compactOnMobile
        action={
          <button type="button" onClick={openCreate} className={actionPrimaryClass}>
            {tPillbox(language, "createPlan")}
          </button>
        }
        className="[&_.app-title]:text-[1.72rem] [&_.app-title]:tracking-[-0.05em] sm:[&_.app-title]:text-[2.1rem] [&_.app-subtitle]:text-[0.93rem] sm:[&_.app-subtitle]:text-[0.98rem]"
      />

      <ul className="grid gap-4">
        {groups.map((group) => (
          <li key={group.id}>
            <button
              type="button"
              onClick={() => openEdit(group)}
              className="block w-full text-left"
            >
              <RowSurface className="rounded-[24px] px-3.5 py-3.5 transition hover:translate-y-[-1px] sm:rounded-[24px] sm:px-4.5 sm:py-4">
                <div className="grid gap-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="app-card-title text-[1rem] sm:text-[1.08rem]">
                        {displayPillboxText(group.title, language)}
                      </h2>
                      <p className="mt-1 text-[0.84rem] leading-5 text-muted sm:text-[0.88rem]">
                        {group.activeCount} {tPillbox(language, "medicinesInPlan")}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="soft-pill rounded-full px-2 py-1 text-[10px]">
                        {tPillbox(language, "nextShort")}: {group.nextDose}
                      </span>
                      {group.dayLabel ? (
                        <span className="text-[0.72rem] font-medium leading-none text-muted">
                          {displayPillboxText(group.dayLabel, language)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {group.members.map((member) => (
                      <span
                        key={member}
                        className="soft-pill inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.7rem] font-medium"
                      >
                        <span
                          className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_16%,white)] text-[8px] font-semibold text-[color:var(--color-primary)]"
                          title={member}
                        >
                          {memberInitial(member)}
                        </span>
                        <span className="leading-none text-foreground">
                          {displayPillboxText(member, language)}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 text-[0.74rem] font-medium text-muted sm:text-[0.78rem]">
                    <span>
                      {group.dayLabel
                        ? tPillbox(language, "courseActive")
                        : tPillbox(language, "noDeadline")}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <div className="flex justify-end text-[0.72rem] font-semibold tracking-[-0.02em] text-muted">
                      <span>{Math.round(group.progress * 100)}%</span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full"
                      style={{
                        backgroundColor: "#d7ccea",
                        boxShadow: "inset 0 1px 2px rgba(138, 123, 191, 0.18)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, group.progress * 100))}%`,
                          background: "linear-gradient(90deg, #7f6ab7 0%, #9687c8 100%)",
                          boxShadow: "0 2px 10px rgba(127, 106, 183, 0.32)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </RowSurface>
            </button>
          </li>
        ))}
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
    </div>
  );
}
