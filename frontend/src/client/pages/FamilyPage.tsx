/**
 * Семья: одна семья на приложение, редактирование названия и CRUD родителей.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFamily, fetchFamilies, updateFamily } from "@shared/api/families";
import {
  createParent,
  deleteParent,
  fetchParentsByFamilyId,
  updateParent,
} from "@shared/api/parents";
import { useAppStore } from "@shared/store/useAppStore";
import type { Parent } from "@shared/types/api";

export function FamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentRole, setNewParentRole] = useState("");
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [editingParentName, setEditingParentName] = useState("");
  const [editingParentRole, setEditingParentRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const queryClient = useQueryClient();

  const {
    data: families = [],
    isLoading: familyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families"],
    queryFn: fetchFamilies,
  });

  const family = families.find((item) => item.id === currentFamilyId) ?? families[0] ?? null;

  useEffect(() => {
    if (family) {
      setFamilyName(family.name);
      setCurrentFamily(family);
    } else {
      setFamilyName("");
    }
  }, [family, setCurrentFamily]);

  const {
    data: parents = [],
    isLoading: parentsLoading,
    error: parentsError,
  } = useQuery({
    queryKey: ["parents", family?.id],
    queryFn: () => fetchParentsByFamilyId(family!.id),
    enabled: !!family?.id,
  });

  const createFamilyMutation = useMutation({
    mutationFn: (name: string) => createFamily(name),
    onSuccess: (createdFamily) => {
      setCurrentFamily(createdFamily);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка создания семьи");
    },
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFamily(id, name),
    onSuccess: (updatedFamily) => {
      setCurrentFamily(updatedFamily);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка обновления семьи");
    },
  });

  const createParentMutation = useMutation({
    mutationFn: (payload: { family_id: string; name: string; role: string }) =>
      createParent(payload),
    onSuccess: () => {
      setNewParentName("");
      setNewParentRole("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["parents", family?.id] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка создания родителя");
    },
  });

  const updateParentMutation = useMutation({
    mutationFn: ({ id, name, role }: { id: string; name: string; role: string }) =>
      updateParent(id, { name, role }),
    onSuccess: () => {
      setEditingParentId(null);
      setEditingParentName("");
      setEditingParentRole("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["parents", family?.id] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка обновления родителя");
    },
  });

  const deleteParentMutation = useMutation({
    mutationFn: deleteParent,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["parents", family?.id] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка удаления родителя");
    },
  });

  const handleFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = familyName.trim();
    if (!trimmedName) {
      return;
    }
    if (family) {
      updateFamilyMutation.mutate({ id: family.id, name: trimmedName });
      return;
    }
    createFamilyMutation.mutate(trimmedName);
  };

  const handleParentCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) {
      return;
    }
    const trimmedName = newParentName.trim();
    const trimmedRole = newParentRole.trim();
    if (!trimmedName || !trimmedRole) {
      return;
    }
    createParentMutation.mutate({
      family_id: family.id,
      name: trimmedName,
      role: trimmedRole,
    });
  };

  const handleParentEditStart = (parent: Parent) => {
    setEditingParentId(parent.id);
    setEditingParentName(parent.name);
    setEditingParentRole(parent.role);
    setError(null);
  };

  const handleParentSave = (parentId: string) => {
    const trimmedName = editingParentName.trim();
    const trimmedRole = editingParentRole.trim();
    if (!trimmedName || !trimmedRole) {
      return;
    }
    updateParentMutation.mutate({
      id: parentId,
      name: trimmedName,
      role: trimmedRole,
    });
  };

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Семья</h1>
      <p className="mt-2 text-muted">
        Пока без регистрации в приложении доступна одна семья с названием и списком родителей.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {familyError && (
        <p className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {(familyError as { message?: string }).message ?? "Ошибка загрузки семьи"}
        </p>
      )}

      <section className="mt-6 rounded-xl border border-border bg-background p-4">
        <h2 className="text-lg font-medium text-foreground">
          {family ? "Название семьи" : "Создать семью"}
        </h2>
        <form onSubmit={handleFamilySubmit} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="block text-sm text-muted">Название</span>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0"
              placeholder="Например: Семья Ивановых"
            />
          </label>
          <button
            type="submit"
            disabled={
              familyLoading ||
              createFamilyMutation.isPending ||
              updateFamilyMutation.isPending ||
              !familyName.trim()
            }
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
          >
            {family
              ? updateFamilyMutation.isPending
                ? "Сохраняем…"
                : "Сохранить"
              : createFamilyMutation.isPending
                ? "Создаём…"
                : "Создать"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">Родители</h2>
          {family && <span className="text-sm text-muted">{parents.length} шт.</span>}
        </div>

        {!family && (
          <p className="mt-3 text-sm text-muted">
            Сначала создайте семью, затем добавьте родителей.
          </p>
        )}
        {family && (
          <>
            <form onSubmit={handleParentCreate} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1">
                <span className="block text-sm text-muted">Имя</span>
                <input
                  type="text"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Например: Анна"
                />
              </label>
              <label className="min-w-0 flex-1">
                <span className="block text-sm text-muted">Роль</span>
                <input
                  type="text"
                  value={newParentRole}
                  onChange={(e) => setNewParentRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Например: мама"
                />
              </label>
              <button
                type="submit"
                disabled={
                  createParentMutation.isPending || !newParentName.trim() || !newParentRole.trim()
                }
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
              >
                {createParentMutation.isPending ? "Добавляем…" : "Добавить"}
              </button>
            </form>

            {parentsError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {(parentsError as { message?: string }).message ?? "Ошибка загрузки родителей"}
              </p>
            )}
            {parentsLoading && <p className="mt-3 text-sm text-muted">Загрузка…</p>}
            {!parentsLoading && parents.length === 0 && (
              <p className="mt-3 text-sm text-muted">Пока нет родителей. Добавьте первого выше.</p>
            )}
            {parents.length > 0 && (
              <ul className="mt-4 space-y-3">
                {parents.map((parent) => {
                  const isEditing = editingParentId === parent.id;
                  const isSaving =
                    updateParentMutation.isPending &&
                    updateParentMutation.variables?.id === parent.id;

                  return (
                    <li
                      key={parent.id}
                      className="rounded-xl border border-border bg-background/60 p-4"
                    >
                      {isEditing ? (
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="min-w-0 flex-1">
                            <span className="block text-sm text-muted">Имя</span>
                            <input
                              type="text"
                              value={editingParentName}
                              onChange={(e) => setEditingParentName(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                            />
                          </label>
                          <label className="min-w-0 flex-1">
                            <span className="block text-sm text-muted">Роль</span>
                            <input
                              type="text"
                              value={editingParentRole}
                              onChange={(e) => setEditingParentRole(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleParentSave(parent.id)}
                            disabled={
                              isSaving || !editingParentName.trim() || !editingParentRole.trim()
                            }
                            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
                          >
                            {isSaving ? "Сохраняем…" : "Сохранить"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingParentId(null);
                              setEditingParentName("");
                              setEditingParentRole("");
                            }}
                            className="rounded-lg border border-border px-4 py-2 hover:bg-muted/30"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">{parent.name}</p>
                            <p className="mt-1 text-sm text-muted">{parent.role}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleParentEditStart(parent)}
                              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/30"
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteParentMutation.mutate(parent.id)}
                              disabled={deleteParentMutation.isPending}
                              className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
