/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChild,
  deleteChild,
  fetchChildrenByFamilyId,
  updateChild,
} from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodesByChildId,
} from "@shared/api/illnessEpisodes";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";

export function ChildrenPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
    })),
  });

  const historyQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
    })),
  });

  const createMutation = useMutation({
    mutationFn: ({ name, birthDate }: { name: string; birthDate?: string | null }) =>
      createChild(currentFamilyId!, name, birthDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      birthDate,
    }: {
      id: string;
      name: string;
      birthDate?: string | null;
    }) => updateChild(id, name, birthDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ["child", variables.id] });
      setEditingChildId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] });
    },
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Дети</h1>
        <p className="mt-2 text-muted">Сначала выбери семью на странице «Семья».</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Дети</h1>
        <p className="mt-1 text-sm text-muted">
          Создание, редактирование, удаление и запуск эпизода болезни.
        </p>
      </div>

      <AddChildForm
        onSubmit={(name, birthDate) => createMutation.mutate({ name, birthDate })}
        isPending={createMutation.isPending}
      />

      {isLoading && <p className="text-muted">Загрузка…</p>}
      {error && (
        <p className="text-red-600 dark:text-red-400">
          {(error as { message?: string }).message ?? "Ошибка загрузки"}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && (
        <EmptyState>Пока нет детей. Добавь первого ребёнка выше.</EmptyState>
      )}

      {children.length > 0 && (
        <ul className="grid gap-3">
          {children.map((child, index) => {
            const activeEpisode = activeEpisodeQueries[index]?.data ?? null;
            const episodes = historyQueries[index]?.data ?? [];

            return (
              <ChildCard
                key={child.id}
                child={child}
                isEditing={editingChildId === child.id}
                activeEpisodeStartedAt={activeEpisode?.startedAt ?? null}
                episodeCount={episodes.length}
                onEditToggle={() =>
                  setEditingChildId((current) => (current === child.id ? null : child.id))
                }
                onDelete={() => deleteMutation.mutate(child.id)}
                onSave={(name, birthDate) =>
                  updateMutation.mutate({ id: child.id, name, birthDate })
                }
                onStartEpisode={() => {
                  if (activeEpisode) {
                    navigate(`/children/${child.id}/illness`);
                    return;
                  }
                  navigate(`/children/${child.id}/illness?mode=create`);
                }}
                isSaving={updateMutation.isPending && editingChildId === child.id}
                isDeleting={deleteMutation.isPending}
                isStartingEpisode={false}
                hasActiveEpisode={!!activeEpisode}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddChildForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (name: string, birthDate?: string | null) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), birthDate || undefined);
    setName("");
    setBirthDate("");
  };

  return (
    <Surface className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="block text-sm text-muted">Имя</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Дата рождения</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-focus disabled:opacity-50"
          >
            {isPending ? "Добавляем…" : "Добавить"}
          </button>
        </div>
      </form>
    </Surface>
  );
}

function ChildCard({
  child,
  isEditing,
  activeEpisodeStartedAt,
  episodeCount,
  onEditToggle,
  onDelete,
  onSave,
  onStartEpisode,
  isSaving,
  isDeleting,
  isStartingEpisode,
  hasActiveEpisode,
}: {
  child: Child;
  isEditing: boolean;
  activeEpisodeStartedAt: string | null;
  episodeCount: number;
  onEditToggle: () => void;
  onDelete: () => void;
  onSave: (name: string, birthDate?: string | null) => void;
  onStartEpisode: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isStartingEpisode: boolean;
  hasActiveEpisode: boolean;
}) {
  const [draftName, setDraftName] = useState(child.name);
  const [draftBirthDate, setDraftBirthDate] = useState(child.birthDate ?? "");

  return (
    <li>
      <RowSurface>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{child.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {child.ageLabel ? `${child.ageLabel} • ` : ""}
              {child.birthDate ? `Рожд. ${formatDate(child.birthDate)} • ` : ""}
              Эпизодов: {episodeCount}
            </p>
            {hasActiveEpisode && activeEpisodeStartedAt && (
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Сейчас болеет с {formatDate(activeEpisodeStartedAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/30"
            >
              История
            </Link>
            <button
              type="button"
              onClick={onStartEpisode}
              disabled={isStartingEpisode}
              className="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-focus disabled:opacity-50"
            >
              {hasActiveEpisode
                ? "Смотреть активный"
                : isStartingEpisode
                  ? "Создаём…"
                  : "Новый эпизод"}
            </button>
            <button
              type="button"
              onClick={onEditToggle}
              className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/30"
            >
              {isEditing ? "Закрыть" : "Редактировать"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
            >
              Удалить
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="block min-w-0">
              <span className="block text-sm text-muted">Имя</span>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-muted">Дата рождения</span>
              <input
                type="date"
                value={draftBirthDate}
                onChange={(e) => setDraftBirthDate(e.target.value)}
                className="mt-1 w-full border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => onSave(draftName.trim(), draftBirthDate || null)}
              disabled={isSaving || !draftName.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-focus disabled:opacity-50"
            >
              {isSaving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        )}
      </RowSurface>
    </li>
  );
}
