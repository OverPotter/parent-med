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
import { RowSurface, Surface } from "@shared/components/Surface";
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
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const queryClient = useQueryClient();

  const {
    data: families = [],
    isLoading: familyLoading,
    error: familyError,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
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
      queryClient.invalidateQueries({ queryKey: ["families", accountId] });
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
      queryClient.invalidateQueries({ queryKey: ["families", accountId] });
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
    <div className="min-w-0 space-y-6">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Семья</h1>
      <p className="mt-2 text-muted">Настройки семьи: название, родители и базовый контекст аккаунта.</p>

      {error && (
        <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      )}
      {familyError && (
        <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
          {(familyError as { message?: string }).message ?? "Ошибка загрузки семьи"}
        </p>
      )}

      <Surface className="p-5 sm:p-6">
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
              className="soft-input mt-1 w-full max-w-md rounded-2xl px-4 py-3 min-w-0"
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
            className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
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
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">Родители</h2>
          {family && <span className="soft-pill rounded-full px-3 py-1 text-xs">{parents.length} шт.</span>}
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
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  placeholder="Например: Анна"
                />
              </label>
              <label className="min-w-0 flex-1">
                <span className="block text-sm text-muted">Роль</span>
                <input
                  type="text"
                  value={newParentRole}
                  onChange={(e) => setNewParentRole(e.target.value)}
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  placeholder="Например: мама"
                />
              </label>
              <button
                type="submit"
                disabled={
                  createParentMutation.isPending || !newParentName.trim() || !newParentRole.trim()
                }
                className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
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
                    <li key={parent.id}>
                      <RowSurface>
                      {isEditing ? (
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="min-w-0 flex-1">
                            <span className="block text-sm text-muted">Имя</span>
                            <input
                              type="text"
                              value={editingParentName}
                              onChange={(e) => setEditingParentName(e.target.value)}
                              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                            />
                          </label>
                          <label className="min-w-0 flex-1">
                            <span className="block text-sm text-muted">Роль</span>
                            <input
                              type="text"
                              value={editingParentRole}
                              onChange={(e) => setEditingParentRole(e.target.value)}
                              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleParentSave(parent.id)}
                            disabled={
                              isSaving || !editingParentName.trim() || !editingParentRole.trim()
                            }
                            className="soft-button-primary rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
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
                            className="soft-button-secondary rounded-2xl px-4 py-3 text-sm"
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
                              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteParentMutation.mutate(parent.id)}
                              disabled={deleteParentMutation.isPending}
                              className="soft-button-danger rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      )}
                      </RowSurface>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </Surface>
    </div>
  );
}
