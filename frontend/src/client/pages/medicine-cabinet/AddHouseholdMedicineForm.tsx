import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHouseholdMedicine } from "@shared/api/householdMedicines";
import { searchMedicineCatalog } from "@shared/api/medicineCatalog";
import { trackHouseholdMedicineAdded } from "@shared/analytics";
import type { AppLanguage } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { MedicineCatalogItem } from "@shared/types/api";
import { normalizeIsoDateInput } from "@shared/utils/dateInput";
import {
  CatalogSearchResults,
  CatalogSearchSection,
  ManualMedicineMainSection,
  ManualMedicineTextSection,
  PackageFieldsSection,
  SelectedCatalogMedicine,
} from "./AddHouseholdMedicineSections";
import { tCabinet } from "./copy";
import { MedicineCabinetHeader } from "./MedicineCabinetHeader";
import { cabinetActionPrimaryClass, cabinetPanelClass } from "./styles";
import {
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
    <div
      className="child-profile-shell space-y-3"
      style={{
        paddingBottom: "max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
        scrollPaddingBottom:
          "calc(7.5rem + var(--app-keyboard-height, 0px) + var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
      }}
    >
      <MedicineCabinetHeader
        backLabel={`← ${tCabinet(language, "back")}`}
        onBack={onClose}
        title={screenTitle}
        hint={screenHint}
        actionLabel={tCabinet(language, "reset")}
        onAction={resetAllFields}
      />

      <div className="mx-auto w-full max-w-2xl space-y-3 pb-3 pt-2">
        {isCatalogMode && (
          <>
            <CatalogSearchSection
              language={language}
              searchName={searchName}
              onSearchNameChange={(value) => {
                setSearchName(value);
                setCatalogItem(null);
                setFormError(null);
              }}
            />

            {searchLoading && (
              <p className={`${cabinetPanelClass} px-4 py-3 text-sm text-muted`}>
                {tCabinet(language, "searching")}
              </p>
            )}

            {!catalogItem && normalizedCatalogSearch.length >= 2 && catalogItems.length > 0 && (
              <CatalogSearchResults
                language={language}
                catalogItems={catalogItems}
                onSelect={handleAddFromCatalog}
              />
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
              <SelectedCatalogMedicine
                language={language}
                catalogItem={catalogItem}
                onChangeMedicine={() => {
                  resetPackageFields();
                  setCatalogItem(null);
                  setSearchName("");
                }}
              />
            )}
          </>
        )}

        {isManualMode && (
          <ManualMedicineMainSection
            language={language}
            medicineFormOptions={medicineFormOptions}
            newMedicineName={newMedicineName}
            newMedicineForm={newMedicineForm}
            newMedicineConcentration={newMedicineConcentration}
            onNameChange={(value) => {
              setNewMedicineName(value);
              setFormError(null);
            }}
            onFormChange={(value) => {
              setNewMedicineForm(value);
              setFormError(null);
            }}
            onConcentrationChange={(value) => {
              setNewMedicineConcentration(value);
              setFormError(null);
            }}
          />
        )}

        {isManualMode && (
          <ManualMedicineTextSection
            language={language}
            newMedicineDescription={newMedicineDescription}
            newMedicineDosage={newMedicineDosage}
            onDescriptionChange={(value) => {
              setNewMedicineDescription(value);
              setFormError(null);
            }}
            onDosageChange={(value) => {
              setNewMedicineDosage(value);
              setFormError(null);
            }}
          />
        )}

        {(isManualMode || catalogItem) && (
          <>
            <PackageFieldsSection
              language={language}
              expiryDate={expiryDate}
              openedAt={openedAt}
              openedShelfDays={openedShelfDays}
              comment={comment}
              catalogDefaultOpenedShelfDays={catalogItem?.defaultOpenedShelfDays}
              isExpired={isExpired}
              hasUnknownAfterOpening={hasUnknownAfterOpening}
              onExpiryDateChange={(value) => {
                setExpiryDate(value);
                setFormError(null);
              }}
              onOpenedAtChange={(value) => {
                setOpenedAt(value);
                setFormError(null);
              }}
              onOpenedShelfDaysChange={(value) => {
                setOpenedShelfDays(value);
                setFormError(null);
              }}
              onCommentChange={(value) => {
                setComment(value);
                setFormError(null);
              }}
            />
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

        <div className="app-form-action-bar pt-1">
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
