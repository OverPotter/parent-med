import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFamilyMember,
  fetchFamilies,
  fetchMyFamilyMembers,
  updateFamilyMemberRole,
  updateMyFamily,
} from "@shared/api/families";
import { createFamilyInvite } from "@shared/api/familyInvites";
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
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Семья</h1>
        <p className="mt-2 text-muted">
          Одна общая семейная база, но у каждого взрослого свой личный аккаунт, история входов и
          подпись в событиях.
        </p>
      </div>

      {error && <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{error}</p>}
      {familyError && (
        <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
          {(familyError as { message?: string }).message ?? "Не удалось загрузить семью."}
        </p>
      )}
      {membersError && (
        <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
          {(membersError as { message?: string }).message ?? "Не удалось загрузить участников."}
        </p>
      )}

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-foreground">Название семьи</h2>
            <p className="mt-1 text-sm text-muted">
              Это общее имя семьи, которое увидят все приглашённые участники.
            </p>
          </div>
          {family && (
            <span className="soft-pill rounded-full px-3 py-1 text-xs">
              ID: {family.id.slice(0, 8)}
            </span>
          )}
        </div>

        <form onSubmit={handleFamilySubmit} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="block text-sm text-muted">Название</span>
            <input
              type="text"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
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
            className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
          >
            {updateFamilyMutation.isPending ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-foreground">Участники семьи</h2>
            <p className="mt-1 text-sm text-muted">
              Владельцы могут приглашать новых взрослых, менять роли и отзывать доступ.
            </p>
          </div>
          <span className="soft-pill rounded-full px-3 py-1 text-xs">{members.length} чел.</span>
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
                ownersCount={ownersCount}
                isPending={updateMemberRoleMutation.isPending || deleteMemberMutation.isPending}
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
              />
            ))}
          </div>
        )}
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-foreground">Приглашение в семью</h2>
            <p className="mt-1 text-sm text-muted">
              Новому взрослому отправляется личная ссылка. Он войдёт в ту же семейную базу, но под
              своим аккаунтом.
            </p>
          </div>
          <span className="soft-pill rounded-full px-3 py-1 text-xs">Только для owner</span>
        </div>

        {!canManageFamily ? (
          <p className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
            Приглашать новых участников может только владелец семьи.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => createInviteMutation.mutate()}
              disabled={createInviteMutation.isPending}
              className="soft-button-primary mt-4 rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
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
                    className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
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
  ownersCount: number;
  isPending: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
}

function MemberCard({
  member,
  isCurrent,
  isOwner,
  ownersCount,
  isPending,
  onPromote,
  onDemote,
  onDelete,
}: MemberCardProps) {
  const canDemote = member.familyRole === "owner" && ownersCount > 1 && !isCurrent;
  const canPromote = member.familyRole !== "owner" && !isCurrent;
  const canDelete = !isCurrent;

  return (
    <div className="soft-panel rounded-[24px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {member.displayName || "Без имени"}
            </p>
            <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">
              {roleLabel(member.familyRole)}
            </span>
            {isCurrent && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">Это вы</span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">{member.email}</p>
        </div>

        {isOwner && (
          <div className="flex flex-wrap gap-2">
            {canPromote && (
              <button
                type="button"
                onClick={onPromote}
                disabled={isPending}
                className="soft-button-secondary rounded-2xl px-3 py-2 text-xs disabled:opacity-50"
              >
                Сделать owner
              </button>
            )}
            {canDemote && (
              <button
                type="button"
                onClick={onDemote}
                disabled={isPending}
                className="soft-button-secondary rounded-2xl px-3 py-2 text-xs disabled:opacity-50"
              >
                Сделать adult
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="soft-button-secondary rounded-2xl px-3 py-2 text-xs disabled:opacity-50"
              >
                Удалить из семьи
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
