import { useEffect, useMemo, useRef, useState } from "react";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import type { Family, FamilyMember } from "@shared/types/api";
import {
  runOptimisticRecipientSelectionUpdate,
  toggleNormalizedRecipientSelection,
} from "@shared/utils/optimisticRecipientSelection";
import { resolveRecipientSelection } from "@shared/utils/recipientSelection";
import { tFamily } from "../family/copy";
import { cabinetActionSecondaryClass, cabinetPanelClass } from "./styles";

export function CabinetPushRecipientsCard({
  language,
  family,
  familyMembers,
  currentAccountId,
  isPending,
  isOffline = false,
  onNetworkRequired,
  onChangeSelection,
}: {
  language: "ru" | "en";
  family: Family;
  familyMembers: FamilyMember[];
  currentAccountId: string | null;
  isPending: boolean;
  isOffline?: boolean;
  onNetworkRequired?: () => void;
  onChangeSelection: (memberIds: string[]) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);
  const eligibleMemberIds = useMemo(
    () => familyMembers.map((member) => member.id),
    [familyMembers]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    resolveRecipientSelection(family.cabinetMemberAccountIds, currentAccountId, eligibleMemberIds)
  );
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const isBusy = isPending || isSubmittingSelection;

  useEffect(() => {
    if (isBusy) {
      return;
    }
    setSelectedIds(
      resolveRecipientSelection(family.cabinetMemberAccountIds, currentAccountId, eligibleMemberIds)
    );
  }, [currentAccountId, eligibleMemberIds, family.cabinetMemberAccountIds, isBusy]);

  const handleToggle = async (memberId: string) => {
    if (isBusy) {
      return;
    }
    const previousIds = selectedIdsRef.current;
    const normalizedNextIds = toggleNormalizedRecipientSelection(memberId, previousIds, (nextIds) =>
      resolveRecipientSelection(nextIds, currentAccountId, eligibleMemberIds)
    );
    await runOptimisticRecipientSelectionUpdate({
      previousIds,
      nextIds: normalizedNextIds,
      applySelection: (ids) => {
        setSelectedIds(ids);
        selectedIdsRef.current = ids;
      },
      setSubmitting: setIsSubmittingSelection,
      submitSelection: onChangeSelection,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isOffline) {
            onNetworkRequired?.();
            return;
          }
          setIsOpen(true);
        }}
        disabled={isBusy}
        aria-disabled={isOffline}
        className={`${cabinetActionSecondaryClass} shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-60 ${isOffline ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {language === "ru" ? "Уведомления" : "Reminders"}
      </button>

      <OverlayDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={
          language === "ru"
            ? "Закрыть выбор получателей push по аптечке"
            : "Close cabinet push recipients"
        }
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
              {language === "ru"
                ? "Кому приходят push по аптечке"
                : "Who gets cabinet push reminders"}
            </h2>
            <p className="text-sm leading-5 text-muted">
              {language === "ru"
                ? "Этим получателям будут приходить push о сроках и просрочке упаковок. В списке только те, у кого открыт доступ к аптечке."
                : "These recipients receive push reminders about expiry dates and expired packs. Only members with cabinet access are shown here."}
            </p>
          </div>

          <div
            className={`${cabinetPanelClass} mt-4 max-h-[min(23rem,58vh)] overflow-y-auto p-2.5`}
          >
            <div className="space-y-2">
              {familyMembers.map((member) => {
                const selected = selectedIds.includes(member.id);
                const isCurrentAccount = Boolean(currentAccountId && member.id === currentAccountId);
                const label =
                  member.displayName ||
                  (isCurrentAccount
                    ? tFamily(language, "yourProfileTitle")
                    : tFamily(language, "noName"));
                const meta = member.relationshipLabel || tFamily(language, "member");
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      void handleToggle(member.id);
                    }}
                    disabled={isBusy}
                    className={[
                      "soft-choice-row w-full",
                      selected ? "soft-choice-row-active" : "",
                      isBusy ? "cursor-not-allowed opacity-60" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="grid min-w-0 gap-0.5 text-left">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
                          {label}
                        </span>
                        {isCurrentAccount ? (
                          <span className="soft-pill inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold leading-none text-foreground">
                            {tFamily(language, "yourProfileTitle")}
                          </span>
                        ) : null}
                      </span>
                      <span className="min-w-0 truncate whitespace-nowrap text-[0.81rem] leading-5 text-muted">
                        {meta}
                      </span>
                    </span>
                    <span className="soft-choice-check">{selected ? "✓" : null}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}
