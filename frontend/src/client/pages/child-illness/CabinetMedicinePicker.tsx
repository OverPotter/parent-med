import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import {
  SectionTitle,
  illnessCompactInputClass,
  illnessCompactSecondaryButtonClass,
} from "./shared";
import { formatMedicineCountLabel, getMedicineStatusLabel } from "./reminderUtils";

function canUseMedicineInReminder(medicine: HouseholdMedicine) {
  return medicine.status !== "expired" && medicine.status !== "expired_after_opening";
}

function getMedicineValidUntilText(medicine: HouseholdMedicine, language: "ru" | "en") {
  const dateText = formatDate(medicine.expiryDate);
  return language === "ru" ? `Годен до ${dateText}` : `Good until ${dateText}`;
}

function getMedicineTitle(medicine: HouseholdMedicine) {
  return medicine.medicineConcentration
    ? `${medicine.medicineName} · ${medicine.medicineConcentration}`
    : medicine.medicineName;
}

function getMedicineDoseCalcText(medicine: HouseholdMedicine, language: "ru" | "en") {
  const minDose = medicine.pediatricDoseMgPerKgMin;
  const maxDose = medicine.pediatricDoseMgPerKgMax;

  if (minDose == null && maxDose == null) {
    return language === "ru" ? "Нет" : "None";
  }

  const formatValue = (value: number) =>
    new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);

  if (minDose != null && maxDose != null && Math.abs(minDose - maxDose) > 0.001) {
    return `${formatValue(minDose)}-${formatValue(maxDose)} ${
      language === "ru" ? "мг/кг" : "mg/kg"
    }`;
  }

  return `${formatValue(maxDose ?? minDose ?? 0)} ${language === "ru" ? "мг/кг" : "mg/kg"}`;
}

export function CabinetMedicinePicker({
  medicines,
  value,
  onChange,
  label,
  screenOnly = false,
}: {
  medicines: HouseholdMedicine[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  screenOnly?: boolean;
}) {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedLabel = label ?? (language === "ru" ? "Упаковка" : "Pack");
  const [query, setQuery] = useState("");
  const isOpen = searchParams.get("picker") === "cabinet";
  const selectedMedicine = medicines.find((medicine) => medicine.id === value) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const availableMedicines = medicines.filter(canUseMedicineInReminder);
  const filteredMedicines = normalizedQuery
    ? availableMedicines.filter((medicine) =>
        [
          medicine.medicineName,
          medicine.medicineConcentration ?? "",
          medicine.medicineForm ?? "",
          medicine.medicineDosage ?? "",
          getMedicineStatusLabel(medicine, language),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : availableMedicines;

  const selectMedicine = (medicineId: string) => {
    onChange(medicineId);
    const next = new URLSearchParams(searchParams);
    next.delete("picker");
    setSearchParams(next, { replace: true });
    setQuery("");
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [isOpen]);

  const pickerScreen = (
    <div className="min-w-0 space-y-4 overflow-hidden md:min-h-0 md:space-y-4">
      <SectionTitle
        title={language === "ru" ? "Выбрать из аптечки" : "Choose from first aid kit"}
        subtitle={
          selectedMedicine
            ? language === "ru"
              ? "Оставьте текущий препарат или выберите другой."
              : "Keep the current medicine or choose a different one."
            : language === "ru"
              ? "Выберите готовую упаковку из аптечки."
              : "Choose an available pack from the cabinet."
        }
        actionInlineOnMobile
        action={
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("picker");
              setSearchParams(next, { replace: true });
            }}
            className={illnessCompactSecondaryButtonClass}
          >
            {language === "ru" ? "Назад" : "Back"}
          </button>
        }
      />

      {availableMedicines.length > 0 ? (
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={language === "ru" ? "Поиск по аптечке" : "Search first aid kit"}
          className={illnessCompactInputClass}
        />
      ) : null}

      <div className="soft-panel min-w-0 overflow-hidden rounded-[24px]">
        {filteredMedicines.map((medicine) => {
          const isActive = medicine.id === value;
          const statusDotClass =
            medicine.status === "expired" || medicine.status === "expired_after_opening"
              ? "bg-rose-500"
              : medicine.status === "expiring_soon" || medicine.status === "expiring_after_opening"
                ? "bg-amber-500"
                : "bg-emerald-500";

          return (
            <button
              key={medicine.id}
              type="button"
              onClick={() => selectMedicine(medicine.id)}
              aria-pressed={isActive}
              className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_42%,transparent)] px-4 py-3 text-left transition last:border-b-0 ${
                isActive
                  ? ""
                  : "hover:bg-[color:color-mix(in_srgb,var(--color-surface-soft)_92%,transparent)]"
              }`}
            >
              <span className="min-w-0">
                <span className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusDotClass}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
                    {getMedicineTitle(medicine)}
                  </span>
                </span>
                <span className="mt-1 block truncate pl-4 text-xs text-muted">
                  {[medicine.medicineForm, getMedicineValidUntilText(medicine, language)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-1 block truncate pl-4 text-xs text-muted">
                  {language === "ru"
                    ? `Дозировка: ${getMedicineDoseCalcText(medicine, language)}`
                    : `Dosage: ${getMedicineDoseCalcText(medicine, language)}`}
                </span>
              </span>
              <span
                className={`inline-flex min-h-[2.2rem] items-center rounded-full px-3 text-[0.74rem] font-semibold ${
                  isActive
                    ? "soft-pill-primary app-profile-action--selected"
                    : "soft-pill app-profile-action"
                }`}
                aria-hidden="true"
              >
                {isActive
                  ? language === "ru"
                    ? "Выбрано"
                    : "Selected"
                  : language === "ru"
                    ? "Выбрать"
                    : "Choose"}
              </span>
            </button>
          );
        })}
        {filteredMedicines.length === 0 && (
          <div className="px-4 py-4 text-sm text-muted">
            {availableMedicines.length === 0
              ? language === "ru"
                ? "Сейчас нет упаковок, которые можно использовать в напоминании."
                : "There are no packs that can be used in a reminder right now."
              : language === "ru"
                ? "Ничего не найдено."
                : "Nothing found."}
          </div>
        )}
      </div>
    </div>
  );

  if (screenOnly) {
    return pickerScreen;
  }

  return (
    <div className="block min-w-0">
      <span className="soft-field-label">{resolvedLabel}</span>
      <div className="mt-2">
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.set("picker", "cabinet");
            setSearchParams(next, { replace: false });
          }}
          aria-expanded={isOpen}
          className={`${illnessCompactSecondaryButtonClass} flex w-full items-start justify-between gap-3 text-left`}
        >
          <span className="min-w-0 flex-1 overflow-hidden">
            {selectedMedicine ? (
              <>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {getMedicineTitle(selectedMedicine)}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {[selectedMedicine.medicineForm, getMedicineValidUntilText(selectedMedicine, language)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {language === "ru"
                    ? `Дозировка: ${getMedicineDoseCalcText(selectedMedicine, language)}`
                    : `Dosage: ${getMedicineDoseCalcText(selectedMedicine, language)}`}
                </span>
              </>
            ) : (
              <>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {language === "ru" ? "Выбрать из аптечки" : "Choose from first aid kit"}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {availableMedicines.length}{" "}
                  {language === "ru"
                    ? formatMedicineCountLabel(availableMedicines.length)
                    : availableMedicines.length === 1
                      ? "medicine"
                      : "medicines"}
                </span>
              </>
            )}
          </span>
          {!selectedMedicine ? (
            <span className="soft-choice-check shrink-0" aria-hidden="true">
              {language === "ru" ? "Выбрать" : "Choose"}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
