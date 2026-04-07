import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";

const familyCopy = {
  ru: {
    title: "Семья",
    subtitle: "Родители и близкие работают в одном семейном пространстве.",
    memberCountOne: "участник",
    memberCountFew: "участника",
    memberCountMany: "участников",
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
    currentFamilyName: "Текущее название",
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
    inviteTitle: "Приглашение в семью",
    inviteDescription:
      "Новому взрослому отправляется личная ссылка. Он войдёт в ту же семейную базу, но под своим аккаунтом.",
    ownerOnly: "Только для владельца",
    creatingInvite: "Создаём ссылку…",
    createInvite: "Создать ссылку-приглашение",
    newLink: "Новая ссылка",
    validUntil: "Действует до",
    inviteCopied: "Ссылка скопирована",
    inviteCopyFailed: "Не удалось скопировать ссылку.",
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
    memberCountOne: "member",
    memberCountFew: "members",
    memberCountMany: "members",
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
    currentFamilyName: "Current name",
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
    inviteTitle: "Family invite",
    inviteDescription:
      "A new adult gets a personal invite link. They join the same family workspace under their own account.",
    ownerOnly: "Owners only",
    creatingInvite: "Creating link…",
    createInvite: "Create invite link",
    newLink: "New link",
    validUntil: "Valid until",
    inviteCopied: "Link copied",
    inviteCopyFailed: "Could not copy the link.",
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

function memberCountLabel(language: AppLanguage, count: number) {
  if (language === "en") {
    return `${count} ${count === 1 ? tFamily(language, "memberCountOne") : tFamily(language, "memberCountMany")}`;
  }

  const mod10 = count % 10;
  const mod100 = count % 100;
  const label =
    mod10 === 1 && mod100 !== 11
      ? tFamily(language, "memberCountOne")
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? tFamily(language, "memberCountFew")
        : tFamily(language, "memberCountMany");
  return `${count} ${label}`;
}

function roleLabel(role: string, language: AppLanguage): string {
  return role === "owner" ? tFamily(language, "owner") : tFamily(language, "member");
}

export function FamilyPage() {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [familyName, setFamilyName] = useState("");
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
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

  const canManageFamily = currentAccountRole === "owner";
  const shouldOpenCurrentProfileEditor =
    searchParams.get("edit") === "profile" || searchParams.get("edit") === "me";
  const familyTitle =
    family?.name?.trim() || currentFamilyName?.trim() || tFamily(language, "title");

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={familyTitle}
        subtitle={tFamily(language, "subtitle")}
        compactOnMobile
        hideOnMobile
        action={
          <span className="soft-pill inline-flex min-h-[2.45rem] w-fit items-center rounded-full px-3.5 py-1.5 text-[0.78rem] tracking-[-0.015em]">
            {memberCountLabel(language, members.length)}
          </span>
        }
      />

      <div className="md:hidden">
        <h1 className="app-title text-[1.52rem] tracking-[-0.045em]">{familyTitle}</h1>
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

      <Surface className="app-section-surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title">{tFamily(language, "membersTitle")}</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {tFamily(language, "membersDescription")}
            </p>
          </div>
          <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
            {members.length} {tFamily(language, "peopleShort")}
          </span>
        </div>

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "membersLoading")}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tFamily(language, "noMembers")}</p>
        ) : (
          <div className="mt-4 space-y-3">
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
      </Surface>

      {canManageFamily ? (
        <Surface className="app-section-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="app-card-title">{tFamily(language, "inviteTitle")}</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {tFamily(language, "inviteDescription")}
              </p>
            </div>
            <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
              {tFamily(language, "ownerOnly")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => createInviteMutation.mutate()}
            disabled={createInviteMutation.isPending}
            className="soft-button-primary app-btn-primary-md mt-4 inline-flex disabled:opacity-50"
          >
            {createInviteMutation.isPending
              ? tFamily(language, "creatingInvite")
              : tFamily(language, "createInvite")}
          </button>

          {createInviteMutation.data && (
            <div className="soft-panel mt-4 rounded-[24px] p-4">
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
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="soft-button-secondary app-btn-secondary-md inline-flex"
                >
                  {inviteCopied
                    ? tFamily(language, "inviteCopied")
                    : tFamily(language, "copyInvite")}
                </button>
              </div>
            </div>
          )}
        </Surface>
      ) : null}

      <Surface className="app-section-surface">
        <div>
          <h2 className="app-card-title">{tFamily(language, "familyNameTitle")}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            {tFamily(language, "familyNameDescription")}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <DisclosureHeader
            isOpen={isEditingFamilyName}
            onToggle={() => {
              setFamilyName(family?.name ?? "");
              setIsEditingFamilyName((current) => !current);
            }}
            desktopClosedLabel={tFamily(language, "edit")}
            desktopOpenLabel={tFamily(language, "hide")}
            mobileClosedLabel={tFamily(language, "edit")}
            mobileOpenLabel={tFamily(language, "hide")}
            contentClassName="space-y-0"
          >
            <p className="app-card-title truncate">
              {family?.name || tFamily(language, "familyNameMissing")}
            </p>
          </DisclosureHeader>

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
                  className="soft-button-primary app-btn-primary-md inline-flex w-full disabled:opacity-50 sm:w-auto"
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
                  className="soft-button-secondary app-btn-secondary-md inline-flex w-full sm:w-auto"
                >
                  {tFamily(language, "cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      </Surface>
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
    <div className="soft-panel rounded-[30px] p-4">
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
          <p className="mt-2 text-sm text-muted">@{member.login}</p>
          <p className="mt-1 text-sm text-muted">
            {member.email || tFamily(language, "emailMissing")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {member.phone || tFamily(language, "phoneMissing")}
          </p>
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
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                {isEditing ? tFamily(language, "hideProfile") : tFamily(language, "editProfile")}
              </button>
            )}
            {canPromote && (
              <button
                type="button"
                onClick={() => setIsPromoteConfirmOpen(true)}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                {tFamily(language, "makeOwner")}
              </button>
            )}
            {canDemote && (
              <button
                type="button"
                onClick={() => setIsDemoteConfirmOpen(true)}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                {tFamily(language, "makeAdult")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                {tFamily(language, "removeFromFamily")}
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
          <label className="block">
            <span className="soft-field-label">{tFamily(language, "displayName")}</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="soft-input w-full px-4"
              placeholder={tFamily(language, "displayNamePlaceholder")}
            />
          </label>
          <label className="block">
            <span className="soft-field-label">{tFamily(language, "relationship")}</span>
            <input
              type="text"
              value={relationshipLabel}
              onChange={(event) => setRelationshipLabel(event.target.value)}
              className="soft-input w-full px-4"
              placeholder={tFamily(language, "relationshipPlaceholder")}
            />
          </label>
          <label className="block">
            <span className="soft-field-label">{tFamily(language, "phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="soft-input w-full px-4"
              placeholder="+375 ..."
            />
          </label>
          {isCurrent ? (
            <label className="block">
              <span className="soft-field-label">{tFamily(language, "email")}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                }}
                className="soft-input w-full px-4"
                placeholder={tFamily(language, "emailPlaceholder")}
                autoComplete="email"
              />
            </label>
          ) : null}
          <div className="flex items-end">
            <button
              type="button"
              onClick={async () => {
                const normalizedEmail = email.trim().toLowerCase();
                const isValidEmail =
                  normalizedEmail.length === 0 ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
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
              disabled={isPending || !displayName.trim()}
              className="app-btn-primary-md soft-button-primary inline-flex min-h-[3rem] items-center justify-center px-4 disabled:opacity-50 sm:min-h-[3.15rem] sm:px-5"
            >
              {isPending ? tFamily(language, "saving") : tFamily(language, "saveProfile")}
            </button>
          </div>
          {emailError ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm sm:col-span-2">
              {emailError}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
