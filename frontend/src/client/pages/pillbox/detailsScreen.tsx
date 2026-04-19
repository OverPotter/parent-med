import type { PillboxPlan } from "@shared/api/pillboxPlans.contract";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import {
  actionCompactSecondaryClass,
  actionFilterClass,
  displayPillboxText,
  EditorShell,
  formatPillboxDoseAmount,
  FlowScreenHeader,
  formatMealRule,
  isLateDose,
  isOverdueDose,
  normalizeDisplayTime,
  PillboxDeleteTarget,
  PillboxGroup,
  PillboxPlanActionTarget,
  summarizeMedicationTimes,
  tPillbox,
} from "./shared";

export function PillboxDetailsScreen({
  language,
  selectedPlan,
  selectedPlanId,
  allGroups,
  planActionTarget,
  planActionError,
  togglePlanStatusPending,
  deletePlanPending,
  deleteTarget,
  onBack,
  onToggleStatus,
  onGoToSetup,
  onRequestArchive,
  onRequestDelete,
  onConfirmPlanAction,
  onClosePlanAction,
  onConfirmDelete,
  onCloseDelete,
}: {
  language: AppLanguage;
  selectedPlan: PillboxPlan;
  selectedPlanId: string;
  allGroups: PillboxGroup[];
  planActionTarget: PillboxPlanActionTarget;
  planActionError: string | null;
  togglePlanStatusPending: boolean;
  deletePlanPending: boolean;
  deleteTarget: PillboxDeleteTarget | null;
  onBack: () => void;
  onToggleStatus: () => void;
  onGoToSetup: () => void;
  onRequestArchive: () => void;
  onRequestDelete: () => void;
  onConfirmPlanAction: () => void;
  onClosePlanAction: () => void;
  onConfirmDelete: () => void;
  onCloseDelete: () => void;
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

  return (
    <EditorShell>
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

      <section className="space-y-4">
        <div className="soft-panel rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                    selectedPlan.status === "active"
                      ? "bg-[color:var(--color-success)]"
                      : selectedPlan.status === "paused"
                        ? "bg-[color:var(--color-warning)]"
                        : "bg-[color:var(--color-danger)]"
                  }`}
                />
                <p className="app-card-title min-w-0 truncate">
                  {displayPillboxText(selectedPlan.title)}
                </p>
              </div>
              {selectedPlan.status !== "archived" ? (
                <button
                  type="button"
                  onClick={onToggleStatus}
                  disabled={togglePlanStatusPending}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                    selectedPlan.status === "active"
                      ? "border-emerald-500/45 bg-emerald-500/25"
                      : "border-amber-500/45 bg-amber-500/20"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[0.7rem] shadow-sm transition-transform dark:bg-slate-100 ${
                      selectedPlan.status === "active"
                        ? "translate-x-6 text-emerald-600"
                        : "translate-x-1 text-amber-700"
                    }`}
                  >
                    {selectedPlan.status === "active" ? "✓" : "✕"}
                  </span>
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="soft-panel-muted rounded-[20px] px-3.5 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
                  {selectedGroupOverdue
                    ? tPillbox(language, "overdueDose")
                    : tPillbox(language, "nextDoseShort")}
                </p>
                <p
                  className={`mt-1 text-[0.98rem] font-semibold tracking-[-0.03em] ${
                    selectedGroupOverdue || selectedGroupLate
                      ? "text-[color:var(--color-warning)]"
                      : "text-[color:var(--color-success)]"
                  }`}
                >
                  {selectedGroup?.nextDose ?? "—"}
                </p>
              </div>
              <div className="soft-panel-muted rounded-[20px] px-3.5 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
                  {tPillbox(language, "medicineCount")}
                </p>
                <p className="mt-1 text-[0.98rem] font-semibold tracking-[-0.03em] text-foreground">
                  {sortedMedications.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="soft-panel overflow-hidden rounded-[28px]">
          <div className="divide-y divide-[color:color-mix(in_srgb,var(--color-border)_62%,transparent)]">
            {sortedMedications.map((medication, index) => {
              const isNextMedication = medication.id === selectedGroup?.nextMedicationId;
              return (
                <div
                  key={medication.id}
                  className={`px-4 py-3 sm:px-5 ${isNextMedication ? "bg-[color:color-mix(in_srgb,var(--color-primary)_7%,transparent)]" : ""}`}
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
                        {formatPillboxDoseAmount(
                          medication.doseAmount || tPillbox(language, "amountMissing"),
                          language
                        )}
                        <span className="mx-1.5">—</span>
                        {summarizeMedicationTimes(
                          medication.times.map(normalizeDisplayTime),
                          language
                        )}
                        <span className="mx-1.5">—</span>
                        {formatMealRule(medication.mealRule, language)}
                      </p>
                    </div>
                    <span className="soft-pill shrink-0 px-2.5 py-1 text-[10px]">
                      {medication.courseMode === "period"
                        ? `${medication.courseStartDate ?? "—"} → ${medication.courseEndDate ?? "—"}`
                        : tPillbox(language, "continuous")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {selectedPlan.status !== "archived" ? (
            <button type="button" onClick={onGoToSetup} className={actionCompactSecondaryClass}>
              {tPillbox(language, "editPlan")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestArchive}
              disabled={togglePlanStatusPending}
              className={`${actionCompactSecondaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {tPillbox(language, "restorePlan")}
            </button>
          )}
          {selectedPlan.status !== "archived" ? (
            <button
              type="button"
              onClick={onRequestArchive}
              disabled={togglePlanStatusPending}
              className={`${actionFilterClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {tPillbox(language, "archivePlan")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={deletePlanPending}
            className={`${actionFilterClass} text-[color:var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {tPillbox(language, "deletePlan")}
          </button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={planActionTarget !== null}
        title={
          planActionTarget === "pause"
            ? tPillbox(language, "confirmPausePlanTitle")
            : planActionTarget === "resume"
              ? tPillbox(language, "confirmResumePlanTitle")
              : planActionTarget === "archive"
                ? tPillbox(language, "confirmArchivePlanTitle")
                : tPillbox(language, "confirmRestorePlanTitle")
        }
        description={`${planActionTarget === "pause" ? tPillbox(language, "confirmPausePlanDescription") : planActionTarget === "resume" ? tPillbox(language, "confirmResumePlanDescription") : planActionTarget === "archive" ? tPillbox(language, "confirmArchivePlanDescription") : tPillbox(language, "confirmRestorePlanDescription")}${planActionError ? `\n\n${planActionError}` : ""}`}
        confirmLabel={
          planActionTarget === "pause"
            ? tPillbox(language, "pausePlan")
            : planActionTarget === "resume"
              ? tPillbox(language, "resumePlan")
              : planActionTarget === "archive"
                ? tPillbox(language, "archivePlan")
                : tPillbox(language, "restorePlan")
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
