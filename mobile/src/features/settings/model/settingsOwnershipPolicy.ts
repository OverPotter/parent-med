import type { MobileAuthSession } from "../../auth/api/authApi";
import type {
  MobileFamilyAccessSummary,
  MobileFamilySettingsSummary,
} from "../api/settingsApi";
import {
  isDeletionBlocked,
  type SettingsScreenContent,
} from "./settingsScreen";

export type SettingsOwnershipPolicy = {
  isFamilyOwner: boolean;
  hasOtherAdultMembers: boolean;
  showDeleteFamilyAction: boolean;
  usesFamilyDeleteEndpoint: boolean;
  showSubscriptionManagement: boolean;
  deletionBlocked: boolean;
  deleteLabel: string;
  deleteHint: string;
  blockedDeleteTitle: string;
  blockedDeleteMessage: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
};

type ResolveSettingsOwnershipPolicyInput = {
  content: SettingsScreenContent;
  session: MobileAuthSession | null;
  familySummary: MobileFamilySettingsSummary;
  familyAccess: MobileFamilyAccessSummary;
};

function resolveOwnerAccountId(
  session: MobileAuthSession | null,
  familySummary: MobileFamilySettingsSummary,
) {
  if (familySummary.ownerAccountId) {
    return familySummary.ownerAccountId;
  }

  return session?.family.ownerAccountId ?? null;
}

export function resolveSettingsOwnershipPolicy({
  content,
  session,
  familySummary,
  familyAccess,
}: ResolveSettingsOwnershipPolicyInput): SettingsOwnershipPolicy {
  const ownerAccountId = resolveOwnerAccountId(session, familySummary);
  const isFamilyOwner =
    ownerAccountId != null &&
    session != null &&
    ownerAccountId === session.account.id;
  const hasOtherAdultMembers = familyAccess.currentAdultsCount > 1;
  const showDeleteFamilyAction = isFamilyOwner && hasOtherAdultMembers;
  const usesFamilyDeleteEndpoint = isFamilyOwner;
  const showSubscriptionManagement = isFamilyOwner;
  const deletionBlocked = isDeletionBlocked(
    familyAccess.canManageSubscription,
    familyAccess.subscriptionStatus,
  );

  return {
    isFamilyOwner,
    hasOtherAdultMembers,
    showDeleteFamilyAction,
    usesFamilyDeleteEndpoint,
    showSubscriptionManagement,
    deletionBlocked,
    deleteLabel: showDeleteFamilyAction
      ? content.deleteFamilyLabel
      : content.deleteAccountLabel,
    deleteHint: deletionBlocked
      ? showDeleteFamilyAction
        ? content.deleteFamilyBlockedHint
        : content.deleteAccountBlockedHint
      : showDeleteFamilyAction
        ? content.deleteFamilyHint
        : content.deleteAccountHint,
    blockedDeleteTitle: showDeleteFamilyAction
      ? content.deleteFamilyLabel
      : content.deleteAccountLabel,
    blockedDeleteMessage: showDeleteFamilyAction
      ? content.deleteFamilyBlockedHint
      : content.deleteAccountBlockedHint,
    confirmDeleteTitle: showDeleteFamilyAction
      ? content.confirmDeleteOwnerTitle
      : content.confirmDeleteMemberTitle,
    confirmDeleteMessage: showDeleteFamilyAction
      ? content.confirmDeleteOwnerMessage
      : content.confirmDeleteMemberMessage,
  };
}
