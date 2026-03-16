/**
 * Семья: создать новую или ввести id и выбрать текущую.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@shared/store/useAppStore";
import { createFamily, fetchFamily } from "@shared/api/families";
import { useMutation } from "@tanstack/react-query";

export function FamilyPage() {
  const [name, setName] = useState("");
  const [familyIdInput, setFamilyIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { currentFamilyId, setCurrentFamilyId } = useAppStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (n: string) => createFamily(n),
    onSuccess: (data) => {
      setCurrentFamilyId(data.id);
      setName("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail ?? "Ошибка создания семьи");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(name.trim());
  };

  const handleSelectById = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = familyIdInput.trim();
    if (!id) return;
    setError(null);
    try {
      const family = await fetchFamily(id);
      setCurrentFamilyId(family.id);
      setFamilyIdInput("");
      queryClient.invalidateQueries({ queryKey: ["family"] });
    } catch {
      setError("Семья с таким id не найдена");
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Семья</h1>
      {currentFamilyId && (
        <p className="mt-2 text-muted">
          Текущая семья: <code className="rounded bg-muted/50 px-1 text-sm">{currentFamilyId}</code>
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-medium text-foreground">Создать семью</h2>
          <form onSubmit={handleCreate} className="mt-2 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="block text-sm text-muted">Название</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0"
                placeholder="Например: Семья Ивановых"
              />
            </label>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
            >
              {createMutation.isPending ? "Создаём…" : "Создать"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">Выбрать семью по id</h2>
          <form onSubmit={handleSelectById} className="mt-2 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="block text-sm text-muted">ID семьи</span>
              <input
                type="text"
                value={familyIdInput}
                onChange={(e) => setFamilyIdInput(e.target.value)}
                className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground min-w-0"
                placeholder="uuid"
              />
            </label>
            <button
              type="submit"
              disabled={!familyIdInput.trim()}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground hover:bg-muted/30 disabled:opacity-50"
            >
              Выбрать
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
