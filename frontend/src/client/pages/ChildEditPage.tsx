import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChild, fetchChild, updateChild } from "@shared/api/children";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { getLocalIsoDate } from "@shared/utils/date";
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

const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";
const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5";
const appBtnDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex items-center justify-center px-4";

export function ChildEditPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      birthDate,
      details,
    }: {
      id: string;
      name: string;
      birthDate?: string | null;
      details?: ChildProfileDetails;
    }) => updateChild(id, name, birthDate, details),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child", variables.id] });
      navigate(`/children/${variables.id}`, { replace: true });
    },
  });

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

  return (
    <div className="min-w-0 space-y-6">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={language === "ru" ? `Удалить ребёнка · ${child.name}` : `Delete child · ${child.name}`}
        description={copy.deleteDescription}
        confirmLabel={deleteMutation.isPending ? copy.deleting : copy.deleteConfirm}
        cancelLabel={copy.deleteCancel}
        confirmTone="danger"
        isPending={deleteMutation.isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() =>
          deleteMutation.mutate(child.id, { onSuccess: () => setIsDeleteConfirmOpen(false) })
        }
      />

      <div className="px-1">
        <Link
          to={`/children/${child.id}`}
          className="inline-flex text-sm text-primary hover:underline"
        >
          {language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        </Link>
      </div>

      <PageIntro title={copy.form.title} subtitle={copy.form.subtitle} hideOnMobile />

      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-2 text-[1.42rem] tracking-[-0.04em]">{copy.form.title}</h1>
          <p className="text-sm text-muted">{copy.form.subtitle}</p>
        </Surface>
      </div>

      <EditChildProfileForm
        child={child}
        onSave={(name, birthDate, details) =>
          updateMutation.mutate({ id: child.id, name, birthDate, details })
        }
        onRequestDeleteConfirm={() => setIsDeleteConfirmOpen(true)}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        copy={copy}
        language={language}
      />
    </div>
  );
}

function EditChildProfileForm({
  child,
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
    babyModeEnabled: boolean;
  };
  onSave: (name: string, birthDate?: string | null, details?: ChildProfileDetails) => void;
  onRequestDeleteConfirm: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  copy: ReturnType<typeof getChildrenCopy>["childProfile"];
  language: "ru" | "en";
}) {
  const [draftName, setDraftName] = useState(child.name);
  const [draftBirthDate, setDraftBirthDate] = useState(child.birthDate ?? "");
  const [institutionName, setInstitutionName] = useState(child.institutionName ?? "");
  const [institutionPhone, setInstitutionPhone] = useState(child.institutionPhone ?? "");
  const [doctorName, setDoctorName] = useState(child.doctorName ?? "");
  const [doctorPhone, setDoctorPhone] = useState(child.doctorPhone ?? "");
  const [allergies, setAllergies] = useState(child.allergies ?? "");
  const [notes, setNotes] = useState(child.notes ?? "");
  const [babyModeEnabled, setBabyModeEnabled] = useState(child.babyModeEnabled);
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(child.allergies || child.notes));
  const [isContactsOpen, setIsContactsOpen] = useState(
    Boolean(
      child.institutionName || child.institutionPhone || child.doctorName || child.doctorPhone
    )
  );

  return (
    <Surface className="app-section-surface">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
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
              max={getLocalIsoDate()}
              className="w-full"
            />
          </label>
        </div>

        <div className="soft-panel rounded-[20px] px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="soft-field-label">{copy.form.babyModeLabel}</span>
              <span className="mt-1 block text-sm text-muted">{copy.form.babyModeHint}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={babyModeEnabled}
              onClick={() => setBabyModeEnabled((current) => !current)}
              className={[
                "relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors",
                babyModeEnabled
                  ? "border-primary/30 bg-primary/15"
                  : "border-border/70 bg-foreground/6",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-1 inline-block h-6 w-6 rounded-full shadow-sm transition-transform",
                  babyModeEnabled ? "translate-x-6 bg-primary" : "translate-x-0 bg-background",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="soft-panel-muted rounded-[22px] p-4">
          <button
            type="button"
            onClick={() => setIsNotesOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={isNotesOpen}
          >
            <span className="text-sm font-medium text-foreground">
              {language === "ru" ? "Аллергии и заметки" : "Allergies and notes"}
            </span>
            <span className="soft-pill rounded-full px-3 py-1 text-xs">
              {isNotesOpen
                ? language === "ru"
                  ? "Свернуть"
                  : "Collapse"
                : language === "ru"
                  ? "Открыть"
                  : "Open"}
            </span>
          </button>
          {isNotesOpen ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField label={copy.form.allergiesLabel} value={allergies} onChange={setAllergies} />
              <TextField label={copy.form.notesLabel} value={notes} onChange={setNotes} />
            </div>
          ) : null}
        </div>

        <div className="soft-panel-muted rounded-[22px] p-4">
          <button
            type="button"
            onClick={() => setIsContactsOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={isContactsOpen}
          >
            <span className="text-sm font-medium text-foreground">{copy.contactsSummary}</span>
            <span className="soft-pill rounded-full px-3 py-1 text-xs">
              {isContactsOpen
                ? language === "ru"
                  ? "Свернуть"
                  : "Collapse"
                : language === "ru"
                  ? "Открыть"
                  : "Open"}
            </span>
          </button>
          {isContactsOpen ? (
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
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() =>
              onSave(draftName.trim(), draftBirthDate || null, {
                babyModeEnabled,
                institutionName: institutionName.trim() || null,
                institutionPhone: institutionPhone.trim() || null,
                doctorName: doctorName.trim() || null,
                doctorPhone: doctorPhone.trim() || null,
                allergies: allergies.trim() || null,
                notes: notes.trim() || null,
              })
            }
            disabled={isSaving || !draftName.trim()}
            className={`${appBtnPrimaryClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:w-auto`}
          >
            {isSaving ? copy.form.saving : copy.form.save}
          </button>
          <Link
            to={`/children/${child.id}`}
            className={`${appBtnSecondaryClass} min-h-[2.95rem] w-full sm:w-auto`}
          >
            {copy.deleteCancel}
          </Link>
          <button
            type="button"
            onClick={onRequestDeleteConfirm}
            disabled={isDeleting || isSaving}
            className={`${appBtnDangerClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:ml-auto sm:w-auto`}
          >
            {isDeleting ? copy.deleting : copy.form.delete}
          </button>
        </div>
      </div>
    </Surface>
  );
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
