import { useState } from "react";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import { getAccountDisplayLabel } from "@shared/utils/accountLabels";
import { PlanPushRecipientsField } from "./PlanPushRecipientsField";
import { buildPillboxPlanTargetLabel } from "./planTarget";
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

function formatCompactRecipientsSummary(labels: string[], language: AppLanguage): string {
  if (!labels.length) {
    return language === "ru" ? "никто не выбран" : "no one selected";
  }
  if (labels.length <= 3) {
    return labels.join(", ");
  }
  return language === "ru" ? `${labels.length} участников` : `${labels.length} members`;
}

export function PillboxSetupScreen({
  language,
  draft,
  familyMembers,
  canAddMedication,
  addMedicationBlockedReason,
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
  onSelectTargetMember,
  currentAccountId,
  onSelectRecipients,
  onOpenRecipientsSheet,
  onSavePlan,
  deleteTarget,
  onConfirmDelete,
  onCloseDeleteDialog,
  underlaySnapshotKey,
  enableBackGesture = true,
  backLabel,
}: {
  language: AppLanguage;
  draft: SetupDraft;
  familyMembers: FamilyMemberLike[];
  canAddMedication: boolean;
  addMedicationBlockedReason: string | null;
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
  onSelectTargetMember: (memberId: string) => void;
  currentAccountId: string | null;
  onSelectRecipients: (memberIds: string[]) => void | Promise<void>;
  onOpenRecipientsSheet?: () => void | Promise<void>;
  onSavePlan: () => void;
  deleteTarget: PillboxDeleteTarget | null;
  onConfirmDelete: () => void;
  onCloseDeleteDialog: () => void;
  underlaySnapshotKey?: string;
  enableBackGesture?: boolean;
  backLabel?: string;
}) {
  const [targetSheetOpen, setTargetSheetOpen] = useState(false);
  const selectedTargetMember =
    familyMembers.find((member) => member.id === draft.targetMemberId) ?? null;
  const targetMemberLabel = selectedTargetMember
    ? buildPillboxPlanTargetLabel(selectedTargetMember)
    : language === "ru"
      ? "Выберите участника семьи"
      : "Choose a family member";
  const generatedTitlePreview = draft.title.trim()
    ? draft.title
    : language === "ru"
      ? "Название появится после выбора участника"
      : "The plan name will appear after you choose a family member";
  const compactReminderRecipientsLine = formatCompactRecipientsSummary(
    familyMembers
      .filter((member) => draft.members.includes(member.id))
      .map((member) => getAccountDisplayLabel(member)),
    language
  );

  return (
    <EditorShell
      onBack={onBack}
      underlaySnapshotKey={underlaySnapshotKey}
      enableBackGesture={enableBackGesture}
    >
      <FlowScreenHeader
        backLabel={backLabel ?? tPillbox(language, "setupBack")}
        onBack={onBack}
        eyebrow=""
        title={
          isEditing
            ? language === "ru"
              ? "Таблетница · Редактировать план"
              : "Pillbox · Edit plan"
            : language === "ru"
              ? "Таблетница · Создать план"
              : "Pillbox · Create plan"
        }
        subtitle={
          isEditing
            ? language === "ru"
              ? "Обновите лекарства и название плана. Настройки уведомлений доступны в карточке плана."
              : "Update medicines and the plan name. Notification settings are available in plan details."
            : language === "ru"
              ? "Сначала выберите, для кого этот план, а потом добавьте лекарства."
              : "Choose who this plan is for first, then add medicines."
        }
      />

      <div className="pt-2 space-y-4">
        <div className="soft-panel space-y-5 rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
          {!isEditing ? (
            <section className="space-y-3 pt-1">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="soft-field-label">
                    {language === "ru" ? "Для кого план" : "Who is this plan for"}
                  </span>
                  <p className="text-[0.78rem] leading-5 text-muted">
                    {language === "ru"
                      ? "Сначала выберите, для кого будет этот план."
                      : "Choose who this plan is for first."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetSheetOpen(true)}
                  className="soft-input flex min-h-[2.82rem] w-full items-center justify-between gap-3 px-4 py-0 text-left text-[16px] leading-[1.15] sm:min-h-[2.92rem]"
                >
                  <span className={selectedTargetMember ? "text-foreground" : "text-muted"}>
                    {targetMemberLabel}
                  </span>
                  <span aria-hidden="true" className="text-muted">
                    ›
                  </span>
                </button>
                <p className="text-sm leading-6 text-muted">
                  {language === "ru" ? "План:" : "Plan:"}{" "}
                  <span className="font-bold text-foreground underline decoration-[color:color-mix(in_srgb,var(--color-primary)_38%,transparent)] decoration-2 underline-offset-4">
                    {generatedTitlePreview}
                  </span>
                </p>
              </div>
            </section>
          ) : null}

          {!isEditing ? (
            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <span className="soft-field-label">
                    {language === "ru" ? "Уведомления" : "Notifications"}
                  </span>
                  <p className="text-[0.78rem] leading-5 text-muted">
                    {language === "ru"
                      ? "Кому сейчас придут напоминания по этому плану. Позже это можно изменить."
                      : "Who currently receives reminders for this plan. You can change this later."}
                  </p>
                </div>
                <PlanPushRecipientsField
                  language={language}
                  familyMembers={familyMembers}
                  currentAccountId={currentAccountId}
                  selectedMemberIds={draft.members}
                  onSubmit={onSelectRecipients}
                  onOpen={onOpenRecipientsSheet}
                  buttonLabel={language === "ru" ? "Изменить" : "Change"}
                />
              </div>
              <p className="text-sm leading-6 text-muted">
                {language === "ru" ? "Уведомления для:" : "Notifications for:"}{" "}
                <span className="font-semibold text-foreground">
                  {compactReminderRecipientsLine}
                </span>
              </p>
              {!canAddMedication && addMedicationBlockedReason ? (
                <p className="text-[0.78rem] leading-5 text-muted">{addMedicationBlockedReason}</p>
              ) : null}
            </section>
          ) : null}

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

            <button
              type="button"
              onClick={onAddMedication}
              disabled={!canAddMedication}
              className={`${actionSecondaryClass} disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none`}
            >
              {tPillbox(language, "addMedicine")}
            </button>
          </section>

          {isEditing ? (
            <section className="space-y-3 pt-1">
              <label className="block space-y-1.5" htmlFor="pillbox-group-title">
                <span className="soft-field-label">{tPillbox(language, "titleLabel")}</span>
                <input
                  id="pillbox-group-title"
                  value={draft.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder={language === "ru" ? "Например: Для Артема" : "Example: For Artem"}
                  className="soft-input w-full px-4"
                />
              </label>
            </section>
          ) : null}

          <section className="space-y-3 pt-1">
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
              <button
                type="button"
                onClick={onSavePlan}
                disabled={!canSavePlan}
                className={`${actionPrimaryClass} disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none`}
              >
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
      <OverlayDialog
        isOpen={!isEditing && targetSheetOpen}
        onClose={() => setTargetSheetOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={language === "ru" ? "Для кого план" : "Who is this plan for"}
        containerClassName="flex items-end"
        backdropClassName="bg-[rgba(15,23,42,0.32)]"
      >
        <div
          data-ios-disable-back-swipe="true"
          className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
          <div className="space-y-1.5">
            <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">
              {language === "ru" ? "Для кого план" : "Who is this plan for"}
            </h2>
            <p className="text-sm leading-5 text-muted">
              {language === "ru"
                ? "Выберите участника семьи, чтобы сразу подставить название плана и получателя уведомлений."
                : "Choose a family member to prefill the plan name and reminder recipient."}
            </p>
          </div>

          <div className="soft-choice-list mt-4">
            {familyMembers.map((member) => {
              const selected = member.id === draft.targetMemberId;
              const memberMeta = member.relationshipLabel?.trim() ?? "";
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onSelectTargetMember(member.id);
                    setTargetSheetOpen(false);
                  }}
                  className={["soft-choice-row", selected ? "soft-choice-row-active" : ""].join(
                    " "
                  )}
                >
                  <span className="grid min-w-0 gap-0.5 text-left">
                    <span className="min-w-0 truncate whitespace-nowrap text-sm font-semibold tracking-[-0.02em] text-foreground">
                      {getAccountDisplayLabel(member)}
                    </span>
                    {memberMeta ? (
                      <span className="min-w-0 truncate whitespace-nowrap text-[0.81rem] leading-5 text-muted">
                        {memberMeta}
                      </span>
                    ) : null}
                  </span>
                  <span className="soft-choice-check">{selected ? "✓" : null}</span>
                </button>
              );
            })}
          </div>
        </div>
      </OverlayDialog>
    </EditorShell>
  );
}
