/**
 * Дети: список по текущей семье, добавление, переход к эпизодам болезни.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@shared/store/useAppStore";
import { fetchChildrenByFamilyId, createChild, deleteChild } from "@shared/api/children";
import type { Child } from "@shared/types/api";

export function ChildrenPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, birthDate }: { name: string; birthDate?: string | null }) =>
      createChild(currentFamilyId!, name, birthDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] }),
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Дети</h1>
        <p className="mt-2 text-muted">Сначала выберите семью на странице «Семья».</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Дети</h1>

      <AddChildForm
        onSubmit={(name, birthDate) => createMutation.mutate({ name, birthDate })}
        isPending={createMutation.isPending}
      />

      {isLoading && <p className="mt-4 text-muted">Загрузка…</p>}
      {error && (
        <p className="mt-4 text-red-600 dark:text-red-400">
          {(error as { message?: string }).message ?? "Ошибка загрузки"}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && (
        <p className="mt-4 text-muted">Пока нет детей. Добавьте ребёнка выше.</p>
      )}
      {children.length > 0 && (
        <ul className="mt-6 space-y-3">
          {children.map((c) => (
            <ChildCard
              key={c.id}
              child={c}
              onDelete={() => deleteMutation.mutate(c.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
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
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
    >
      <label className="min-w-0 flex-1">
        <span className="block text-sm text-muted">Имя</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0"
        />
      </label>
      <label className="min-w-0">
        <span className="block text-sm text-muted">Дата рождения</span>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
      >
        {isPending ? "Добавляем…" : "Добавить"}
      </button>
    </form>
  );
}

function ChildCard({
  child,
  onDelete,
  isDeleting,
}: {
  child: Child;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-4 min-w-0">
      <div className="min-w-0 flex-1">
        <Link
          to={`/children/${child.id}/illness`}
          className="font-medium text-foreground hover:text-primary truncate block"
        >
          {child.name}
        </Link>
        {child.birthDate && <p className="text-sm text-muted truncate">Рожд. {child.birthDate}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/children/${child.id}/illness`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/30"
        >
          Болезни
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
        >
          Удалить
        </button>
      </div>
    </li>
  );
}
