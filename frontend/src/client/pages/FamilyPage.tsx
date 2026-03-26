import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import type { FamilyMember } from "@shared/types/api";

function roleLabel(role: string): string {
  return role === "owner" ? "Владелец" : "Участник";
}

export function FamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const currentAccountId = useAppStore((s) => s.accountId);
  const currentAccountRole = useAppStore((s) => s.accountFamilyRole);
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
      queryClient.invalidateQueries({ queryKey: ["families", accountId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось обновить название семьи.");
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: () => createFamilyInvite({ family_role: "adult" }),
    onSuccess: () => {
      setInviteCopied(false);
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось создать ссылку приглашения.");
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
      setError(err.response?.data?.detail ?? "Не удалось обновить роль участника.");
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberAccountId: string) => deleteFamilyMember(memberAccountId),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Не удалось удалить участника из семьи.");
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
      setError(err.response?.data?.detail ?? "Не удалось обновить профиль участника.");
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
    await navigator.clipboard.writeText(latestInviteUrl);
    setInviteCopied(true);
  };

  const canManageFamily = currentAccountRole === "owner";

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Семья"
        subtitle="Одна общая семейная база, но у каждого взрослого свой личный аккаунт, история входов и подпись в событиях."
        compactOnMobile
        action={
          <span className="soft-pill inline-flex min-h-[2.45rem] w-fit items-center rounded-full px-3.5 py-1.5 text-[0.78rem] tracking-[-0.015em]">
            {members.length} участник{members.length === 1 ? "" : members.length < 5 ? "а" : "ов"}
          </span>
        }
      />

      {error && <p className="soft-note-danger">{error}</p>}
      {familyError && (
        <p className="soft-note-danger">
          {(familyError as { message?: string }).message ?? "Не удалось загрузить семью."}
        </p>
      )}
      {membersError && (
        <p className="soft-note-danger">
          {(membersError as { message?: string }).message ?? "Не удалось загрузить участников."}
        </p>
      )}

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title text-[1.08rem]">Название семьи</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Это общее имя семьи, которое увидят все приглашённые участники.
            </p>
          </div>
          {family && (
            <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
              ID: {family.id.slice(0, 8)}
            </span>
          )}
        </div>

        <form onSubmit={handleFamilySubmit} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="soft-field-label">Название</span>
            <input
              type="text"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              className="soft-input w-full px-4"
              placeholder="Например: Семья Ивановых"
            />
          </label>
          <button
            type="submit"
            disabled={
              !family ||
              isFamilyLoading ||
              updateFamilyMutation.isPending ||
              !familyName.trim() ||
              familyName.trim() === family.name
            }
            className="soft-button-primary inline-flex min-h-[3rem] w-full items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.15rem] sm:w-auto sm:px-5 sm:text-[0.93rem]"
          >
            {updateFamilyMutation.isPending ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title text-[1.08rem]">Участники семьи</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Владельцы могут приглашать новых взрослых, менять роли и отзывать доступ.
            </p>
          </div>
          <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
            {members.length} чел.
          </span>
        </div>

        {isMembersLoading ? (
          <p className="mt-4 text-sm text-muted">Загружаем участников…</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-muted">У семьи пока нет подключённых участников.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrent={member.id === currentAccountId}
                isOwner={canManageFamily}
                canEditProfile={canManageFamily || member.id === currentAccountId}
                ownersCount={ownersCount}
                isPending={
                  updateMemberRoleMutation.isPending ||
                  updateMemberProfileMutation.isPending ||
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
                onSaveProfile={(payload) =>
                  updateMemberProfileMutation.mutate({
                    memberAccountId: member.id,
                    displayName: payload.displayName,
                    relationshipLabel: payload.relationshipLabel,
                    phone: payload.phone,
                  })
                }
              />
            ))}
          </div>
        )}
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title text-[1.08rem]">Приглашение в семью</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Новому взрослому отправляется личная ссылка. Он войдёт в ту же семейную базу, но под
              своим аккаунтом.
            </p>
          </div>
          <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">Только для owner</span>
        </div>

        {!canManageFamily ? (
          <p className="soft-note-warning mt-4">
            Приглашать новых участников может только владелец семьи.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => createInviteMutation.mutate()}
              disabled={createInviteMutation.isPending}
              className="soft-button-primary mt-4 inline-flex min-h-[3rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.15rem] sm:px-5 sm:text-[0.93rem]"
            >
              {createInviteMutation.isPending ? "Создаём ссылку…" : "Создать ссылку-приглашение"}
            </button>

            {createInviteMutation.data && (
              <div className="soft-panel mt-4 rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Новая ссылка</p>
                <p className="mt-2 break-all text-sm text-foreground">{latestInviteUrl}</p>
                <p className="mt-2 text-sm text-muted">
                  Действует до{" "}
                  {new Date(createInviteMutation.data.expiresAt).toLocaleString("ru-RU")}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="soft-button-secondary inline-flex min-h-[2.8rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em]"
                  >
                    {inviteCopied ? "Ссылка скопирована" : "Скопировать ссылку"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Surface>
    </div>
  );
}

interface MemberCardProps {
  member: FamilyMember;
  isCurrent: boolean;
  isOwner: boolean;
  canEditProfile: boolean;
  ownersCount: number;
  isPending: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
  onSaveProfile: (payload: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => void;
}

function MemberCard({
  member,
  isCurrent,
  isOwner,
  canEditProfile,
  ownersCount,
  isPending,
  onPromote,
  onDemote,
  onDelete,
  onSaveProfile,
}: MemberCardProps) {
  const canDemote = member.familyRole === "owner" && ownersCount > 1 && !isCurrent;
  const canPromote = member.familyRole !== "owner" && !isCurrent;
  const canDelete = !isCurrent;
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(member.displayName || "");
  const [relationshipLabel, setRelationshipLabel] = useState(member.relationshipLabel || "");
  const [phone, setPhone] = useState(member.phone || "");

  useEffect(() => {
    setDisplayName(member.displayName || "");
    setRelationshipLabel(member.relationshipLabel || "");
    setPhone(member.phone || "");
  }, [member.displayName, member.relationshipLabel, member.phone]);

  return (
    <div className="soft-panel rounded-[30px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-card-title text-base">
              {member.displayName || member.login || "Без имени"}
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
              {roleLabel(member.familyRole)}
            </span>
            {isCurrent && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">Это вы</span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">@{member.login}</p>
          <p className="mt-1 text-sm text-muted">{member.email || "Email не указан"}</p>
          <p className="mt-1 text-sm text-muted">{member.phone || "Телефон не указан"}</p>
        </div>

        {(isOwner || canEditProfile) && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {canEditProfile && (
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                {isEditing ? "Скрыть профиль" : "Редактировать профиль"}
              </button>
            )}
            {canPromote && (
              <button
                type="button"
                onClick={onPromote}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                Сделать owner
              </button>
            )}
            {canDemote && (
              <button
                type="button"
                onClick={onDemote}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                Сделать adult
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="soft-button-secondary min-h-[2.85rem] px-3 text-[0.8rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
              >
                Удалить из семьи
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
          <label className="block">
            <span className="soft-field-label">Имя в семье</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="soft-input w-full px-4"
              placeholder="Например: Оля"
            />
          </label>
          <label className="block">
            <span className="soft-field-label">Кто это в семье</span>
            <input
              type="text"
              value={relationshipLabel}
              onChange={(event) => setRelationshipLabel(event.target.value)}
              className="soft-input w-full px-4"
              placeholder="Например: няня"
            />
          </label>
          <label className="block">
            <span className="soft-field-label">Телефон</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="soft-input w-full px-4"
              placeholder="+375 ..."
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                onSaveProfile({
                  displayName: displayName.trim() || member.login,
                  relationshipLabel: relationshipLabel.trim() || null,
                  phone: phone.trim() || null,
                });
                setIsEditing(false);
              }}
              disabled={isPending || !displayName.trim()}
              className="soft-button-primary inline-flex min-h-[3rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.15rem] sm:px-5 sm:text-[0.93rem]"
            >
              {isPending ? "Сохраняем…" : "Сохранить профиль"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
