import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { updateAccountProfile } from "@shared/api/auth";
import {
  deleteFamilyMember,
  fetchFamilies,
  fetchMyFamilyMembers,
  updateFamilyMemberProfile,
  updateFamilyMemberRole,
  updateMyFamily,
} from "@shared/api/families";
import { createFamilyInvite } from "@shared/api/familyInvites";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import {
  SectionTitle,
} from "./child-illness/shared";
import { FamilyInviteSection } from "./family/FamilyInviteSection";
import { FamilyNameSection } from "./family/FamilyNameSection";
import { MemberCard } from "./family/MemberCard";
import { tFamily } from "./family/copy";

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
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const queryClient = useQueryClient();
  const isIosShell = useIsIosShell();

  const {
    data: families = [],
    isLoading: isFamilyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: Boolean(accountId),
  });

  const {
    data: members = [],
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["family-members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(currentFamilyId),
  });

  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;
  const ownersCount = useMemo(
    () => members.filter((member) => member.familyRole === "owner").length,
    [members]
  );

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

  const updateFamilyMutation = useMutation({
    mutationFn: (name: string) => updateMyFamily(name),
    onSuccess: (updatedFamily) => {
      setCurrentFamily(updatedFamily);
      setError(null);
      setIsEditingFamilyName(false);
      queryClient.invalidateQueries({ queryKey: ["families", accountId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "updateFamilyFailed"));
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: () => createFamilyInvite({ family_role: "adult" }),
    onSuccess: () => {
      setInviteCopied(false);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "createInviteFailed"));
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({
      memberAccountId,
      familyRole,
    }: {
      memberAccountId: string;
      familyRole: string;
    }) => updateFamilyMemberRole(memberAccountId, familyRole),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "updateRoleFailed"));
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberAccountId: string) => deleteFamilyMember(memberAccountId),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "deleteMemberFailed"));
    },
  });

  const updateMemberProfileMutation = useMutation({
    mutationFn: ({
      memberAccountId,
      displayName,
      relationshipLabel,
      phone,
    }: {
      memberAccountId: string;
      displayName?: string;
      relationshipLabel?: string | null;
      phone?: string | null;
    }) =>
      updateFamilyMemberProfile(memberAccountId, {
        display_name: displayName,
        relationship_label: relationshipLabel,
        phone,
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "updateProfileFailed"));
    },
  });

  const updateMyProfileMutation = useMutation({
    mutationFn: ({ email }: { email: string | null }) => updateAccountProfile({ email }),
    onSuccess: (account) => {
      setAccountEmail(account.email);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? tFamily(language, "updateProfileFailed"));
    },
  });

  const latestInviteUrl = createInviteMutation.data
    ? `${window.location.origin}${createInviteMutation.data.invitePath}`
    : "";
  const canManageFamily = currentAccountRole === "owner";
  const shouldOpenCurrentProfileEditor =
    searchParams.get("edit") === "profile" || searchParams.get("edit") === "me";
  const familyTitle =
    family?.name?.trim() || currentFamilyName?.trim() || tFamily(language, "title");
  const canShareInvite = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const shouldUseDirectNativeInvite = isIosShell && canShareInvite;

  const inviteShareText =
    language === "ru"
      ? `Присоединяйся к нашей семье в приложении ${familyTitle}. Открой приглашение:`
      : `Join our family in the ${familyTitle} app. Open this invite:`;

  const handleFamilySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = familyName.trim();
    if (!trimmedName || !family || trimmedName === family.name) {
      return;
    }
    updateFamilyMutation.mutate(trimmedName);
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

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle
          title={tFamily(language, "membersTitle")}
          subtitle={tFamily(language, "membersDescription")}
          action={
            <span className="text-sm font-semibold text-muted">
              {members.length} {tFamily(language, "peopleShort")}
            </span>
          }
        />

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noMembers")}</p>
        ) : (
          <div className="mt-4 divide-y divide-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)]">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrent={member.id === currentAccountId}
                forceEdit={Boolean(
                  shouldOpenCurrentProfileEditor && member.id === currentAccountId
                )}
                isOwner={canManageFamily}
                canEditProfile={canManageFamily || member.id === currentAccountId}
                ownersCount={ownersCount}
                isPending={
                  updateMemberRoleMutation.isPending ||
                  updateMemberProfileMutation.isPending ||
                  updateMyProfileMutation.isPending ||
                  deleteMemberMutation.isPending
                }
                onPromote={() =>
                  updateMemberRoleMutation.mutate({
                    memberAccountId: member.id,
                    familyRole: "owner",
                  })
                }
                onDemote={() =>
                  updateMemberRoleMutation.mutate({
                    memberAccountId: member.id,
                    familyRole: "adult",
                  })
                }
                onDelete={() => deleteMemberMutation.mutate(member.id)}
                onSaveProfile={async (payload) => {
                  try {
                    await updateMemberProfileMutation.mutateAsync({
                      memberAccountId: member.id,
                      displayName: payload.displayName,
                      relationshipLabel: payload.relationshipLabel,
                      phone: payload.phone,
                    });
                    if (member.id === currentAccountId && payload.email !== undefined) {
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
    </div>
  );
}
