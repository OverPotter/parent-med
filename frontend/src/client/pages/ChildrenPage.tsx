/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChild, fetchChildrenByFamilyId } from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodesByChildId,
} from "@shared/api/illnessEpisodes";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { DateField } from "@shared/components/DateField";
import { trackChildCreated } from "@shared/analytics";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";

type ChildProfileDetails = {
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

export function ChildrenPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [createFormResetKey, setCreateFormResetKey] = useState(0);
  const liveQueryOptions = useLiveQueryOptions(10000);

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const historyQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const latestWeightQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["weight-entry-latest", child.id],
      queryFn: () => fetchLatestWeightEntryByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const createMutation = useMutation({
    mutationFn: ({
      name,
      birthDate,
      details,
    }: {
      name: string;
      birthDate?: string | null;
      details?: ChildProfileDetails;
    }) => createChild(currentFamilyId!, name, birthDate, details),
    onSuccess: (child) => {
      queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] });
      setCreateFormResetKey((current) => current + 1);
      setIsCreateFormOpen(false);
      void trackChildCreated(child.id);
    },
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="app-title text-[1.9rem]">Дети</h1>
        <p className="mt-2 text-muted">Сначала выбери семью на странице «Семья».</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title="Дети"
        subtitle="Профили детей, быстрый вход в текущее наблюдение и архив прошлых записей без лишнего шума."
        compactOnMobile
        action={
          <button
            type="button"
            onClick={() => setIsCreateFormOpen((current) => !current)}
            className={[
              "soft-button-primary inline-flex items-center justify-center min-h-[2.95rem] w-full px-4 text-[0.88rem] tracking-[-0.03em] sm:min-h-[3.15rem] sm:w-auto sm:px-5 sm:text-[0.93rem]",
              children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
            ].join(" ")}
          >
            {isCreateFormOpen ? "Скрыть форму" : "Добавить ребёнка"}
          </button>
        }
      />

      {isCreateFormOpen && (
        <AddChildForm
          onSubmit={(name, birthDate, details) =>
            createMutation.mutate({ name, birthDate, details })
          }
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
        <p className="soft-note-danger">{(error as { message?: string }).message ?? "Ошибка загрузки"}</p>
      )}
      {!isLoading && !error && children.length === 0 && !isCreateFormOpen && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>Пока нет детей. Добавьте первого ребёнка, чтобы вести записи и наблюдение.</p>
            <button
              type="button"
              onClick={() => setIsCreateFormOpen(true)}
              className="soft-button-primary inline-flex items-center justify-center min-h-[2.95rem] w-full px-4 text-[0.88rem] tracking-[-0.03em] sm:min-h-[3.15rem] sm:w-auto sm:px-5 sm:text-[0.93rem]"
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
                  activeEpisodeStartedAt={activeEpisode?.startedAt ?? null}
                  episodeCount={episodes.length}
                  latestWeightEntry={latestWeightQueries[index]?.data ?? null}
                  onStartEpisode={() => {
                    if (activeEpisode) {
                      navigate("/illnesses/active");
                      return;
                    }
                    navigate(`/children/${child.id}/illness?mode=create`);
                  }}
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
                  <p className="app-card-title text-[1.02rem]">Нужно добавить ещё ребёнка?</p>
                  <p className="mt-1 text-sm text-muted">Добавьте профиль, когда будете готовы.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen(true)}
                  className="soft-button-secondary inline-flex items-center justify-center min-h-[2.8rem] px-3.5 text-[0.84rem] tracking-[-0.025em]"
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
  onSubmit: (name: string, birthDate?: string | null, details?: ChildProfileDetails) => void;
  isPending: boolean;
  resetKey: number;
  errorMessage: string | null;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionPhone, setInstitutionPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setName("");
    setBirthDate("");
    setInstitutionName("");
    setInstitutionPhone("");
    setDoctorName("");
    setDoctorPhone("");
    setAllergies("");
    setNotes("");
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
    onSubmit(name.trim(), normalizedBirthDate ?? undefined, {
      institutionName: institutionName.trim() || null,
      institutionPhone: institutionPhone.trim() || null,
      doctorName: doctorName.trim() || null,
      doctorPhone: doctorPhone.trim() || null,
      allergies: allergies.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <Surface className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="app-card-title text-[1.1rem] sm:text-[1.18rem]">Новый ребёнок</h2>
            <p className="mt-1 text-sm text-muted">Форма открывается только когда она нужна.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="soft-button-secondary min-h-[3rem] w-full px-4 text-[0.9rem] sm:min-h-[3.2rem] sm:w-auto sm:text-[0.94rem]"
          >
            Отмена
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="min-w-0 flex-1">
            <span className="soft-field-label">Имя</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError(null);
              }}
              className="soft-input w-full px-4"
            />
          </label>
          <label className="block">
            <span className="soft-field-label">Дата рождения</span>
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
            className="soft-button-primary inline-flex items-center justify-center min-h-[3rem] w-full px-4 text-[0.88rem] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.15rem] sm:w-auto sm:self-end sm:px-5 sm:text-[0.93rem]"
          >
            {isPending ? "Добавляем…" : "Добавить"}
          </button>
        </div>
        <details className="soft-panel-muted rounded-[22px] p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
            Медицинские и контактные данные
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InputField label="Сад / школа" value={institutionName} onChange={setInstitutionName} />
            <InputField
              label="Телефон организации"
              value={institutionPhone}
              onChange={setInstitutionPhone}
            />
            <InputField label="Врач" value={doctorName} onChange={setDoctorName} />
            <InputField label="Телефон врача" value={doctorPhone} onChange={setDoctorPhone} />
            <TextField label="Аллергии" value={allergies} onChange={setAllergies} />
            <TextField label="Заметки" value={notes} onChange={setNotes} />
          </div>
        </details>
        {(validationError || errorMessage) && (
          <p className="soft-note-danger">{validationError ?? errorMessage}</p>
        )}
      </form>
    </Surface>
  );
}

function ChildCard({
  child,
  activeEpisodeStartedAt,
  episodeCount,
  latestWeightEntry,
  onStartEpisode,
  isStartingEpisode,
  hasActiveEpisode,
}: {
  child: Child;
  activeEpisodeStartedAt: string | null;
  episodeCount: number;
  latestWeightEntry: WeightEntry | null;
  onStartEpisode: () => void;
  isStartingEpisode: boolean;
  hasActiveEpisode: boolean;
}) {
  const latestWeightLabel = latestWeightEntry ? formatWeightValue(latestWeightEntry.valueKg) : null;
  const primaryMeta = [
    child.ageLabel,
    latestWeightLabel ? `Вес ${latestWeightLabel}` : null,
  ].filter(Boolean) as string[];
  const historyLabel = episodeCount > 0 ? `${episodeCount} в истории` : "История пустая";
  return (
    <li>
      <RowSurface
        className={hasActiveEpisode ? "soft-card-status-danger" : "soft-card-status-success"}
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="app-card-title text-[1.12rem] sm:text-[1.18rem]">{child.name}</h2>
                {hasActiveEpisode && (
                  <>
                    <span className="soft-pill-danger rounded-full px-2.5 py-1 text-xs">
                      {activeEpisodeStartedAt
                        ? `Наблюдение с ${formatDate(activeEpisodeStartedAt)}`
                        : "Наблюдение"}
                    </span>
                  </>
                )}
              </div>
              <span className="soft-pill hidden rounded-full px-3 py-1 text-xs sm:inline-flex">
                {historyLabel}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {primaryMeta.map((chip) => (
                <span key={chip} className="soft-pill rounded-full px-3 py-1 text-xs">
                  {chip}
                </span>
              ))}
              <span className="soft-pill rounded-full px-3 py-1 text-xs sm:hidden">
                {historyLabel}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:w-[12rem] sm:shrink-0">
            <button
              type="button"
              onClick={onStartEpisode}
              disabled={isStartingEpisode}
              className="soft-button-primary inline-flex w-full items-center justify-center min-h-[2.9rem] px-3.5 text-center text-[0.84rem] leading-[1.05] tracking-[-0.03em] disabled:opacity-50 sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
            >
              {hasActiveEpisode
                ? "К активным болезням"
                : isStartingEpisode
                  ? "Открываем…"
                  : "Начать наблюдение"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/children/${child.id}/illness?view=history`}
                className="soft-button-secondary inline-flex min-h-[2.7rem] items-center justify-center px-3 text-center text-[0.8rem] leading-none tracking-[-0.025em] sm:min-h-[2.9rem] sm:px-3.5 sm:text-[0.85rem]"
              >
                История
              </Link>
              <Link
                to={`/children/${child.id}`}
                className="soft-button-secondary inline-flex min-h-[2.7rem] items-center justify-center px-3 text-center text-[0.8rem] leading-none tracking-[-0.025em] sm:min-h-[2.9rem] sm:px-3.5 sm:text-[0.85rem]"
              >
                Профиль
              </Link>
            </div>
          </div>
        </div>
      </RowSurface>
    </li>
  );
}

function formatWeightValue(valueKg: number): string {
  return `${new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} кг`;
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="soft-field-label">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="soft-input w-full px-4"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="soft-field-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="soft-input w-full px-4"
      />
    </label>
  );
}
