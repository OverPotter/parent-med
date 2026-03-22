/**
 * Аптечка: список упаковок по семье, добавление (справочник + срок годности).
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHouseholdMedicines,
  createHouseholdMedicine,
  deleteHouseholdMedicine,
  updateHouseholdMedicine,
} from "@shared/api/householdMedicines";
import { searchMedicineCatalog } from "@shared/api/medicineCatalog";
import { DateField } from "@shared/components/DateField";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface, Surface } from "@shared/components/Surface";
import { trackHouseholdMedicineAdded } from "@shared/analytics";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import type { HouseholdMedicine, MedicineCatalogItem } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { useAppStore } from "@shared/store/useAppStore";

const STATUS_CARD_STYLES: Record<string, string> = {
  ok: "soft-card-status-success",
  expiring_soon: "soft-card-status-warning",
  expiring_after_opening: "soft-card-status-warning",
  expired: "soft-card-status-danger",
  expired_after_opening: "soft-card-status-danger",
};

export function MedicineCabinetPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"cabinet" | "add">("cabinet");
  const [cabinetSearch, setCabinetSearch] = useState("");
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(10000);

  const {
    data: medicines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!accountId,
    ...liveQueryOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMedicine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-medicines", accountId] }),
  });

  const handleWriteOff = (id: string) => {
    if (!window.confirm("Списать препарат из аптечки?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const normalizedCabinetSearch = cabinetSearch.trim().toLowerCase();
  const filteredMedicines = medicines.filter((medicine) => {
    if (!normalizedCabinetSearch) {
      return true;
    }

    return [
      medicine.medicineName,
      medicine.medicineConcentration ?? "",
      medicine.medicineForm,
      medicine.comment ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedCabinetSearch);
  });

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Аптечка"
        subtitle="Реальные упаковки дома: срок годности, дата вскрытия и можно ли использовать препарат сейчас."
        hideOnMobile
      />
      <div className="soft-nav-shell inline-flex flex-wrap gap-2 rounded-[24px] p-2">
        <button
          type="button"
          onClick={() => setView("add")}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            view === "add" ? "soft-tab-active" : "soft-tab"
          }`}
        >
          Добавить препарат
        </button>
        <button
          type="button"
          onClick={() => setView("cabinet")}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            view === "cabinet" ? "soft-tab-active" : "soft-tab"
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
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {(error as { message?: string }).message ?? "Ошибка загрузки"}
            </p>
          )}
          {!isLoading && !error && medicines.length === 0 && (
            <p className="soft-panel-muted rounded-[24px] px-5 py-4 text-sm text-muted">
              В аптечке пока нет препаратов. Переключитесь на «Добавить препарат».
            </p>
          )}
          {medicines.length > 0 && (
            <div className="mt-4">
              <input
                type="search"
                value={cabinetSearch}
                onChange={(event) => setCabinetSearch(event.target.value)}
                placeholder="Поиск по аптечке"
                className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
          )}
          {medicines.length > 0 && filteredMedicines.length === 0 && (
            <p className="soft-panel-muted mt-4 rounded-[24px] px-5 py-4 text-sm text-muted">
              По запросу ничего не найдено.
            </p>
          )}
          {medicines.length > 0 && (
            <ul className="mt-6 space-y-3">
              {filteredMedicines.map((m) => (
                <MedicineItemCard key={m.id} medicine={m} onDelete={handleWriteOff} />
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
  icon: string;
  className: string;
} {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return {
      text: "Принимать нельзя",
      icon: "✕",
      className: "soft-pill-danger inline-flex rounded-full px-3 py-1 text-xs",
    };
  }

  if (!medicine.openedAt) {
    return {
      text: "Проверить вскрытие",
      icon: "!",
      className: "soft-pill-warning inline-flex rounded-full px-3 py-1 text-xs",
    };
  }

  return {
    text: "Принимать можно",
    icon: "✓",
    className: "soft-pill-success inline-flex rounded-full px-3 py-1 text-xs",
  };
}

function getStatusDateText(medicine: HouseholdMedicine): string {
  if (
    (medicine.status === "expired_after_opening" || medicine.status === "expiring_after_opening") &&
    medicine.openedExpiresAt
  ) {
    return `После вскрытия до ${formatDate(medicine.openedExpiresAt)}`;
  }

  return `Годен до ${formatDate(medicine.expiryDate)}`;
}

function getOpenedStatusHint(medicine: HouseholdMedicine): string | null {
  if (
    (medicine.status === "expired_after_opening" || medicine.status === "expiring_after_opening") &&
    medicine.openedAt &&
    medicine.effectiveOpenedShelfDays
  ) {
    return `Вскрыли ${formatDate(medicine.openedAt)} · после вскрытия ${medicine.effectiveOpenedShelfDays} дн.`;
  }

  return null;
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
    onSuccess: (_data, variables) => {
      const source = variables.catalog_item_id ? "catalog" : "manual";
      trackHouseholdMedicineAdded(source);
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
    <Surface className="mt-4 p-5 sm:p-6">
      <div className="space-y-4">
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
              className="soft-input mt-1 w-full max-w-xs rounded-2xl px-4 py-3 min-w-0"
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
                  className="soft-card w-full rounded-[22px] px-4 py-4 text-left text-sm transition-colors hover:bg-[color:var(--color-surface-soft)]"
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
          <div className="soft-panel-muted rounded-[24px] p-4">
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
                className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
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
              className="soft-input min-w-0 flex-1 max-w-xs rounded-2xl px-4 py-3"
            />
            <select
              value={newMedicineForm}
              onChange={(e) => {
                setNewMedicineForm(e.target.value);
                setFormError(null);
              }}
              className="soft-input rounded-2xl px-4 py-3"
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
              className="soft-input min-w-0 flex-1 max-w-xs rounded-2xl px-4 py-3"
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
                    className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
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
                    className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
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
                  className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
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
              <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm">
                Срок годности уже истёк. Препарат можно сохранить в аптечку для учёта, но Safety
                Engine не даст использовать его в приёмах.
              </p>
            )}
            {hasUnknownAfterOpening && (
              <p className="soft-note-info rounded-2xl px-4 py-3 text-sm">
                Дата вскрытия указана, но срок после вскрытия не задан. Препарат сохранится, но
                оценка после вскрытия будет считаться неизвестной.
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
                className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
                placeholder="Например: только ночью после еды"
              />
            </label>
            {(formError ||
              (createHouseholdMutation.error as { response?: { data?: { detail?: string } } })
                ?.response?.data?.detail) && (
              <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
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
                  className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
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
                  className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
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
                className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
              >
                Сбросить
              </button>
            </div>
          </>
        )}
      </div>
    </Surface>
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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileActionsExpanded, setIsMobileActionsExpanded] = useState(false);
  const [isStatusTooltipVisible, setIsStatusTooltipVisible] = useState(false);
  const [statusTooltipMode, setStatusTooltipMode] = useState<"idle" | "hover" | "touch">("idle");
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
  const statusDateText = getStatusDateText(medicine);
  const openedStatusHint = getOpenedStatusHint(medicine);

  const collapseMobileCard = () => {
    setIsMobileActionsExpanded(false);
    setIsDetailsExpanded(false);
    setIsEditing(false);
  };

  const toggleMobileCard = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsDetailsExpanded((value) => !value);
      setIsEditing(false);
      return;
    }
    if (typeof window !== "undefined" && isStatusTooltipVisible && statusTooltipMode === "touch") {
      return;
    }
    if (isMobileActionsExpanded || isDetailsExpanded || isEditing) {
      collapseMobileCard();
      return;
    }
    setIsMobileActionsExpanded(true);
  };

  useEffect(() => {
    if (!isStatusTooltipVisible || statusTooltipMode !== "touch") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsStatusTooltipVisible(false);
      setStatusTooltipMode("idle");
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isStatusTooltipVisible, statusTooltipMode]);

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
    <li>
      <RowSurface className={`min-w-0 ${STATUS_CARD_STYLES[medicine.status] ?? ""}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2">
              <div
                className="min-w-0 cursor-pointer"
                onClick={toggleMobileCard}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleMobileCard();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isMobileActionsExpanded || isDetailsExpanded || isEditing}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="group relative shrink-0">
                    <button
                      type="button"
                      title={intakeMessage.text}
                      aria-label={intakeMessage.text}
                      onClick={(event) => event.stopPropagation()}
                      onMouseEnter={() => {
                        setStatusTooltipMode("hover");
                        setIsStatusTooltipVisible(true);
                      }}
                      onMouseLeave={() => {
                        setIsStatusTooltipVisible(false);
                        setStatusTooltipMode("idle");
                      }}
                      onFocus={() => {
                        setStatusTooltipMode("hover");
                        setIsStatusTooltipVisible(true);
                      }}
                      onBlur={() => {
                        setIsStatusTooltipVisible(false);
                        setStatusTooltipMode("idle");
                      }}
                      onTouchStart={() => {
                        setStatusTooltipMode("touch");
                        setIsStatusTooltipVisible(true);
                      }}
                      onTouchEnd={(event) => {
                        event.currentTarget.blur();
                      }}
                      onTouchCancel={() => {
                        setIsStatusTooltipVisible(false);
                        setStatusTooltipMode("idle");
                      }}
                      className={`${intakeMessage.className} h-7 min-w-7 shrink-0 px-2 font-semibold`}
                    >
                      {intakeMessage.icon}
                    </button>
                    <div
                      className={[
                        "pointer-events-none absolute left-0 top-full z-10 mt-2 w-max max-w-[12rem] rounded-2xl border border-border/80 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs leading-5 text-foreground shadow-lg backdrop-blur-xl",
                        isStatusTooltipVisible ? "block" : "hidden",
                      ].join(" ")}
                    >
                      {intakeMessage.text}
                    </div>
                  </div>
                  <p className="min-w-0 break-words font-medium text-foreground">
                    {medicine.medicineName}
                    {medicine.medicineConcentration ? `, ${medicine.medicineConcentration}` : ""}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="soft-pill rounded-full px-3 py-1 text-xs">{statusDateText}</span>
                </div>
                {openedStatusHint && <p className="mt-2 text-xs text-muted">{openedStatusHint}</p>}
              </div>
            </div>

            {isDetailsExpanded && (
              <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm text-muted">
                <p>Форма: {medicine.medicineForm}</p>
                {medicine.openedAt && (
                  <p>
                    Вскрыто: {formatDate(medicine.openedAt)}
                    {medicine.effectiveOpenedShelfDays
                      ? ` · После вскрытия: ${medicine.effectiveOpenedShelfDays} дн.`
                      : " · Срок после вскрытия не указан"}
                    {medicine.openedExpiresAt
                      ? ` · Использовать до: ${formatDate(medicine.openedExpiresAt)}`
                      : ""}
                  </p>
                )}
                {medicine.medicineDosage && <p>Как применять: {medicine.medicineDosage}</p>}
                {medicine.medicineDescription && <p>Описание: {medicine.medicineDescription}</p>}
                {medicine.comment && <p>Комментарий: {medicine.comment}</p>}
              </div>
            )}
          </div>
          {isMobileActionsExpanded && (
            <div className="w-full md:hidden">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailsExpanded((value) => !value)}
                  className="soft-button-secondary w-full rounded-2xl px-4 py-2.5 text-sm"
                >
                  {isDetailsExpanded ? "Скрыть" : "Подробнее"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing((value) => !value)}
                  className="soft-button-secondary w-full rounded-2xl px-4 py-2.5 text-sm"
                >
                  {isEditing ? "Закрыть" : "Новая упаковка"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(medicine.id)}
                  className="soft-button-danger w-full rounded-2xl px-4 py-2.5 text-sm"
                >
                  Списать
                </button>
              </div>
            </div>
          )}
          <div className="hidden md:flex md:w-auto md:flex-row md:flex-wrap md:gap-2">
            <button
              type="button"
              onClick={() => setIsDetailsExpanded((value) => !value)}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              {isDetailsExpanded ? "Скрыть" : "Подробнее"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              {isEditing ? "Закрыть" : "Новая упаковка"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(medicine.id)}
              className="soft-button-danger rounded-2xl px-4 py-2.5 text-sm"
            >
              Списать
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm text-muted">
              Если купили новую упаковку этого же препарата, обновите здесь срок годности и дату
              вскрытия. Старую карточку заводить заново не нужно.
            </p>
            {isOwnMedicine && (
              <>
                <label className="block">
                  <span className="block text-sm text-muted">Название препарата</span>
                  <input
                    type="text"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm text-muted">Форма</span>
                  <input
                    type="text"
                    value={medicineForm}
                    onChange={(e) => setMedicineForm(e.target.value)}
                    className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm text-muted">Концентрация</span>
                  <input
                    type="text"
                    value={medicineConcentration}
                    onChange={(e) => setMedicineConcentration(e.target.value)}
                    className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm text-muted">Описание</span>
                  <textarea
                    value={medicineDescription}
                    onChange={(e) => setMedicineDescription(e.target.value)}
                    className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm text-muted">Как применять</span>
                  <textarea
                    value={medicineDosage}
                    onChange={(e) => setMedicineDosage(e.target.value)}
                    className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
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
                className="soft-input mt-1 w-full rounded-2xl px-4 py-3"
              />
            </label>
            {isExpired && (
              <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                Срок годности уже истёк. Препарат останется в аптечке для учёта, но использовать его
                в приёмах нельзя.
              </p>
            )}
            {hasUnknownAfterOpening && (
              <p className="soft-note-info rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                Дата вскрытия указана, но срок после вскрытия не задан. Статус после вскрытия будет
                считаться неизвестным.
              </p>
            )}
            <label className="block sm:col-span-2">
              <span className="block text-sm text-muted">Комментарий</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="soft-input mt-1 min-h-20 w-full rounded-2xl px-4 py-3"
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
                className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </RowSurface>
    </li>
  );
}
