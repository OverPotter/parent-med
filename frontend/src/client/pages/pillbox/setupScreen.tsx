import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import { appPillActionClass } from "../child-illness/shared";
import { PlanPushRecipientsField } from "./PlanPushRecipientsField";
import {
  actionPrimaryClass,
  actionSecondaryClass,
  displayPillboxText,
  EditorShell,
  formatPillboxDoseAmount,
  FlowScreenHeader,
  formatMealRule,
  normalizeDisplayTime,
  PillboxDeleteTarget,
  SetupDraft,
  summarizeMedicationTimes,
  tPillbox,
} from "./shared";

type FamilyMemberLike = {
  id: string;
  displayName?: string | null;
  login?: string | null;
  relationshipLabel?: string | null;
};

function formatMedicationListCount(count: number, language: AppLanguage) {
  if (language === "en") {
    return count === 1 ? "1 medicine" : `${count} medicines`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} лекарство`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} лекарства`;
  return `${count} лекарств`;
}

export function PillboxSetupScreen({
  language,
  draft,
  familyMembers,
  canSavePlan,
  saveBlockedReason,
  saveAttempted,
  savePlanError,
  isEditing,
  onBack,
  onAddMedication,
  onOpenMedication,
  onRequestDeleteMedication,
  onTitleChange,
  onToggleMember,
  onSavePlan,
  recipientsSummary,
  showTestPushAction,
  testPushLabel,
  onSendTestPush,
  isTestPushPending,
  testPushStatus,
  deleteTarget,
  onConfirmDelete,
  onCloseDeleteDialog,
}: {
  language: AppLanguage;
  draft: SetupDraft;
  familyMembers: FamilyMemberLike[];
  canSavePlan: boolean;
  saveBlockedReason: string | null;
  saveAttempted: boolean;
  savePlanError: string | null;
  isEditing: boolean;
  onBack: () => void;
  onAddMedication: () => void;
  onOpenMedication: (medicationId: string) => void;
  onRequestDeleteMedication: (medicationId: string, medicationName: string) => void;
  onTitleChange: (value: string) => void;
  onToggleMember: (memberId: string) => void;
  onSavePlan: () => void;
  recipientsSummary: string | null;
  showTestPushAction: boolean;
  testPushLabel: string;
  onSendTestPush: () => void;
  isTestPushPending: boolean;
  testPushStatus: string | null;
  deleteTarget: PillboxDeleteTarget | null;
  onConfirmDelete: () => void;
  onCloseDeleteDialog: () => void;
}) {
  return (
    <EditorShell onBack={onBack}>
      <FlowScreenHeader
        backLabel={tPillbox(language, "setupBack")}
        onBack={onBack}
        eyebrow=""
        title={
          isEditing
            ? language === "ru"
              ? "Приёмы · Редактировать план"
              : "Pillbox · Edit plan"
            : language === "ru"
              ? "Приёмы · Создать план"
              : "Pillbox · Create plan"
        }
        subtitle={
          isEditing
            ? language === "ru"
              ? "Обновите лекарства, название и push по плану. В списке только те, у кого открыт доступ к приёмам."
              : "Update medicines, the plan name, and push recipients."
            : language === "ru"
              ? "Сначала добавьте лекарства, потом дайте плану имя и выберите, кому приходят push."
              : "Add medicines first, then name the plan and choose who gets push reminders."
        }
      />

      <div className="pt-2 space-y-4">
        <div className="soft-panel space-y-5 rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="app-card-title">{tPillbox(language, "medsTitle")}</h1>
              <span className="text-[0.73rem] font-medium text-muted">
                {formatMedicationListCount(draft.medications.length, language)}
              </span>
            </div>

            {draft.medications.length ? (
              <div className="divide-y divide-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
                {draft.medications.map((medication, index) => (
                  <div key={medication.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenMedication(medication.id)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-[0.38rem] inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--color-primary)]"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[0.94rem] font-semibold tracking-[-0.025em] text-foreground">
                                  {displayPillboxText(
                                    medication.title ||
                                      tPillbox(language, "unnamedMedicine", { index: index + 1 })
                                  )}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.77rem] leading-5 text-muted">
                                <span className="truncate">
                                  {summarizeMedicationTimes(
                                    medication.times.map(normalizeDisplayTime),
                                    language
                                  )}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_30%,transparent)]"
                                />
                                <span>{formatMealRule(medication.mealRule, language)}</span>
                                <span
                                  aria-hidden="true"
                                  className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_30%,transparent)]"
                                />
                                <span className="text-[0.74rem] text-muted/90">
                                  {formatPillboxDoseAmount(
                                    medication.dose || tPillbox(language, "amountMissing"),
                                    language
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestDeleteMedication(
                            medication.id,
                            displayPillboxText(
                              medication.title ||
                                tPillbox(language, "unnamedMedicine", { index: index + 1 })
                            )
                          )
                        }
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full text-[0.82rem] text-muted transition hover:bg-[color:color-mix(in_srgb,var(--color-danger)_10%,transparent)] hover:text-[color:var(--color-danger)]"
                        aria-label={tPillbox(language, "delete")}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button type="button" onClick={onAddMedication} className={actionSecondaryClass}>
              {tPillbox(language, "addMedicine")}
            </button>
          </section>

          <section className="space-y-3 pt-1">
            <label className="block space-y-1.5" htmlFor="pillbox-group-title">
              <span className="soft-field-label">{tPillbox(language, "titleLabel")}</span>
              <input
                id="pillbox-group-title"
                value={draft.title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder={language === "ru" ? "Например: Для бабушки" : "Example: For grandma"}
                className="soft-input w-full px-4"
              />
            </label>
          </section>

          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="app-card-title">{tPillbox(language, "membersTitle")}</h2>
              <PlanPushRecipientsField
                language={language}
                familyMembers={familyMembers}
                selectedMemberIds={draft.members}
                onToggleMember={onToggleMember}
              />
            </div>
            {recipientsSummary ? (
              <p className="text-sm leading-6 text-muted">{recipientsSummary}</p>
            ) : null}
            {showTestPushAction ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onSendTestPush}
                  disabled={isTestPushPending}
                  className={`${appPillActionClass} shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {testPushLabel}
                </button>
                {testPushStatus ? (
                  <p className="text-sm leading-6 text-muted">{testPushStatus}</p>
                ) : null}
              </div>
            ) : null}
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
            <div className="border-t border-border/60 pt-4">
              <button type="button" onClick={onSavePlan} className={actionPrimaryClass}>
                {isEditing ? tPillbox(language, "savePlan") : tPillbox(language, "createNewPlan")}
              </button>
            </div>
          </section>
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
        onConfirm={onConfirmDelete}
        onCancel={onCloseDeleteDialog}
      />
    </EditorShell>
  );
}
