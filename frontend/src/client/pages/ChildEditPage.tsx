import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChild, fetchChild, updateChild } from "@shared/api/children";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { canEditChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { isChildLockedByPlan } from "@shared/subscription/childPlanAccess";
import { getLocalIsoDate } from "@shared/utils/date";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { getChildrenCopy } from "@client/i18n/children";
import { scrollFieldIntoView } from "@shared/utils/focus";

type ChildProfileDetails = {
  babyModeEnabled?: boolean;
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

const appBtnPrimaryClass = "soft-pill-primary app-profile-action app-profile-action--selected";
const appBtnDangerClass = "soft-pill-danger app-profile-action";

export function ChildEditPage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canEditProfile =
    !!childId && canEditChild(childId, accountFamilyRole, accountAccessPolicy);
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    staleTime: 60 * 1000,
  });
  const planLocksChildActions = childId ? isChildLockedByPlan(childId, familyAccess) : false;

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      scrollFieldIntoView(event.target, { delayMs: 120, block: "center" });
    };

    page.addEventListener("focusin", handleFocusIn);
    return () => page.removeEventListener("focusin", handleFocusIn);
  }, []);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canEditProfile,
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

  if (!childId || !canEditProfile || planLocksChildActions) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  return (
    <div
      ref={pageRef}
      className="child-profile-shell min-h-[100dvh] space-y-6"
      style={{
        scrollPaddingBottom:
          "calc(7.5rem + var(--app-keyboard-height, 0px) + max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))))",
      }}
    >
      <IosEdgeBackGesture
        isEnabled={isIosShell}
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        targetRef={pageRef}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={
          language === "ru" ? `Удалить ребёнка · ${child.name}` : `Delete child · ${child.name}`
        }
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

      <ChildSectionTopBar
        onBack={() => navigate(`/children/${child.id}`, { replace: true })}
        backLabel={language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        title={`${copy.form.title} · ${child.name}`}
        hint={copy.form.subtitle}
      />

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
  const [allergies, setAllergies] = useState(child.allergies ?? "");
  const [notes, setNotes] = useState(child.notes ?? "");
  const [babyModeEnabled, setBabyModeEnabled] = useState(child.babyModeEnabled);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  return (
    <Surface className="app-section-surface mx-auto w-full max-w-2xl pt-2">
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
                "baby-mode-switch relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
        </div>

        <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
          <button
            type="button"
            onClick={() => setIsNotesOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={isNotesOpen}
          >
            <span className="text-sm font-medium text-foreground">
              {language === "ru" ? "Аллергии и заметки" : "Allergies and notes"}
            </span>
            <span className="soft-pill app-profile-action min-h-[2.1rem] px-3 py-1 text-xs">
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
              <TextField
                label={copy.form.allergiesLabel}
                value={allergies}
                onChange={setAllergies}
              />
              <TextField label={copy.form.notesLabel} value={notes} onChange={setNotes} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/70 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() =>
                onSave(draftName.trim(), draftBirthDate || null, {
                  babyModeEnabled,
                  allergies: allergies.trim() || null,
                  notes: notes.trim() || null,
                })
              }
              disabled={isSaving || !draftName.trim()}
              className={`${appBtnPrimaryClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:w-auto`}
            >
              {isSaving ? copy.form.saving : copy.form.save}
            </button>
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
      </div>
    </Surface>
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
