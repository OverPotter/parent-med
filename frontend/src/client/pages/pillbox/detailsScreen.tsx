import type { PillboxPlan } from "@shared/api/pillboxPlans.contract";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import { getAccountDisplayLabel } from "@shared/utils/accountLabels";
import { PlanPushRecipientsField } from "./PlanPushRecipientsField";
import {
  actionCompactDangerClass,
  actionCompactSecondaryClass,
  displayPillboxText,
  EditorShell,
  formatPillboxReminderRecipientsLine,
  formatPillboxDoseAmount,
  FlowScreenHeader,
  formatMealRule,
  isLateDose,
  isOverdueDose,
  normalizeDisplayTime,
  PillboxDeleteTarget,
  PillboxGroup,
  PillboxPlanActionTarget,
  tPillbox,
} from "./shared";

export function PillboxDetailsScreen({
  language,
  selectedPlan,
  selectedPlanId,
  allGroups,
  canAct,
  canEdit,
  disableEditingActions,
  planActionTarget,
  planActionError,
  togglePlanStatusPending,
  deletePlanPending,
  deleteTarget,
  onBack,
  onToggleStatus,
  onGoToSetup,
  onOpenMedication,
  familyMembers,
  currentAccountId,
  onToggleRecipient,
  recipientSelectionPending,
  onRequestDelete,
  onConfirmPlanAction,
  onClosePlanAction,
  onConfirmDelete,
  onCloseDelete,
  underlaySnapshotKey,
  enableBackGesture = true,
}: {
  language: AppLanguage;
  selectedPlan: PillboxPlan;
  selectedPlanId: string;
  allGroups: PillboxGroup[];
  canAct: boolean;
  canEdit: boolean;
  disableEditingActions: boolean;
  planActionTarget: PillboxPlanActionTarget;
  planActionError: string | null;
  togglePlanStatusPending: boolean;
  deletePlanPending: boolean;
  deleteTarget: PillboxDeleteTarget | null;
  onBack: () => void;
  onToggleStatus: () => void;
  onGoToSetup: () => void;
  onOpenMedication: (medicationId: string) => void;
  familyMembers: Array<{
    id: string;
    displayName?: string | null;
    login?: string | null;
    relationshipLabel?: string | null;
  }>;
  currentAccountId: string | null;
  onToggleRecipient: (memberIds: string[]) => void | Promise<void>;
  recipientSelectionPending: boolean;
  onRequestDelete: () => void;
  onConfirmPlanAction: () => void;
  onClosePlanAction: () => void;
  onConfirmDelete: () => void;
  onCloseDelete: () => void;
  underlaySnapshotKey?: string;
  enableBackGesture?: boolean;
}) {
  const selectedGroup = allGroups.find((group) => group.id === selectedPlanId) ?? null;
  const selectedGroupOverdue = selectedGroup
    ? isOverdueDose(selectedGroup.nextDoseAt, selectedGroup.status)
    : false;
  const selectedGroupLate = selectedGroup
    ? isLateDose(selectedGroup.nextDoseAt, selectedGroup.status)
    : false;
  const sortedMedications = [...selectedPlan.medications].sort((left, right) => {
    const nextMedicationId = selectedGroup?.nextMedicationId;
    if (nextMedicationId) {
      const leftIsNext = left.id === nextMedicationId;
      const rightIsNext = right.id === nextMedicationId;
      if (leftIsNext && !rightIsNext) return -1;
      if (!leftIsNext && rightIsNext) return 1;
    }
    return left.position - right.position;
  });
  const factsLine = formatPlanFactsLine(
    sortedMedications.length,
    language,
    selectedPlan.status === "archived" || selectedPlan.status === "completed"
  );
  const remindersLine = formatPillboxReminderRecipientsLine(
    familyMembers
      .filter((member) => selectedPlan.memberAccountIds.includes(member.id))
      .map((member) => getAccountDisplayLabel(member)),
    language
  );
  const isCompletedPlan = selectedPlan.status === "completed" || selectedPlan.status === "archived";
  const canDeletePlan = canEdit || (canAct && isCompletedPlan);

  return (
    <EditorShell
      onBack={onBack}
      underlaySnapshotKey={underlaySnapshotKey}
      enableBackGesture={enableBackGesture}
    >
      <FlowScreenHeader
        backLabel={tPillbox(language, "detailsBack")}
        onBack={onBack}
        eyebrow=""
        title={tPillbox(language, "detailsTitle")}
        subtitle={
          language === "ru"
            ? "Сводка по плану, лекарства и быстрые действия."
            : "Plan summary, medicines and quick actions."
        }
      />

      <section className="mt-4 space-y-4">
        <div className="soft-panel rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                      selectedPlan.status === "active"
                        ? "bg-[color:var(--color-success)]"
                        : selectedPlan.status === "paused"
                          ? "bg-[color:var(--color-warning)]"
                          : selectedPlan.status === "completed" ||
                              selectedPlan.status === "archived"
                            ? "bg-sky-500"
                            : "bg-[color:var(--color-danger)]"
                    }`}
                  />
                  <p className="app-card-title min-w-0 truncate">
                    {displayPillboxText(selectedPlan.title)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canEdit &&
                  !disableEditingActions &&
                  (selectedPlan.status === "active" || selectedPlan.status === "paused") ? (
                    <PlanPushRecipientsField
                      language={language}
                      familyMembers={familyMembers}
                      currentAccountId={currentAccountId}
                      selectedMemberIds={selectedPlan.memberAccountIds}
                      onSubmit={onToggleRecipient}
                      isPending={recipientSelectionPending}
                    />
                  ) : null}
                  {canAct &&
                  (selectedPlan.status === "active" || selectedPlan.status === "paused") ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={selectedPlan.status === "active"}
                      onClick={onToggleStatus}
                      disabled={togglePlanStatusPending}
                      className={[
                        "baby-mode-switch relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors",
                        selectedPlan.status === "active" ? "baby-mode-switch--active" : "",
                        togglePlanStatusPending ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "baby-mode-switch__thumb absolute left-1 inline-block h-6 w-6 rounded-full transition-transform",
                          selectedPlan.status === "active" ? "translate-x-6" : "translate-x-0",
                        ].join(" ")}
                      />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-[0.8rem] leading-5 text-muted">{factsLine}</p>
              <p className="text-[0.8rem] leading-5 text-muted">{remindersLine}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <div className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
                <span
                  aria-hidden="true"
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    isCompletedPlan
                      ? "bg-sky-500"
                      : selectedGroupOverdue || selectedGroupLate
                        ? "bg-[color:var(--color-warning)]"
                        : "bg-[color:var(--color-success)]"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
                    {isCompletedPlan
                      ? language === "ru"
                        ? "Состояние"
                        : "Status"
                      : selectedGroupOverdue
                        ? tPillbox(language, "overdueDose")
                        : tPillbox(language, "nextDoseShort")}
                  </span>
                  <span className="mt-0.5 block break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
                    {isCompletedPlan
                      ? language === "ru"
                        ? "Курс завершён"
                        : "Course completed"
                      : (selectedGroup?.nextDose ?? "—")}
                  </span>
                </span>
              </div>
              <div className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
                <span
                  aria-hidden="true"
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
                    {language === "ru" ? "Лекарств" : "Medicines"}
                  </span>
                  <span className="mt-0.5 block break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
                    {sortedMedications.length}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
          <div className="px-4 pb-2 pt-3 sm:px-5">
            <h2 className="app-card-title">{tPillbox(language, "medsTitle")}</h2>
          </div>
          <div className="divide-y divide-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)]">
            {sortedMedications.map((medication, index) => {
              const isNextMedication = medication.id === selectedGroup?.nextMedicationId;
              const normalizedTimes = medication.times.map(normalizeDisplayTime);
              const primaryTime = normalizedTimes[0] ?? "—";
              return (
                <div
                  key={medication.id}
                  className={`grid grid-cols-[4.4rem_minmax(0,1fr)] items-start gap-3 px-3 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4 ${isNextMedication ? "bg-[color:color-mix(in_srgb,var(--color-primary)_7%,transparent)]" : ""}`}
                >
                  <span className="min-w-0 pt-0.5 text-xs font-semibold tabular-nums text-muted">
                    <span className="block truncate leading-4 text-foreground">{primaryTime}</span>
                    <span className="block truncate text-[0.68rem] leading-4">
                      {formatTimesPerDayLabel(normalizedTimes.length, language)}
                    </span>
                  </span>
                  {canEdit && !disableEditingActions ? (
                    <button
                      type="button"
                      onClick={() => onOpenMedication(medication.id)}
                      className="min-w-0 text-left transition hover:opacity-85"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isNextMedication
                              ? "bg-[color:var(--color-success)]"
                              : "bg-[color:color-mix(in_srgb,var(--color-primary)_70%,white)]"
                          }`}
                          aria-hidden="true"
                        />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {displayPillboxText(
                            medication.customMedicineName ||
                              tPillbox(language, "unnamedMedicine", { index: index + 1 })
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-muted">
                        {formatMealRule(medication.mealRule, language)}
                        {" · "}
                        {formatPillboxDoseAmount(
                          medication.doseAmount || tPillbox(language, "amountMissing"),
                          language
                        )}
                        {" · "}
                        {medication.courseMode === "period"
                          ? `${medication.courseStartDate ?? "—"} — ${medication.courseEndDate ?? "—"}`
                          : tPillbox(language, "continuous")}
                      </p>
                    </button>
                  ) : (
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isNextMedication
                              ? "bg-[color:var(--color-success)]"
                              : "bg-[color:color-mix(in_srgb,var(--color-primary)_70%,white)]"
                          }`}
                          aria-hidden="true"
                        />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {displayPillboxText(
                            medication.customMedicineName ||
                              tPillbox(language, "unnamedMedicine", { index: index + 1 })
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-muted">
                        {formatMealRule(medication.mealRule, language)}
                        {" · "}
                        {formatPillboxDoseAmount(
                          medication.doseAmount || tPillbox(language, "amountMissing"),
                          language
                        )}
                        {" · "}
                        {medication.courseMode === "period"
                          ? `${medication.courseStartDate ?? "—"} — ${medication.courseEndDate ?? "—"}`
                          : tPillbox(language, "continuous")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canEdit || canDeletePlan ? (
          <div className="grid grid-cols-2 gap-2">
            {canEdit && (selectedPlan.status === "active" || selectedPlan.status === "paused") ? (
              <button
                type="button"
                onClick={onGoToSetup}
                disabled={disableEditingActions}
                className={`${actionCompactSecondaryClass} w-full disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {tPillbox(language, "editPlan")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRequestDelete}
              disabled={deletePlanPending || !canDeletePlan}
              className={`${actionCompactDangerClass} w-full disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedPlan.status === "active" || selectedPlan.status === "paused"
                  ? ""
                  : "col-span-2"
              }`}
            >
              {tPillbox(language, "deletePlan")}
            </button>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        isOpen={planActionTarget !== null}
        title={
          planActionTarget === "pause"
            ? tPillbox(language, "confirmPausePlanTitle")
            : tPillbox(language, "confirmResumePlanTitle")
        }
        description={`${planActionTarget === "pause" ? tPillbox(language, "confirmPausePlanDescription") : tPillbox(language, "confirmResumePlanDescription")}${planActionError ? `\n\n${planActionError}` : ""}`}
        confirmLabel={
          planActionTarget === "pause"
            ? tPillbox(language, "pausePlan")
            : tPillbox(language, "resumePlan")
        }
        cancelLabel={tPillbox(language, "cancel")}
        confirmTone="primary"
        isPending={togglePlanStatusPending}
        onConfirm={onConfirmPlanAction}
        onCancel={onClosePlanAction}
      />
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.kind === "plan"
            ? tPillbox(language, "confirmDeletePlanTitle")
            : tPillbox(language, "confirmDeleteMedicineTitle")
        }
        description={`${deleteTarget?.kind === "plan" ? tPillbox(language, "confirmDeletePlanDescription") : tPillbox(language, "confirmDeleteMedicineDescription")}${planActionError ? `\n\n${planActionError}` : ""}`}
        confirmLabel={tPillbox(language, "delete")}
        cancelLabel={tPillbox(language, "cancel")}
        confirmTone="danger"
        isPending={deletePlanPending}
        onConfirm={onConfirmDelete}
        onCancel={onCloseDelete}
      />
    </EditorShell>
  );
}

function formatTimesPerDayLabel(count: number, language: AppLanguage) {
  if (language === "en") {
    return count === 1 ? "once a day" : `${count} times`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return "1 раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} раза`;
  return `${count} раз`;
}

function formatPlanFactsLine(
  medicationsCount: number,
  language: AppLanguage,
  isCompleted: boolean
) {
  if (language === "en") {
    const facts = [`${medicationsCount} ${medicationsCount === 1 ? "medicine" : "medicines"}`];
    if (isCompleted) facts.unshift("Completed");
    return facts.join(" · ");
  }

  const meds =
    medicationsCount % 10 === 1 && medicationsCount % 100 !== 11
      ? `${medicationsCount} лекарство`
      : medicationsCount % 10 >= 2 &&
          medicationsCount % 10 <= 4 &&
          (medicationsCount % 100 < 12 || medicationsCount % 100 > 14)
        ? `${medicationsCount} лекарства`
        : `${medicationsCount} лекарств`;
  return [isCompleted ? "Завершён" : null, meds].filter(Boolean).join(" · ");
}
