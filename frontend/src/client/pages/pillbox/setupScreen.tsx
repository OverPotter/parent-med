import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
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
              ? "Обновите лекарства, название и участников плана."
              : "Update medicines, plan name and participants."
            : language === "ru"
              ? "Сначала добавьте лекарства, потом дайте плану имя и выберите участников."
              : "Add medicines first, then name the plan and choose participants."
        }
      />

      <div className="space-y-4">
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
            <div className="space-y-1">
              <h2 className="app-card-title">{tPillbox(language, "membersTitle")}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {familyMembers.map((member) => {
                const selected = draft.members.includes(member.id);
                const memberLabel = member.displayName || member.login || member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onToggleMember(member.id)}
                    className="soft-pill app-profile-action inline-flex min-h-[2.5rem] w-auto max-w-full items-center gap-2 px-3.25 text-[0.8rem] font-medium tracking-[-0.02em]"
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full transition ${
                        selected
                          ? "bg-[color:var(--color-success)]"
                          : "bg-[color:color-mix(in_srgb,var(--color-border)_86%,transparent)]"
                      }`}
                    />
                    <span className={selected ? "text-foreground" : "text-foreground/86"}>
                      {memberLabel}
                    </span>
                  </button>
                );
              })}
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
            <div className="pt-1">
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
