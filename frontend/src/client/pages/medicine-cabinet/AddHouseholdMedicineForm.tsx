import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHouseholdMedicine } from "@shared/api/householdMedicines";
import { searchMedicineCatalog } from "@shared/api/medicineCatalog";
import { trackHouseholdMedicineAdded } from "@shared/analytics";
import { DateField } from "@shared/components/DateField";
import type { AppLanguage } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { MedicineCatalogItem } from "@shared/types/api";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import { tCabinet } from "./copy";
import { MedicineCabinetHeader } from "./MedicineCabinetHeader";
import {
  cabinetActionPrimaryClass,
  cabinetActionSecondaryClass,
  cabinetAddPageClass,
  cabinetCatalogListClass,
  cabinetCatalogRowClass,
  cabinetCompactInputClass,
  cabinetCompactTextareaClass,
  cabinetListClass,
  cabinetListRowClass,
  cabinetManualPillClass,
  cabinetPanelClass,
} from "./styles";
import {
  getLocalizedMedicineForm,
  getMedicineFormOptions,
  hasUnknownOpenedShelfLife,
  isExpiredDate,
  toOpenedShelfDaysOrNull,
} from "./utils";

export function AddHouseholdMedicineForm({
  language,
  mode,
  onClose,
  onCreated,
}: {
  language: AppLanguage;
  mode: "catalog" | "manual";
  onClose: () => void;
  onCreated: () => void;
}) {
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
  const medicineFormOptions = getMedicineFormOptions(language);
  const isExpired = isExpiredDate(expiryDate);
  const hasUnknownAfterOpening = hasUnknownOpenedShelfLife(openedAt, openedShelfDays);
  const normalizedCatalogSearch = searchName.trim();
  const isCatalogMode = mode === "catalog";
  const isManualMode = mode === "manual";

  const { data: catalogItems = [], isLoading: searchLoading } = useQuery({
    queryKey: ["medicine-catalog-search", normalizedCatalogSearch],
    queryFn: () => searchMedicineCatalog(normalizedCatalogSearch, 10),
    enabled: isCatalogMode && normalizedCatalogSearch.length >= 2,
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
    const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);

    if (!newMedicineName.trim()) return;
    if (!normalizedExpiryDate) {
      setFormError(tCabinet(language, "expiryDateError"));
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError(tCabinet(language, "openedAtError"));
      return;
    }
    if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
      setFormError(tCabinet(language, "openedShelfDaysError"));
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
      opened_shelf_days: parsedOpenedShelfDays,
      comment: comment.trim() || null,
    });
  };

  const handleAddSelected = () => {
    const normalizedExpiryDate = normalizeIsoDateInput(expiryDate);
    const normalizedOpenedAt = normalizeIsoDateInput(openedAt);
    const parsedOpenedShelfDays = toOpenedShelfDaysOrNull(openedShelfDays);

    if (!catalogItem) return;
    if (!normalizedExpiryDate) {
      setFormError(tCabinet(language, "expiryDateError"));
      return;
    }
    if (openedAt && !normalizedOpenedAt) {
      setFormError(tCabinet(language, "openedAtError"));
      return;
    }
    if (openedShelfDays.trim() && parsedOpenedShelfDays === null) {
      setFormError(tCabinet(language, "openedShelfDaysError"));
      return;
    }

    setFormError(null);
    createHouseholdMutation.mutate({
      catalog_item_id: catalogItem.id,
      expiry_date: normalizedExpiryDate,
      opened_at: normalizedOpenedAt,
      opened_shelf_days: parsedOpenedShelfDays,
      comment: comment.trim() || null,
    });
  };

  const canSubmitCatalog = Boolean(catalogItem && expiryDate && !createHouseholdMutation.isPending);
  const canSubmitOwn = Boolean(
    newMedicineName.trim() && expiryDate && !createHouseholdMutation.isPending
  );
  const canSubmit = isCatalogMode ? canSubmitCatalog : canSubmitOwn;
  const submitLabel = isCatalogMode
    ? tCabinet(language, "addToKit")
    : tCabinet(language, "addOwnToKit");
  const screenTitle = isCatalogMode
    ? tCabinet(language, "addFromCatalog")
    : tCabinet(language, "addOwnMedicine");
  const screenHint = isCatalogMode
    ? tCabinet(language, "addFromCatalogHint")
    : tCabinet(language, "addOwnMedicineHint");
  const handleSubmit = isCatalogMode ? handleAddSelected : handleCreateNewAndAdd;
  const shouldDockActions = isManualMode || Boolean(catalogItem);

  const resetAllFields = () => {
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
  };

  return (
    <div className={`${cabinetAddPageClass} flex-col overflow-hidden`}>
      <MedicineCabinetHeader
        backLabel={`← ${tCabinet(language, "back")}`}
        onBack={onClose}
        title={screenTitle}
        hint={screenHint}
        actionLabel={tCabinet(language, "reset")}
        onAction={resetAllFields}
      />

      <div
        className={
          shouldDockActions
            ? "min-h-0 flex-1 overflow-y-auto py-3"
            : "shrink-0 overflow-visible py-3"
        }
      >
        <div className="mx-auto w-full max-w-2xl space-y-3 pb-3">
          {isCatalogMode && (
            <>
              <div className={`${cabinetPanelClass} px-3.5 py-3`}>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">{tCabinet(language, "catalogSearch")}</span>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setCatalogItem(null);
                      setFormError(null);
                    }}
                    className={cabinetCompactInputClass}
                    placeholder={tCabinet(language, "catalogSearchPlaceholder")}
                  />
                </label>
                <p className="mt-2 text-xs font-semibold leading-5 text-muted">
                  {tCabinet(language, "catalogSearchHint")}
                </p>
              </div>

              {searchLoading && (
                <p className={`${cabinetPanelClass} px-4 py-3 text-sm text-muted`}>
                  {tCabinet(language, "searching")}
                </p>
              )}

              {!catalogItem && normalizedCatalogSearch.length >= 2 && catalogItems.length > 0 && (
                <ul className={cabinetCatalogListClass}>
                  {catalogItems.map((item) => (
                    <li
                      key={item.id}
                      className="border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleAddFromCatalog(item)}
                        className={cabinetCatalogRowClass}
                      >
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_72%,var(--color-info)_28%)]" />
                            <span className="min-w-0 break-words text-sm font-semibold leading-5 text-foreground">
                              {item.name}
                            </span>
                          </span>
                          <span className="mt-0.5 block pl-4 text-xs font-semibold leading-5 text-muted">
                            {[
                              getLocalizedMedicineForm(item.form, language),
                              item.concentration,
                              item.defaultOpenedShelfDays
                                ? tCabinet(language, "openedShelfHint", {
                                    days: item.defaultOpenedShelfDays,
                                  })
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {item.dosage && (
                            <span className="mt-0.5 block pl-4 text-xs leading-5 text-muted/90">
                              {tCabinet(language, "dosageHint", { value: item.dosage })}
                            </span>
                          )}
                          {item.description && (
                            <span className="mt-0.5 line-clamp-2 block pl-4 text-xs leading-5 text-muted/80">
                              {item.description}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-right text-lg font-semibold leading-none text-muted"
                        >
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!catalogItem &&
                !searchLoading &&
                normalizedCatalogSearch.length >= 2 &&
                catalogItems.length === 0 && (
                  <p className={`${cabinetPanelClass} px-4 py-3 text-sm text-muted`}>
                    {tCabinet(language, "catalogNoResults")}
                  </p>
                )}
              {!catalogItem && normalizedCatalogSearch.length < 2 && (
                <p className={`${cabinetPanelClass} px-4 py-3 text-sm text-muted`}>
                  {tCabinet(language, "catalogPickFirst")}
                </p>
              )}

              {catalogItem && (
                <div className={cabinetListClass}>
                  <div className={cabinetListRowClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {catalogItem.name} ({getLocalizedMedicineForm(catalogItem.form, language)}
                          {catalogItem.concentration ? `, ${catalogItem.concentration}` : ""})
                        </p>
                        {catalogItem.dosage && (
                          <p className="mt-1 text-sm text-muted">
                            {tCabinet(language, "dosageHint", { value: catalogItem.dosage })}
                          </p>
                        )}
                        {catalogItem.description && (
                          <p className="mt-2 text-sm text-muted">
                            {tCabinet(language, "descriptionLabel", {
                              value: catalogItem.description,
                            })}
                          </p>
                        )}
                        {catalogItem.defaultOpenedShelfDays && (
                          <p className="mt-2 text-sm text-muted">
                            {tCabinet(language, "openedShelfHint", {
                              days: catalogItem.defaultOpenedShelfDays,
                            })}
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
                        className={cabinetActionSecondaryClass}
                      >
                        {tCabinet(language, "switchMedicine")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isManualMode && (
            <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_72%,var(--color-info)_28%)]" />
                <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
                  {tCabinet(language, "manualMainSection")}
                </p>
              </div>
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "newMedicineName")}</span>
                <input
                  type="text"
                  value={newMedicineName}
                  onChange={(e) => {
                    setNewMedicineName(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={tCabinet(language, "newMedicineNamePlaceholder")}
                  className={cabinetCompactInputClass}
                />
              </label>
              <div className="space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "medicineForm")}</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {medicineFormOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setNewMedicineForm(option.value);
                        setFormError(null);
                      }}
                      className={`${cabinetManualPillClass} ${
                        newMedicineForm === option.value
                          ? "soft-pill-primary app-profile-action app-profile-action--selected"
                          : "soft-pill app-profile-action"
                      }`}
                      aria-pressed={newMedicineForm === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block space-y-1.5">
                <span className="soft-field-label">{tCabinet(language, "concentration")}</span>
                <input
                  type="text"
                  value={newMedicineConcentration}
                  onChange={(e) => {
                    setNewMedicineConcentration(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={tCabinet(language, "concentrationPlaceholder")}
                  className={cabinetCompactInputClass}
                />
              </label>
            </div>
          )}

          {isManualMode && (
            <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-info)_68%,var(--color-primary)_32%)]" />
                <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
                  {tCabinet(language, "manualTextSection")}
                </p>
              </div>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="soft-field-label">{tCabinet(language, "description")}</span>
                <textarea
                  value={newMedicineDescription}
                  onChange={(e) => {
                    setNewMedicineDescription(e.target.value);
                    setFormError(null);
                  }}
                  className={cabinetCompactTextareaClass}
                  placeholder={tCabinet(language, "descriptionPlaceholder")}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="soft-field-label">{tCabinet(language, "usage")}</span>
                <textarea
                  value={newMedicineDosage}
                  onChange={(e) => {
                    setNewMedicineDosage(e.target.value);
                    setFormError(null);
                  }}
                  className={cabinetCompactTextareaClass}
                  placeholder={tCabinet(language, "usagePlaceholder")}
                />
              </label>
            </div>
          )}

          {(isManualMode || catalogItem) && (
            <>
              <div className={`${cabinetPanelClass} space-y-2.5 px-3.5 py-2.5`}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_64%,var(--color-primary)_36%)]" />
                  <p className="text-[0.82rem] font-extrabold tracking-[-0.025em] text-foreground">
                    {tCabinet(language, "packageSection")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="soft-field-label">{tCabinet(language, "expiryDate")}</span>
                    <DateField
                      value={expiryDate}
                      onChange={(nextValue) => {
                        setExpiryDate(nextValue);
                        setFormError(null);
                      }}
                      className="cabinet-compact-date-field"
                      language={language}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="soft-field-label">{tCabinet(language, "openedAt")}</span>
                    <DateField
                      value={openedAt}
                      onChange={(nextValue) => {
                        setOpenedAt(nextValue);
                        setFormError(null);
                      }}
                      className="cabinet-compact-date-field"
                      language={language}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="soft-field-label">
                      {tCabinet(language, "openedShelfDays")}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="3650"
                      value={openedShelfDays}
                      onChange={(e) => {
                        setOpenedShelfDays(e.target.value);
                        setFormError(null);
                      }}
                      className={cabinetCompactInputClass}
                      placeholder={
                        catalogItem?.defaultOpenedShelfDays
                          ? String(catalogItem.defaultOpenedShelfDays)
                          : tCabinet(language, "openedShelfDaysUnknown")
                      }
                    />
                    <span className="mt-1 block text-xs text-muted">
                      {tCabinet(language, "openedShelfDaysAuto")}
                    </span>
                  </label>
                </div>
                {isExpired && (
                  <p className="soft-note-warning rounded-2xl px-4 py-3 text-sm">
                    {tCabinet(language, "expiredWarning")}
                  </p>
                )}
                {hasUnknownAfterOpening && (
                  <p className="soft-note-info rounded-2xl px-4 py-3 text-sm">
                    {tCabinet(language, "openedUnknownWarning")}
                  </p>
                )}
                <label className="block space-y-1.5">
                  <span className="soft-field-label">{tCabinet(language, "comment")}</span>
                  <textarea
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setFormError(null);
                    }}
                    className={cabinetCompactTextareaClass}
                    placeholder={tCabinet(language, "commentPlaceholder")}
                  />
                </label>
              </div>
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
                    tCabinet(language, "addError")}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-[color:color-mix(in_srgb,var(--color-border)_42%,transparent)] bg-background py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`${cabinetActionPrimaryClass} w-full disabled:opacity-50`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
