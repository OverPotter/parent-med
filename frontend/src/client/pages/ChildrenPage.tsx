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
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

type ChildProfileDetails = {
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

export function ChildrenPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).childrenPage;
  const common = getChildrenCopy(language).common;
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
        <h1 className="app-title">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        compactOnMobile
        hideOnMobile
        className="children-intro-hero"
        action={
          <button
            type="button"
            onClick={() => setIsCreateFormOpen((current) => !current)}
            className={[
              "soft-button-primary app-btn-primary-md w-full sm:w-auto",
              children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
            ].join(" ")}
          >
            {isCreateFormOpen ? copy.hideForm : copy.addChild}
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
          copy={copy}
          language={language}
        />
      )}

      {isLoading && <p className="text-muted">{common.loading}</p>}
      {error && (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? copy.loadError}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && !isCreateFormOpen && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>{copy.empty}</p>
            <button
              type="button"
              onClick={() => setIsCreateFormOpen(true)}
              className="soft-button-primary app-btn-primary-md w-full sm:w-auto"
            >
              {copy.addFirstChild}
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
                  copy={copy}
                  language={language}
                  t={t}
                />
              );
            })}
          </ul>

          {!isCreateFormOpen && (
            <Surface className="soft-panel-muted p-4 sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-card-title">{copy.addAnotherPromptTitle}</p>
                  <p className="mt-1 text-sm text-muted">{copy.addAnotherPromptText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen(true)}
                  className="soft-button-secondary app-btn-secondary-md"
                >
                  {copy.addButtonShort}
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
  copy,
  language,
}: {
  onSubmit: (name: string, birthDate?: string | null, details?: ChildProfileDetails) => void;
  isPending: boolean;
  resetKey: number;
  errorMessage: string | null;
  onCancel: () => void;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"];
  language: "ru" | "en";
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
      setValidationError(copy.validationBirthDate);
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
    <Surface className="app-section-surface">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="app-card-title">{copy.formTitle}</h2>
            <p className="mt-1 text-sm text-muted">{copy.formSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="soft-button-secondary app-btn-secondary-md w-full sm:w-auto"
          >
            {copy.cancel}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="min-w-0 flex-1">
            <span className="soft-field-label">{copy.nameLabel}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError(null);
              }}
              className="soft-input w-full px-4"
              placeholder={copy.namePlaceholder}
            />
          </label>
          <label className="block">
            <span className="soft-field-label">{copy.birthDateLabel}</span>
            <DateField
              value={birthDate}
              onChange={(nextValue) => {
                setBirthDate(nextValue);
                setValidationError(null);
              }}
              language={language}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-1"
            />
          </label>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="soft-button-primary app-btn-primary-md inline-flex w-full disabled:opacity-50 sm:w-auto sm:self-end"
          >
            {isPending ? copy.saving : copy.addButtonShort}
          </button>
        </div>
        <details className="soft-panel-muted rounded-[22px] p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
            {language === "ru" ? "Медицинские и контактные данные" : "Medical and contact details"}
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InputField
              label={copy.institutionNameLabel}
              value={institutionName}
              onChange={setInstitutionName}
              placeholder={copy.institutionNamePlaceholder}
            />
            <InputField
              label={copy.institutionPhoneLabel}
              value={institutionPhone}
              onChange={setInstitutionPhone}
              placeholder={copy.institutionPhonePlaceholder}
            />
            <InputField
              label={copy.doctorNameLabel}
              value={doctorName}
              onChange={setDoctorName}
              placeholder={copy.doctorNamePlaceholder}
            />
            <InputField
              label={copy.doctorPhoneLabel}
              value={doctorPhone}
              onChange={setDoctorPhone}
              placeholder={copy.doctorPhonePlaceholder}
            />
            <TextField
              label={copy.allergiesLabel}
              value={allergies}
              onChange={setAllergies}
              placeholder={copy.allergiesPlaceholder}
            />
            <TextField
              label={copy.notesLabel}
              value={notes}
              onChange={setNotes}
              placeholder={copy.notesPlaceholder}
            />
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
  copy,
  language,
  t,
}: {
  child: Child;
  activeEpisodeStartedAt: string | null;
  episodeCount: number;
  latestWeightEntry: WeightEntry | null;
  onStartEpisode: () => void;
  isStartingEpisode: boolean;
  hasActiveEpisode: boolean;
  copy: ReturnType<typeof getChildrenCopy>["childrenPage"];
  language: "ru" | "en";
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const latestWeightLabel = latestWeightEntry
    ? formatWeightValue(latestWeightEntry.valueKg, language)
    : null;
  const primaryMeta = [
    ageLabel,
    latestWeightLabel ? `${copy.childCard.weight} ${latestWeightLabel}` : null,
  ].filter(Boolean) as string[];
  const historyLabel =
    episodeCount > 0 ? t(copy.childCard.historyCount, { count: episodeCount }) : null;
  return (
    <li>
      <RowSurface
        className={`children-card-hero ${hasActiveEpisode ? "children-card-hero--active" : ""}`}
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="app-card-title">{child.name}</h2>
                {hasActiveEpisode && (
                  <>
                    <span className="soft-pill-danger rounded-full px-2.5 py-1 text-xs">
                      {activeEpisodeStartedAt
                        ? t(copy.childCard.activeSince, {
                            date: formatDate(activeEpisodeStartedAt),
                          })
                        : copy.childCard.activeObservation}
                    </span>
                  </>
                )}
              </div>
              {historyLabel ? (
                <span className="landing-child-pill hidden rounded-full px-3.5 py-1.5 text-sm sm:inline-flex">
                  {historyLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {primaryMeta.map((chip) => (
                <span key={chip} className="landing-child-pill rounded-full px-3.5 py-1.5 text-sm">
                  {chip}
                </span>
              ))}
              {historyLabel ? (
                <span className="landing-child-pill rounded-full px-3.5 py-1.5 text-sm sm:hidden">
                  {historyLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid w-full gap-2 sm:w-[13.75rem] sm:shrink-0">
            <button
              type="button"
              onClick={onStartEpisode}
              disabled={isStartingEpisode}
              className="soft-button-primary app-btn-primary-md inline-flex w-full text-center leading-[1.05] disabled:opacity-50"
            >
              {hasActiveEpisode
                ? copy.childCard.openObservation
                : isStartingEpisode
                  ? commonLoading(language)
                  : copy.childCard.startObservation}
            </button>

            <Link
              to={`/children/${child.id}`}
              className="soft-button-secondary app-btn-secondary-md inline-flex text-center leading-[1.05]"
            >
              {copy.childCard.profile}
            </Link>
          </div>
        </div>
      </RowSurface>
    </li>
  );
}

function formatWeightValue(valueKg: number, language: "ru" | "en"): string {
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} kg`;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="soft-field-label">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="soft-input w-full px-4"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="soft-field-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="soft-input w-full px-4"
        placeholder={placeholder}
      />
    </label>
  );
}

function commonLoading(language: "ru" | "en") {
  return language === "ru" ? "Открываем…" : "Opening…";
}
