import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChild } from "@shared/api/children";
import { createHeightEntry } from "@shared/api/heightEntries";
import { createWeightEntry } from "@shared/api/weightEntries";
import { trackChildCreated } from "@shared/analytics";
import { DateField } from "@shared/components/DateField";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { getLocalIsoDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { getChildrenCopy } from "@client/i18n/children";

type ChildProfileDetails = {
  babyModeEnabled?: boolean;
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

export function ChildCreatePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childrenPage;
  const common = getChildrenCopy(language).common;
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [heightValue, setHeightValue] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionPhone, setInstitutionPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [babyModeEnabled, setBabyModeEnabled] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const parsedWeight = parseMeasurement(weightValue);
  const parsedHeight = parseMeasurement(heightValue);

  const createMutation = useMutation({
    mutationFn: ({
      childName,
      childBirthDate,
      childWeight,
      childHeight,
      details,
    }: {
      childName: string;
      childBirthDate?: string | null;
      childWeight?: number | null;
      childHeight?: number | null;
      details?: ChildProfileDetails;
    }) =>
      createChild(currentFamilyId!, childName, childBirthDate, details).then(async (child) => {
        const followUps: Promise<unknown>[] = [];
        if (childWeight !== null && childWeight !== undefined) {
          followUps.push(
            createWeightEntry({
              child_id: child.id,
              value_kg: childWeight,
            })
          );
        }
        if (childHeight !== null && childHeight !== undefined) {
          followUps.push(
            createHeightEntry({
              child_id: child.id,
              value_cm: childHeight,
            })
          );
        }
        if (followUps.length > 0) {
          await Promise.all(followUps);
        }
        return child;
      }),
    onSuccess: (child) => {
      queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] });
      void trackChildCreated(child.id);
      navigate("/children", { replace: true });
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    const normalizedBirthDate = normalizeIsoDateInput(birthDate);
    if (birthDate && !normalizedBirthDate) {
      setValidationError(copy.validationBirthDate);
      return;
    }
    if (weightValue.trim() && parsedWeight === null) {
      setValidationError(language === "ru" ? "Укажите корректный вес." : "Enter a valid weight.");
      return;
    }
    if (heightValue.trim() && parsedHeight === null) {
      setValidationError(language === "ru" ? "Укажите корректный рост." : "Enter a valid height.");
      return;
    }

    setValidationError(null);
    createMutation.mutate({
      childName: name.trim(),
      childBirthDate: normalizedBirthDate ?? undefined,
      childWeight: parsedWeight,
      childHeight: parsedHeight,
      details: {
        institutionName: institutionName.trim() || null,
        institutionPhone: institutionPhone.trim() || null,
        doctorName: doctorName.trim() || null,
        doctorPhone: doctorPhone.trim() || null,
        allergies: allergies.trim() || null,
        notes: notes.trim() || null,
        babyModeEnabled,
      },
    });
  };

  const apiError =
    (createMutation.error as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail ?? null;

  return (
    <div className="min-w-0 space-y-6">
      <ChildSectionTopBar
        backHref="/children"
        backLabel={language === "ru" ? "← К детям" : "← Back to children"}
      />

      <div className="space-y-1 px-1">
        <h1 className="app-card-title">
          {copy.formTitle} · {copy.title}
        </h1>
        <p className="text-sm leading-6 text-muted">{copy.formSubtitle}</p>
      </div>

      <Surface className="app-section-surface">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="min-w-0">
              <span className="soft-field-label">{copy.nameLabel}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
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
                max={getLocalIsoDate()}
                className="mt-1"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="soft-field-label">{copy.weightLabel}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={weightValue}
                onChange={(event) => {
                  setWeightValue(event.target.value);
                  setValidationError(null);
                }}
                className="soft-input mt-1 w-full px-4"
                placeholder={copy.weightPlaceholder}
              />
              <span className="mt-1 block text-xs text-muted">
                {language === "ru" ? "Необязательно" : "Optional"}
              </span>
            </label>
            <label className="block">
              <span className="soft-field-label">{copy.heightLabel}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={heightValue}
                onChange={(event) => {
                  setHeightValue(event.target.value);
                  setValidationError(null);
                }}
                className="soft-input mt-1 w-full px-4"
                placeholder={copy.heightPlaceholder}
              />
              <span className="mt-1 block text-xs text-muted">
                {language === "ru" ? "Необязательно" : "Optional"}
              </span>
            </label>
          </div>

          <div className="soft-panel rounded-[20px] px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="soft-field-label">{copy.babyModeLabel}</span>
                <span className="mt-1 block text-sm text-muted">{copy.babyModeHint}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={babyModeEnabled}
                onClick={() => setBabyModeEnabled((current) => !current)}
                className={[
                  "baby-mode-switch relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors",
                  babyModeEnabled ? "baby-mode-switch--active" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "baby-mode-switch__thumb absolute left-1 inline-block h-6 w-6 rounded-full transition-transform",
                    babyModeEnabled ? "translate-x-6" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={[
                  "soft-pill inline-flex rounded-full px-3 py-1 text-xs font-medium",
                  babyModeEnabled ? "border-primary/25 bg-primary/10 text-primary" : "text-muted",
                ].join(" ")}
              >
                {babyModeEnabled
                  ? language === "ru"
                    ? "Включён"
                    : "Enabled"
                  : language === "ru"
                    ? "Выключен"
                    : "Disabled"}
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            <button
              type="button"
              onClick={() => setIsDetailsOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isDetailsOpen}
            >
              <span className="text-sm font-medium text-foreground">
                {language === "ru"
                  ? "Медицинские и контактные данные"
                  : "Medical and contact details"}
              </span>
              <span className="soft-pill app-profile-action min-h-[2.1rem] px-3 py-1 text-xs">
                {isDetailsOpen
                  ? language === "ru"
                    ? "Свернуть"
                    : "Collapse"
                  : language === "ru"
                    ? "Открыть"
                    : "Open"}
              </span>
            </button>

            {isDetailsOpen ? (
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
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/children")}
              className="soft-pill app-profile-action min-h-[2.5rem] w-full sm:w-auto"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.5rem] w-full disabled:opacity-50 sm:w-auto"
            >
              {createMutation.isPending ? copy.saving : copy.addButtonShort}
            </button>
          </div>

          {(validationError || apiError) && (
            <p className="soft-note-danger">{validationError ?? apiError}</p>
          )}
        </form>
      </Surface>
    </div>
  );
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
  placeholder: string;
}) {
  return (
    <label className="block space-y-1.5">
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
  placeholder: string;
}) {
  return (
    <label className="block space-y-1.5">
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

function parseMeasurement(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
