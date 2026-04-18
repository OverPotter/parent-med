import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import { tCabinet } from "./copy";
import {
  cabinetActionDangerClass,
  cabinetActionSecondaryClass,
  cabinetListRowClass,
} from "./styles";
import {
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
  isExpanded,
  onExpandChange,
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  compact?: boolean;
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
  };

  const toggleDetails = () => {
    if (!isExpanded) {
      onExpandChange(true);
    }
    setIsDetailsExpanded((value) => !value);
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
                {!compact && (
                  <button
                    type="button"
                    onClick={() => {
                      onExpandChange(false);
                      setIsDetailsExpanded(false);
                      navigate(`/medicine-cabinet/${medicine.id}/new-pack`);
                    }}
                    className={`${cabinetActionSecondaryClass} w-full`}
                  >
                    {tCabinet(language, "newPack")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`${cabinetActionDangerClass} col-span-2 w-full`}
                >
                  {tCabinet(language, "writeOff")}
                </button>
              </div>
            </div>
          )}
          {!compact && isExpanded && (
            <div className="hidden md:flex md:w-auto md:flex-row md:flex-wrap md:gap-2">
              <button type="button" onClick={toggleDetails} className={cabinetActionSecondaryClass}>
                {isDetailsExpanded ? tCabinet(language, "hide") : tCabinet(language, "details")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onExpandChange(false);
                  setIsDetailsExpanded(false);
                  navigate(`/medicine-cabinet/${medicine.id}/new-pack`);
                }}
                className={cabinetActionSecondaryClass}
              >
                {tCabinet(language, "newPack")}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className={cabinetActionDangerClass}
              >
                {tCabinet(language, "writeOff")}
              </button>
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
          <p className={`text-[0.72rem] font-semibold leading-4 ${statusDateClass}`}>
            {statusLabel}
          </p>
          <p className="text-[0.72rem] leading-5 text-muted">
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
}: {
  language: AppLanguage;
  medicine: HouseholdMedicine;
  localizedMedicineForm: string;
  useUntilText: string;
}) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] pt-3 text-xs leading-5 text-muted">
      <p>{tCabinet(language, "formField", { value: localizedMedicineForm })}</p>
      {medicine.openedAt && (
        <p>
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
      {medicine.medicineDosage && (
        <p>{tCabinet(language, "usageField", { value: medicine.medicineDosage })}</p>
      )}
      {medicine.medicineDescription && (
        <p>
          {tCabinet(language, "descriptionField", {
            value: medicine.medicineDescription,
          })}
        </p>
      )}
      {medicine.comment && <p>{tCabinet(language, "commentField", { value: medicine.comment })}</p>}
    </div>
  );
}
