/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  fetchIllnessEpisodesByChildId,
  fetchActiveIllnessEpisodeByChildId,
  createIllnessEpisode,
  updateIllnessEpisode,
} from "@shared/api/illnessEpisodes";
import {
  fetchTemperatureEntriesByEpisodeId,
  createTemperatureEntry,
} from "@shared/api/temperatureEntries";
import {
  fetchAdministrationEventsByEpisodeId,
  createAdministrationEvent,
} from "@shared/api/administrationEvents";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { useAppStore } from "@shared/store/useAppStore";
import { formatDate, formatDateTime } from "@shared/utils/date";

export function ChildIllnessPage() {
  const { childId } = useParams<{ childId: string }>();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId,
  });

  const { data: activeEpisode } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId,
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (startedAt: string) =>
      createIllnessEpisode({ child_id: childId!, started_at: startedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
    },
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => updateIllnessEpisode(episodeId, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
    },
  });

  if (!childId || childLoading || !child) {
    return (
      <div>
        <p className="text-muted">Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Link to="/children" className="text-sm text-primary hover:underline">
        ← К списку детей
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
        Болезни: {child.name}
      </h1>

      {!currentFamilyId && (
        <p className="mt-2 text-muted">Семья не выбрана. Выберите семью на странице «Семья».</p>
      )}

      <CreateEpisodeForm
        onSubmit={(startedAt) => createEpisodeMutation.mutate(startedAt)}
        isPending={createEpisodeMutation.isPending}
        hasActive={!!activeEpisode}
      />

      {activeEpisode && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Активный эпизод</h2>
          <EpisodeBlock
            episodeId={activeEpisode.id}
            startedAt={activeEpisode.startedAt}
            status={activeEpisode.status}
            onClose={() => closeEpisodeMutation.mutate(activeEpisode.id)}
            familyId={currentFamilyId}
          />
        </section>
      )}

      {episodes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Все эпизоды</h2>
          <ul className="mt-2 space-y-2">
            {episodes.map((ep) => (
              <li key={ep.id} className="rounded-lg border border-border p-3">
                <span className="text-foreground">
                  {formatDate(ep.startedAt)} — {ep.status}
                </span>
                {ep.status === "active" && (
                  <EpisodeBlock
                    episodeId={ep.id}
                    startedAt={ep.startedAt}
                    status={ep.status}
                    onClose={() => closeEpisodeMutation.mutate(ep.id)}
                    familyId={currentFamilyId ?? null}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CreateEpisodeForm({
  onSubmit,
  isPending,
  hasActive,
}: {
  onSubmit: (startedAt: string) => void;
  isPending: boolean;
  hasActive: boolean;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startedAt) return;
    onSubmit(startedAt);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
    >
      <label>
        <span className="block text-sm text-muted">Дата начала</span>
        <input
          type="date"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || hasActive}
        className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
      >
        {hasActive ? "Есть активный эпизод" : isPending ? "Создаём…" : "Новый эпизод"}
      </button>
    </form>
  );
}

function EpisodeBlock({
  episodeId,
  status,
  onClose,
  familyId,
}: {
  episodeId: string;
  startedAt: string;
  status: string;
  onClose: () => void;
  familyId: string | null;
}) {
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);

  const { data: temps = [] } = useQuery({
    queryKey: ["temperature-entries", episodeId],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episodeId),
    enabled: !!episodeId,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episodeId],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episodeId),
    enabled: !!episodeId,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!familyId && !!accountId,
  });
  const usableHouseholdMedicines = householdMedicines.filter(
    (medicine) => medicine.status !== "expired" && medicine.status !== "expired_after_opening"
  );

  const addTempMutation = useMutation({
    mutationFn: (valueCelsius: number) =>
      createTemperatureEntry({ episode_id: episodeId, value_celsius: valueCelsius }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["temperature-entries", episodeId] }),
  });

  const addAdminMutation = useMutation({
    mutationFn: (p: { household_medicine_id: string; amount: string }) =>
      createAdministrationEvent({
        episode_id: episodeId,
        household_medicine_id: p.household_medicine_id,
        amount: p.amount,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["administration-events", episodeId] }),
  });

  const [tempValue, setTempValue] = useState("");
  const [adminMedicineId, setAdminMedicineId] = useState("");
  const [adminAmount, setAdminAmount] = useState("");

  return (
    <div className="mt-3 space-y-4 pl-0 sm:pl-2">
      {status === "active" && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/30"
        >
          Закрыть эпизод
        </button>
      )}

      <div>
        <h3 className="text-sm font-medium text-foreground">Температура</h3>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            type="number"
            step={0.1}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="36.6"
            className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-foreground"
          />
          <button
            type="button"
            onClick={() => {
              const v = parseFloat(tempValue);
              if (!Number.isNaN(v)) {
                addTempMutation.mutate(v);
                setTempValue("");
              }
            }}
            disabled={addTempMutation.isPending || !tempValue}
            className="rounded-lg bg-primary px-3 py-1 text-sm text-white hover:bg-primary-focus disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
        <ul className="mt-2 text-sm text-muted">
          {temps.map((t) => (
            <li key={t.id}>
              {t.valueCelsius} °C — {formatDateTime(t.measuredAt)}
            </li>
          ))}
        </ul>
      </div>

      {status === "active" && familyId && (
        <div>
          <h3 className="text-sm font-medium text-foreground">Приём лекарства</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <select
              value={adminMedicineId}
              onChange={(e) => setAdminMedicineId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-foreground max-w-xs"
            >
              <option value="">Выберите упаковку</option>
              {usableHouseholdMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.medicineName} · {m.statusLabel} · до {formatDate(m.expiryDate)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={adminAmount}
              onChange={(e) => setAdminAmount(e.target.value)}
              placeholder="5 мл"
              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-foreground"
            />
            <button
              type="button"
              onClick={() => {
                if (adminMedicineId && adminAmount.trim()) {
                  addAdminMutation.mutate({
                    household_medicine_id: adminMedicineId,
                    amount: adminAmount.trim(),
                  });
                  setAdminMedicineId("");
                  setAdminAmount("");
                }
              }}
              disabled={addAdminMutation.isPending || !adminMedicineId || !adminAmount.trim()}
              className="rounded-lg bg-primary px-3 py-1 text-sm text-white hover:bg-primary-focus disabled:opacity-50"
            >
              Записать приём
            </button>
          </div>
          {usableHouseholdMedicines.length === 0 && (
            <p className="mt-1 text-sm text-muted">
              В аптечке нет доступных упаковок для приёма. Просроченные препараты скрыты.
            </p>
          )}
          {addAdminMutation.isError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {(addAdminMutation.error as { response?: { data?: { detail?: string } } }).response
                ?.data?.detail ?? "Ошибка (проверьте срок годности и вскрытие — Safety Engine)"}
            </p>
          )}
          <ul className="mt-2 text-sm text-muted">
            {administrations.map((a) => (
              <li key={a.id}>
                {a.amount} — {formatDateTime(a.administeredAt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
