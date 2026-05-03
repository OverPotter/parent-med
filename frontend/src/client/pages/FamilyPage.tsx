import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchFamilies, fetchMyFamilyAccess } from "@shared/api/families";
import { hasNetworkUnavailableError } from "@shared/api/network";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { ModuleOfflineState } from "@shared/components/ModuleOfflineState";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface } from "@shared/components/Surface";
import { useIsOffline } from "@shared/hooks/useIsOffline";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import {
  FAMILY_ACCESS_REFRESH_MS,
  familyAccessQueryOptions,
} from "@shared/hooks/useFamilyAccessQueryOptions";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import { normalizeFamilyAccessPolicy } from "@shared/familyAccess/policy";
import { SubscriptionUpgradeDialog } from "@client/subscription/SubscriptionUpgradeDialog";
import { useSubscriptionUpgradeDialogState } from "@client/subscription/useSubscriptionUpgradeDialogState";
import { useUpgradeDialogOpenState } from "@client/subscription/useUpgradeDialogOpenState";
import { FamilyInviteSection } from "./family/FamilyInviteSection";
import { runCreateInviteFlow } from "./family/inviteActions";
import { FamilyLeaveSection } from "./family/FamilyLeaveSection";
import { FamilyNameSection } from "./family/FamilyNameSection";
import { MemberCard } from "./family/MemberCard";
import {
  canLeaveCurrentFamily,
  canManageFamilyMembers,
  isFamilyOwnerAccount,
} from "./family/memberManagement";
import { otherMembersCountLabel, tFamily } from "./family/copy";
import { useFamilyMembersData } from "./family/useFamilyMembersData";
import { useFamilyPageMutations } from "./family/useFamilyPageMutations";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[0.8rem] w-[0.8rem] fill-none stroke-current">
      <path
        d="M13.9 3.6a1.6 1.6 0 0 1 2.3 0l.2.2a1.6 1.6 0 0 1 0 2.3l-8.1 8.1-3.1.8.8-3.1 7.9-8.3Z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.7 4.8 15.2 7.3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FamilyPage() {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [familyName, setFamilyName] = useState("");
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isInviteSharePending, setIsInviteSharePending] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const { isUpgradeDialogOpen, setIsUpgradeDialogOpen, openUpgradeDialog } =
    useUpgradeDialogOpenState();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountFamilyContext = useAppStore((s) => s.setAccountFamilyContext);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const setAuthState = useAppStore((s) => s.setAuthState);
  const isIosShell = useIsIosShell();
  const isOffline = useIsOffline();
  const familiesLiveQueryOptions = useLiveQueryOptions(FAMILY_ACCESS_REFRESH_MS);
  const {
    data: families = [],
    isLoading: isFamilyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
    ...familiesLiveQueryOptions,
  });
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    ...familyAccessQueryOptions,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const {
    upgradeToPlus,
    restorePurchases,
    isUpgradePending,
    upgradeErrorMessage,
    clearUpgradeError,
    restoreSuccessMessage,
  } = useSubscriptionUpgradeDialogState({
    language,
    accountId,
    currentFamilyId,
    canManageSubscription,
    subscriptionStatus: familyAccess?.subscriptionStatus ?? "inactive",
  });
  const [isLeaveFamilyConfirmOpen, setIsLeaveFamilyConfirmOpen] = useState(false);

  const { isMembersLoading, membersError, currentMember, otherMembers, adminsCount } =
    useFamilyMembersData(currentFamilyId, currentAccountId);

  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
  const showOfflineState = isOffline || hasNetworkUnavailableError([familyError, membersError]);
  const isFamilyOwner = isFamilyOwnerAccount({
    familyOwnerAccountId: family?.ownerAccountId,
    currentAccountId,
  });
  const canManageFamily = canManageFamilyMembers({
    familyOwnerAccountId: family?.ownerAccountId,
    currentAccountId,
    currentAccountRole,
  });
  const currentMemberPolicy = normalizeFamilyAccessPolicy(currentMember?.accessPolicy);
  const currentMemberHasAnyFamilyAccess =
    currentMemberPolicy.allChildren ||
    currentMemberPolicy.childIds.length > 0 ||
    currentMemberPolicy.pillboxAccess !== "none" ||
    currentMemberPolicy.cabinetAccess !== "none";
  const familyTitle =
    family?.name?.trim() || currentFamilyName?.trim() || tFamily(language, "title");

  useEffect(() => {
    if (family) {
      setFamilyName(family.name);
      if (family.id !== currentFamilyId || family.name !== currentFamilyName) {
        setCurrentFamily(family);
      }
      return;
    }
    setFamilyName("");
  }, [currentFamilyId, currentFamilyName, family, setCurrentFamily]);

  const {
    updateFamilyMutation,
    createInviteMutation,
    updateMemberMutation,
    deleteMemberMutation,
    updateMemberProfileMutation,
    leaveFamilyMutation,
  } = useFamilyPageMutations({
    language,
    accountId,
    currentFamilyId,
    currentAccountId,
    setCurrentFamily,
    setAuthState,
    setAccountFamilyContext,
    setError,
  });
  const canLeaveFamily = canLeaveCurrentFamily({
    familyOwnerAccountId: family?.ownerAccountId,
    currentAccountId,
    hasCurrentMember: Boolean(currentMember),
  });

  const latestInviteCode = createInviteMutation.data?.token ?? "";
  const shouldOpenCurrentProfileEditor =
    searchParams.get("edit") === "profile" || searchParams.get("edit") === "me";
  const canShareInvite = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const shouldUseDirectNativeInvite = isIosShell && canShareInvite;
  const canInviteMembers = familyAccess?.canInviteMembers ?? false;
  const inviteLockedReason =
    isFamilyOwner && !canInviteMembers ? tFamily(language, "invitesPlusOnly") : null;

  useEffect(() => {
    if (!inviteToast) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setInviteToast(null);
    }, 2600);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inviteToast]);

  if (showOfflineState) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={familyTitle}
          subtitle={tFamily(language, "subtitle")}
          action={
            <Link
              to="/more"
              className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
            >
              {tFamily(language, "moreBack")}
            </Link>
          }
          compactOnMobile
          hideOnMobile
          className="app-safe-top-standalone"
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <Link
              to="/more"
              className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
            >
              {tFamily(language, "moreBack")}
            </Link>
            <h1 className="app-mobile-section-intro__title">{familyTitle}</h1>
            <p className="app-mobile-section-intro__hint">{tFamily(language, "subtitle")}</p>
          </div>
        </div>
        <ModuleOfflineState language={language} />
      </div>
    );
  }

  if (!isFamilyLoading && !family) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={familyTitle}
          subtitle={tFamily(language, "subtitle")}
          action={
            <Link
              to="/more"
              className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
            >
              {tFamily(language, "moreBack")}
            </Link>
          }
          compactOnMobile
          hideOnMobile
          className="app-safe-top-standalone"
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <Link
              to="/more"
              className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
            >
              {tFamily(language, "moreBack")}
            </Link>
            <h1 className="app-mobile-section-intro__title">{familyTitle}</h1>
            <p className="app-mobile-section-intro__hint">{tFamily(language, "subtitle")}</p>
          </div>
        </div>
        <EmptyState className="text-foreground">
          <div className="space-y-3">
            <p className="app-card-title">{tFamily(language, "noFamilyTitle")}</p>
            <p className="text-sm leading-6 text-muted">
              {tFamily(language, "noFamilyDescription")}
            </p>
          </div>
        </EmptyState>
      </div>
    );
  }

  const handleFamilySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = familyName.trim();
    if (!trimmedName || !family || trimmedName === family.name) {
      return;
    }
    updateFamilyMutation.mutate(trimmedName, {
      onSuccess: () => {
        setIsEditingFamilyName(false);
      },
    });
  };

  const handleCopyInvite = async () => {
    if (!latestInviteCode) {
      setError(tFamily(language, "inviteCopyFailed"));
      return;
    }
    try {
      await navigator.clipboard.writeText(latestInviteCode);
      setInviteCopied(true);
      setInviteToast(tFamily(language, "inviteCopied"));
      setError(null);
    } catch {
      setError(tFamily(language, "inviteCopyFailed"));
    }
  };

  const handleShareInvite = async (inviteCode: string) => {
    if (!inviteCode || !canShareInvite) {
      if (!inviteCode) {
        setError(tFamily(language, "inviteShareFailed"));
      }
      return false;
    }

    try {
      setIsInviteSharePending(true);
      await navigator.share({
        title: tFamily(language, "inviteTitle"),
        text: inviteCode,
      });
      setError(null);
      if (shouldUseDirectNativeInvite) {
        setInviteToast(tFamily(language, "inviteShareReady"));
      }
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return false;
      }
      setError(tFamily(language, "inviteShareFailed"));
      return false;
    } finally {
      setIsInviteSharePending(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!canInviteMembers) {
      openUpgradeDialog();
      return;
    }
    try {
      await runCreateInviteFlow({
        canShareInvite,
        createInvite: () => createInviteMutation.mutateAsync(),
        markInviteCopied: setInviteCopied,
        onShareInvite: handleShareInvite,
        setError,
        shareFailedMessage: tFamily(language, "inviteShareFailed"),
      });
    } catch {
      // Ошибка уже обработана в mutation.onError.
    }
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <ConfirmDialog
        isOpen={isLeaveFamilyConfirmOpen}
        title={tFamily(language, "confirmLeaveFamilyTitle")}
        description={tFamily(language, "confirmLeaveFamilyDescription")}
        confirmLabel={tFamily(language, "confirmLeaveFamilyAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={leaveFamilyMutation.isPending}
        onCancel={() => setIsLeaveFamilyConfirmOpen(false)}
        onConfirm={() => {
          leaveFamilyMutation.mutate();
          setIsLeaveFamilyConfirmOpen(false);
        }}
      />
      <PageIntro
        title={familyTitle}
        subtitle={tFamily(language, "subtitle")}
        action={
          <Link
            to="/more"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {tFamily(language, "moreBack")}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/more"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {tFamily(language, "moreBack")}
          </Link>
          <h1 className="app-mobile-section-intro__title">{familyTitle}</h1>
          <p className="app-mobile-section-intro__hint">{tFamily(language, "subtitle")}</p>
        </div>
      </div>

      {error && <p className="soft-note-danger">{error}</p>}
      {inviteToast ? <p className="soft-note-success">{inviteToast}</p> : null}
      {familyError && !showOfflineState && (
        <p className="soft-note-danger">
          {(familyError as { message?: string }).message ?? tFamily(language, "loadFamilyFailed")}
        </p>
      )}
      {membersError && !showOfflineState && (
        <p className="soft-note-danger">
          {(membersError as { message?: string }).message ?? tFamily(language, "loadMembersFailed")}
        </p>
      )}
      {currentMember && !currentMemberHasAnyFamilyAccess ? (
        <p className="soft-note-danger">
          <span className="font-semibold">{tFamily(language, "noFamilyAccessTitle")}. </span>
          {tFamily(language, "currentNoAccessDescription")}
        </p>
      ) : null}
      {!isFamilyLoading && !family ? (
        <EmptyState className="text-foreground">
          <div className="space-y-3">
            <p className="app-card-title">{tFamily(language, "noFamilyTitle")}</p>
            <p className="text-sm leading-6 text-muted">
              {tFamily(language, "noFamilyDescription")}
            </p>
          </div>
        </EmptyState>
      ) : null}

      {family ? (
        <>
          <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
            {isMembersLoading ? (
              <p className="text-sm text-muted">{tFamily(language, "membersLoading")}</p>
            ) : !currentMember ? (
              <p className="text-sm text-muted">{tFamily(language, "noMembers")}</p>
            ) : (
              <MemberCard
                key={currentMember.id}
                member={currentMember}
                familyOwnerAccountId={family?.ownerAccountId}
                isCurrent
                forceEdit={Boolean(shouldOpenCurrentProfileEditor)}
                canManageAccess={false}
                canManageRoles={false}
                canDeleteMember={false}
                canEditProfile={false}
                adminsCount={adminsCount}
                isPending={
                  updateMemberMutation.isPending ||
                  updateMemberProfileMutation.isPending ||
                  deleteMemberMutation.isPending
                }
                headerAction={
                  <button
                    type="button"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set("edit", "me");
                      setSearchParams(next, { replace: true });
                    }}
                    aria-label={tFamily(language, "editProfile")}
                    title={tFamily(language, "editProfile")}
                    className="soft-pill inline-flex shrink-0 items-center justify-center rounded-full px-3.25 py-[0.44rem] text-[0.8rem]"
                  >
                    <PencilIcon />
                  </button>
                }
                onPromote={() => {}}
                onDemote={() => {}}
                accessHref={`/family/members/${currentMember.id}/access`}
                onDelete={() => deleteMemberMutation.mutate(currentMember.id)}
                onSaveProfile={async (payload) => {
                  try {
                    await updateMemberProfileMutation.mutateAsync({
                      memberAccountId: currentMember.id,
                      displayName: payload.displayName,
                      relationshipLabel: payload.relationshipLabel,
                      phone: payload.phone,
                    });
                    return true;
                  } catch {
                    return false;
                  }
                }}
                onHideForcedEdit={() => {
                  if (!shouldOpenCurrentProfileEditor) {
                    return;
                  }
                  const next = new URLSearchParams(searchParams);
                  next.delete("edit");
                  setSearchParams(next, { replace: true });
                }}
                language={language}
              />
            )}
          </RowSurface>

          <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="app-card-title">{tFamily(language, "otherMembersTitle")}</h2>
              <Link
                to="/family/members"
                className="soft-pill-primary inline-flex min-h-[2.2rem] shrink-0 items-center px-3 text-[0.78rem] font-semibold"
              >
                {tFamily(language, "openAllMembers")}
              </Link>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">
              {tFamily(language, "otherMembersDescription")}
            </p>

            {isMembersLoading ? (
              <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
            ) : otherMembers.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{tFamily(language, "noOtherMembers")}</p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                {otherMembersCountLabel(language, otherMembers.length)}
              </p>
            )}
          </RowSurface>

          {isFamilyOwner ? (
            <FamilyInviteSection
              language={language}
              isPending={createInviteMutation.isPending}
              isInviteSharePending={isInviteSharePending}
              canShareInvite={canShareInvite}
              inviteLocked={!canInviteMembers}
              inviteLockedReason={inviteLockedReason}
              inviteCopied={inviteCopied}
              latestInviteCode={latestInviteCode}
              inviteExpiresAt={createInviteMutation.data?.expiresAt}
              onCreateInvite={() => {
                void handleCreateInvite();
              }}
              onLockedInviteAttempt={openUpgradeDialog}
              onShareInvite={() => {
                void handleShareInvite(latestInviteCode);
              }}
              onCopyInvite={handleCopyInvite}
            />
          ) : null}

          <FamilyNameSection
            language={language}
            familyName={familyName}
            currentFamilyName={family?.name}
            canManageFamily={canManageFamily}
            isEditing={isEditingFamilyName}
            isFamilyLoading={isFamilyLoading}
            isPending={updateFamilyMutation.isPending}
            onFamilyNameChange={setFamilyName}
            onToggleEditing={() => {
              if (isEditingFamilyName) {
                setFamilyName(family?.name ?? "");
              }
              setIsEditingFamilyName((current) => !current);
            }}
            onCancel={() => {
              setFamilyName(family?.name ?? "");
              setIsEditingFamilyName(false);
            }}
            onSubmit={handleFamilySubmit}
          />
          {canLeaveFamily ? (
            <FamilyLeaveSection
              language={language}
              onLeave={() => setIsLeaveFamilyConfirmOpen(true)}
            />
          ) : null}
          <SubscriptionUpgradeDialog
            isOpen={isUpgradeDialogOpen}
            setIsOpen={setIsUpgradeDialogOpen}
            language={language}
            entryPoint="invite_family"
            canManageSubscription={canManageSubscription}
            subscriptionStatus={familyAccess?.subscriptionStatus ?? "inactive"}
            isUpgradePending={isUpgradePending}
            upgradeErrorMessage={upgradeErrorMessage}
            restoreSuccessMessage={restoreSuccessMessage}
            clearUpgradeError={clearUpgradeError}
            upgradeToPlus={upgradeToPlus}
            restorePurchases={restorePurchases}
          />
        </>
      ) : null}
    </div>
  );
}
