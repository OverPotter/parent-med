import { useState } from "react";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import { appPillActionClass } from "../child-illness/shared";
import { tPillbox } from "./shared";

type FamilyMemberLike = {
  id: string;
  displayName?: string | null;
  login?: string | null;
  relationshipLabel?: string | null;
};

export function PlanPushRecipientsField({
  language,
  familyMembers,
  selectedMemberIds,
  onSubmit,
}: {
  language: AppLanguage;
  familyMembers: FamilyMemberLike[];
  selectedMemberIds: string[];
  onSubmit: (memberIds: string[]) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>(selectedMemberIds);
  const [isSaving, setIsSaving] = useState(false);

  const openSheet = () => {
    setDraftMemberIds(selectedMemberIds);
    setIsOpen(true);
  };

  const toggleDraftMember = (memberId: string) => {
    if (draftMemberIds.length === 1 && draftMemberIds.includes(memberId)) {
      return;
    }
    setDraftMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((item) => item !== memberId)
        : [...current, memberId]
    );
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    try {
      setIsSaving(true);
      await onSubmit(draftMemberIds);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={`${appPillActionClass} shrink-0 px-4`}
      >
        {language === "ru" ? "Уведомления" : "Notifications"}
      </button>

      <OverlayDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={tPillbox(language, "membersTitle")}
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
              {tPillbox(language, "membersTitle")}
            </h2>
            <p className="text-sm leading-5 text-muted">
              {language === "ru"
                ? "Можно выбрать сразу несколько получателей, но хотя бы один должен остаться."
                : "Choose several recipients and save them in one action."}
            </p>
          </div>

          <div className="soft-choice-list mt-4">
            {familyMembers.map((member) => {
              const selected = draftMemberIds.includes(member.id);
              const memberLabel = member.displayName || member.login || member.id;
              const memberMeta = member.relationshipLabel || member.login || member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleDraftMember(member.id)}
                  className={["soft-choice-row", selected ? "soft-choice-row-active" : ""].join(" ")}
                >
                  <span className="grid min-w-0 gap-0.5 text-left">
                    <span className="min-w-0 text-sm font-semibold tracking-[-0.02em] text-foreground">
                      {memberLabel}
                    </span>
                    <span className="min-w-0 text-[0.81rem] leading-5 text-muted">
                      {memberMeta}
                    </span>
                  </span>
                  <span className="soft-choice-check">{selected ? "✓" : null}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 pb-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full px-4 text-sm font-semibold text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {language === "ru" ? "Отмена" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving || draftMemberIds.length === 0}
              className={`${appPillActionClass} shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {language === "ru" ? (isSaving ? "Сохраняем..." : "Сохранить") : isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}
