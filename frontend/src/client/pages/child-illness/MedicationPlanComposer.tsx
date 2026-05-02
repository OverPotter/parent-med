import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { HouseholdMedicine, WeightEntry } from "@shared/types/api";
import { getCurrentDeviceTimestampIso, getLocalIsoDate } from "@shared/utils/date";
import { scrollFieldIntoView } from "@shared/utils/focus";
import {
  calculateMedicationDoseRecommendation,
  getMedicationDosePerKgReference,
} from "../../utils/medicationPlans";
import {
  appBtnSecondaryClass,
  illnessCompactInputClass,
  illnessCompactSecondaryButtonClass,
  illnessPanelSoftClass,
} from "./shared";
import { MedicationDoseCalculationCard } from "./MedicationDoseCalculationCard";
import {
  canSubmitMedicationPlanComposer,
  hasDoseUnitHint,
  MedicationPlanPayload,
  intervalMinutesToInputValue,
  parseIntervalInputToMinutes,
  parseNullableInteger,
  parseNullableNumber,
  reminderModeButtonClass,
} from "./reminderUtils";
import { CabinetMedicinePicker } from "./CabinetMedicinePicker";
import { ReminderFirstAdministrationSection } from "./ReminderFirstAdministrationSection";
import { isFutureFirstAdministrationSelection } from "./reminderTiming";

const reminderComposerPrimaryActionClass =
  "soft-pill-success app-profile-action app-profile-action--active min-h-[2.58rem] px-3.75 text-[0.8rem] sm:min-h-[2.68rem] sm:text-[0.82rem]";
const reminderComposerSecondaryActionClass = `${illnessCompactSecondaryButtonClass} min-h-[2.45rem] px-3.5 text-[0.79rem] sm:min-h-[2.55rem] sm:text-[0.81rem]`;
const reminderComposerDisabledActionClass = `${reminderComposerSecondaryActionClass} border border-border/75 bg-[color:color-mix(in_srgb,var(--color-surface)_84%,var(--color-background)_16%)] text-foreground/55 shadow-none opacity-70 cursor-not-allowed`;

function getCurrentLocalTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDoseSummaryNumber(value: number, language: "ru" | "en") {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function toPositiveNumber(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function toLocalDeviceTimestampIso(dateValue: string, timeValue: string) {
  const [parsedYear, parsedMonth, parsedDay] = dateValue
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const [parsedHours, parsedMinutes] = timeValue
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  const year = parsedYear ?? 0;
  const month = parsedMonth ?? 1;
  const day = parsedDay ?? 1;
  const hours = parsedHours ?? 0;
  const minutes = parsedMinutes ?? 0;
  return getCurrentDeviceTimestampIso(new Date(year, month - 1, day, hours, minutes, 0, 0));
}

export function MedicationPlanComposer({
  childName,
  medicines,
  latestWeight,
  onSubmit,
  submitLabel,
  isPending,
  initialValue,
  onCancel,
}: {
  childName?: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onSubmit: (payload: MedicationPlanPayload) => void;
  submitLabel: string;
  isPending: boolean;
  initialValue?: MedicationPlanPayload | null;
  onCancel?: () => void;
}) {
  const { language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const isCabinetPickerOpen = searchParams.get("picker") === "cabinet";
  const defaultPlanMode: "cabinet" | "manual" = initialValue?.householdMedicineId
    ? "cabinet"
    : "manual";
  const [planMode, setPlanMode] = useState<"cabinet" | "manual">(defaultPlanMode);
  const [selectedMedicineId, setSelectedMedicineId] = useState(
    initialValue?.householdMedicineId ?? ""
  );
  const [customMedicineName, setCustomMedicineName] = useState(
    initialValue?.customMedicineName ?? ""
  );
  const [doseAmount, setDoseAmount] = useState(initialValue?.doseAmount ?? "");
  const [minIntervalInput, setMinIntervalInput] = useState(
    initialValue
      ? intervalMinutesToInputValue(initialValue.minIntervalMinutes, intervalUnit)
      : intervalUnit === "minutes"
        ? "180"
        : "3"
  );
  const [maxDosesPerDay, setMaxDosesPerDay] = useState(
    initialValue?.maxDosesPerDay ? String(initialValue.maxDosesPerDay) : ""
  );
  const [weightKg, setWeightKg] = useState(
    initialValue?.weightKg
      ? String(initialValue.weightKg)
      : latestWeight
        ? String(latestWeight.valueKg)
        : ""
  );
  const [doseMgPerKg, setDoseMgPerKg] = useState(
    initialValue?.doseMgPerKg ? String(initialValue.doseMgPerKg) : ""
  );
  const [manualDoseOverride, setManualDoseOverride] = useState(
    initialValue?.manualDoseOverride ?? false
  );
  const [isDoseSettingsOpen, setIsDoseSettingsOpen] = useState(false);
  const [firstDoseStatus, setFirstDoseStatus] = useState<"already_given" | "not_given">(
    initialValue?.firstDoseStatus ?? "not_given"
  );
  const [firstDoseDate, setFirstDoseDate] = useState(getLocalIsoDate());
  const [firstDoseTime, setFirstDoseTime] = useState(getCurrentLocalTimeValue());
  const autoAppliedWeightRef = useRef<string | null>(null);
  const autoAppliedDosePerKgRef = useRef<string | null>(null);
  const autoFillWeightEnabledRef = useRef(true);
  const autoFillDosePerKgEnabledRef = useRef(true);
  const autoFillDoseEnabledRef = useRef(true);
  const lastSuggestedDoseRef = useRef("");
  const previousPlanModeRef = useRef<"cabinet" | "manual">(defaultPlanMode);
  const previousSelectedMedicineIdRef = useRef(initialValue?.householdMedicineId ?? "");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) ?? null;
  const referenceDosePerKg = getMedicationDosePerKgReference(selectedMedicine, language);
  const parsedWeightKg = toPositiveNumber(parseNullableNumber(weightKg));
  const parsedDoseMgPerKg = toPositiveNumber(parseNullableNumber(doseMgPerKg));
  const doseCalculation = calculateMedicationDoseRecommendation(
    selectedMedicine,
    parsedWeightKg,
    parsedDoseMgPerKg,
    language
  );
  const suggestedDoseText = doseCalculation?.suggestedDoseText ?? "";
  const shouldShowDoseUnitHint = hasDoseUnitHint(doseAmount);
  const parsedIntervalMinutes = parseIntervalInputToMinutes(minIntervalInput, intervalUnit);
  const firstDoseAt =
    !initialValue && firstDoseStatus === "already_given"
      ? toLocalDeviceTimestampIso(firstDoseDate, firstDoseTime)
      : null;
  const hasFutureFirstDoseSelection =
    !initialValue &&
    firstDoseStatus === "already_given" &&
    isFutureFirstAdministrationSelection(firstDoseDate, firstDoseTime);
  const canSubmit = canSubmitMedicationPlanComposer({
    isPending,
    planMode,
    selectedMedicineId,
    customMedicineName,
    doseAmount,
    minIntervalInput,
    parsedIntervalMinutes,
    hasFutureFirstDoseSelection,
  });
  const latestWeightValue = latestWeight?.valueKg ?? null;
  const latestWeightText = latestWeightValue !== null ? String(latestWeightValue) : "";
  const latestWeightMeta = latestWeight
    ? language === "ru"
      ? `${latestWeight.valueKg} кг`
      : `${latestWeight.valueKg} kg`
    : null;
  const childWeightSummaryLabel =
    language === "ru"
      ? childName && childName.trim().length > 0
        ? `${childName.trim()} вес`
        : "Вес"
      : childName && childName.trim().length > 0
        ? `${childName.trim()} weight`
        : "Weight";
  const referenceDoseLabel = referenceDosePerKg?.sourceLabel ?? null;
  const effectiveDosePerKgText =
    parsedDoseMgPerKg !== null
      ? `${parsedDoseMgPerKg} ${language === "ru" ? "мг/кг" : "mg/kg"}`
      : referenceDoseLabel;
  const canUseDoseCalculation =
    planMode === "cabinet" &&
    !!selectedMedicine &&
    (referenceDosePerKg !== null || parsedDoseMgPerKg !== null || !!initialValue?.doseMgPerKg);
  const formulaSummary =
    canUseDoseCalculation && parsedWeightKg !== null && parsedDoseMgPerKg !== null
      ? language === "ru"
        ? `${formatDoseSummaryNumber(parsedWeightKg, language)} кг × ${formatDoseSummaryNumber(parsedDoseMgPerKg, language)} мг/кг = ${doseCalculation ? `${formatDoseSummaryNumber(doseCalculation.calculatedDoseMg, language)} мг${doseCalculation.calculatedDoseUnit && doseCalculation.calculatedDoseUnit !== "mg" && doseCalculation.calculatedDoseValue !== null ? ` = ${doseCalculation.suggestedDoseText}` : ""}` : `${formatDoseSummaryNumber(parsedWeightKg * parsedDoseMgPerKg, language)} мг`}`
        : `${formatDoseSummaryNumber(parsedWeightKg, language)} kg × ${formatDoseSummaryNumber(parsedDoseMgPerKg, language)} mg/kg = ${doseCalculation ? `${formatDoseSummaryNumber(doseCalculation.calculatedDoseMg, language)} mg${doseCalculation.calculatedDoseUnit && doseCalculation.calculatedDoseUnit !== "mg" && doseCalculation.calculatedDoseValue !== null ? ` = ${doseCalculation.suggestedDoseText}` : ""}` : `${formatDoseSummaryNumber(parsedWeightKg * parsedDoseMgPerKg, language)} mg`}`
      : null;
  const concentrationSummary =
    selectedMedicine && canUseDoseCalculation
      ? [selectedMedicine.medicineForm, selectedMedicine.medicineConcentration]
          .filter((value) => !!value)
          .join(" · ")
      : null;
  const showDoseReferenceSummary = Boolean(
    canUseDoseCalculation &&
    (latestWeightMeta || effectiveDosePerKgText || concentrationSummary || formulaSummary)
  );
  const summaryDosePerKgLabel =
    parsedDoseMgPerKg !== null
      ? `${parsedDoseMgPerKg} ${language === "ru" ? "мг/кг" : "mg/kg"}`
      : referenceDosePerKg
        ? `${referenceDosePerKg.value} ${language === "ru" ? "мг/кг" : "mg/kg"}`
        : null;

  const clearCabinetPicker = () => {
    if (!searchParams.get("picker")) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete("picker");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (planMode !== "cabinet") {
      clearCabinetPicker();
    }
  }, [planMode]);

  useEffect(() => {
    if (!latestWeightText || !autoFillWeightEnabledRef.current) {
      autoAppliedWeightRef.current = null;
      return;
    }

    const trimmedWeight = weightKg.trim();
    if (
      !trimmedWeight ||
      (autoAppliedWeightRef.current !== null && trimmedWeight === autoAppliedWeightRef.current)
    ) {
      setWeightKg(latestWeightText);
      autoAppliedWeightRef.current = latestWeightText;
    }
  }, [latestWeightText]);

  useEffect(() => {
    const referenceText =
      referenceDosePerKg && Number.isFinite(referenceDosePerKg.value)
        ? String(referenceDosePerKg.value)
        : "";

    if (!canUseDoseCalculation || !referenceText || !autoFillDosePerKgEnabledRef.current) {
      if (
        autoAppliedDosePerKgRef.current !== null &&
        doseMgPerKg.trim() === autoAppliedDosePerKgRef.current
      ) {
        setDoseMgPerKg("");
      }
      autoAppliedDosePerKgRef.current = null;
      return;
    }

    const trimmedDosePerKg = doseMgPerKg.trim();
    if (
      !trimmedDosePerKg ||
      (autoAppliedDosePerKgRef.current !== null &&
        trimmedDosePerKg === autoAppliedDosePerKgRef.current)
    ) {
      setDoseMgPerKg(referenceText);
      autoAppliedDosePerKgRef.current = referenceText;
    }
  }, [canUseDoseCalculation, referenceDosePerKg]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (
        !target.matches(
          "input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable='true']"
        )
      ) {
        return;
      }
      scrollFieldIntoView(target, { delayMs: 140, block: "center" });
    };

    root.addEventListener("focusin", handleFocusIn);
    return () => {
      root.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  useEffect(() => {
    if (planMode !== "cabinet" || !suggestedDoseText || !autoFillDoseEnabledRef.current) {
      return;
    }
    const trimmedDose = doseAmount.trim();
    if (manualDoseOverride && trimmedDose) {
      return;
    }
    if (
      trimmedDose &&
      trimmedDose !== lastSuggestedDoseRef.current &&
      trimmedDose !== suggestedDoseText
    ) {
      return;
    }
    setDoseAmount(suggestedDoseText);
    setManualDoseOverride(false);
    lastSuggestedDoseRef.current = suggestedDoseText;
  }, [doseAmount, manualDoseOverride, planMode, suggestedDoseText]);

  useEffect(() => {
    if (planMode !== "cabinet" || suggestedDoseText || manualDoseOverride) {
      return;
    }

    if (doseAmount.trim() && doseAmount.trim() === lastSuggestedDoseRef.current) {
      setDoseAmount("");
      lastSuggestedDoseRef.current = "";
    }
  }, [doseAmount, manualDoseOverride, planMode, suggestedDoseText]);

  useEffect(() => {
    if (selectedMedicineId === previousSelectedMedicineIdRef.current) {
      return;
    }
    previousSelectedMedicineIdRef.current = selectedMedicineId;
    autoFillWeightEnabledRef.current = true;
    autoFillDosePerKgEnabledRef.current = true;
    autoFillDoseEnabledRef.current = true;
    lastSuggestedDoseRef.current = "";
    autoAppliedWeightRef.current = null;
    autoAppliedDosePerKgRef.current = null;
    if (!selectedMedicineId) {
      return;
    }
    if (latestWeightText) {
      setWeightKg(latestWeightText);
      autoAppliedWeightRef.current = latestWeightText;
    }
    const referenceText =
      referenceDosePerKg && Number.isFinite(referenceDosePerKg.value)
        ? String(referenceDosePerKg.value)
        : "";
    if (referenceText) {
      setDoseMgPerKg(referenceText);
      autoAppliedDosePerKgRef.current = referenceText;
    } else {
      setDoseMgPerKg("");
    }
    setManualDoseOverride(false);
  }, [latestWeightText, referenceDosePerKg, selectedMedicineId]);

  useEffect(() => {
    if (initialValue) {
      previousPlanModeRef.current = planMode;
      setIsDoseSettingsOpen(false);
      return;
    }
    setIsDoseSettingsOpen(false);
    if (previousPlanModeRef.current === "cabinet" && planMode === "manual") {
      setSelectedMedicineId("");
      setDoseAmount("");
      setManualDoseOverride(false);
      setWeightKg("");
      setDoseMgPerKg("");
      autoFillWeightEnabledRef.current = true;
      autoFillDosePerKgEnabledRef.current = true;
      autoFillDoseEnabledRef.current = true;
      lastSuggestedDoseRef.current = "";
    }
    previousPlanModeRef.current = planMode;
  }, [canUseDoseCalculation, initialValue, planMode]);

  if (planMode === "cabinet" && isCabinetPickerOpen) {
    return (
      <CabinetMedicinePicker
        medicines={medicines}
        value={selectedMedicineId}
        onChange={setSelectedMedicineId}
        label={language === "ru" ? "Лекарство" : "Medicine"}
        screenOnly
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className="space-y-4"
      style={{
        scrollPaddingBottom:
          "calc(8.5rem + var(--app-keyboard-height, 0px) + max(0.75rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom))))",
      }}
    >
      <div className={`${illnessPanelSoftClass} space-y-4 rounded-[28px] p-4 sm:p-5`}>
        {medicines.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                clearCabinetPicker();
                setPlanMode("manual");
              }}
              className={reminderModeButtonClass(planMode === "manual", appBtnSecondaryClass)}
            >
              {language === "ru" ? "Вручную" : "Manual"}
            </button>
            <button
              type="button"
              onClick={() => setPlanMode("cabinet")}
              className={reminderModeButtonClass(planMode === "cabinet", appBtnSecondaryClass)}
            >
              {language === "ru" ? "Из аптечки" : "From cabinet"}
            </button>
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="min-w-0">
            {planMode === "cabinet" ? (
              <div className="space-y-3">
                <CabinetMedicinePicker
                  medicines={medicines}
                  value={selectedMedicineId}
                  onChange={setSelectedMedicineId}
                  label={language === "ru" ? "Лекарство" : "Medicine"}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block min-w-0 space-y-1.5">
                  <span className="soft-field-label">
                    {language === "ru" ? "Лекарство" : "Medicine"}
                  </span>
                  <input
                    type="text"
                    value={customMedicineName}
                    onChange={(event) => setCustomMedicineName(event.target.value)}
                    placeholder={language === "ru" ? "Например: Ибуклин" : "Example: Ibuklin"}
                    className={illnessCompactInputClass}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="space-y-3">
              <MedicationDoseCalculationCard
                language={language}
                show={showDoseReferenceSummary}
                childWeightSummaryLabel={childWeightSummaryLabel}
                latestWeightMeta={latestWeightMeta}
                summaryDosePerKgLabel={summaryDosePerKgLabel}
                formulaSummary={formulaSummary}
                isOpen={isDoseSettingsOpen}
                onToggle={() => setIsDoseSettingsOpen((current) => !current)}
                latestWeightValue={latestWeight?.valueKg ?? null}
                weightKg={weightKg}
                doseMgPerKg={doseMgPerKg}
                referenceDosePerKgValue={referenceDosePerKg?.value ?? null}
                onWeightChange={(value) => {
                  autoFillWeightEnabledRef.current = false;
                  autoAppliedWeightRef.current = null;
                  setWeightKg(value);
                }}
                onDosePerKgChange={(value) => {
                  autoFillDosePerKgEnabledRef.current = false;
                  autoAppliedDosePerKgRef.current = null;
                  setDoseMgPerKg(value);
                }}
              />

              <label className="block space-y-1.5">
                <span className="soft-field-label">
                  {language === "ru"
                    ? "Итоговая доза для напоминания"
                    : "Final dose for the reminder"}
                </span>
                <input
                  type="text"
                  value={doseAmount}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    autoFillDoseEnabledRef.current = false;
                    setDoseAmount(nextValue);
                    if (!suggestedDoseText) {
                      setManualDoseOverride(false);
                      return;
                    }
                    const trimmed = nextValue.trim();
                    setManualDoseOverride(trimmed !== suggestedDoseText);
                  }}
                  placeholder={
                    language === "ru" ? "Например: 10 мл или 1 таб." : "Example: 10 ml or 1 tab"
                  }
                  className={illnessCompactInputClass}
                />
                {selectedMedicine?.medicineDosage ? (
                  <p className="mt-2 text-xs text-muted">
                    {language === "ru" ? "Справка по дозировке" : "Dose guidance"}:{" "}
                    {selectedMedicine.medicineDosage}
                  </p>
                ) : null}
                {shouldShowDoseUnitHint && (
                  <p className="mt-2 text-xs text-muted">
                    {language === "ru"
                      ? "Лучше добавить единицу дозы: мл, таб., мг, кап. и т.д."
                      : "Better add a dose unit: ml, tab, mg, drops, etc."}
                  </p>
                )}
                {manualDoseOverride && doseAmount.trim() ? (
                  <p className="mt-2 text-xs text-muted">
                    {language === "ru"
                      ? `Итоговая доза изменена вручную: ${doseAmount.trim()}.`
                      : `Final dose was edited manually: ${doseAmount.trim()}.`}
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          <div className="min-w-0">
            <label className="block space-y-1.5">
              <span className="soft-field-label">
                {language === "ru" ? "Интервал напоминания" : "Reminder interval"},{" "}
                {intervalUnit === "minutes"
                  ? language === "ru"
                    ? "минут"
                    : "minutes"
                  : language === "ru"
                    ? "часов"
                    : "hours"}
              </span>
              <input
                type="number"
                min="1"
                max={intervalUnit === "minutes" ? "1440" : "24"}
                step={intervalUnit === "minutes" ? "1" : "0.5"}
                value={minIntervalInput}
                onChange={(e) => setMinIntervalInput(e.target.value)}
                className={illnessCompactInputClass}
              />
            </label>
          </div>

          <div className="min-w-0">
            <label className="block space-y-1.5">
              <span className="soft-field-label">
                {language === "ru" ? "Лимит приёмов в сутки" : "Daily dose limit"}
              </span>
              <input
                type="number"
                min="1"
                max="24"
                value={maxDosesPerDay}
                onChange={(e) => setMaxDosesPerDay(e.target.value)}
                placeholder={language === "ru" ? "Если знаете" : "If you know it"}
                className={illnessCompactInputClass}
              />
              <p className="mt-2 text-xs text-muted">
                {language === "ru"
                  ? "Необязательно. Укажите, только если на упаковке или от врача есть чёткий максимум на сутки."
                  : "Optional. Fill this in only when the package or clinician gives a clear per-day maximum."}
              </p>
            </label>
          </div>
        </div>
      </div>

      {!initialValue ? (
        <ReminderFirstAdministrationSection
          language={language}
          firstDoseStatus={firstDoseStatus}
          firstDoseDate={firstDoseDate}
          firstDoseTime={firstDoseTime}
          hasFutureFirstDoseSelection={hasFutureFirstDoseSelection}
          onStatusChange={setFirstDoseStatus}
          onDateChange={setFirstDoseDate}
          onTimeChange={setFirstDoseTime}
        />
      ) : null}

      <div className="grid gap-2 border-t border-border/60 pt-4">
        <div className={`grid gap-2 ${onCancel ? "grid-cols-2" : "grid-cols-1"}`}>
          {onCancel ? (
            <button
              type="button"
              onClick={() => {
                clearCabinetPicker();
                onCancel();
              }}
              disabled={isPending}
              className={`${reminderComposerSecondaryActionClass} w-full`}
            >
              {language === "ru" ? "Отмена" : "Cancel"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!canSubmit || parsedIntervalMinutes === null) {
                return;
              }

              onSubmit({
                householdMedicineId: planMode === "cabinet" ? selectedMedicineId : null,
                customMedicineName: planMode === "manual" ? customMedicineName.trim() : null,
                doseAmount: doseAmount.trim(),
                minIntervalMinutes: parsedIntervalMinutes,
                maxDosesPerDay: parseNullableInteger(maxDosesPerDay),
                weightKg: parsedWeightKg,
                doseMgPerKg: parsedDoseMgPerKg,
                calculatedDoseMg: doseCalculation?.calculatedDoseMg ?? null,
                calculatedDoseValue: doseCalculation?.calculatedDoseValue ?? null,
                calculatedDoseUnit: doseCalculation?.calculatedDoseUnit ?? null,
                doseCalcMode: doseCalculation?.doseCalcMode ?? null,
                doseCalcWarning: doseCalculation?.doseCalcWarning ?? null,
                manualDoseOverride,
                notes: null,
                firstDoseStatus: initialValue ? undefined : firstDoseStatus,
                firstDoseAt,
              });

              if (!initialValue) {
                setPlanMode("manual");
                setSelectedMedicineId("");
                setCustomMedicineName("");
                setDoseAmount("");
                setMinIntervalInput(intervalUnit === "minutes" ? "180" : "3");
                setMaxDosesPerDay("");
                setDoseMgPerKg("");
                setManualDoseOverride(false);
                setFirstDoseStatus("not_given");
                setFirstDoseDate(getLocalIsoDate());
                setFirstDoseTime(getCurrentLocalTimeValue());
              }
              clearCabinetPicker();
              onCancel?.();
            }}
            disabled={!canSubmit}
            className={`w-full ${
              canSubmit ? reminderComposerPrimaryActionClass : reminderComposerDisabledActionClass
            }`}
          >
            {isPending ? (language === "ru" ? "Сохраняем…" : "Saving…") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
