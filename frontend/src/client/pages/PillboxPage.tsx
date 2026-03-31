import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { DateField } from "@shared/components/DateField";
import { RowSurface } from "@shared/components/Surface";

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

const PILLBOX_EDITOR_STATE_KEY = "pillbox-editor-state";

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
type MedicationTemplate = {
  title: string;
  dose: string;
  times: string[];
  mealRule: string;
  repeatDays: string[];
  courseMode: "continuous" | "period";
  courseStartDate?: string;
  courseEndDate?: string;
};

const medicationTemplates: MedicationTemplate[] = [
  {
    title: "Магний B6",
    dose: "1 таблетка",
    times: ["08:30"],
    mealRule: "Во время еды",
    repeatDays: medicationDays.map((day) => day.full),
    courseMode: "continuous",
  },
  {
    title: "Омега-3",
    dose: "1 капсула",
    times: ["08:30", "14:00", "20:00"],
    mealRule: "После еды",
    repeatDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
    courseMode: "period",
    courseStartDate: "2026-04-01",
    courseEndDate: "2026-04-21",
  },
  {
    title: "Витамин D3",
    dose: "4 капли",
    times: ["20:00"],
    mealRule: "После еды",
    repeatDays: medicationDays.map((day) => day.full),
    courseMode: "continuous",
  },
  {
    title: "Пробиотик",
    dose: "1 капсула",
    times: ["09:00", "21:00"],
    mealRule: "После еды",
    repeatDays: medicationDays.map((day) => day.full),
    courseMode: "period",
    courseStartDate: "2026-04-02",
    courseEndDate: "2026-04-12",
  },
];

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

function createMedication(index: number): MedicationItem {
  const templateIndex = (index - 1) % medicationTemplates.length;
  const template = medicationTemplates[templateIndex] ?? medicationTemplates[0]!;

  return {
    id: `new-${Date.now()}-${index}`,
    title: template.title,
    dose: template.dose,
    times: [...template.times],
    mealRule: template.mealRule,
    repeatDays: [...template.repeatDays],
    courseMode: template.courseMode,
    courseStartDate: template.courseStartDate ?? "",
    courseEndDate: template.courseEndDate ?? "",
  };
}

function buildDraft(group?: PillboxGroup): SetupDraft {
  if (!group) {
    return {
      id: null,
      title: "",
      members: ["Мама"],
      medications: [createMedication(1)],
    };
  }

  return {
    id: group.id,
    title: group.title,
    members: [...group.members],
    medications: group.medications.map((item) => ({ ...item })),
  };
}

function buildGroupFromDraft(draft: SetupDraft, previous?: PillboxGroup): PillboxGroup {
  const nextDose =
    draft.medications.flatMap((item) => item.times).sort((a, b) => a.localeCompare(b))[0] ??
    "08:30";

  return {
    id: previous?.id ?? `group-${Date.now()}`,
    title: draft.title.trim() || "Новый план",
    activeCount: draft.medications.length,
    nextDose,
    members: draft.members,
    dayLabel: previous?.dayLabel,
    progress: previous?.progress ?? 0.35,
    medications: draft.medications,
  };
}

function summarizeMedicationTimes(times: string[]) {
  const normalized = [...times].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (!normalized.length) return "Время не указано";
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
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-[3.05rem] w-full items-center justify-center rounded-[22px] px-4 text-center text-[0.88rem] font-semibold tracking-[-0.025em] sm:min-h-[3.15rem] ${
              selected ? "soft-button-primary" : "soft-button-secondary"
            }`}
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

export function PillboxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState(initialGroups);
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDose, setEditorDose] = useState("");
  const [editorTimes, setEditorTimes] = useState<string[]>([""]);
  const [editorCoursePreset, setEditorCoursePreset] = useState<CoursePreset>("custom");
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
    setEditorTitle(medication?.title ?? "");
    setEditorDose(medication?.dose ?? "");
    setEditorTimes(medication?.times.length ? [...medication.times] : [""]);
    setEditorCoursePreset(medication ? getCoursePreset(medication) : "custom");
  }, [activeMedicationId, draft?.id, screen]);

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
    const nextMedication = createMedication((draft?.medications.length ?? 0) + 1);
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
    const nextGroup = buildGroupFromDraft(draft, previous);

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
        medications: nextMedications.length ? nextMedications : [createMedication(1)],
      };
    });

    if (screen === "medication") {
      goToSetup();
    }
  };

  if (screen === "medication" && draft && activeMedication) {
    const showCourseDates = activeMedication.courseMode === "period";
    const editorFieldWrapClass = "mx-auto w-full max-w-[36rem]";

    return (
      <EditorShell>
        <div className="space-y-3 px-1">
          <BackLinkButton label="← К плану" onClick={goToSetup} />
          <div>
            <h1 className="app-page-title text-[1.62rem] tracking-[-0.05em] sm:text-[2rem]">
              Настройка приёма
            </h1>
            <p className="mt-1 text-[0.9rem] leading-5 text-muted">
              Здесь можно спокойно настроить время, срок и связь с едой для одного лекарства.
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
                      label="Как называется"
                      icon={<FieldIcon kind="pill" />}
                      placeholder="Название лекарства"
                      value={editorTitle}
                      onChange={setEditorTitle}
                    />
                    <TintedField
                      label="Сколько принимать"
                      icon={<FieldIcon kind="dose" />}
                      placeholder="Например, 1 таблетка"
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
                              aria-label={`Удалить время ${index + 1}`}
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
                        + Добавить время
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
                              label={day.short}
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
                        options={[
                          { value: "continuous", label: "Постоянно принимать" },
                          { value: "period", label: "Курсом" },
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
                            options={[
                              { value: "7", label: "7 дней" },
                              { value: "14", label: "14 дней" },
                              { value: "30", label: "30 дней" },
                              { value: "custom", label: "Свои даты" },
                            ]}
                          />
                          {editorCoursePreset === "custom" ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block space-y-1.5">
                                <span className="soft-field-label">Начало курса</span>
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
                                  placeholder="Дата начала"
                                />
                              </label>
                              <label className="block space-y-1.5">
                                <span className="soft-field-label">Окончание</span>
                                <DateField
                                  value={activeMedication.courseEndDate}
                                  onChange={(nextValue) =>
                                    updateMedication(activeMedication.id, {
                                      courseEndDate: nextValue,
                                    })
                                  }
                                  placeholder="Дата окончания"
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
                  options={[
                    { value: "До еды", label: "До еды", icon: <UtensilsBadge /> },
                    { value: "Во время еды", label: "Во время", icon: <UtensilsBadge /> },
                    { value: "После еды", label: "После еды", icon: <UtensilsBadge /> },
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
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => deleteMedication(activeMedication.id)}
                  className={actionDangerClass}
                >
                  Удалить лекарство
                </button>
              </div>
            </div>
          </div>
        </div>
      </EditorShell>
    );
  }

  if (screen === "setup" && draft) {
    return (
      <div className="min-w-0 space-y-6">
        <BackLinkButton label="← К планам" onClick={goToHub} />
        <PageIntro
          title="Настройка плана"
          subtitle="Соберите план: как он называется, что в него входит и кому придут напоминания."
          eyebrow="Таблетница"
          compactOnMobile
        />

        <div className="mx-auto grid w-full max-w-5xl gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.92fr)] xl:gap-5">
          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="sm:px-5 sm:py-5">
              <label className="block space-y-1.5" htmlFor="pillbox-group-title">
                <span className="soft-field-label">Название плана</span>
                <input
                  id="pillbox-group-title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, title: event.target.value } : current
                    )
                  }
                  placeholder="Название плана"
                  className="soft-input w-full px-4"
                />
              </label>
            </RowSurface>

            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="app-card-title text-[1rem]">Что будем принимать</h2>
                  <p className="mt-1 text-[0.84rem] leading-5 text-muted">
                    У каждого лекарства можно отдельно задать время, срок и связь с едой.
                  </p>
                </div>
                <span className="soft-pill rounded-full px-2.5 py-1 text-[10px]">
                  {draft.medications.length} шт.
                </span>
              </div>

              <div className="grid gap-2.5">
                {draft.medications.map((medication, index) => (
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
                            {medication.title || `Лекарство ${index + 1}`}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.78rem] text-muted">
                          {medication.dose || "Количество не указано"} ·{" "}
                          {summarizeMedicationTimes(medication.times)}
                        </p>
                      </div>
                      <span className="text-[1.1rem] leading-none text-[color:var(--color-primary)]">
                        ›
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedication(medication.id)}
                      className={actionCompactDangerClass}
                      aria-label={`Удалить ${medication.title || `лекарство ${index + 1}`}`}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addMedication} className={actionSecondaryClass}>
                + Добавить лекарство
              </button>
            </RowSurface>
          </div>

          <div className="space-y-4 xl:space-y-5">
            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <h2 className="app-card-title text-[1rem]">Кому придут напоминания</h2>

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
                      <span className="text-[0.78rem] font-medium text-foreground">{member}</span>
                    </button>
                  );
                })}
              </div>

              <div className="soft-panel-muted rounded-[18px] px-3 py-2 text-[0.72rem] leading-5 text-[color:var(--color-primary)]">
                Если никого не выбрать, план останется только у того, кто его настроил.
              </div>
            </RowSurface>

            <RowSurface className="space-y-3 sm:px-5 sm:py-5">
              <div className="space-y-1">
                <h2 className="app-card-title text-[1rem]">Готово</h2>
                <p className="text-[0.84rem] leading-5 text-muted">
                  Сохраните план сейчас или вернитесь позже и спокойно продолжите настройку.
                </p>
              </div>
              <div className="grid gap-2.5">
                <button type="button" onClick={saveGroup} className={actionPrimaryClass}>
                  {isEditing ? "Сохранить план" : "Создать план"}
                </button>
                {isEditing ? (
                  <button type="button" onClick={deleteGroup} className={actionDangerClass}>
                    Удалить план
                  </button>
                ) : null}
              </div>
            </RowSurface>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Таблетница"
        subtitle="Семейные планы приёма: что принимать, когда напомнить и как идёт курс."
        compactOnMobile
        action={
          <button type="button" onClick={openCreate} className={actionPrimaryClass}>
            + Создать план
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
                        {group.title}
                      </h2>
                      <p className="mt-1 text-[0.84rem] leading-5 text-muted sm:text-[0.88rem]">
                        {group.activeCount} лекарства в плане
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="soft-pill rounded-full px-2 py-1 text-[10px]">
                        След: {group.nextDose}
                      </span>
                      {group.dayLabel ? (
                        <span className="text-[0.72rem] font-medium leading-none text-muted">
                          {group.dayLabel}
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
                        <span className="leading-none text-foreground">{member}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 text-[0.74rem] font-medium text-muted sm:text-[0.78rem]">
                    <span className="soft-pill rounded-full px-2 py-1 text-[10px]">
                      Следующий приём {group.nextDose}
                    </span>
                    <span>{group.dayLabel ? "Курс активен" : "Без срока"}</span>
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
        Когда курс закончится, план можно будет спокойно убрать в историю.
      </div>
    </div>
  );
}
