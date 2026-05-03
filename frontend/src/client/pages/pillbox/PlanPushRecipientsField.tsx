import { useEffect, useMemo, useRef, useState } from "react";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { AppLanguage } from "@shared/i18n";
import { getAccountDisplayLabel } from "@shared/utils/accountLabels";
import { resolveRecipientSelection } from "@shared/utils/recipientSelection";
import {
  runOptimisticRecipientSelectionUpdate,
  toggleNormalizedRecipientSelection,
} from "@shared/utils/optimisticRecipientSelection";
import { tFamily } from "../family/copy";
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
  onOpen,
  isPending = false,
  buttonLabel,
}: {
  language: AppLanguage;
  familyMembers: FamilyMemberLike[];
  currentAccountId: string | null;
  selectedMemberIds: string[];
  onSubmit: (memberIds: string[]) => void | Promise<void>;
  onOpen?: () => void | Promise<void>;
  isPending?: boolean;
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);
  const eligibleMemberIds = useMemo(
    () => familyMembers.map((member) => member.id),
    [familyMembers]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    resolveRecipientSelection(selectedMemberIds, currentAccountId, eligibleMemberIds)
  );
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    setSelectedIds(
      resolveRecipientSelection(selectedMemberIds, currentAccountId, eligibleMemberIds)
    );
  }, [currentAccountId, eligibleMemberIds, selectedMemberIds]);

  const isBusy = isPending || isOpening || isSubmittingSelection;

  const handleOpen = async () => {
    if (isBusy) {
      return;
    }
    setIsOpening(true);
    try {
      await onOpen?.();
    } finally {
      setIsOpening(false);
      setIsOpen(true);
    }
  };

  const handleToggle = async (memberId: string) => {
    if (isBusy) {
      return;
    }
    const previousIds = selectedIdsRef.current;
    const normalizedNextIds = toggleNormalizedRecipientSelection(
      memberId,
      previousIds,
      (nextIds) => resolveRecipientSelection(nextIds, currentAccountId, eligibleMemberIds)
    );
    await runOptimisticRecipientSelectionUpdate({
      previousIds,
      nextIds: normalizedNextIds,
      applySelection: (ids) => {
        setSelectedIds(ids);
        selectedIdsRef.current = ids;
      },
      setSubmitting: setIsSubmittingSelection,
      submitSelection: onSubmit,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleOpen();
        }}
        disabled={isBusy}
        className={`${appPillActionClass} shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {buttonLabel ?? (language === "ru" ? "Уведомления" : "Notifications")}
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
              const isCurrentAccount = Boolean(currentAccountId && member.id === currentAccountId);
              const memberMeta = member.relationshipLabel?.trim() || "";
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    void handleToggle(member.id);
                  }}
                  disabled={isBusy}
                  className={[
                    "soft-choice-row",
                    selected ? "soft-choice-row-active" : "",
                    isBusy ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  <span className="grid min-w-0 gap-0.5 text-left">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate whitespace-nowrap text-sm font-semibold tracking-[-0.02em] text-foreground">
                        {memberLabel}
                      </span>
                      {isCurrentAccount ? (
                        <span className="soft-pill inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold leading-none text-foreground">
                          {tFamily(language, "yourProfileTitle")}
                        </span>
                      ) : null}
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
    </>
  );
}
