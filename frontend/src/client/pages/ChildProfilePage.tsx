import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChild, fetchChild, updateChild } from "@shared/api/children";
import { createWeightEntry, fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { useI18n } from "@shared/hooks/useI18n";
import { Surface } from "@shared/components/Surface";
import type { WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

type ChildProfileDetails = {
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";
const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5";
const appBtnDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex items-center justify-center px-4";

export function ChildProfilePage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      birthDate,
      details,
      weightKg,
    }: {
      id: string;
      name: string;
      birthDate?: string | null;
      details?: ChildProfileDetails;
      weightKg?: number | null;
    }) => {
      const updates: Promise<unknown>[] = [updateChild(id, name, birthDate, details)];

      if (weightKg !== null && weightKg !== undefined) {
        updates.push(
          createWeightEntry({
            child_id: id,
            value_kg: weightKg,
          })
        );
      }

      return Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", variables.id] });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (!isEditing || !editFormRef.current) {
      return;
    }

    editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isEditing]);

  const deleteMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      navigate("/children", { replace: true });
    },
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);

  return (
    <div className="min-w-0 space-y-6">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t(copy.deleteTitle, { name: child.name })}
        description={copy.deleteDescription}
        confirmLabel={deleteMutation.isPending ? copy.deleting : copy.deleteConfirm}
        confirmTone="danger"
        isPending={deleteMutation.isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() =>
          deleteMutation.mutate(child.id, { onSuccess: () => setIsDeleteConfirmOpen(false) })
        }
      />
      <div className="px-1">
        <Link to="/children" className="inline-flex text-sm text-primary hover:underline">
          {language === "ru" ? "← К детям" : "← Back to children"}
        </Link>
      </div>
      <PageIntro
        title={child.name}
        subtitle={undefined}
        eyebrow={undefined}
        hideOnMobile
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
            >
              {copy.history}
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
              aria-expanded={isEditing}
              aria-controls="child-profile-edit-form"
            >
              {isEditing ? copy.collapseForm : copy.editProfile}
            </button>
          </div>
        }
      />
      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-3 text-[1.42rem] tracking-[-0.04em]">{child.name}</h1>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full text-center sm:min-h-[3.05rem]`}
            >
              {copy.history}
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full sm:min-h-[3.05rem]`}
              aria-expanded={isEditing}
              aria-controls="child-profile-edit-form"
            >
              {isEditing ? copy.collapseForm : copy.editProfile}
            </button>
          </div>
        </Surface>
      </div>

      {isEditing && (
        <div ref={editFormRef}>
          <EditChildProfileForm
            child={child}
            latestWeight={latestWeight}
            onSave={(name, birthDate, details, weightKg) =>
              updateMutation.mutate({ id: child.id, name, birthDate, details, weightKg })
            }
            onRequestDeleteConfirm={() => setIsDeleteConfirmOpen(true)}
            isSaving={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            copy={copy}
            language={language}
          />
        </div>
      )}

      <Surface className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="app-card-title">{copy.basic}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoLine label={copy.age} value={ageLabel ?? copy.ageMissing} />
          <InfoLine
            label={copy.birthDate}
            value={child.birthDate ? formatDate(child.birthDate) : copy.birthDateMissing}
          />
          <InfoLine
            label={copy.latestWeight}
            value={
              latestWeight
                ? formatWeightValue(latestWeight.valueKg, language)
                : copy.latestWeightMissing
            }
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {child.allergies && <InfoLine label={copy.allergies} value={child.allergies} />}
          {child.notes && <InfoLine label={copy.notes} value={child.notes} fullWidth />}
          {hasExtraContacts(child) && (
            <details className="soft-panel-muted rounded-[24px] px-4 py-4 sm:col-span-2">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                {copy.contactsSummary}
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {child.institutionName && (
                  <InfoLine label={copy.institution} value={child.institutionName} />
                )}
                {child.institutionPhone && (
                  <InfoLine label={copy.institutionPhone} value={child.institutionPhone} />
                )}
                {child.doctorName && <InfoLine label={copy.doctor} value={child.doctorName} />}
                {child.doctorPhone && (
                  <InfoLine label={copy.doctorPhone} value={child.doctorPhone} />
                )}
              </div>
            </details>
          )}
          {!hasProfileDetails(child, latestWeight) && (
            <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:col-span-2">
              <p className="text-sm text-muted">{copy.noExtra}</p>
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

function EditChildProfileForm({
  child,
  latestWeight,
  onSave,
  onRequestDeleteConfirm,
  isSaving,
  isDeleting,
  copy,
  language,
}: {
  child: {
    id: string;
    name: string;
    birthDate: string | null;
    institutionName: string | null;
    institutionPhone: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    allergies: string | null;
    notes: string | null;
  };
  latestWeight: WeightEntry | null;
  onSave: (
    name: string,
    birthDate?: string | null,
    details?: ChildProfileDetails,
    weightKg?: number | null
  ) => void;
  onRequestDeleteConfirm: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  copy: ReturnType<typeof getChildrenCopy>["childProfile"];
  language: "ru" | "en";
}) {
  const [draftName, setDraftName] = useState(child.name);
  const [draftBirthDate, setDraftBirthDate] = useState(child.birthDate ?? "");
  const [draftWeight, setDraftWeight] = useState(latestWeight ? String(latestWeight.valueKg) : "");
  const [institutionName, setInstitutionName] = useState(child.institutionName ?? "");
  const [institutionPhone, setInstitutionPhone] = useState(child.institutionPhone ?? "");
  const [doctorName, setDoctorName] = useState(child.doctorName ?? "");
  const [doctorPhone, setDoctorPhone] = useState(child.doctorPhone ?? "");
  const [allergies, setAllergies] = useState(child.allergies ?? "");
  const [notes, setNotes] = useState(child.notes ?? "");

  useEffect(() => {
    setDraftName(child.name);
    setDraftBirthDate(child.birthDate ?? "");
    setDraftWeight(latestWeight ? String(latestWeight.valueKg) : "");
    setInstitutionName(child.institutionName ?? "");
    setInstitutionPhone(child.institutionPhone ?? "");
    setDoctorName(child.doctorName ?? "");
    setDoctorPhone(child.doctorPhone ?? "");
    setAllergies(child.allergies ?? "");
    setNotes(child.notes ?? "");
  }, [child, latestWeight]);

  const parsedWeight = parseDraftWeight(draftWeight);
  const latestWeightValue = latestWeight?.valueKg ?? null;
  const shouldSaveWeight =
    parsedWeight !== null &&
    (latestWeightValue === null || Math.abs(parsedWeight - latestWeightValue) >= 0.1);

  return (
    <div id="child-profile-edit-form">
      <Surface className="soft-hero border-primary/25 p-5 ring-1 ring-primary/10 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title">{copy.form.title}</h2>
            <p className="mt-1 text-sm text-muted">{copy.form.subtitle}</p>
          </div>
          {latestWeight && (
            <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
              {copy.latestWeight}: {formatWeightValue(latestWeight.valueKg, language)}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="block min-w-0 space-y-1.5">
            <span className="soft-field-label">{copy.form.nameLabel}</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="soft-input w-full px-4"
              placeholder={language === "ru" ? "Например: Миша" : "Example: Misha"}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="soft-field-label">{copy.form.birthDateLabel}</span>
            <DateField
              value={draftBirthDate}
              onChange={setDraftBirthDate}
              language={language}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="soft-field-label">{copy.form.weightLabel}</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draftWeight}
              onChange={(e) => setDraftWeight(e.target.value)}
              placeholder={copy.form.weightPlaceholder}
              className="soft-input w-full px-4"
            />
            <p className="soft-field-hint">
              {latestWeight
                ? `${copy.latestWeight}: ${formatWeightValue(latestWeight.valueKg, language)}`
                : language === "ru"
                  ? "Если заполнить вес, он сохранится как последняя запись."
                  : "If you add the weight, it will be saved as the latest entry."}
            </p>
          </label>
          <div className="sm:col-span-2 xl:col-span-3 grid gap-3 sm:grid-cols-2">
            <TextField label={copy.form.allergiesLabel} value={allergies} onChange={setAllergies} />
            <TextField label={copy.form.notesLabel} value={notes} onChange={setNotes} />
          </div>
          <details className="soft-panel sm:col-span-2 xl:col-span-3 rounded-[26px] p-4 sm:p-5">
            <summary className="cursor-pointer list-none text-sm font-medium tracking-[-0.02em] text-foreground">
              {copy.contactsSummary}
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InputField
                label={copy.form.institutionNameLabel}
                value={institutionName}
                onChange={setInstitutionName}
              />
              <InputField
                label={copy.form.institutionPhoneLabel}
                value={institutionPhone}
                onChange={setInstitutionPhone}
              />
              <InputField
                label={copy.form.doctorNameLabel}
                value={doctorName}
                onChange={setDoctorName}
              />
              <InputField
                label={copy.form.doctorPhoneLabel}
                value={doctorPhone}
                onChange={setDoctorPhone}
              />
            </div>
          </details>
          <div className="sm:col-span-2 xl:col-span-3 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
            <button
              type="button"
              onClick={() =>
                onSave(
                  draftName.trim(),
                  draftBirthDate || null,
                  {
                    institutionName: institutionName.trim() || null,
                    institutionPhone: institutionPhone.trim() || null,
                    doctorName: doctorName.trim() || null,
                    doctorPhone: doctorPhone.trim() || null,
                    allergies: allergies.trim() || null,
                    notes: notes.trim() || null,
                  },
                  shouldSaveWeight ? parsedWeight : null
                )
              }
              disabled={
                isSaving ||
                !draftName.trim() ||
                (draftWeight.trim().length > 0 && parsedWeight === null)
              }
              className={`${appBtnPrimaryClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:min-h-[3.1rem] sm:w-auto sm:px-5`}
            >
              {isSaving ? copy.form.saving : copy.form.save}
            </button>
            <button
              type="button"
              onClick={onRequestDeleteConfirm}
              disabled={isDeleting}
              className={`${appBtnDangerClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem]`}
            >
              {isDeleting ? copy.deleting : copy.form.delete}
            </button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function parseDraftWeight(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number(parsed.toFixed(1));
}

function hasProfileDetails(
  child: {
    birthDate: string | null;
    institutionName: string | null;
    institutionPhone: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    allergies: string | null;
    notes: string | null;
  },
  latestWeight: WeightEntry | null
) {
  return Boolean(
    child.birthDate ||
    child.institutionName ||
    child.institutionPhone ||
    child.doctorName ||
    child.doctorPhone ||
    child.allergies ||
    child.notes ||
    latestWeight
  );
}

function hasExtraContacts(child: {
  institutionName: string | null;
  institutionPhone: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
}) {
  return Boolean(
    child.institutionName || child.institutionPhone || child.doctorName || child.doctorPhone
  );
}

function formatWeightValue(valueKg: number, language: "ru" | "en"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
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
    <label className="block space-y-1.5">
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
    <label className="block space-y-1.5">
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

function InfoLine({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 leading-6 text-foreground">{value}</p>
    </div>
  );
}
