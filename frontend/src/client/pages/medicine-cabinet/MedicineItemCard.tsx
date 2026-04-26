import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { tCabinet } from "./copy";
import {
  cabinetActionDangerClass,
  cabinetActionPrimaryClass,
  cabinetActionSecondaryClass,
  cabinetCompactInputClass,
  cabinetListRowClass,
} from "./styles";
import {
  formatDoseCalcValue,
  getLocalizedMedicineForm,
  getMedicineStatusDateClass,
  getMedicineStatusDotClass,
  getMedicineStatusLabel,
  getStatusDateText,
} from "./utils";

export function MedicineItemCard({
  language,
  medicine,
  onDelete,
  isDeleting = false,
  compact = false,
  canEdit = true,
  isUpdatingDoseCalc = false,
  isOffline = false,
  onNetworkRequired,
  onUpdateDoseCalc,
  isExpanded,
  onExpandChange,
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  compact?: boolean;
  canEdit?: boolean;
  isUpdatingDoseCalc?: boolean;
  isOffline?: boolean;
  onNetworkRequired?: () => void;
  onUpdateDoseCalc?: (id: string, minValue: number | null, maxValue: number | null) => void;
  isExpanded: boolean;
  onExpandChange: (isExpanded: boolean) => void;
}) {
  const navigate = useNavigate();
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const statusDotClass = getMedicineStatusDotClass(medicine);
  const statusDateClass = getMedicineStatusDateClass(medicine);
  const statusDateText = getStatusDateText(medicine, language);
  const statusLabel = getMedicineStatusLabel(medicine, language);
  const localizedMedicineForm = getLocalizedMedicineForm(medicine.medicineForm, language);
  const useUntilText = medicine.openedExpiresAt
    ? tCabinet(language, "useUntil", { date: formatDate(medicine.openedExpiresAt) })
    : "";

  const collapseMobileCard = () => {
    onExpandChange(false);
    setIsDetailsExpanded(false);
  };

  const toggleMobileCard = () => {
    if (isExpanded || isDetailsExpanded) {
      collapseMobileCard();
      return;
    }
    onExpandChange(true);
    setIsDetailsExpanded(true);
  };

  const toggleDetails = () => {
    if (!isExpanded) {
      onExpandChange(true);
    }
    setIsDetailsExpanded((value) => !value);
  };

  const handleNewPack = () => {
    if (isOffline) {
      onNetworkRequired?.();
      return;
    }
    onExpandChange(false);
    setIsDetailsExpanded(false);
    navigate(`/medicine-cabinet/${medicine.id}/new-pack`);
  };

  const handleDelete = () => {
    if (isOffline) {
      onNetworkRequired?.();
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  return (
    <li>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={tCabinet(language, "writeOffTitle", { name: medicine.medicineName })}
        description={tCabinet(language, "writeOffDescription")}
        confirmLabel={
          isDeleting ? tCabinet(language, "writeOffPending") : tCabinet(language, "writeOff")
        }
        confirmTone="danger"
        isPending={isDeleting}
        cancelLabel={tCabinet(language, "close")}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(medicine.id);
        }}
      />
      <div className={`${cabinetListRowClass} min-w-0`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1.5">
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
                aria-expanded={isExpanded || isDetailsExpanded}
              >
                <MedicineListRowContent
                  medicine={medicine}
                  localizedMedicineForm={localizedMedicineForm}
                  statusLabel={statusLabel}
                  statusDateClass={statusDateClass}
                  statusDateText={statusDateText}
                  statusDotClass={statusDotClass}
                />
              </div>
            </div>

            {isExpanded && isDetailsExpanded && (
              <MedicineDetails
                language={language}
                medicine={medicine}
                localizedMedicineForm={localizedMedicineForm}
                useUntilText={useUntilText}
                canEdit={canEdit}
                isOffline={isOffline}
                isUpdatingDoseCalc={isUpdatingDoseCalc}
                onNetworkRequired={onNetworkRequired}
                onUpdateDoseCalc={onUpdateDoseCalc}
              />
            )}
          </div>
          {isExpanded && (
            <div className={compact ? "w-full" : "w-full md:hidden"}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleDetails}
                  className={`${cabinetActionSecondaryClass} w-full`}
                >
                  {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
                </button>
                {!compact && canEdit ? (
                  <button
                    type="button"
                    onClick={handleNewPack}
                    aria-disabled={isOffline}
                    className={`${cabinetActionSecondaryClass} w-full ${isOffline ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {tCabinet(language, "newPack")}
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-disabled={isOffline}
                    className={`${cabinetActionDangerClass} col-span-2 w-full ${isOffline ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {tCabinet(language, "writeOff")}
                  </button>
                ) : null}
              </div>
            </div>
          )}
          {!compact && isExpanded && (
            <div className="hidden md:flex md:w-auto md:flex-row md:flex-wrap md:gap-2">
              <button type="button" onClick={toggleDetails} className={cabinetActionSecondaryClass}>
                {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
              </button>
              {canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={handleNewPack}
                    aria-disabled={isOffline}
                    className={`${cabinetActionSecondaryClass} ${isOffline ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {tCabinet(language, "newPack")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-disabled={isOffline}
                    className={`${cabinetActionDangerClass} ${isOffline ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {tCabinet(language, "writeOff")}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function MedicineListRowContent({
  medicine,
  localizedMedicineForm,
  statusLabel,
  statusDateClass,
  statusDateText,
  statusDotClass,
}: {
  medicine: HouseholdMedicine;
  localizedMedicineForm: string;
  statusLabel: string;
  statusDateClass: string;
  statusDateText: string;
  statusDotClass: string;
}) {
  return (
    <div className="min-w-0">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} />
          <p className="min-w-0 break-words text-sm font-semibold leading-5 tracking-[-0.02em] text-foreground">
            {medicine.medicineName}
            {medicine.medicineConcentration ? `, ${medicine.medicineConcentration}` : ""}
          </p>
        </div>
        <div className="mt-0.5 pl-4">
          <p className="text-[0.72rem] leading-5 text-muted">
            <span className={`font-semibold ${statusDateClass}`}>{statusLabel}</span>
            <span className="text-muted"> · </span>
            <span className={statusDateClass}>{statusDateText}</span>
            {medicine.medicineForm &&
            medicine.medicineForm.trim().toLowerCase() !== "не указано" ? (
              <span className="text-muted"> · {localizedMedicineForm}</span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}

function MedicineDetails({
  language,
  medicine,
  localizedMedicineForm,
  useUntilText,
  canEdit,
  isOffline,
  isUpdatingDoseCalc,
  onNetworkRequired,
  onUpdateDoseCalc,
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  localizedMedicineForm: string;
  useUntilText: string;
  canEdit: boolean;
  isOffline: boolean;
  isUpdatingDoseCalc: boolean;
  onNetworkRequired?: () => void;
  onUpdateDoseCalc?: (id: string, minValue: number | null, maxValue: number | null) => void;
}) {
  const [isDoseCalcEditorOpen, setIsDoseCalcEditorOpen] = useState(false);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [doseCalcError, setDoseCalcError] = useState<string | null>(null);
  const doseCalcValue = formatDoseCalcValue(medicine, language);

  const handleDoseCalcSave = () => {
    if (isOffline) {
      onNetworkRequired?.();
      return;
    }

    const parsedMin = minInput.trim() ? Number.parseFloat(minInput) : null;
    const parsedMax = maxInput.trim() ? Number.parseFloat(maxInput) : null;

    if (
      (parsedMin !== null && (!Number.isFinite(parsedMin) || parsedMin <= 0)) ||
      (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax <= 0))
    ) {
      setDoseCalcError(
        language === "ru"
          ? "Укажите значение больше нуля."
          : "Use a value greater than zero."
      );
      return;
    }

    if (parsedMin === null && parsedMax === null) {
      setDoseCalcError(
        language === "ru"
          ? "Добавьте минимум или максимум."
          : "Add a minimum or maximum value."
      );
      return;
    }

    if (parsedMin !== null && parsedMax !== null && parsedMax < parsedMin) {
      setDoseCalcError(
        language === "ru" ? "Максимум должен быть не меньше минимума." : "Max must be at least min."
      );
      return;
    }

    setDoseCalcError(null);
    onUpdateDoseCalc?.(medicine.id, parsedMin, parsedMax);
  };

  return (
    <div className="mt-3 space-y-2 border-t border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] pt-3 text-xs leading-5 text-muted">
      <p className="break-words">
        {tCabinet(language, medicine.medicineCategory ? "manualCategoryField" : "formField", {
          value: localizedMedicineForm,
        })}
      </p>
      {medicine.medicineDescription && (
        <p className="break-words">
          {tCabinet(language, "descriptionField", {
            value: medicine.medicineDescription,
          })}
        </p>
      )}
      <p className="break-words">
        {medicine.medicineDosage
          ? tCabinet(language, "usageField", { value: medicine.medicineDosage })
          : tCabinet(language, "usageMissingField")}
      </p>
      <p className="break-words">
        {doseCalcValue
          ? tCabinet(language, "doseCalcField", { value: doseCalcValue })
          : tCabinet(language, "doseCalcMissingField")}
      </p>
      {!doseCalcValue && canEdit ? (
        <div className="space-y-2 rounded-2xl border border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_48%,transparent)] px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_42%,transparent)]">
          {!isDoseCalcEditorOpen ? (
            <button
              type="button"
              onClick={() => {
                if (isOffline) {
                  onNetworkRequired?.();
                  return;
                }
                setDoseCalcError(null);
                setIsDoseCalcEditorOpen(true);
              }}
              className={`${cabinetActionSecondaryClass} w-full`}
            >
              {language === "ru" ? "Добавить дозировку" : "Add dosage"}
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="soft-field-label">
                    {language === "ru" ? "Минимум, мг/кг" : "Min, mg/kg"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={minInput}
                    onChange={(event) => setMinInput(event.target.value)}
                    className={cabinetCompactInputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="soft-field-label">
                    {language === "ru" ? "Максимум, мг/кг" : "Max, mg/kg"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={maxInput}
                    onChange={(event) => setMaxInput(event.target.value)}
                    className={cabinetCompactInputClass}
                  />
                </label>
              </div>
              {doseCalcError ? <p className="text-xs text-rose-600">{doseCalcError}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDoseCalcEditorOpen(false);
                    setMinInput("");
                    setMaxInput("");
                    setDoseCalcError(null);
                  }}
                  className={`${cabinetActionSecondaryClass} w-full`}
                >
                  {language === "ru" ? "Отмена" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleDoseCalcSave}
                  disabled={isUpdatingDoseCalc}
                  className={`${cabinetActionPrimaryClass} w-full`}
                >
                  {isUpdatingDoseCalc
                    ? language === "ru"
                      ? "Сохраняем..."
                      : "Saving..."
                    : language === "ru"
                      ? "Сохранить"
                      : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {medicine.openedAt && (
        <p className="break-words">
          {medicine.effectiveOpenedShelfDays
            ? tCabinet(language, "openedFieldKnown", {
                date: formatDate(medicine.openedAt),
                days: medicine.effectiveOpenedShelfDays,
                untilText: useUntilText,
              })
            : tCabinet(language, "openedFieldUnknown", {
                date: formatDate(medicine.openedAt),
                untilText: useUntilText,
              })}
        </p>
      )}
      {medicine.comment && (
        <p className="break-words">
          {tCabinet(language, "commentField", { value: medicine.comment })}
        </p>
      )}
    </div>
  );
}
