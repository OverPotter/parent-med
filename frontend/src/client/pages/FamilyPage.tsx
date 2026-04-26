import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchFamilies, fetchMyFamilyAccess } from "@shared/api/families";
import {
  acceptLatestDevFamilyInvite,
  fetchLatestDevFamilyInvitePreview,
} from "@shared/api/familyInvites";
import { applySessionToClient } from "@shared/api/client";
import { hasNetworkUnavailableError } from "@shared/api/network";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { ModuleOfflineState } from "@shared/components/ModuleOfflineState";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface } from "@shared/components/Surface";
import { useIsOffline } from "@shared/hooks/useIsOffline";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import { normalizeFamilyAccessPolicy } from "@shared/familyAccess/policy";
import { buildShareableInviteUrl } from "@shared/config/inviteLinks";
import { UpgradeDialog } from "@client/subscription/UpgradeDialog";
import { useSubscriptionUpgrade } from "@client/subscription/useSubscriptionUpgrade";
import { FamilyInviteSection } from "./family/FamilyInviteSection";
import { FamilyLeaveSection } from "./family/FamilyLeaveSection";
import { FamilyNameSection } from "./family/FamilyNameSection";
import { MemberCard } from "./family/MemberCard";
import { canLeaveCurrentFamily, canManageFamilyMembers, isFamilyOwnerAccount } from "./family/memberManagement";
import { tFamily } from "./family/copy";
import { useFamilyMembersData } from "./family/useFamilyMembersData";
import { useFamilyPageMutations } from "./family/useFamilyPageMutations";

export function FamilyPage() {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [familyName, setFamilyName] = useState("");
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isInviteSharePending, setIsInviteSharePending] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
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
  const showDevInviteShortcut =
    import.meta.env.DEV || import.meta.env.MODE === "mobile-dev";
  const {
    data: families = [],
    isLoading: isFamilyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
  });
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    ...familyAccessQueryOptions,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const { upgradeToPlus, isUpgradePending } = useSubscriptionUpgrade(
    accountId,
    currentFamilyId,
    canManageSubscription
  );
  const [isLeaveFamilyConfirmOpen, setIsLeaveFamilyConfirmOpen] = useState(false);

  const { isMembersLoading, membersError, currentMember, otherMembers, adminsCount } =
    useFamilyMembersData(currentFamilyId, currentAccountId);

  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
  const showOfflineState =
    isOffline || hasNetworkUnavailableError([familyError, membersError]);
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

  const latestInviteUrl = createInviteMutation.data
    ? buildShareableInviteUrl(createInviteMutation.data.invitePath, window.location.origin)
    : "";
  const shouldOpenCurrentProfileEditor =
    searchParams.get("edit") === "profile" || searchParams.get("edit") === "me";
  const canShareInvite = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const shouldUseDirectNativeInvite = isIosShell && canShareInvite;
  const canInviteMembers = familyAccess?.canInviteMembers ?? false;
  const inviteLockedReason =
    isFamilyOwner && !canInviteMembers
      ? language === "ru"
        ? "Приглашения доступны в Plus."
        : "Invites are available in Plus."
      : null;

  const inviteShareText =
    language === "ru"
      ? `Присоединяйся к нашей семье в приложении ${familyTitle}. Открой приглашение:`
      : `Join our family in the ${familyTitle} app. Open this invite:`;
  const { data: latestDevInvitePreview } = useQuery({
    queryKey: ["family-invites", "dev", "latest"],
    queryFn: fetchLatestDevFamilyInvitePreview,
    enabled: Boolean(accountId && showDevInviteShortcut),
    retry: false,
  });
  const acceptLatestDevInviteMutation = useMutation({
    mutationFn: () => acceptLatestDevFamilyInvite(),
    onSuccess: (data) => {
      applySessionToClient(data);
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      setError(null);
      navigate("/family", { replace: true });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось подключиться к dev-приглашению.");
    },
  });

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
              {language === "ru" ? "← Ещё" : "← More"}
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
              {language === "ru" ? "← Ещё" : "← More"}
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
              {language === "ru" ? "← Ещё" : "← More"}
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
              {language === "ru" ? "← Ещё" : "← More"}
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
    if (!latestInviteUrl) {
      setError(tFamily(language, "inviteCopyFailed"));
      return;
    }
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setInviteCopied(true);
      setInviteToast(tFamily(language, "inviteCopied"));
      setError(null);
    } catch {
      setError(tFamily(language, "inviteCopyFailed"));
    }
  };

  const handleShareInvite = async (inviteUrl: string) => {
    if (!inviteUrl || !canShareInvite) {
      if (!inviteUrl) {
        setError(tFamily(language, "inviteShareFailed"));
      }
      return false;
    }

    try {
      setIsInviteSharePending(true);
      await navigator.share({
        title: tFamily(language, "inviteTitle"),
        text: inviteShareText,
        url: inviteUrl,
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
      setIsUpgradeDialogOpen(true);
      return;
    }
    try {
      if (shouldUseDirectNativeInvite && latestInviteUrl) {
        await handleShareInvite(latestInviteUrl);
        return;
      }

      const invite = await createInviteMutation.mutateAsync();
      setInviteCopied(false);
      const inviteUrl = buildShareableInviteUrl(invite.invitePath, window.location.origin);
      if (shouldUseDirectNativeInvite) {
        if (!inviteUrl) {
          setError(tFamily(language, "inviteShareFailed"));
        }
        return;
      }

      if (canShareInvite && inviteUrl) {
        await handleShareInvite(inviteUrl);
      }
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
            {language === "ru" ? "← Ещё" : "← More"}
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
            {language === "ru" ? "← Ещё" : "← More"}
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
          {language === "ru"
            ? "Сейчас у вас нет доступа к данным семьи. Обратитесь к владельцу семьи или администратору."
            : "You currently do not have access to family data. Contact the family owner or an admin."}
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-card-title">{tFamily(language, "yourProfileTitle")}</h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {currentMember ? (
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set("edit", "me");
                  setSearchParams(next, { replace: true });
                }}
                className="soft-pill-primary inline-flex min-h-[2.2rem] shrink-0 items-center px-3 text-[0.78rem] font-semibold"
              >
                {tFamily(language, "editProfile")}
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted">
          {tFamily(language, "yourProfileDescription")}
        </p>

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : !currentMember ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noMembers")}</p>
        ) : (
          <div className="mt-4">
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
          </div>
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
            {language === "ru"
              ? `В семье ещё ${otherMembers.length} ${otherMembers.length === 1 ? "участник" : "участника"}.`
              : `${otherMembers.length} more member${otherMembers.length === 1 ? "" : "s"} in the family.`}
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
          latestInviteUrl={latestInviteUrl}
          inviteExpiresAt={createInviteMutation.data?.expiresAt}
          onCreateInvite={() => {
            void handleCreateInvite();
          }}
          onLockedInviteAttempt={() => setIsUpgradeDialogOpen(true)}
          onShareInvite={() => {
            void handleShareInvite(latestInviteUrl);
          }}
          onCopyInvite={handleCopyInvite}
        />
      ) : null}

      {showDevInviteShortcut ? (
        <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="app-card-title">
            {language === "ru" ? "Dev: последнее приглашение" : "Dev: latest invite"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {latestDevInvitePreview
              ? language === "ru"
                ? `Быстрое подключение к семье «${latestDevInvitePreview.familyName}» без копирования ссылки.`
                : `Quickly join "${latestDevInvitePreview.familyName}" without copying a link.`
              : language === "ru"
                ? "Если owner уже создал приглашение на другом симуляторе, можно подключиться без ссылки."
                : "If the owner already created an invite on another simulator, you can join without a link."}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => acceptLatestDevInviteMutation.mutate()}
              disabled={acceptLatestDevInviteMutation.isPending}
              className="soft-button-secondary disabled:opacity-50"
            >
              {acceptLatestDevInviteMutation.isPending
                ? language === "ru"
                  ? "Подключаем…"
                  : "Joining…"
                : language === "ru"
                  ? "Подключиться к последнему invite"
                  : "Join latest invite"}
            </button>
          </div>
        </RowSurface>
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
      <UpgradeDialog
        isOpen={isUpgradeDialogOpen}
        language={language}
        entryPoint="invite_family"
        isPending={isUpgradePending}
        canUpgrade={canManageSubscription}
        onClose={() => setIsUpgradeDialogOpen(false)}
        onUpgrade={() => {
          void upgradeToPlus().then(() => {
            setIsUpgradeDialogOpen(false);
          });
        }}
      />
        </>
      ) : null}
    </div>
  );
}
