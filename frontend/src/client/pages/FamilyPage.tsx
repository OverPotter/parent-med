import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { updateAccountProfile } from "@shared/api/auth";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
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
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";
import {
  appBtnJournalPrimaryClass,
  appBtnJournalSecondaryClass,
  SectionTitle,
} from "./child-illness/shared";

const familyCopy = {
  ru: {
    title: "Семья",
    subtitle: "Родители и близкие работают в одном семейном пространстве.",
    loadFamilyFailed: "Не удалось загрузить семью.",
    loadMembersFailed: "Не удалось загрузить участников.",
    updateFamilyFailed: "Не удалось обновить название семьи.",
    createInviteFailed: "Не удалось создать ссылку приглашения.",
    updateRoleFailed: "Не удалось обновить роль участника.",
    deleteMemberFailed: "Не удалось удалить участника из семьи.",
    updateProfileFailed: "Не удалось обновить профиль участника.",
    familyNameTitle: "Название семьи",
    familyNameDescription: "Общее название, которое видят все участники семьи.",
    edit: "Изменить",
    hide: "Скрыть",
    familyNameMissing: "Название пока не указано",
    newFamilyName: "Новое название",
    newFamilyNamePlaceholder: "Например: Семья Ивановых",
    saving: "Сохраняем…",
    save: "Сохранить",
    cancel: "Отмена",
    membersTitle: "Участники семьи",
    membersDescription: "Владельцы могут приглашать новых взрослых, менять роли и отзывать доступ.",
    peopleShort: "чел.",
    membersLoading: "Загружаем участников…",
    noMembers: "У семьи пока нет подключённых участников.",
    inviteTitle: "Пригласить в приложение",
    inviteDescription:
      "Отправьте приглашение близкому. Он установит приложение или откроет ссылку и подключится к вашей семье под своим аккаунтом.",
    ownerOnly: "Только для владельца",
    creatingInvite: "Готовим приглашение…",
    createInvite: "Пригласить",
    newLink: "Новая ссылка",
    validUntil: "Действует до",
    inviteCopied: "Ссылка скопирована",
    inviteCopyFailed: "Не удалось скопировать ссылку.",
    inviteShareFailed: "Не удалось открыть меню «Поделиться».",
    shareInvite: "Поделиться",
    copyInvite: "Скопировать ссылку",
    owner: "Владелец",
    member: "Участник",
    noName: "Без имени",
    thisIsYou: "Это вы",
    emailMissing: "Email не указан",
    phoneMissing: "Телефон не указан",
    hideProfile: "Скрыть профиль",
    editProfile: "Редактировать профиль",
    makeOwner: "Сделать владельцем",
    makeAdult: "Сделать участником",
    removeFromFamily: "Удалить из семьи",
    confirmPromoteTitle: "Сделать участника владельцем?",
    confirmPromoteDescription:
      "Участник получит права владельца семьи: сможет приглашать и удалять участников, а также менять роли.",
    confirmPromoteAction: "Да, сделать владельцем",
    confirmDemoteTitle: "Снять роль владельца?",
    confirmDemoteDescription:
      "Участник останется в семье, но потеряет права владельца и станет обычным участником.",
    confirmDemoteAction: "Да, сделать участником",
    confirmRemoveTitle: "Удалить участника из семьи?",
    confirmRemoveDescription:
      "Участник потеряет доступ к вашей семейной базе. Это действие можно будет вернуть только новым приглашением.",
    confirmRemoveAction: "Да, удалить",
    displayName: "Имя в семье",
    displayNamePlaceholder: "Например: Оля",
    relationship: "Кто это в семье",
    relationshipPlaceholder: "Например: няня",
    phone: "Телефон",
    email: "Email",
    emailPlaceholder: "you@example.com",
    invalidEmail: "Введите корректный email или оставьте поле пустым.",
    saveProfile: "Сохранить профиль",
  },
  en: {
    title: "Family",
    subtitle: "Parents and relatives work together in one family space.",
    loadFamilyFailed: "Could not load family.",
    loadMembersFailed: "Could not load members.",
    updateFamilyFailed: "Could not update the family name.",
    createInviteFailed: "Could not create an invite link.",
    updateRoleFailed: "Could not update the member role.",
    deleteMemberFailed: "Could not remove the member from the family.",
    updateProfileFailed: "Could not update the member profile.",
    familyNameTitle: "Family name",
    familyNameDescription: "Shared name visible to everyone in your family space.",
    edit: "Edit",
    hide: "Hide",
    familyNameMissing: "Family name is not set yet",
    newFamilyName: "New family name",
    newFamilyNamePlaceholder: "Example: The Ivanov Family",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    membersTitle: "Family members",
    membersDescription: "Owners can invite new adults, change roles and revoke access.",
    peopleShort: "people",
    membersLoading: "Loading members…",
    noMembers: "No family members are connected yet.",
    inviteTitle: "Invite to the app",
    inviteDescription:
      "Send an invite to a family member. They can install the app or open the link and join your family with their own account.",
    ownerOnly: "Owners only",
    creatingInvite: "Preparing invite…",
    createInvite: "Invite",
    newLink: "New link",
    validUntil: "Valid until",
    inviteCopied: "Link copied",
    inviteCopyFailed: "Could not copy the link.",
    inviteShareFailed: "Could not open the share sheet.",
    shareInvite: "Share",
    copyInvite: "Copy link",
    owner: "Owner",
    member: "Member",
    noName: "No name",
    thisIsYou: "You",
    emailMissing: "Email is not set",
    phoneMissing: "Phone is not set",
    hideProfile: "Hide profile",
    editProfile: "Edit profile",
    makeOwner: "Make owner",
    makeAdult: "Make adult",
    removeFromFamily: "Remove from family",
    confirmPromoteTitle: "Promote this member to owner?",
    confirmPromoteDescription:
      "The member will get family owner permissions: invite/remove members and manage roles.",
    confirmPromoteAction: "Yes, make owner",
    confirmDemoteTitle: "Remove owner role?",
    confirmDemoteDescription:
      "The member will stay in the family but lose owner permissions and become an adult.",
    confirmDemoteAction: "Yes, make adult",
    confirmRemoveTitle: "Remove this member from family?",
    confirmRemoveDescription:
      "The member will lose access to your family workspace. Access can be restored only with a new invite.",
    confirmRemoveAction: "Yes, remove",
    displayName: "Family name",
    displayNamePlaceholder: "Example: Olivia",
    relationship: "Relationship",
    relationshipPlaceholder: "Example: nanny",
    phone: "Phone",
    email: "Email",
    emailPlaceholder: "you@example.com",
    invalidEmail: "Enter a valid email or leave the field empty.",
    saveProfile: "Save profile",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function tFamily(language: AppLanguage, key: keyof (typeof familyCopy)["ru"]) {
  return familyCopy[language][key];
}

function roleLabel(role: string, language: AppLanguage): string {
  return role === "owner" ? tFamily(language, "owner") : tFamily(language, "member");
}

const PROFILE_DIALOG_HISTORY_KEY = "__pm_family_profile_dialog__";

export function FamilyPage() {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [familyName, setFamilyName] = useState("");
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isInviteSharePending, setIsInviteSharePending] = useState(false);
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountEmail = useAppStore((s) => s.setAccountEmail);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const queryClient = useQueryClient();

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
      const invite = await createInviteMutation.mutateAsync();
      setInviteCopied(false);
      const inviteUrl = `${window.location.origin}${invite.invitePath}`;
      await handleShareInvite(inviteUrl);
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
        <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h2 className="app-card-title">{tFamily(language, "inviteTitle")}</h2>
              <div className="flex shrink-0 items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    void handleCreateInvite();
                  }}
                  disabled={createInviteMutation.isPending || isInviteSharePending}
                  className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem] disabled:opacity-50`}
                >
                  {createInviteMutation.isPending || isInviteSharePending
                    ? tFamily(language, "creatingInvite")
                    : tFamily(language, "createInvite")}
                </button>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted">{tFamily(language, "inviteDescription")}</p>
          </div>

          <p className="mt-2 text-sm font-semibold text-muted">{tFamily(language, "ownerOnly")}</p>

          {createInviteMutation.data && (
            <div className="mt-4 border-t border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] pt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {tFamily(language, "newLink")}
              </p>
              <p className="mt-2 break-all text-sm text-foreground">{latestInviteUrl}</p>
              <p className="mt-2 text-sm text-muted">
                {tFamily(language, "validUntil")}{" "}
                {new Date(createInviteMutation.data.expiresAt).toLocaleString(
                  language === "ru" ? "ru-RU" : "en-US"
                )}
                .
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {canShareInvite ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleShareInvite(latestInviteUrl);
                    }}
                    disabled={isInviteSharePending}
                    className={`${appBtnJournalSecondaryClass} inline-flex`}
                  >
                    {tFamily(language, "shareInvite")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`${appBtnJournalSecondaryClass} inline-flex`}
                >
                  {inviteCopied
                    ? tFamily(language, "inviteCopied")
                    : tFamily(language, "copyInvite")}
                </button>
              </div>
            </div>
          )}
        </RowSurface>
      ) : null}

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h2 className="app-card-title">{tFamily(language, "familyNameTitle")}</h2>
            <div className="flex shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  if (isEditingFamilyName) {
                    setFamilyName(family?.name ?? "");
                  }
                  setIsEditingFamilyName((current) => !current);
                }}
                className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
              >
                {isEditingFamilyName ? tFamily(language, "hide") : tFamily(language, "edit")}
              </button>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted">{tFamily(language, "familyNameDescription")}</p>
        </div>

        <div className="mt-4 space-y-4">
          <p className="app-card-title truncate">{family?.name || tFamily(language, "familyNameMissing")}</p>

          {isEditingFamilyName && (
            <form onSubmit={handleFamilySubmit} className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1">
                <span className="soft-field-label">{tFamily(language, "newFamilyName")}</span>
                <input
                  type="text"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  className="soft-input w-full px-4"
                  placeholder={tFamily(language, "newFamilyNamePlaceholder")}
                />
              </label>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button
                  type="submit"
                  disabled={
                    !family ||
                    isFamilyLoading ||
                    updateFamilyMutation.isPending ||
                  !familyName.trim() ||
                  familyName.trim() === family.name
                }
                  className={`${appBtnJournalPrimaryClass} inline-flex w-full disabled:opacity-50 sm:w-auto`}
                >
                  {updateFamilyMutation.isPending
                    ? tFamily(language, "saving")
                    : tFamily(language, "save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFamilyName(family?.name ?? "");
                    setIsEditingFamilyName(false);
                  }}
                  disabled={updateFamilyMutation.isPending}
                  className={`${appBtnJournalSecondaryClass} inline-flex w-full sm:w-auto`}
                >
                  {tFamily(language, "cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      </RowSurface>
    </div>
  );
}

interface MemberCardProps {
  member: FamilyMember;
  isCurrent: boolean;
  forceEdit: boolean;
  isOwner: boolean;
  canEditProfile: boolean;
  ownersCount: number;
  isPending: boolean;
  language: AppLanguage;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
  onSaveProfile: (payload: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
    email?: string | null;
  }) => Promise<boolean>;
  onHideForcedEdit: () => void;
}

function MemberCard({
  member,
  isCurrent,
  forceEdit,
  isOwner,
  canEditProfile,
  ownersCount,
  isPending,
  language,
  onPromote,
  onDemote,
  onDelete,
  onSaveProfile,
  onHideForcedEdit,
}: MemberCardProps) {
  const canDemote = member.familyRole === "owner" && ownersCount > 1 && !isCurrent;
  const canPromote = member.familyRole !== "owner" && !isCurrent;
  const canDelete = !isCurrent;
  const [isEditing, setIsEditing] = useState(forceEdit);
  const [displayName, setDisplayName] = useState(member.displayName || "");
  const [relationshipLabel, setRelationshipLabel] = useState(member.relationshipLabel || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [email, setEmail] = useState(member.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
  const [isDemoteConfirmOpen, setIsDemoteConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setDisplayName(member.displayName || "");
    setRelationshipLabel(member.relationshipLabel || "");
    setPhone(member.phone || "");
    setEmail(member.email || "");
    setEmailError(null);
  }, [member.displayName, member.relationshipLabel, member.phone, member.email]);

  useEffect(() => {
    if (forceEdit) {
      setIsEditing(true);
    }
  }, [forceEdit]);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <ConfirmDialog
        isOpen={isPromoteConfirmOpen}
        title={tFamily(language, "confirmPromoteTitle")}
        description={tFamily(language, "confirmPromoteDescription")}
        confirmLabel={tFamily(language, "confirmPromoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={isPending}
        onCancel={() => setIsPromoteConfirmOpen(false)}
        onConfirm={() => {
          onPromote();
          setIsPromoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDemoteConfirmOpen}
        title={tFamily(language, "confirmDemoteTitle")}
        description={tFamily(language, "confirmDemoteDescription")}
        confirmLabel={tFamily(language, "confirmDemoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={isPending}
        onCancel={() => setIsDemoteConfirmOpen(false)}
        onConfirm={() => {
          onDemote();
          setIsDemoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={tFamily(language, "confirmRemoveTitle")}
        description={tFamily(language, "confirmRemoveDescription")}
        confirmLabel={tFamily(language, "confirmRemoveAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDelete();
          setIsDeleteConfirmOpen(false);
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-card-title text-base">
              {member.displayName || member.login || tFamily(language, "noName")}
            </p>
            {member.relationshipLabel && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">
                {member.relationshipLabel}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                member.familyRole === "owner" ? "soft-pill-primary" : "soft-pill"
              }`}
            >
              {roleLabel(member.familyRole, language)}
            </span>
            {isCurrent && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">
                {tFamily(language, "thisIsYou")}
              </span>
            )}
          </div>
          <div className="mt-2 grid gap-1.5">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">Login: </span>@{member.login}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">Email: </span>
              {member.email || tFamily(language, "emailMissing")}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">{tFamily(language, "phone")}: </span>
              {member.phone || tFamily(language, "phoneMissing")}
            </p>
          </div>
        </div>

        {(isOwner || canEditProfile) && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {canEditProfile && (
              <button
                type="button"
                onClick={() =>
                  setIsEditing((current) => {
                    const next = !current;
                    if (!next) {
                      onHideForcedEdit();
                    }
                    return next;
                  })
                }
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {isEditing ? tFamily(language, "hideProfile") : tFamily(language, "editProfile")}
              </button>
            )}
            {canPromote && (
              <button
                type="button"
                onClick={() => setIsPromoteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "makeOwner")}
              </button>
            )}
            {canDemote && (
              <button
                type="button"
                onClick={() => setIsDemoteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "makeAdult")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "removeFromFamily")}
              </button>
            )}
          </div>
        )}
      </div>

      <ProfileEditDialog
        language={language}
        isOpen={isEditing}
        isCurrent={isCurrent}
        displayName={displayName}
        relationshipLabel={relationshipLabel}
        phone={phone}
        email={email}
        emailError={emailError}
        isPending={isPending}
        onClose={() => {
          setIsEditing(false);
          onHideForcedEdit();
        }}
        onDisplayNameChange={setDisplayName}
        onRelationshipLabelChange={setRelationshipLabel}
        onPhoneChange={setPhone}
        onEmailChange={(value) => {
          setEmail(value);
          setEmailError(null);
        }}
        onSubmit={async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const isValidEmail =
            normalizedEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
          if (!isValidEmail) {
            setEmailError(tFamily(language, "invalidEmail"));
            return;
          }
          const isSaved = await onSaveProfile({
            displayName: displayName.trim() || member.login,
            relationshipLabel: relationshipLabel.trim() || null,
            phone: phone.trim() || null,
            email: isCurrent ? normalizedEmail || null : undefined,
          });
          if (isSaved) {
            setIsEditing(false);
          }
        }}
      />
    </div>
  );
}

function ProfileEditDialog({
  language,
  isOpen,
  isCurrent,
  displayName,
  relationshipLabel,
  phone,
  email,
  emailError,
  isPending,
  onClose,
  onDisplayNameChange,
  onRelationshipLabelChange,
  onPhoneChange,
  onEmailChange,
  onSubmit,
}: {
  language: AppLanguage;
  isOpen: boolean;
  isCurrent: boolean;
  displayName: string;
  relationshipLabel: string;
  phone: string;
  email: string;
  emailError: string | null;
  isPending: boolean;
  onClose: () => void;
  onDisplayNameChange: (value: string) => void;
  onRelationshipLabelChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const isClosingFromHistoryRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const currentState =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const dialogState = { ...currentState, [PROFILE_DIALOG_HISTORY_KEY]: true };

    window.history.pushState(dialogState, "", window.location.href);

    const handlePopState = () => {
      isClosingFromHistoryRef.current = true;
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (
        !isClosingFromHistoryRef.current &&
        window.history.state &&
        typeof window.history.state === "object" &&
        window.history.state[PROFILE_DIALOG_HISTORY_KEY]
      ) {
        window.history.back();
      }
      isClosingFromHistoryRef.current = false;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const handleClose = () => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state === "object" &&
      window.history.state[PROFILE_DIALOG_HISTORY_KEY]
    ) {
      window.history.back();
      return;
    }

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "max(0.75rem, var(--app-safe-top-runtime, env(safe-area-inset-top)))",
        paddingBottom: "max(1rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
      }}
    >
      <div className="app-v3-background" aria-hidden="true">
        <div className="app-v3-decor app-v3-decor-a" />
        <div className="app-v3-decor app-v3-decor-b" />
        <div className="app-v3-decor app-v3-decor-c" />
        <div className="app-v3-noise" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/70 bg-background/88 px-4 pb-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto w-full max-w-[34rem]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex min-h-[2.25rem] items-center text-sm font-extrabold text-primary disabled:opacity-50"
            >
              {language === "ru" ? "← Семья" : "← Family"}
            </button>
            <div className="mt-1.5">
              <h2 className="app-card-title text-[1.25rem]">{tFamily(language, "editProfile")}</h2>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
          <div className="mx-auto w-full max-w-[34rem]">
            <div className="soft-panel overflow-hidden rounded-[28px] border border-border shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="soft-field-label">{tFamily(language, "displayName")}</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => onDisplayNameChange(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder={tFamily(language, "displayNamePlaceholder")}
                    />
                  </label>

                  <label className="block">
                    <span className="soft-field-label">{tFamily(language, "relationship")}</span>
                    <input
                      type="text"
                      value={relationshipLabel}
                      onChange={(event) => onRelationshipLabelChange(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder={tFamily(language, "relationshipPlaceholder")}
                    />
                  </label>

                  <label className="block">
                    <span className="soft-field-label">{tFamily(language, "phone")}</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => onPhoneChange(event.target.value)}
                      className="soft-input w-full px-4"
                      placeholder="+375 ..."
                    />
                  </label>

                  <label className="block">
                    <span className="soft-field-label">{tFamily(language, "email")}</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                      disabled={!isCurrent}
                      className="soft-input w-full px-4 disabled:opacity-80"
                      placeholder={tFamily(language, "emailPlaceholder")}
                      autoComplete="email"
                    />
                  </label>

                  {emailError ? (
                    <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                      {emailError}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-border/60 p-4 sm:px-5 sm:pb-5 sm:pt-4">
                <button
                  type="button"
                  onClick={() => void onSubmit()}
                  disabled={isPending || !displayName.trim()}
                  className={`${appBtnJournalPrimaryClass} w-full justify-center disabled:opacity-50`}
                >
                  {isPending ? tFamily(language, "saving") : tFamily(language, "saveProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
