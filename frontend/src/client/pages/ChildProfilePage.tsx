import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChild, fetchChild, updateChild } from "@shared/api/children";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
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
    }: {
      id: string;
      name: string;
      birthDate?: string | null;
      details?: ChildProfileDetails;
    }) => updateChild(id, name, birthDate, details),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", variables.id] });
      setIsEditing(false);
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
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={child.name}
        subtitle="Профиль ребёнка с основными данными, контактами и заметками для семьи."
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
            >
              {isEditing ? "Закрыть" : "Редактировать"}
            </button>
          </div>
        }
      />

      <Surface className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ProfileStat label="Возраст" value={child.ageLabel ?? "Не указан"} />
          <ProfileStat
            label="Дата рождения"
            value={child.birthDate ? formatDate(child.birthDate) : "Не указана"}
          />
          <ProfileStat
            label="Последний вес"
            value={latestWeight ? formatWeightValue(latestWeight.valueKg) : "Пока нет записи"}
          />
        </div>
      </Surface>

      <Surface className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="app-card-title text-lg">Данные профиля</h2>
          <p className="mt-1 text-sm text-muted">
            Контакты, важные пометки и всё, что не нужно держать в списке детей.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {child.institutionName && <InfoLine label="Сад / школа" value={child.institutionName} />}
          {child.institutionPhone && (
            <InfoLine label="Телефон организации" value={child.institutionPhone} />
          )}
          {child.doctorName && <InfoLine label="Врач" value={child.doctorName} />}
          {child.doctorPhone && <InfoLine label="Телефон врача" value={child.doctorPhone} />}
          {child.allergies && <InfoLine label="Аллергии" value={child.allergies} />}
          {child.notes && <InfoLine label="Заметки" value={child.notes} fullWidth />}
          {!hasProfileDetails(child, latestWeight) && (
            <div className="soft-panel-muted rounded-[18px] px-4 py-3 sm:col-span-2">
              <p className="text-sm text-muted">Дополнительные данные пока не заполнены.</p>
            </div>
          )}
        </div>
      </Surface>

      {isEditing && (
        <EditChildProfileForm
          child={child}
          latestWeight={latestWeight}
          onSave={(name, birthDate, details) =>
            updateMutation.mutate({ id: child.id, name, birthDate, details })
          }
          onDelete={() => deleteMutation.mutate(child.id)}
          isSaving={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      )}
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
  onSave: (name: string, birthDate?: string | null, details?: ChildProfileDetails) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [draftName, setDraftName] = useState(child.name);
  const [draftBirthDate, setDraftBirthDate] = useState(child.birthDate ?? "");
  const [institutionName, setInstitutionName] = useState(child.institutionName ?? "");
  const [institutionPhone, setInstitutionPhone] = useState(child.institutionPhone ?? "");
  const [doctorName, setDoctorName] = useState(child.doctorName ?? "");
  const [doctorPhone, setDoctorPhone] = useState(child.doctorPhone ?? "");
  const [allergies, setAllergies] = useState(child.allergies ?? "");
  const [notes, setNotes] = useState(child.notes ?? "");

  useEffect(() => {
    setDraftName(child.name);
    setDraftBirthDate(child.birthDate ?? "");
    setInstitutionName(child.institutionName ?? "");
    setInstitutionPhone(child.institutionPhone ?? "");
    setDoctorName(child.doctorName ?? "");
    setDoctorPhone(child.doctorPhone ?? "");
    setAllergies(child.allergies ?? "");
    setNotes(child.notes ?? "");
  }, [child]);

  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="app-card-title text-lg">Редактирование профиля</h2>
          <p className="mt-1 text-sm text-muted">
            Вес меняется в журнале болезни. Здесь редактируются профильные данные.
          </p>
        </div>
        {latestWeight && (
          <span className="soft-pill rounded-full px-3 py-1 text-xs">
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
        <button
          type="button"
          onClick={() =>
            onSave(draftName.trim(), draftBirthDate || null, {
              institutionName: institutionName.trim() || null,
              institutionPhone: institutionPhone.trim() || null,
              doctorName: doctorName.trim() || null,
              doctorPhone: doctorPhone.trim() || null,
              allergies: allergies.trim() || null,
              notes: notes.trim() || null,
            })
          }
          disabled={isSaving || !draftName.trim()}
          className="soft-button-primary w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-50 sm:col-span-2 xl:col-span-1 xl:self-end"
        >
          {isSaving ? "Сохраняем…" : "Сохранить"}
        </button>
        <div className="sm:col-span-2 xl:col-span-3 grid gap-3 sm:grid-cols-2">
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
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel-muted rounded-[18px] px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
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
