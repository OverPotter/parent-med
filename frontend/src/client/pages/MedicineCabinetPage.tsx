/**
 * Аптечка: список упаковок по семье, добавление (справочник + срок годности).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@shared/store/useAppStore";
import {
  fetchHouseholdMedicinesByFamilyId,
  createHouseholdMedicine,
  deleteHouseholdMedicine,
} from "@shared/api/householdMedicines";
import { searchMedicineCatalog, createMedicineCatalogItem } from "@shared/api/medicineCatalog";
import type { MedicineCatalogItem } from "@shared/types/api";

export function MedicineCabinetPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();

  const {
    data: medicines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: () => fetchHouseholdMedicinesByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMedicine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-medicines", currentFamilyId] }),
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Аптечка</h1>
        <p className="mt-2 text-muted">Сначала выберите семью на странице «Семья».</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Аптечка</h1>
      <AddHouseholdMedicineForm familyId={currentFamilyId} />

      {isLoading && <p className="mt-4 text-muted">Загрузка…</p>}
      {error && (
        <p className="mt-4 text-red-600 dark:text-red-400">
          {(error as { message?: string }).message ?? "Ошибка загрузки"}
        </p>
      )}
      {!isLoading && !error && medicines.length === 0 && (
        <p className="mt-4 text-muted">В аптечке пока нет препаратов. Добавьте упаковку выше.</p>
      )}
      {medicines.length > 0 && (
        <ul className="mt-6 space-y-3">
          {medicines.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-4 min-w-0"
            >
              <div className="min-w-0 flex-1 truncate">
                <p className="font-medium text-foreground">ID упаковки: {m.id.slice(0, 8)}…</p>
                <p className="text-sm text-muted">
                  Срок годности: {m.expiryDate}
                  {m.openedAt ? ` · Вскрыто: ${m.openedAt.slice(0, 10)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(m.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddHouseholdMedicineForm({ familyId }: { familyId: string }) {
  const [searchName, setSearchName] = useState("");
  const [catalogItem, setCatalogItem] = useState<MedicineCatalogItem | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [newMedicineName, setNewMedicineName] = useState("");
  const [newMedicineForm, setNewMedicineForm] = useState("syrup");
  const queryClient = useQueryClient();

  const { data: catalogItems = [], isLoading: searchLoading } = useQuery({
    queryKey: ["medicine-catalog-search", searchName],
    queryFn: () => searchMedicineCatalog(searchName, 10),
    enabled: searchName.length >= 2,
  });

  const createCatalogMutation = useMutation({
    mutationFn: (p: { name: string; form: string; concentration?: string | null }) =>
      createMedicineCatalogItem(p),
    onSuccess: (item) => {
      setCatalogItem(item);
      setNewMedicineName("");
      queryClient.invalidateQueries({ queryKey: ["medicine-catalog-search"] });
    },
  });

  const createHouseholdMutation = useMutation({
    mutationFn: (p: { family_id: string; catalog_item_id: string; expiry_date: string }) =>
      createHouseholdMedicine(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-medicines", familyId] });
      setCatalogItem(null);
      setExpiryDate("");
    },
  });

  const handleAddFromCatalog = (item: MedicineCatalogItem) => {
    setCatalogItem(item);
    setSearchName("");
  };

  const handleCreateNewAndAdd = () => {
    if (!newMedicineName.trim() || !expiryDate) return;
    createCatalogMutation.mutate(
      { name: newMedicineName.trim(), form: newMedicineForm },
      {
        onSuccess: (item) => {
          createHouseholdMutation.mutate({
            family_id: familyId,
            catalog_item_id: item.id,
            expiry_date: expiryDate,
          });
        },
      }
    );
  };

  const handleAddSelected = () => {
    if (!catalogItem || !expiryDate) return;
    createHouseholdMutation.mutate({
      family_id: familyId,
      catalog_item_id: catalogItem.id,
      expiry_date: expiryDate,
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
            onChange={(e) => setSearchName(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0"
            placeholder="Название препарата"
          />
        </label>
      </div>
      {searchLoading && <p className="text-sm text-muted">Поиск…</p>}
      {catalogItems.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {catalogItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleAddFromCatalog(item)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/30"
              >
                {item.name} ({item.form})
              </button>
            </li>
          ))}
        </ul>
      )}

      {!catalogItem && (
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newMedicineName}
            onChange={(e) => setNewMedicineName(e.target.value)}
            placeholder="Название нового препарата"
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground min-w-0 flex-1 max-w-xs"
          />
          <select
            value={newMedicineForm}
            onChange={(e) => setNewMedicineForm(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
          >
            <option value="tablet">таблетки</option>
            <option value="syrup">сироп</option>
            <option value="drops">капли</option>
          </select>
        </div>
      )}

      {(catalogItem || newMedicineName) && (
        <>
          <label className="block">
            <span className="block text-sm text-muted">Срок годности</span>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
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
                disabled={!newMedicineName.trim() || !expiryDate || createCatalogMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-focus disabled:opacity-50"
              >
                Создать в справочнике и добавить
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCatalogItem(null);
                setExpiryDate("");
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
