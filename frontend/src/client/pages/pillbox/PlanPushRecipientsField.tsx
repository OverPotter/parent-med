import { useEffect, useMemo, useState } from "react";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import { getAccountDisplayLabel, getAccountSecondaryLabel } from "@shared/utils/accountLabels";
import { resolveRecipientSelection } from "@shared/utils/recipientSelection";
import { appPillActionClass } from "../child-illness/shared";
import { tPillbox } from "./shared";

type FamilyMemberLike = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  relationshipLabel?: string | null;
};

export function PlanPushRecipientsField({
  language,
  familyMembers,
  currentAccountId,
  selectedMemberIds,
  onSubmit,
  isPending = false,
}: {
  language: AppLanguage;
  familyMembers: FamilyMemberLike[];
  currentAccountId: string | null;
  selectedMemberIds: string[];
  onSubmit: (memberIds: string[]) => void | Promise<void>;
  isPending?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const eligibleMemberIds = useMemo(
    () => familyMembers.map((member) => member.id),
    [familyMembers]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    resolveRecipientSelection(selectedMemberIds, currentAccountId, eligibleMemberIds)
  );

  useEffect(() => {
    setSelectedIds(
      resolveRecipientSelection(selectedMemberIds, currentAccountId, eligibleMemberIds)
    );
  }, [currentAccountId, eligibleMemberIds, selectedMemberIds]);

  const handleToggle = (memberId: string) => {
    if (isPending) {
      return;
    }
    setSelectedIds((current) => {
      const nextIds = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      const normalizedNextIds = resolveRecipientSelection(
        nextIds,
        currentAccountId,
        eligibleMemberIds
      );
      void Promise.resolve(onSubmit(normalizedNextIds)).catch(() => {
        setSelectedIds(current);
      });
      return normalizedNextIds;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className={`${appPillActionClass} shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-60`}
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
                ? "Можно выбрать сразу несколько получателей. Хотя бы один должен остаться."
                : "Choose several recipients. At least one recipient must remain selected."}
            </p>
          </div>

          <div className="soft-choice-list mt-4">
            {familyMembers.map((member) => {
              const selected = selectedIds.includes(member.id);
              const memberLabel = getAccountDisplayLabel(member);
              const memberMeta = getAccountSecondaryLabel(member);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggle(member.id)}
                  disabled={isPending}
                  className={[
                    "soft-choice-row",
                    selected ? "soft-choice-row-active" : "",
                    isPending ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  <span className="grid min-w-0 gap-0.5 text-left">
                    <span className="min-w-0 truncate whitespace-nowrap text-sm font-semibold tracking-[-0.02em] text-foreground">
                      {memberLabel}
                    </span>
                    <span className="min-w-0 truncate whitespace-nowrap text-[0.81rem] leading-5 text-muted">
                      {memberMeta}
                    </span>
                  </span>
                  <span className="soft-choice-check">{selected ? "✓" : null}</span>
                </button>
              );
            })}
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}
