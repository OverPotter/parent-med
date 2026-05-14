import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import {
  fetchMobileCabinetFamily,
  updateMobileCabinetRecipients,
} from "../api/cabinetRecipientsApi";
import { filterEligibleCabinetRecipientIds } from "../model/medicineCabinetOverviewModel";

export function useCabinetRecipientsController({
  authSession,
  familyMembers,
}: {
  authSession: MobileAuthSession | null;
  familyMembers: MobileFamilyMember[];
}) {
  const [isRecipientsSheetOpen, setIsRecipientsSheetOpen] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isSavingRecipients, setIsSavingRecipients] = useState(false);
  const [ownerAccountId, setOwnerAccountId] = useState<string | null>(
    authSession?.family.ownerAccountId ?? null,
  );
  const recipientsMutationCountRef = useRef(0);
  const currentAccountId = authSession?.account.id ?? "";

  const eligibleFamilyMembers = useMemo(
    () =>
      familyMembers.filter((member) => member.accessPolicy.cabinetAccess !== "none"),
    [familyMembers],
  );
  const eligibleRecipientIds = useMemo(
    () => eligibleFamilyMembers.map((member) => member.id),
    [eligibleFamilyMembers],
  );

  const resolveCabinetRecipientSelection = useCallback(
    (selectedIds: string[] | null | undefined) =>
      filterEligibleCabinetRecipientIds(selectedIds, eligibleRecipientIds),
    [eligibleRecipientIds],
  );

  useEffect(() => {
    if (!authSession) {
      return;
    }
    const session = authSession;
    const mutationCountAtLoadStart = recipientsMutationCountRef.current;
    let cancelled = false;

    async function loadCabinetFamily() {
      try {
        const family = await fetchMobileCabinetFamily(session);
        if (cancelled) {
          return;
        }
        setOwnerAccountId(family.ownerAccountId);
        if (recipientsMutationCountRef.current === mutationCountAtLoadStart) {
          setSelectedRecipientIds(
            resolveCabinetRecipientSelection(family.cabinetMemberAccountIds),
          );
        }
      } catch {
        if (
          !cancelled &&
          recipientsMutationCountRef.current === mutationCountAtLoadStart
        ) {
          setSelectedRecipientIds(resolveCabinetRecipientSelection([]));
        }
      }
    }

    void loadCabinetFamily();
    return () => {
      cancelled = true;
    };
  }, [authSession, currentAccountId, resolveCabinetRecipientSelection]);

  const canManageRecipients =
    !!ownerAccountId && !!currentAccountId && ownerAccountId === currentAccountId;

  const selectedRecipientLabels = eligibleFamilyMembers
    .filter((member) => selectedRecipientIds.includes(member.id))
    .map((member) => member.displayName);
  const recipientsSummary = selectedRecipientLabels.length
    ? selectedRecipientLabels.join(", ")
    : "никто";

  const handleOpenRecipients = () => {
    if (!canManageRecipients) {
      return;
    }
    setIsRecipientsSheetOpen(true);
  };

  const handleToggleRecipient = (memberId: string) => {
    if (!authSession || isSavingRecipients) {
      return;
    }

    recipientsMutationCountRef.current += 1;
    const previousIds = selectedRecipientIds;
    const candidateIds = selectedRecipientIds.includes(memberId)
      ? selectedRecipientIds.filter((id) => id !== memberId)
      : [...selectedRecipientIds, memberId];
    const resolvedCandidateIds = resolveCabinetRecipientSelection(candidateIds);

    setSelectedRecipientIds(resolvedCandidateIds);
    setIsSavingRecipients(true);

    void updateMobileCabinetRecipients({
      accessToken: authSession.accessToken,
      memberAccountIds: resolvedCandidateIds,
    })
      .then((family) => {
        const resolved = resolveCabinetRecipientSelection(
          family.cabinetMemberAccountIds,
        );
        setOwnerAccountId(family.ownerAccountId);
        setSelectedRecipientIds(resolved);
      })
      .catch(() => {
        setSelectedRecipientIds(previousIds);
      })
      .finally(() => {
        setIsSavingRecipients(false);
      });
  };

  return {
    isRecipientsSheetOpen,
    setIsRecipientsSheetOpen,
    selectedRecipientIds,
    isSavingRecipients,
    currentAccountId,
    eligibleFamilyMembers,
    recipientsSummary,
    canManageRecipients,
    handleOpenRecipients,
    handleToggleRecipient,
  };
}
