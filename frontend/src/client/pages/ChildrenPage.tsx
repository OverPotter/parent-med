/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useEffect, useState } from "react";
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
import { DateField } from "@shared/components/DateField";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";

export function ChildrenPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [createFormResetKey, setCreateFormResetKey] = useState(0);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] });
      setCreateFormResetKey((current) => current + 1);
      setIsCreateFormOpen(false);
    },
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
    <div className="min-w-0 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Дети</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Профили детей, история и переход в текущую болезнь.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateFormOpen((current) => !current)}
          className={[
            "soft-button-primary rounded-2xl px-4 py-2.5 text-sm",
            children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
          ].join(" ")}
        >
          {isCreateFormOpen ? "Скрыть форму" : "Добавить ребёнка"}
        </button>
      </div>

      {isCreateFormOpen && (
        <AddChildForm
          onSubmit={(name, birthDate) => createMutation.mutate({ name, birthDate })}
          isPending={createMutation.isPending}
          resetKey={createFormResetKey}
          errorMessage={
            (
              createMutation.error as {
                response?: { data?: { detail?: string } };
              }
            )?.response?.data?.detail ?? null
          }
          onCancel={() => setIsCreateFormOpen(false)}
        />
      )}

      {isLoading && <p className="text-muted">Загрузка…</p>}
      {error && (
        <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
          {(error as { message?: string }).message ?? "Ошибка загрузки"}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && !isCreateFormOpen && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>Пока нет детей. Добавьте первого ребёнка, чтобы перейти к болезням и записям.</p>
            <button
              type="button"
              onClick={() => setIsCreateFormOpen(true)}
              className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm"
            >
              Добавить первого ребёнка
            </button>
          </div>
        </EmptyState>
      )}

      {children.length > 0 && (
        <>
          <ul className="grid gap-4">
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

          {!isCreateFormOpen && (
            <Surface className="soft-panel-muted p-4 sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Нужно добавить ещё ребёнка?</p>
                  <p className="mt-1 text-sm text-muted">Кнопка перенесена вниз, чтобы не мешать списку.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen(true)}
                  className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
                >
                  Добавить
                </button>
              </div>
            </Surface>
          )}
        </>
      )}
    </div>
  );
}

function AddChildForm({
  onSubmit,
  isPending,
  resetKey,
  errorMessage,
  onCancel,
}: {
  onSubmit: (name: string, birthDate?: string | null) => void;
  isPending: boolean;
  resetKey: number;
  errorMessage: string | null;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setName("");
    setBirthDate("");
    setValidationError(null);
  }, [resetKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const normalizedBirthDate = normalizeIsoDateInput(birthDate);
    if (birthDate && !normalizedBirthDate) {
      setValidationError("Укажите корректную дату рождения через календарь.");
      return;
    }

    setValidationError(null);
    onSubmit(name.trim(), normalizedBirthDate ?? undefined);
  };

  return (
    <Surface className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Новый ребёнок</h2>
            <p className="mt-1 text-sm text-muted">Форма открывается только когда она нужна.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
          >
            Отмена
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="min-w-0 flex-1">
            <span className="block text-sm text-muted">Имя</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError(null);
              }}
              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Дата рождения</span>
            <DateField
              value={birthDate}
              onChange={(nextValue) => {
                setBirthDate(nextValue);
                setValidationError(null);
              }}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-1"
            />
          </label>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50 sm:self-end"
          >
            {isPending ? "Добавляем…" : "Добавить"}
          </button>
        </div>
        {(validationError || errorMessage) && (
          <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
            {validationError ?? errorMessage}
          </p>
        )}
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
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{child.name}</h2>
              {hasActiveEpisode && (
                <span className="soft-pill-success rounded-full px-2.5 py-1 text-xs">
                  Активная болезнь
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              {child.ageLabel ? `${child.ageLabel} • ` : ""}
              {child.birthDate ? `Рожд. ${formatDate(child.birthDate)} • ` : ""}
              Эпизодов: {episodeCount}
            </p>
            {hasActiveEpisode && activeEpisodeStartedAt && (
              <p className="mt-1 text-sm text-[color:var(--color-success)]">
                С текущим эпизодом с {formatDate(activeEpisodeStartedAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              История
            </Link>
            <button
              type="button"
              onClick={onStartEpisode}
              disabled={isStartingEpisode}
              className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
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
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              {isEditing ? "Закрыть" : "Редактировать"}
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-5 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="block min-w-0">
              <span className="block text-sm text-muted">Имя</span>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-muted">Дата рождения</span>
              <DateField
                value={draftBirthDate}
                onChange={setDraftBirthDate}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full"
              />
            </label>
            <button
              type="button"
              onClick={() => onSave(draftName.trim(), draftBirthDate || null)}
              disabled={isSaving || !draftName.trim()}
              className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
            >
              {isSaving ? "Сохраняем…" : "Сохранить"}
            </button>
            <div className="sm:col-span-3 flex justify-start pt-1">
              <button
                type="button"
                onClick={() => {
                  const shouldDelete = window.confirm(
                    `Точно удалить ребёнка «${child.name}»? Это действие нельзя отменить.`
                  );
                  if (!shouldDelete) {
                    return;
                  }
                  onDelete();
                }}
                disabled={isDeleting}
                className="soft-button-danger rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {isDeleting ? "Удаляем…" : "Удалить ребёнка"}
              </button>
            </div>
          </div>
        )}
      </RowSurface>
    </li>
  );
}
