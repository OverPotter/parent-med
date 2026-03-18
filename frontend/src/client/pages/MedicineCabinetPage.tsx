/**
 * Аптечка: список упаковок по семье, добавление (справочник + срок годности).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHouseholdMedicines,
  createHouseholdMedicine,
  deleteHouseholdMedicine,
  updateHouseholdMedicine,
} from "@shared/api/householdMedicines";
import { searchMedicineCatalog } from "@shared/api/medicineCatalog";
import { DateField } from "@shared/components/DateField";
import type { HouseholdMedicine, MedicineCatalogItem } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { useAppStore } from "@shared/store/useAppStore";

const STATUS_STYLES: Record<string, string> = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  expiring_soon: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  expiring_after_opening: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  expired: "border-red-500/40 bg-red-500/10 text-red-700",
  expired_after_opening: "border-red-500/40 bg-red-500/10 text-red-700",
};

export function MedicineCabinetPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"cabinet" | "add">("cabinet");
  const accountId = useAppStore((s) => s.accountId);

  const {
    data: medicines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMedicine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] }),
  });

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Аптечка</h1>
      <p className="mt-2 text-sm text-muted">
        Здесь хранятся реальные упаковки дома: срок годности, дата вскрытия и срок использования
        после вскрытия.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("add")}
          className={`rounded-lg px-4 py-2 text-sm ${
            view === "add"
              ? "bg-primary text-white"
              : "border border-border bg-background text-foreground hover:bg-muted/30"
          }`}
        >
          Добавить препарат
        </button>
        <button
          type="button"
          onClick={() => setView("cabinet")}
          className={`rounded-lg px-4 py-2 text-sm ${
            view === "cabinet"
              ? "bg-primary text-white"
              : "border border-border bg-background text-foreground hover:bg-muted/30"
          }`}
        >
          Наша аптечка
        </button>
      </div>

      {view === "add" ? (
        <AddHouseholdMedicineForm onCreated={() => setView("cabinet")} />
      ) : (
        <>
          {isLoading && <p className="mt-4 text-muted">Загрузка…</p>}
          {error && (
            <p className="mt-4 text-red-600 dark:text-red-400">
              {(error as { message?: string }).message ?? "Ошибка загрузки"}
            </p>
          )}
          {!isLoading && !error && medicines.length === 0 && (
            <p className="mt-4 text-muted">
              В аптечке пока нет препаратов. Переключитесь на «Добавить препарат».
            </p>
          )}
          {medicines.length > 0 && (
            <ul className="mt-6 space-y-3">
              {medicines.map((m) => (
                <MedicineItemCard key={m.id} medicine={m} onDelete={deleteMutation.mutate} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function isExpiredDate(value: string): boolean {
  if (!value) return false;
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}

function hasUnknownOpenedShelfLife(openedAt: string, openedShelfDays: string): boolean {
  return Boolean(openedAt && !openedShelfDays);
}

function getIntakeMessage(medicine: HouseholdMedicine): {
  text: string;
  className: string;
} {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return {
      text: "Принимать нельзя",
      className: "text-red-600",
    };
  }

  if (!medicine.openedAt) {
    return {
      text: "Дата вскрытия не указана. Если упаковка уже открыта, сначала укажите это.",
      className: "text-amber-700",
    };
  }

  return {
    text: "Принимать можно",
    className: "text-emerald-700",
  };
}

function AddHouseholdMedicineForm({ onCreated }: { onCreated: () => void }) {
  const [searchName, setSearchName] = useState("");
  const [catalogItem, setCatalogItem] = useState<MedicineCatalogItem | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [openedShelfDays, setOpenedShelfDays] = useState("");
  const [comment, setComment] = useState("");
  const [newMedicineName, setNewMedicineName] = useState("");
  const [newMedicineForm, setNewMedicineForm] = useState("сироп");
  const [newMedicineConcentration, setNewMedicineConcentration] = useState("");
  const [newMedicineDescription, setNewMedicineDescription] = useState("");
  const [newMedicineDosage, setNewMedicineDosage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);

  const { data: catalogItems = [], isLoading: searchLoading } = useQuery({
    queryKey: ["medicine-catalog-search", searchName],
    queryFn: () => searchMedicineCatalog(searchName, 10),
    enabled: searchName.length >= 2,
  });

  const createHouseholdMutation = useMutation({
    mutationFn: createHouseholdMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] });
      setFormError(null);
      setCatalogItem(null);
      setExpiryDate("");
      setOpenedAt("");
      setOpenedShelfDays("");
      setComment("");
      setSearchName("");
      setNewMedicineName("");
      setNewMedicineForm("сироп");
      setNewMedicineConcentration("");
      setNewMedicineDescription("");
      setNewMedicineDosage("");
      onCreated();
    },
  });

  const resetPackageFields = () => {
    setExpiryDate("");
    setOpenedAt("");
    setOpenedShelfDays("");
    setComment("");
    setFormError(null);
  };

  const handleAddFromCatalog = (item: MedicineCatalogItem) => {
    resetPackageFields();
    setCatalogItem(item);
    setSearchName(item.name);
    if (item.defaultOpenedShelfDays) {
      setOpenedShelfDays(String(item.defaultOpenedShelfDays));
    }
  };

  const handleCreateNewAndAdd = () => {
    const normalizedExpiryDate = normalizeIsoDateInput(expiryDate);
    const normalizedOpenedAt = normalizeIsoDateInput(openedAt);

    if (!newMedicineName.trim()) return;
    if (!normalizedExpiryDate) {
      setFormError("Укажите корректный срок годности через календарь.");
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError("Укажите корректную дату вскрытия через календарь.");
      return;
    }

    setFormError(null);
    createHouseholdMutation.mutate({
      medicine_name: newMedicineName.trim(),
      medicine_form: newMedicineForm,
      medicine_concentration: newMedicineConcentration.trim() || null,
      medicine_description: newMedicineDescription.trim() || null,
      medicine_dosage: newMedicineDosage.trim() || null,
      expiry_date: normalizedExpiryDate,
      opened_at: normalizedOpenedAt,
      opened_shelf_days: openedShelfDays ? Number(openedShelfDays) : null,
      comment: comment.trim() || null,
    });
  };

  const handleAddSelected = () => {
    const normalizedExpiryDate = normalizeIsoDateInput(expiryDate);
    const normalizedOpenedAt = normalizeIsoDateInput(openedAt);

    if (!catalogItem) return;
    if (!normalizedExpiryDate) {
      setFormError("Укажите корректный срок годности через календарь.");
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError("Укажите корректную дату вскрытия через календарь.");
      return;
    }

    setFormError(null);
    createHouseholdMutation.mutate({
      catalog_item_id: catalogItem.id,
      expiry_date: normalizedExpiryDate,
      opened_at: normalizedOpenedAt,
      opened_shelf_days: openedShelfDays ? Number(openedShelfDays) : null,
      comment: comment.trim() || null,
    });
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border p-4">
      <h2 className="text-lg font-medium text-foreground">Добавить упаковку</h2>

      <div className="flex flex-wrap gap-4">
        <label className="min-w-0 flex-1">
          <span className="block text-sm text-muted">Поиск по справочнику</span>
          <input
            type="text"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setFormError(null);
            }}
            className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0"
            placeholder="Название препарата"
          />
        </label>
      </div>
      {searchLoading && <p className="text-sm text-muted">Поиск…</p>}
      {!catalogItem && catalogItems.length > 0 && (
        <ul className="grid gap-2">
          {catalogItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleAddFromCatalog(item)}
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-left text-sm hover:bg-muted/30"
              >
                <p className="font-medium text-foreground">
                  {item.name} ({item.form}
                  {item.concentration ? `, ${item.concentration}` : ""})
                </p>
                {item.dosage && (
                  <p className="mt-1 text-xs text-muted">Как применять: {item.dosage}</p>
                )}
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
                )}
                {item.defaultOpenedShelfDays && (
                  <p className="mt-1 text-xs text-muted">
                    После вскрытия: {item.defaultOpenedShelfDays} дн.
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {catalogItem && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {catalogItem.name} ({catalogItem.form}
                {catalogItem.concentration ? `, ${catalogItem.concentration}` : ""})
              </p>
              {catalogItem.dosage && (
                <p className="mt-1 text-sm text-muted">Как применять: {catalogItem.dosage}</p>
              )}
              {catalogItem.description && (
                <p className="mt-2 text-sm text-muted">Описание: {catalogItem.description}</p>
              )}
              {catalogItem.defaultOpenedShelfDays && (
                <p className="mt-2 text-sm text-muted">
                  После вскрытия: {catalogItem.defaultOpenedShelfDays} дн.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                resetPackageFields();
                setCatalogItem(null);
                setSearchName("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/30"
            >
              Сменить препарат
            </button>
          </div>
        </div>
      )}

      {!catalogItem && (
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newMedicineName}
            onChange={(e) => {
              setNewMedicineName(e.target.value);
              setFormError(null);
            }}
            placeholder="Название нового препарата"
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0 flex-1 max-w-xs"
          />
          <select
            value={newMedicineForm}
            onChange={(e) => {
              setNewMedicineForm(e.target.value);
              setFormError(null);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
          >
            <option value="таблетки">таблетки</option>
            <option value="сироп">сироп</option>
            <option value="капли">капли</option>
            <option value="суспензия">суспензия</option>
            <option value="раствор">раствор</option>
          </select>
          <input
            type="text"
            value={newMedicineConcentration}
            onChange={(e) => {
              setNewMedicineConcentration(e.target.value);
              setFormError(null);
            }}
            placeholder="Концентрация"
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0 flex-1 max-w-xs"
          />
        </div>
      )}

      {(catalogItem || newMedicineName) && (
        <>
          {!catalogItem && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="block text-sm text-muted">Описание</span>
                <textarea
                  value={newMedicineDescription}
                  onChange={(e) => {
                    setNewMedicineDescription(e.target.value);
                    setFormError(null);
                  }}
                  className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Для чего препарат и в каких случаях нужен"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm text-muted">Как применять</span>
                <textarea
                  value={newMedicineDosage}
                  onChange={(e) => {
                    setNewMedicineDosage(e.target.value);
                    setFormError(null);
                  }}
                  className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Например: по 5 мл 3 раза в день после еды"
                />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm text-muted">Срок годности</span>
              <DateField
                value={expiryDate}
                onChange={(nextValue) => {
                  setExpiryDate(nextValue);
                  setFormError(null);
                }}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-muted">Дата вскрытия</span>
              <DateField
                value={openedAt}
                onChange={(nextValue) => {
                  setOpenedAt(nextValue);
                  setFormError(null);
                }}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-muted">Срок после вскрытия, дней</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={openedShelfDays}
                onChange={(e) => {
                  setOpenedShelfDays(e.target.value);
                  setFormError(null);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                placeholder={
                  catalogItem?.defaultOpenedShelfDays
                    ? String(catalogItem.defaultOpenedShelfDays)
                    : "Если не знаете, оставьте пустым"
                }
              />
              <span className="mt-1 block text-xs text-muted">
                Если у препарата есть срок после вскрытия в справочнике, он подставится
                автоматически.
              </span>
            </label>
          </div>
          {isExpired && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
              Срок годности уже истёк. Препарат можно сохранить в аптечку для учёта, но Safety
              Engine не даст использовать его в приёмах.
            </p>
          )}
          {hasUnknownAfterOpening && (
            <p className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-800">
              Дата вскрытия указана, но срок после вскрытия не задан. Препарат сохранится, но оценка
              после вскрытия будет считаться неизвестной.
            </p>
          )}
          <label className="block">
            <span className="block text-sm text-muted">Комментарий</span>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setFormError(null);
              }}
              className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              placeholder="Например: только ночью после еды"
            />
          </label>
          {(formError ||
            (createHouseholdMutation.error as { response?: { data?: { detail?: string } } })
              ?.response?.data?.detail) && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {formError ??
                (
                  createHouseholdMutation.error as {
                    response?: { data?: { detail?: string } };
                  }
                ).response?.data?.detail ??
                "Не удалось добавить препарат."}
            </p>
          )}
          <div className="flex gap-2">
            {catalogItem ? (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={!expiryDate || createHouseholdMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
              >
                Добавить в аптечку
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateNewAndAdd}
                disabled={
                  !newMedicineName.trim() || !expiryDate || createHouseholdMutation.isPending
                }
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
              >
                Добавить свой препарат в аптечку
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCatalogItem(null);
                setExpiryDate("");
                setOpenedAt("");
                setOpenedShelfDays("");
                setComment("");
                setSearchName("");
                setNewMedicineName("");
                setNewMedicineForm("сироп");
                setNewMedicineConcentration("");
                setNewMedicineDescription("");
                setNewMedicineDosage("");
                setFormError(null);
              }}
              className="rounded-lg border border-border px-4 py-2 hover:bg-muted/30"
            >
              Сбросить
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MedicineItemCard({
  medicine,
  onDelete,
}: {
  medicine: HouseholdMedicine;
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const [isEditing, setIsEditing] = useState(false);
  const [expiryDate, setExpiryDate] = useState(medicine.expiryDate);
  const [openedAt, setOpenedAt] = useState(medicine.openedAt?.slice(0, 10) ?? "");
  const [openedShelfDays, setOpenedShelfDays] = useState(
    medicine.openedShelfDays ? String(medicine.openedShelfDays) : ""
  );
  const [comment, setComment] = useState(medicine.comment ?? "");
  const [medicineName, setMedicineName] = useState(medicine.medicineName);
  const [medicineForm, setMedicineForm] = useState(medicine.medicineForm);
  const [medicineConcentration, setMedicineConcentration] = useState(
    medicine.medicineConcentration ?? ""
  );
  const [medicineDescription, setMedicineDescription] = useState(
    medicine.medicineDescription ?? ""
  );
  const [medicineDosage, setMedicineDosage] = useState(medicine.medicineDosage ?? "");
  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);
  const isOwnMedicine = medicine.catalogItemId === null;
  const intakeMessage = getIntakeMessage(medicine);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateHouseholdMedicine(medicine.id, {
        ...(isOwnMedicine
          ? {
              medicine_name: medicineName.trim(),
              medicine_form: medicineForm.trim(),
              medicine_concentration: medicineConcentration.trim() || null,
              medicine_description: medicineDescription.trim() || null,
              medicine_dosage: medicineDosage.trim() || null,
            }
          : {}),
        expiry_date: expiryDate,
        opened_at: openedAt || null,
        opened_shelf_days: openedShelfDays ? Number(openedShelfDays) : null,
        comment: comment.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] });
      setIsEditing(false);
    },
  });

  return (
    <li className="rounded-xl border border-border bg-background p-4 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">
              {medicine.medicineName}
              {medicine.medicineConcentration ? `, ${medicine.medicineConcentration}` : ""}
            </p>
            <span
              className={`rounded-full border px-2 py-1 text-xs ${
                STATUS_STYLES[medicine.status] ?? "border-border text-muted"
              }`}
            >
              {medicine.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{medicine.medicineForm}</p>
          {medicine.medicineDosage && (
            <p className="mt-1 text-sm text-muted">Как применять: {medicine.medicineDosage}</p>
          )}
          {medicine.medicineDescription && (
            <p className="mt-1 text-sm text-muted">Описание: {medicine.medicineDescription}</p>
          )}
          <p className="mt-2 text-sm text-muted">
            Срок годности: {formatDate(medicine.expiryDate)} · Осталось: {medicine.expiresInDays}{" "}
            дн.
          </p>
          {medicine.openedAt && (
            <p className="text-sm text-muted">
              Вскрыто: {formatDate(medicine.openedAt)}
              {medicine.effectiveOpenedShelfDays
                ? ` · После вскрытия: ${medicine.effectiveOpenedShelfDays} дн.`
                : " · Срок после вскрытия не указан"}
              {medicine.openedExpiresAt
                ? ` · Использовать до: ${formatDate(medicine.openedExpiresAt)}`
                : ""}
            </p>
          )}
          <p className={`text-sm ${intakeMessage.className}`}>{intakeMessage.text}</p>
          {medicine.comment && (
            <p className="text-sm text-muted">Комментарий: {medicine.comment}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/30"
          >
            {isEditing ? "Закрыть" : "Изменить"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(medicine.id)}
            className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10"
          >
            Удалить
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          {isOwnMedicine && (
            <>
              <label className="block">
                <span className="block text-sm text-muted">Название препарата</span>
                <input
                  type="text"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block">
                <span className="block text-sm text-muted">Форма</span>
                <input
                  type="text"
                  value={medicineForm}
                  onChange={(e) => setMedicineForm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm text-muted">Концентрация</span>
                <input
                  type="text"
                  value={medicineConcentration}
                  onChange={(e) => setMedicineConcentration(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm text-muted">Описание</span>
                <textarea
                  value={medicineDescription}
                  onChange={(e) => setMedicineDescription(e.target.value)}
                  className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm text-muted">Как применять</span>
                <textarea
                  value={medicineDosage}
                  onChange={(e) => setMedicineDosage(e.target.value)}
                  className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="block text-sm text-muted">Срок годности</span>
            <DateField value={expiryDate} onChange={setExpiryDate} className="mt-1" />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Дата вскрытия</span>
            <DateField value={openedAt} onChange={setOpenedAt} className="mt-1" />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Срок после вскрытия, дней</span>
            <input
              type="number"
              min="1"
              max="3650"
              value={openedShelfDays}
              onChange={(e) => setOpenedShelfDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          {isExpired && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 sm:col-span-2">
              Срок годности уже истёк. Препарат останется в аптечке для учёта, но использовать его в
              приёмах нельзя.
            </p>
          )}
          {hasUnknownAfterOpening && (
            <p className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-800 sm:col-span-2">
              Дата вскрытия указана, но срок после вскрытия не задан. Статус после вскрытия будет
              считаться неизвестным.
            </p>
          )}
          <label className="block sm:col-span-2">
            <span className="block text-sm text-muted">Комментарий</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={
                updateMutation.isPending ||
                (isOwnMedicine && (!medicineName.trim() || !medicineForm.trim()))
              }
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
