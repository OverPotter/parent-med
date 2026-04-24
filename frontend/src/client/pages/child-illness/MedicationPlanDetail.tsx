import { useEffect, useState } from "react";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  EpisodeMedicationPlan,
  HouseholdMedicine,
  WeightEntry,
} from "@shared/types/api";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import {
  buildWeightDoseHint,
  formatIntervalForDisplay,
  formatRelativeDateTime,
  type MedicationPlanPriorityItem,
} from "../../utils/medicationPlans";
import {
  DetailRow,
  appBtnJournalDangerClass,
  appBtnJournalSecondaryClass,
  illnessCompactPrimaryButtonClass,
  illnessPanelSoftClass,
} from "./shared";
import type { MedicationPlanPayload } from "./reminderUtils";
import { MedicationPlanComposer } from "./MedicationPlanComposer";

export function MedicationPlanDetail({
  item,
  childId,
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
  childId: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const { plan, medicine, stats, isUnavailable } = item;
  const planName =
    plan.customMedicineName ??
    medicine?.medicineName ??
    (language === "ru" ? "Лекарство" : "Medicine");
  const doseBadge = plan.doseAmount?.trim() ?? "";
  const weightHint = buildWeightDoseHint(medicine, plan.weightKg, plan.doseMgPerKg);
  const nextDoseText = isUnavailable
    ? language === "ru"
      ? "Недоступно"
      : "Unavailable"
    : stats?.blockedByDailyLimit
      ? language === "ru"
        ? "Лимит на сегодня"
        : "Daily limit reached"
      : stats?.nextAllowedAt
        ? stats.nextAllowedAt <= new Date()
          ? language === "ru"
            ? "Можно сейчас"
            : "Available now"
          : formatRelativeDateTime(stats.nextAllowedAt, new Date())
        : language === "ru"
          ? "Можно сейчас"
          : "Available now";
  const canLogDoseNow = Boolean(onTakeDose) && !isUnavailable && !stats?.isBlocked;
  const reminderSummaryItems = [
    ...(doseBadge
      ? [
          {
            label: language === "ru" ? "Доза" : "Dose",
            value: doseBadge,
            tone: "bg-fuchsia-500",
          },
        ]
      : []),
    {
      label: language === "ru" ? "Интервал" : "Interval",
      value: formatIntervalForDisplay(plan.minIntervalMinutes, intervalUnit),
      tone: "bg-sky-500",
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
  }, [plan.id]);

  if (isEditing && canEdit) {
    return (
      <section className="space-y-4">
        <MedicationPlanComposer
          key={plan.id}
          childId={childId}
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
              {planName}
            </h4>
            {(medicine?.medicineForm || medicine?.medicineConcentration) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {[medicine?.medicineForm ?? null, medicine?.medicineConcentration ?? null]
                  .filter(Boolean)
                  .map((item) => (
                    <span
                      key={item}
                      className="soft-pill inline-flex min-h-[1.9rem] items-center rounded-full px-3 py-1 text-[0.74rem] font-semibold"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            )}
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
                        ? "Приём можно отметить сейчас."
                        : "A dose can be logged now."
                      : language === "ru"
                        ? `Следующий приём ${formatRelativeDateTime(stats.nextAllowedAt, new Date())}.`
                        : `Next dose ${formatRelativeDateTime(stats.nextAllowedAt, new Date())}.`
                    : language === "ru"
                      ? "Приём можно отметить сейчас."
                      : "A dose can be logged now."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {reminderSummaryItems.map((item) => (
            <div
              key={item.label}
              className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
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
            </div>
          ))}
        </div>
      </div>

      {(medicine && (medicine.medicineForm || medicine.medicineConcentration)) || weightHint ? (
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
            {weightHint ? (
              <DetailRow
                label={language === "ru" ? "По весу" : "Weight based"}
                value={weightHint}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={`grid gap-2 ${
          canLogDoseNow && onTakeDose ? (canEdit ? "grid-cols-3" : "grid-cols-2") : canEdit ? "grid-cols-2" : "grid-cols-1"
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
            {language === "ru" ? "Изменить" : "Edit"}
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
