import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchFamilies } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface } from "@shared/components/Surface";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { normalizeFamilyAccessPolicy } from "@shared/familyAccess/policy";
import { SectionTitle } from "./child-illness/shared";
import { FamilyInviteSection } from "./family/FamilyInviteSection";
import { FamilyNameSection } from "./family/FamilyNameSection";
import { MemberCard } from "./family/MemberCard";
import { roleLabel, tFamily } from "./family/copy";
import { useFamilyMembersData } from "./family/useFamilyMembersData";
import { useFamilyPageMutations } from "./family/useFamilyPageMutations";

export function FamilyPage() {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [familyName, setFamilyName] = useState("");
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isInviteSharePending, setIsInviteSharePending] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountEmail = useAppStore((s) => s.setAccountEmail);
  const setAccountFamilyContext = useAppStore((s) => s.setAccountFamilyContext);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const isIosShell = useIsIosShell();
  const canManageFamily = currentAccountRole === "admin";

  const {
    data: families = [],
    isLoading: isFamilyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
  });

  const { members, isMembersLoading, membersError, currentMember, otherMembers, adminsCount } =
    useFamilyMembersData(currentFamilyId, currentAccountId);

  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
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
    updateMyProfileMutation,
  } = useFamilyPageMutations({
    language,
    accountId,
    currentFamilyId,
    currentAccountId,
    setCurrentFamily,
    setAccountEmail,
    setAccountFamilyContext,
    setError,
  });

  const latestInviteUrl = createInviteMutation.data
    ? `${window.location.origin}${createInviteMutation.data.invitePath}`
    : "";
  const shouldOpenCurrentProfileEditor =
    searchParams.get("edit") === "profile" || searchParams.get("edit") === "me";
  const canShareInvite = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const shouldUseDirectNativeInvite = isIosShell && canShareInvite;

  const inviteShareText =
    language === "ru"
      ? `Присоединяйся к нашей семье в приложении ${familyTitle}. Открой приглашение:`
      : `Join our family in the ${familyTitle} app. Open this invite:`;

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
    try {
      if (shouldUseDirectNativeInvite && latestInviteUrl) {
        await handleShareInvite(latestInviteUrl);
        return;
      }

      const invite = await createInviteMutation.mutateAsync();
      setInviteCopied(false);
      const inviteUrl = `${window.location.origin}${invite.invitePath}`;
      if (shouldUseDirectNativeInvite) {
        return;
      }

      if (canShareInvite) {
        await handleShareInvite(inviteUrl);
      }
    } catch {
      // Ошибка уже обработана в mutation.onError.
    }
  };

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

      {error && <p className="soft-note-danger">{error}</p>}
      {inviteToast ? <p className="soft-note-success">{inviteToast}</p> : null}
      {familyError && (
        <p className="soft-note-danger">
          {(familyError as { message?: string }).message ?? tFamily(language, "loadFamilyFailed")}
        </p>
      )}
      {membersError && (
        <p className="soft-note-danger">
          {(membersError as { message?: string }).message ?? tFamily(language, "loadMembersFailed")}
        </p>
      )}
      {currentMember && !currentMemberHasAnyFamilyAccess ? (
        <p className="soft-note-danger">
          <span className="font-semibold">{tFamily(language, "noFamilyAccessTitle")}. </span>
          {language === "ru"
            ? "Сейчас у вас нет доступа к данным семьи. Обратитесь к администратору семьи."
            : "You currently do not have access to family data. Contact your family admin."}
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
        <SectionTitle
          title={tFamily(language, "yourProfileTitle")}
          subtitle={tFamily(language, "yourProfileDescription")}
          action={
            <span className="text-sm font-semibold text-muted">
              {members.length} {tFamily(language, "peopleShort")}
            </span>
          }
        />

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : !currentMember ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noMembers")}</p>
        ) : (
          <div className="mt-4">
            <MemberCard
              key={currentMember.id}
              member={currentMember}
              isCurrent
              forceEdit={Boolean(shouldOpenCurrentProfileEditor)}
              canManageAccess={canManageFamily}
              canEditProfile
              adminsCount={adminsCount}
              isPending={
                updateMemberMutation.isPending ||
                updateMemberProfileMutation.isPending ||
                updateMyProfileMutation.isPending ||
                deleteMemberMutation.isPending
              }
              onPromote={() =>
                updateMemberMutation.mutate({
                  memberAccountId: currentMember.id,
                  payload: { family_role: "admin" },
                })
              }
              onDemote={() =>
                updateMemberMutation.mutate({
                  memberAccountId: currentMember.id,
                  payload: { family_role: "member" },
                })
              }
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
                  if (payload.email !== undefined) {
                    await updateMyProfileMutation.mutateAsync({ email: payload.email });
                  }
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
        <SectionTitle
          title={tFamily(language, "otherMembersTitle")}
          subtitle={tFamily(language, "otherMembersDescription")}
          action={
            otherMembers.length > 0 ? (
              <Link
                to="/family/members"
                className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
              >
                {tFamily(language, "openAllMembers")}
              </Link>
            ) : null
          }
        />

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : otherMembers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noOtherMembers")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {otherMembers.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="rounded-[22px] border border-border/60 bg-[color:color-mix(in_srgb,var(--color-background)_88%,white_12%)] px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                    {member.displayName || member.login || tFamily(language, "noName")}
                  </p>
                  <p className="mt-1 text-[0.82rem] leading-5 text-muted">
                    {member.relationshipLabel || roleLabel(member.familyRole, language)}
                  </p>
                </div>
                <Link
                  to="/family/members"
                  className="inline-flex min-h-[2.1rem] shrink-0 items-center text-[0.82rem] font-semibold text-primary"
                >
                  {tFamily(language, "openAllMembers")}
                </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </RowSurface>

      {canManageFamily ? (
        <FamilyInviteSection
          language={language}
          isPending={createInviteMutation.isPending}
          isInviteSharePending={isInviteSharePending}
          canShareInvite={canShareInvite}
          inviteCopied={inviteCopied}
          latestInviteUrl={latestInviteUrl}
          inviteExpiresAt={createInviteMutation.data?.expiresAt}
          onCreateInvite={() => {
            void handleCreateInvite();
          }}
          onShareInvite={() => {
            void handleShareInvite(latestInviteUrl);
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
        </>
      ) : null}
    </div>
  );
}
