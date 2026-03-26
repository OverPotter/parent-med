import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChild, fetchChild, updateChild } from "@shared/api/children";
import { createWeightEntry, fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { DateField } from "@shared/components/DateField";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import type { WeightEntry } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";

type ChildProfileDetails = {
  institutionName?: string | null;
  institutionPhone?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

export function ChildProfilePage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={child.name}
        subtitle="Основные данные ребёнка, вес и семейные заметки в одном месте."
        eyebrow="Профиль ребёнка"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-center text-sm"
            >
              История
            </Link>
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
              aria-expanded={isEditing}
              aria-controls="child-profile-edit-form"
            >
              {isEditing ? "Свернуть форму" : "Редактировать профиль"}
            </button>
          </div>
        }
      />

      {isEditing && (
        <div ref={editFormRef}>
          <EditChildProfileForm
            child={child}
            latestWeight={latestWeight}
            onSave={(name, birthDate, details, weightKg) =>
              updateMutation.mutate({ id: child.id, name, birthDate, details, weightKg })
            }
            onDelete={() => deleteMutation.mutate(child.id)}
            isSaving={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        </div>
      )}

      <Surface className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="app-card-title text-[1.08rem]">Основное</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoLine label="Возраст" value={child.ageLabel ?? "Не указан"} />
          <InfoLine
            label="Дата рождения"
            value={child.birthDate ? formatDate(child.birthDate) : "Не указана"}
          />
          <InfoLine
            label="Последний вес"
            value={latestWeight ? formatWeightValue(latestWeight.valueKg) : "Пока нет записи"}
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {child.allergies && <InfoLine label="Аллергии" value={child.allergies} />}
          {child.notes && <InfoLine label="Заметки" value={child.notes} fullWidth />}
          {hasExtraContacts(child) && (
            <details className="soft-panel-muted rounded-[24px] px-4 py-3 sm:col-span-2">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                Сад, врач и дополнительные контакты
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {child.institutionName && (
                  <InfoLine label="Сад / школа" value={child.institutionName} />
                )}
                {child.institutionPhone && (
                  <InfoLine label="Телефон организации" value={child.institutionPhone} />
                )}
                {child.doctorName && <InfoLine label="Врач" value={child.doctorName} />}
                {child.doctorPhone && <InfoLine label="Телефон врача" value={child.doctorPhone} />}
              </div>
            </details>
          )}
          {!hasProfileDetails(child, latestWeight) && (
            <div className="soft-panel-muted rounded-[24px] px-4 py-3 sm:col-span-2">
              <p className="text-sm text-muted">Дополнительные данные пока не заполнены.</p>
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
  onDelete,
  isSaving,
  isDeleting,
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
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
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
      <Surface className="border-primary/35 p-5 ring-1 ring-primary/10 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="app-card-title text-[1.08rem]">Редактирование профиля</h2>
          </div>
          {latestWeight && (
            <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs">
              Последний вес: {formatWeightValue(latestWeight.valueKg)}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="block min-w-0">
            <span className="block text-sm text-muted">Имя</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Дата рождения</span>
            <DateField
              value={draftBirthDate}
              onChange={setDraftBirthDate}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Вес, кг</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draftWeight}
              onChange={(e) => setDraftWeight(e.target.value)}
              placeholder="Например: 14.2"
              className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
            />
            <p className="mt-2 text-xs text-muted">
              {latestWeight
                ? `Сейчас в профиле: ${formatWeightValue(latestWeight.valueKg)}`
                : "Если заполнить вес, он сохранится как последняя запись."}
            </p>
          </label>
          <div className="sm:col-span-2 xl:col-span-3 grid gap-3 sm:grid-cols-2">
            <TextField label="Аллергии" value={allergies} onChange={setAllergies} />
            <TextField label="Заметки" value={notes} onChange={setNotes} />
          </div>
          <details className="soft-panel-muted sm:col-span-2 xl:col-span-3 rounded-[22px] p-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
              Сад, врач и дополнительные контакты
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InputField
                label="Сад / школа"
                value={institutionName}
                onChange={setInstitutionName}
              />
              <InputField
                label="Телефон организации"
                value={institutionPhone}
                onChange={setInstitutionPhone}
              />
              <InputField label="Врач" value={doctorName} onChange={setDoctorName} />
              <InputField label="Телефон врача" value={doctorPhone} onChange={setDoctorPhone} />
            </div>
          </details>
          <div className="sm:col-span-2 xl:col-span-3 space-y-3 border-t border-border/70 pt-4">
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
              className="soft-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
            >
              {isSaving ? "Сохраняем…" : "Сохранить изменения"}
            </button>
          </div>
          <div className="sm:col-span-2 xl:col-span-3 flex justify-start pt-1">
            <button
              type="button"
              onClick={() => {
                const shouldDelete = window.confirm(
                  `Точно удалить ребёнка «${child.name}»? Это действие нельзя отменить.`
                );
                if (!shouldDelete) {
                  return;
                }
                onDelete();
              }}
              disabled={isDeleting}
              className="soft-button-danger rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {isDeleting ? "Удаляем…" : "Удалить ребёнка"}
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
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="soft-input w-full rounded-2xl px-4 py-3"
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
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="soft-input w-full rounded-2xl px-4 py-3"
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
