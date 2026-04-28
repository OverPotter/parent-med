import { useEffect, useState } from "react";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { EpisodeMedicationPlan, HouseholdMedicine, WeightEntry } from "@shared/types/api";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import {
  buildWeightDoseHint,
  calculateMedicationDoseRecommendation,
  formatDoseStatusLabel,
  formatIntervalForDisplay,
  type MedicationPlanPriorityItem,
} from "../../utils/medicationPlans";
import {
  DetailRow,
  appBtnFilledClass,
  appBtnJournalDangerClass,
  appBtnJournalSecondaryClass,
  illnessCompactPrimaryButtonClass,
  illnessCompactInputClass,
  illnessPanelSoftClass,
} from "./shared";
import {
  hasDoseUnitHint,
  intervalMinutesToInputValue,
  parseIntervalInputToMinutes,
  type MedicationPlanPayload,
} from "./reminderUtils";
import { MedicationPlanComposer } from "./MedicationPlanComposer";

export function MedicationPlanDetail({
  item,
  childName,
  medicines,
  latestWeight,
  canEdit = true,
  onUpdate,
  onDelete,
  onTakeDose,
  isSubmittingAdministration = false,
  isUpdating = false,
  isDeleting = false,
  onEditingChange,
}: {
  item: MedicationPlanPriorityItem<EpisodeMedicationPlan>;
  childName: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  canEdit?: boolean;
  onUpdate: (planId: string, payload: MedicationPlanPayload) => void;
  onDelete: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  onEditingChange?: (isEditing: boolean, planName: string) => void;
}) {
  const { language } = useI18n();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const { plan, medicine, stats, isUnavailable } = item;
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [quickEditField, setQuickEditField] = useState<"dose" | "interval" | null>(null);
  const [quickDoseAmount, setQuickDoseAmount] = useState(plan.doseAmount);
  const [quickIntervalInput, setQuickIntervalInput] = useState(
    intervalMinutesToInputValue(plan.minIntervalMinutes, intervalUnit)
  );
  const planName =
    plan.customMedicineName ??
    medicine?.medicineName ??
    (language === "ru" ? "Лекарство" : "Medicine");
  const titleText = medicine?.medicineConcentration
    ? `${planName} · ${medicine.medicineConcentration}`
    : planName;
  const doseBadge = plan.doseAmount?.trim() ?? "";
  const doseCalculation = calculateMedicationDoseRecommendation(
    medicine,
    plan.weightKg,
    plan.doseMgPerKg,
    language
  );
  const weightHint = buildWeightDoseHint(medicine, plan.weightKg, plan.doseMgPerKg, language);
  const nextDoseText = isUnavailable
    ? language === "ru"
      ? "Недоступно"
      : "Unavailable"
    : stats?.blockedByDailyLimit
      ? language === "ru"
        ? "Лимит на сегодня"
        : "Daily limit reached"
      : stats?.nextAllowedAt
        ? formatDoseStatusLabel(stats.nextAllowedAt, language, new Date())
        : language === "ru"
          ? "Можно дать"
          : "Available now";
  const canLogDoseNow = Boolean(onTakeDose) && !isUnavailable && !stats?.isBlocked;
  const reminderSummaryItems = [
    ...(doseBadge
      ? [
          {
            label: language === "ru" ? "Доза" : "Dose",
            value: doseBadge,
            tone: "bg-fuchsia-500",
            editable: canEdit,
            editKey: "dose" as const,
          },
        ]
      : []),
    {
      label: language === "ru" ? "Интервал" : "Interval",
      value: formatIntervalForDisplay(plan.minIntervalMinutes, intervalUnit),
      tone: "bg-sky-500",
      editable: canEdit,
      editKey: "interval" as const,
    },
    {
      label: language === "ru" ? "Следующий" : "Next",
      value: nextDoseText,
      tone:
        isUnavailable || stats?.blockedByDailyLimit
          ? "bg-rose-500"
          : stats?.isBlocked
            ? "bg-sky-500"
            : "bg-emerald-500",
    },
    {
      label: language === "ru" ? "Сегодня" : "Today",
      value: plan.maxDosesPerDay
        ? language === "ru"
          ? `${stats?.todayCount ?? 0} из ${plan.maxDosesPerDay}`
          : `${stats?.todayCount ?? 0} of ${plan.maxDosesPerDay}`
        : `${stats?.todayCount ?? 0}`,
      tone: "bg-violet-500",
    },
    {
      label: language === "ru" ? "Лимит" : "Limit",
      value: plan.maxDosesPerDay
        ? language === "ru"
          ? `${plan.maxDosesPerDay} в сутки`
          : `${plan.maxDosesPerDay} per day`
        : language === "ru"
          ? "Без лимита"
          : "No limit",
      tone: "bg-teal-500",
    },
    ...(stats?.lastAdministration
      ? [
          {
            label: language === "ru" ? "Последний приём" : "Last dose",
            value: `${formatChildDate(stats.lastAdministration.administeredAt, language, {
              month: "short",
            })} ${formatChildTime(stats.lastAdministration.administeredAt, language)}`,
            tone: "bg-indigo-500",
          },
        ]
      : []),
  ];
  const editableMedicines = Array.from(
    new Map(
      medicines
        .filter(
          (entry) =>
            entry.id === plan.householdMedicineId ||
            (entry.status !== "expired" && entry.status !== "expired_after_opening")
        )
        .map((entry) => [entry.id, entry])
    ).values()
  );

  useEffect(() => {
    onEditingChange?.(isEditing, planName);
    return () => onEditingChange?.(false, planName);
  }, [isEditing, onEditingChange, planName]);

  useEffect(() => {
    setIsEditing(false);
    setIsDeleteConfirmOpen(false);
    setQuickEditField(null);
    setQuickDoseAmount(plan.doseAmount);
    setQuickIntervalInput(intervalMinutesToInputValue(plan.minIntervalMinutes, intervalUnit));
  }, [plan.id]);

  useEffect(() => {
    if (quickEditField !== "dose") {
      setQuickDoseAmount(plan.doseAmount);
    }
  }, [plan.doseAmount, quickEditField]);

  useEffect(() => {
    if (quickEditField !== "interval") {
      setQuickIntervalInput(intervalMinutesToInputValue(plan.minIntervalMinutes, intervalUnit));
    }
  }, [intervalUnit, plan.minIntervalMinutes, quickEditField]);

  const buildUpdatePayload = (
    overrides: Partial<MedicationPlanPayload>
  ): MedicationPlanPayload => ({
    householdMedicineId: plan.householdMedicineId,
    customMedicineName: plan.customMedicineName,
    doseAmount: plan.doseAmount,
    minIntervalMinutes: plan.minIntervalMinutes,
    maxDosesPerDay: plan.maxDosesPerDay,
    weightKg: plan.weightKg,
    doseMgPerKg: plan.doseMgPerKg,
    calculatedDoseMg: plan.calculatedDoseMg,
    calculatedDoseValue: plan.calculatedDoseValue,
    calculatedDoseUnit: plan.calculatedDoseUnit,
    doseCalcMode: plan.doseCalcMode,
    doseCalcWarning: plan.doseCalcWarning,
    manualDoseOverride: plan.manualDoseOverride ?? false,
    notes: plan.notes,
    ...overrides,
  });

  const handleQuickDoseSave = () => {
    const normalizedDose = quickDoseAmount.trim();
    if (!normalizedDose) {
      return;
    }
    onUpdate(
      plan.id,
      buildUpdatePayload({
        doseAmount: normalizedDose,
        manualDoseOverride: true,
      })
    );
    setQuickEditField(null);
  };

  const handleQuickIntervalSave = () => {
    const parsedInterval = parseIntervalInputToMinutes(quickIntervalInput, intervalUnit);
    if (parsedInterval === null) {
      return;
    }
    onUpdate(
      plan.id,
      buildUpdatePayload({
        minIntervalMinutes: parsedInterval,
      })
    );
    setQuickEditField(null);
  };

  if (isEditing && canEdit) {
    return (
      <section className="space-y-4">
        <MedicationPlanComposer
          key={plan.id}
          childName={childName}
          medicines={editableMedicines}
          latestWeight={latestWeight}
          initialValue={{
            householdMedicineId: plan.householdMedicineId,
            customMedicineName: plan.customMedicineName,
            doseAmount: plan.doseAmount,
            minIntervalMinutes: plan.minIntervalMinutes,
            maxDosesPerDay: plan.maxDosesPerDay,
            weightKg: plan.weightKg,
            doseMgPerKg: plan.doseMgPerKg,
            calculatedDoseMg: plan.calculatedDoseMg,
            calculatedDoseValue: plan.calculatedDoseValue,
            calculatedDoseUnit: plan.calculatedDoseUnit,
            doseCalcMode: plan.doseCalcMode,
            doseCalcWarning: plan.doseCalcWarning,
            manualDoseOverride: plan.manualDoseOverride,
            notes: plan.notes,
          }}
          onSubmit={(payload) => {
            onUpdate(plan.id, payload);
            setIsEditing(false);
          }}
          submitLabel={language === "ru" ? "Сохранить напоминание" : "Save reminder"}
          isPending={isUpdating}
          onCancel={() => setIsEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={
          language === "ru" ? `Удалить напоминание · ${planName}` : `Delete reminder · ${planName}`
        }
        description={
          language === "ru"
            ? "Напоминание будет удалено из текущего наблюдения. История уже отмеченных приёмов останется."
            : "The reminder will be removed from the current tracking session. Logged dose history will stay."
        }
        confirmLabel={
          isDeleting
            ? language === "ru"
              ? "Удаляем…"
              : "Deleting…"
            : language === "ru"
              ? "Да, удалить напоминание"
              : "Yes, delete reminder"
        }
        confirmTone="danger"
        isPending={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(plan.id);
        }}
      />
      <div className={`${illnessPanelSoftClass} space-y-3 rounded-[28px] p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              isUnavailable
                ? "bg-rose-500"
                : stats?.blockedByDailyLimit
                  ? "bg-rose-500"
                  : stats?.isBlocked
                    ? "bg-sky-500"
                    : "bg-emerald-500"
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h4 className="min-w-0 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {titleText}
            </h4>
            {medicine?.medicineForm ? (
              <p className="mt-1 text-sm leading-6 text-foreground/70">{medicine.medicineForm}</p>
            ) : null}
            <p className="mt-1 text-sm leading-6 text-foreground/78">
              {isUnavailable
                ? language === "ru"
                  ? "Упаковка недоступна для приёма."
                  : "This pack is unavailable for use."
                : stats?.blockedByDailyLimit
                  ? language === "ru"
                    ? "Лимит приёмов на сегодня уже достигнут."
                    : "Today's dose limit has already been reached."
                  : stats?.nextAllowedAt
                    ? stats.nextAllowedAt <= new Date()
                      ? language === "ru"
                        ? "Можно дать."
                        : "A dose can be logged now."
                      : language === "ru"
                        ? `${formatDoseStatusLabel(stats.nextAllowedAt, language, new Date())}.`
                        : `${formatDoseStatusLabel(stats.nextAllowedAt, language, new Date())}.`
                    : language === "ru"
                      ? "Можно дать."
                      : "A dose can be logged now."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {reminderSummaryItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (!item.editable || !item.editKey) {
                  return;
                }
                setQuickEditField((current) => (current === item.editKey ? null : item.editKey));
              }}
              disabled={!item.editable}
              className={`inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] ${
                item.editable ? "cursor-pointer transition hover:bg-surface-muted" : ""
              } ${
                quickEditField === item.editKey
                  ? "ring-2 ring-[color:color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
                  : ""
              }`}
            >
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.tone}`} />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
                  {item.label}
                </span>
                <span className="mt-0.5 block break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
                  {item.value}
                </span>
              </span>
            </button>
          ))}
        </div>
        {quickEditField === "dose" ? (
          <div className="rounded-[18px] border border-border/60 bg-surface/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {language === "ru" ? "Новая доза" : "New dose"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {language === "ru"
                    ? "Например: 5 мл или 1 таблетка"
                    : "For example: 5 ml or 1 tablet"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={quickDoseAmount}
                onChange={(event) => setQuickDoseAmount(event.target.value)}
                placeholder={language === "ru" ? "Введите дозу" : "Enter dose"}
                className={illnessCompactInputClass}
              />
              {hasDoseUnitHint(quickDoseAmount) ? (
                <p className="text-xs leading-5 text-muted">
                  {language === "ru"
                    ? "Лучше добавить единицу: мл, таб., капли."
                    : "It is better to include a unit: ml, tablet, drops."}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickDoseAmount(plan.doseAmount);
                    setQuickEditField(null);
                  }}
                  className={appBtnJournalSecondaryClass}
                >
                  {language === "ru" ? "Отмена" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleQuickDoseSave}
                  disabled={!quickDoseAmount.trim() || isUpdating}
                  className={appBtnFilledClass}
                >
                  {language === "ru" ? "Сохранить дозу" : "Save dose"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {quickEditField === "interval" ? (
          <div className="rounded-[18px] border border-border/60 bg-surface/70 p-3">
            <p className="text-sm font-semibold text-foreground">
              {language === "ru" ? "Новый интервал" : "New interval"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {language === "ru"
                ? `Введите значение в ${intervalUnit === "hours" ? "часах" : "минутах"}.`
                : `Enter the value in ${intervalUnit === "hours" ? "hours" : "minutes"}.`}
            </p>
            <div className="mt-3 space-y-3">
              <input
                type="number"
                min="1"
                step={intervalUnit === "hours" ? "0.5" : "1"}
                inputMode="decimal"
                value={quickIntervalInput}
                onChange={(event) => setQuickIntervalInput(event.target.value)}
                placeholder={language === "ru" ? "Введите интервал" : "Enter interval"}
                className={illnessCompactInputClass}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickIntervalInput(
                      intervalMinutesToInputValue(plan.minIntervalMinutes, intervalUnit)
                    );
                    setQuickEditField(null);
                  }}
                  className={appBtnJournalSecondaryClass}
                >
                  {language === "ru" ? "Отмена" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleQuickIntervalSave}
                  disabled={
                    parseIntervalInputToMinutes(quickIntervalInput, intervalUnit) === null ||
                    isUpdating
                  }
                  className={appBtnFilledClass}
                >
                  {language === "ru" ? "Сохранить интервал" : "Save interval"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {(medicine &&
        (medicine.medicineForm ||
          medicine.medicineConcentration ||
          medicine.medicineDescription ||
          medicine.medicineDosage)) ||
      weightHint ||
      plan.doseCalcWarning ||
      doseCalculation?.doseCalcWarning ||
      plan.manualDoseOverride ? (
        <div className={`${illnessPanelSoftClass} space-y-3 rounded-[28px] p-4 sm:p-5`}>
          <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {language === "ru" ? "Дополнительно" : "More"}
          </h5>
          <div className="space-y-1">
            {medicine && (medicine.medicineForm || medicine.medicineConcentration) ? (
              <DetailRow
                label={language === "ru" ? "Форма" : "Form"}
                value={[medicine.medicineForm ?? null, medicine.medicineConcentration ?? null]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ) : null}
            {medicine?.medicineDescription ? (
              <DetailRow
                label={language === "ru" ? "Описание" : "Description"}
                value={medicine.medicineDescription}
              />
            ) : null}
            {medicine?.medicineDosage ? (
              <DetailRow
                label={language === "ru" ? "Как давать" : "How to give"}
                value={medicine.medicineDosage}
              />
            ) : null}
            {weightHint ? (
              <DetailRow
                label={language === "ru" ? "По весу" : "Weight based"}
                value={weightHint}
              />
            ) : null}
            {plan.doseCalcWarning || doseCalculation?.doseCalcWarning ? (
              <DetailRow
                label={language === "ru" ? "Проверка дозы" : "Dose safety"}
                value={
                  plan.doseCalcWarning ??
                  doseCalculation?.doseCalcWarning ??
                  (language === "ru"
                    ? "Сверьте дозу по упаковке и назначению врача."
                    : "Verify the dose against the package and clinician instructions.")
                }
              />
            ) : null}
            {plan.manualDoseOverride ? (
              <DetailRow
                label={language === "ru" ? "Итоговая доза" : "Final dose"}
                value={
                  language === "ru"
                    ? `${plan.doseAmount} · изменено вручную`
                    : `${plan.doseAmount} · edited manually`
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={`grid gap-2 ${
          canLogDoseNow && onTakeDose
            ? canEdit
              ? "grid-cols-3"
              : "grid-cols-2"
            : canEdit
              ? "grid-cols-2"
              : "grid-cols-1"
        }`}
      >
        {canLogDoseNow && onTakeDose ? (
          <button
            type="button"
            onClick={() => onTakeDose(plan)}
            disabled={isSubmittingAdministration}
            className={`${illnessCompactPrimaryButtonClass} w-full`}
          >
            {isSubmittingAdministration
              ? language === "ru"
                ? "Отмечаем…"
                : "Logging…"
              : language === "ru"
                ? "Отметить сейчас"
                : "Log now"}
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={appBtnJournalSecondaryClass}
          >
            {language === "ru" ? "Изменить всё" : "Edit all"}
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={isDeleting}
            className={appBtnJournalDangerClass}
          >
            {isDeleting
              ? language === "ru"
                ? "Удаляем…"
                : "Deleting…"
              : language === "ru"
                ? "Удалить"
                : "Delete"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
