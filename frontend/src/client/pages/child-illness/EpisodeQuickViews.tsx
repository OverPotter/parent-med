import { Link } from "react-router-dom";
import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
  IllnessComment,
  WeightEntry,
} from "@shared/types/api";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import type { MedicationPlanPriorityItem } from "../../utils/medicationPlans";
import { AdministrationForm, TemperatureForm, illnessCompactTextareaClass } from "./forms";
import { MedicationPlanComposer, MedicationPlanDetail, MedicationPlanList } from "./reminders";
import {
  appBtnFilledClass,
  appBtnSecondaryClass,
  SectionTitle,
  illnessCompactPrimaryButtonClass,
  illnessCompactSecondaryButtonClass,
  illnessListClass,
  illnessPanelSoftClass,
} from "./shared";
import type { EpisodeTimelineItem } from "./timeline";
import { EpisodeTimelineList } from "./timeline";

export function TemperatureQuickView(props: {
  language: "ru" | "en";
  childName: string;
  successMessage: string | null;
  tempValue: string;
  onTempChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  entries: { id: string; measuredAt: string; valueCelsius: number }[];
}) {
  const {
    language,
    childName,
    successMessage,
    tempValue,
    onTempChange,
    onSubmit,
    isPending,
    entries,
  } = props;

  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle
        title={`${language === "ru" ? "Температура" : "Temperature"} · ${childName}`}
        subtitle={
          language === "ru"
            ? "Сохраните новый замер и сразу сверяйтесь с последними значениями."
            : "Save a new reading and immediately check the latest values."
        }
      />

      {successMessage ? (
        <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">{successMessage}</div>
      ) : null}

      <section className="soft-panel rounded-[28px] p-4 sm:p-5">
        <TemperatureForm
          value={tempValue}
          onChange={onTempChange}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </section>

      <section className="space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1">
          <div>
            <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
              {language === "ru" ? "Последние замеры" : "Recent readings"}
            </h2>
          </div>
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {entries.length}{" "}
            {language === "ru"
              ? entries.length === 1
                ? "запись"
                : entries.length < 5
                  ? "записи"
                  : "записей"
              : entries.length === 1
                ? "entry"
                : "entries"}
          </span>
        </div>

        {entries.length > 0 ? (
          <div className={illnessListClass}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
              >
                <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                  <span className="block leading-4 text-foreground">
                    {formatChildTime(entry.measuredAt, language)}
                  </span>
                  <span className="block truncate text-[0.68rem] leading-4">
                    {formatChildDate(entry.measuredAt, language, { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        entry.valueCelsius >= 38 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {entry.valueCelsius.toFixed(1)}°C
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                    {entry.valueCelsius >= 38
                      ? language === "ru"
                        ? "Нужен контроль температуры"
                        : "Keep an eye on temperature"
                      : language === "ru"
                        ? "Замер сохранён"
                        : "Reading saved"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
            {language === "ru"
              ? "Пока нет ни одного замера температуры."
              : "No temperature readings yet."}
          </div>
        )}
      </section>
    </div>
  );
}

export function AdministrationQuickView(props: {
  language: "ru" | "en";
  successMessage: string | null;
  customMedicineName: string;
  amount: string;
  onCustomMedicineNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  isError: boolean;
  errorDetail: string | null;
  entries: AdministrationEvent[];
}) {
  const {
    language,
    successMessage,
    customMedicineName,
    amount,
    onCustomMedicineNameChange,
    onAmountChange,
    onSubmit,
    isPending,
    isError,
    errorDetail,
    entries,
  } = props;

  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle
        title={language === "ru" ? "Приём" : "Dose"}
        subtitle={
          language === "ru"
            ? "Быстро отметьте лекарство и дозу, если она известна."
            : "Quickly log the medicine and dose if you know it."
        }
      />

      {successMessage ? (
        <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">{successMessage}</div>
      ) : null}

      <section className="soft-panel rounded-[28px] p-4 sm:p-5">
        <div className="space-y-4">
          <AdministrationForm
            customMedicineName={customMedicineName}
            amount={amount}
            onCustomMedicineNameChange={onCustomMedicineNameChange}
            onAmountChange={onAmountChange}
            onSubmit={onSubmit}
            isPending={isPending}
          />
          {isError ? (
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {errorDetail ??
                (language === "ru"
                  ? "Ошибка записи. Проверь срок годности и срок после вскрытия."
                  : "Failed to save. Check the expiry date and the after-opening limit.")}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1">
          <div>
            <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
              {language === "ru" ? "Последние приёмы" : "Recent doses"}
            </h2>
          </div>
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {entries.length}{" "}
            {language === "ru"
              ? entries.length === 1
                ? "запись"
                : entries.length < 5
                  ? "записи"
                  : "записей"
              : entries.length === 1
                ? "entry"
                : "entries"}
          </span>
        </div>

        {entries.length > 0 ? (
          <div className={illnessListClass}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
              >
                <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
                  <span className="block leading-4 text-foreground">
                    {formatChildTime(entry.administeredAt, language)}
                  </span>
                  <span className="block truncate text-[0.68rem] leading-4">
                    {formatChildDate(entry.administeredAt, language, { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {entry.customMedicineName ??
                        (language === "ru" ? "Приём лекарства" : "Dose logged")}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                    {[entry.amount || null, entry.reason || null].filter(Boolean).join(" · ") ||
                      (language === "ru" ? "Запись сохранена" : "Dose saved")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
            {language === "ru" ? "Пока нет ни одного приёма." : "No doses logged yet."}
          </div>
        )}
      </section>
    </div>
  );
}

export function CommentQuickView(props: {
  language: "ru" | "en";
  successMessage: string | null;
  commentText: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  entries: IllnessComment[];
}) {
  const { language, successMessage, commentText, onCommentChange, onSubmit, isPending, entries } =
    props;
  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle
        title={language === "ru" ? "Заметка" : "Note"}
        subtitle={
          language === "ru"
            ? "Добавьте короткое наблюдение о состоянии ребёнка."
            : "Add a short note about the child's current condition."
        }
      />

      {successMessage ? (
        <div className="soft-note-info rounded-[20px] px-4 py-3 text-sm">{successMessage}</div>
      ) : null}

      <section className="soft-panel rounded-[28px] p-4 sm:p-5">
        <div className="space-y-4">
          <div className="grid gap-3">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={
                language === "ru"
                  ? "Например: к вечеру бодрее, после сна снова температура."
                  : "Example: more active by evening, fever came back after sleep."
              }
              className={illnessCompactTextareaClass}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isPending || !commentText.trim()}
                className={illnessCompactPrimaryButtonClass}
              >
                {isPending
                  ? language === "ru"
                    ? "Сохраняем…"
                    : "Saving…"
                  : language === "ru"
                    ? "Добавить заметку"
                    : "Add note"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1">
          <div>
            <h2 className="app-card-title text-[1.05rem] sm:text-[1.15rem]">
              {language === "ru" ? "Последние заметки" : "Recent notes"}
            </h2>
          </div>
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {entries.length}{" "}
            {language === "ru"
              ? entries.length === 1
                ? "запись"
                : entries.length < 5
                  ? "записи"
                  : "записей"
              : entries.length === 1
                ? "entry"
                : "entries"}
          </span>
        </div>

        {entries.length > 0 ? (
          <div className={illnessListClass}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-start gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
              >
                <span className="min-w-0 pt-0.5 text-xs font-semibold tabular-nums text-muted">
                  <span className="block leading-4 text-foreground">
                    {formatChildTime(entry.createdAt, language)}
                  </span>
                  <span className="block truncate text-[0.68rem] leading-4">
                    {formatChildDate(entry.createdAt, language, { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {language === "ru" ? "Наблюдение" : "Observation"}
                    </p>
                  </div>
                  <p className="mt-1 break-words text-sm leading-6 text-muted">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
            {language === "ru" ? "Пока нет ни одной заметки." : "No notes yet."}
          </div>
        )}
      </section>
    </div>
  );
}

export function TimelineQuickView(props: {
  language: "ru" | "en";
  timelineFilter: "all" | "temperature" | "administration" | "comment";
  setTimelineFilter: (value: "all" | "temperature" | "administration" | "comment") => void;
  timelineActorFilter: string;
  setTimelineActorFilter: (value: string) => void;
  timelineActorOptions: string[];
  visibleTimelineItems: EpisodeTimelineItem[];
}) {
  const {
    language,
    timelineFilter,
    setTimelineFilter,
    timelineActorFilter,
    setTimelineActorFilter,
    timelineActorOptions,
    visibleTimelineItems,
  } = props;
  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle
        title={language === "ru" ? "Лента" : "Timeline"}
        subtitle={
          language === "ru"
            ? "Все температуры, приёмы и заметки по текущему наблюдению."
            : "All temperatures, doses and notes for the current tracking session."
        }
      />

      <section className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", language === "ru" ? "Все" : "All", null],
                ["temperature", language === "ru" ? "Замеры" : "Readings", "bg-rose-500"],
                ["administration", language === "ru" ? "Приёмы" : "Doses", "bg-sky-500"],
                ["comment", language === "ru" ? "Заметки" : "Notes", "bg-sky-500"],
              ] as const
            ).map(([key, label, dotClass]) => {
              const isActiveFilter = timelineFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimelineFilter(key)}
                  className={`${isActiveFilter ? appBtnFilledClass : appBtnSecondaryClass} inline-flex min-h-[2.45rem] min-w-0 items-center justify-center gap-1.5 px-3.5 py-1 text-[0.76rem] font-bold tracking-[-0.02em] leading-none sm:min-h-[2.5rem] sm:text-[0.78rem]`}
                >
                  {dotClass ? (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                  ) : null}
                  <span className="text-center">{label}</span>
                </button>
              );
            })}
          </div>
          {timelineActorOptions.length > 0 ? (
            <div className="grid gap-2">
              <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
                {language === "ru" ? "Кто записал" : "Who logged it"}
              </p>
              <div className="flex flex-wrap gap-2">
                {["all", ...timelineActorOptions].map((actor) => {
                  const isAll = actor === "all";
                  const isActiveActor = timelineActorFilter === actor;
                  return (
                    <button
                      key={actor}
                      type="button"
                      onClick={() => setTimelineActorFilter(actor)}
                      className={`${isActiveActor ? appBtnFilledClass : appBtnSecondaryClass} inline-flex min-h-[2.28rem] min-w-0 max-w-full items-center justify-center gap-1.5 px-3.5 py-1 text-[0.74rem] font-semibold leading-none sm:min-h-[2.34rem] sm:text-[0.76rem]`}
                    >
                      {isAll ? null : <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                      <span className="min-w-0 truncate text-center">
                        {isAll ? (language === "ru" ? "Все" : "All") : actor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <EpisodeTimelineList items={visibleTimelineItems} language={language} />
      </section>
    </div>
  );
}

export function ReminderListQuickView(props: {
  language: "ru" | "en";
  childId: string;
  plans: EpisodeMedicationPlan[];
  medicines: HouseholdMedicine[];
  administrations: AdministrationEvent[];
  onOpen: (planId: string) => void;
  onTakeDose: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration: boolean;
}) {
  const {
    language,
    childId,
    plans,
    medicines,
    administrations,
    onOpen,
    onTakeDose,
    isSubmittingAdministration,
  } = props;
  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle
        title={language === "ru" ? "Напоминания" : "Reminders"}
        subtitle={
          language === "ru"
            ? "Список схем приёма для текущего наблюдения."
            : "Dose plans for the current tracking session."
        }
        action={
          <Link
            to={`/children/${childId}/illness?focus=reminder-create`}
            className={illnessCompactSecondaryButtonClass}
          >
            {language === "ru" ? "Добавить" : "Add"}
          </Link>
        }
      />

      <MedicationPlanList
        plans={plans}
        medicines={medicines}
        administrations={administrations}
        onOpen={onOpen}
        onTakeDose={onTakeDose}
        isSubmittingAdministration={isSubmittingAdministration}
      />
    </div>
  );
}

export function ReminderDetailQuickView(props: {
  language: "ru" | "en";
  childId: string;
  selectedReminderItem: MedicationPlanPriorityItem | null;
  latestWeight: WeightEntry | null;
  isReminderCabinetPickerOpen: boolean;
  isReminderEditing: boolean;
  editingReminderName: string | null;
  medicines: HouseholdMedicine[];
  isSubmittingAdministration: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  errorDetail: string | null;
  onEditingChange: (nextIsEditing: boolean, planName: string | null) => void;
  onTakeDose: (plan: EpisodeMedicationPlan) => void;
  onUpdate: (
    planId: string,
    payload: {
      householdMedicineId?: string | null;
      customMedicineName?: string | null;
      doseAmount: string;
      minIntervalMinutes: number;
      maxDosesPerDay?: number | null;
      weightKg?: number | null;
      doseMgPerKg?: number | null;
      notes?: string | null;
    }
  ) => void;
  onDelete: (planId: string) => void;
}) {
  const {
    language,
    childId,
    selectedReminderItem,
    latestWeight,
    isReminderCabinetPickerOpen,
    isReminderEditing,
    editingReminderName,
    medicines,
    isSubmittingAdministration,
    isUpdating,
    isDeleting,
    errorDetail,
    onEditingChange,
    onTakeDose,
    onUpdate,
    onDelete,
  } = props;

  if (!selectedReminderItem) {
    return (
      <div className="min-w-0 space-y-5">
        <SectionTitle
          title={language === "ru" ? "Напоминание" : "Reminder"}
          subtitle={
            language === "ru"
              ? "Выбранное напоминание не найдено."
              : "The selected reminder could not be found."
          }
          action={
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className={illnessCompactSecondaryButtonClass}
            >
              {language === "ru" ? "К списку" : "Back"}
            </Link>
          }
        />

        <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
          {language === "ru" ? "Напоминание не найдено." : "Reminder not found."}
        </div>
      </div>
    );
  }

  return (
    <div className={isReminderCabinetPickerOpen ? "min-w-0 overflow-hidden" : "min-w-0 space-y-5"}>
      {!isReminderCabinetPickerOpen ? (
        <SectionTitle
          title={
            isReminderEditing
              ? language === "ru"
                ? `${editingReminderName ?? selectedReminderItem.plan.customMedicineName ?? selectedReminderItem.medicine?.medicineName ?? "Лекарство"} · Изменить`
                : `${editingReminderName ?? selectedReminderItem.plan.customMedicineName ?? selectedReminderItem.medicine?.medicineName ?? "Medicine"} · Edit`
              : language === "ru"
                ? "Напоминание"
                : "Reminder"
          }
          subtitle={
            isReminderEditing
              ? language === "ru"
                ? "Обновите схему приёма и упаковку."
                : "Update the schedule and the selected pack."
              : language === "ru"
                ? "Параметры и история выбранного напоминания."
                : "Selected reminder details and history."
          }
          action={
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className={illnessCompactSecondaryButtonClass}
            >
              {language === "ru" ? "К списку" : "Back"}
            </Link>
          }
        />
      ) : null}

      <div className="space-y-4">
        <MedicationPlanDetail
          item={selectedReminderItem}
          childId={childId}
          latestWeight={latestWeight}
          isSubmittingAdministration={isSubmittingAdministration}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          medicines={medicines}
          onEditingChange={onEditingChange}
          onTakeDose={onTakeDose}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
        {errorDetail ? (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorDetail}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ReminderCreateQuickView(props: {
  language: "ru" | "en";
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  isReminderCabinetPickerOpen: boolean;
  submitLabel: string;
  isPending: boolean;
  errorDetail: string | null;
  onSubmit: (payload: {
    householdMedicineId?: string | null;
    customMedicineName?: string | null;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    weightKg?: number | null;
    doseMgPerKg?: number | null;
    notes?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const {
    language,
    childId,
    medicines,
    latestWeight,
    isReminderCabinetPickerOpen,
    submitLabel,
    isPending,
    errorDetail,
    onSubmit,
    onCancel,
  } = props;
  return (
    <div className={isReminderCabinetPickerOpen ? "min-w-0 overflow-hidden" : "min-w-0 space-y-5"}>
      {!isReminderCabinetPickerOpen ? (
        <SectionTitle
          title={language === "ru" ? "Новое напоминание" : "New reminder"}
          subtitle={language === "ru" ? "Настройте схему приёма." : "Set up the dosing schedule."}
          action={
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className={illnessCompactSecondaryButtonClass}
            >
              {language === "ru" ? "К списку" : "Back"}
            </Link>
          }
        />
      ) : null}

      <div className="space-y-4">
        <MedicationPlanComposer
          childId={childId}
          medicines={medicines}
          latestWeight={latestWeight}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          isPending={isPending}
          onCancel={onCancel}
        />
        {errorDetail ? (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorDetail}</div>
        ) : null}
      </div>
    </div>
  );
}
