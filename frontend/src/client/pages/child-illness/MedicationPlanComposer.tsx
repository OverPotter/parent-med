import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { createWeightEntry } from "@shared/api/weightEntries";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useAppStore } from "@shared/store/useAppStore";
import type { HouseholdMedicine, WeightEntry } from "@shared/types/api";
import { getCurrentDeviceTimestampIso, getLocalIsoDate } from "@shared/utils/date";
import { formatChildDate } from "@client/utils/childDateFormat";
import { blurActiveField, scrollFieldIntoView } from "@shared/utils/focus";
import { buildWeightDoseHint } from "../../utils/medicationPlans";
import {
  appBtnSecondaryClass,
  illnessCompactInputClass,
  illnessCompactPrimaryButtonClass,
  illnessCompactSecondaryButtonClass,
  illnessPanelSoftClass,
} from "./shared";
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

const reminderComposerPrimaryActionClass = `${illnessCompactPrimaryButtonClass} min-h-[2.45rem] px-3.5 text-[0.79rem] sm:min-h-[2.55rem] sm:text-[0.81rem]`;
const reminderComposerSecondaryActionClass = `${illnessCompactSecondaryButtonClass} min-h-[2.45rem] px-3.5 text-[0.79rem] sm:min-h-[2.55rem] sm:text-[0.81rem]`;

function getCurrentLocalTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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
  return getCurrentDeviceTimestampIso(
    new Date(year, month - 1, day, hours, minutes, 0, 0)
  );
}

function InlineHint({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const showTouchHint = () => {
    setIsOpen(true);
    window.setTimeout(() => {
      setIsOpen(false);
    }, 1400);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        title={text}
        aria-label={text}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onTouchStart={(event) => {
          event.preventDefault();
          showTouchHint();
        }}
        className="soft-pill-primary inline-flex h-5 w-5 items-center justify-center rounded-full px-0 text-[11px] font-semibold leading-none"
      >
        !
      </button>
      {isOpen && (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-border/80 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-normal leading-5 text-foreground shadow-lg shadow-black/10">
          {text}
        </span>
      )}
    </span>
  );
}

export function MedicationPlanComposer({
  childId,
  medicines,
  latestWeight,
  onSubmit,
  submitLabel,
  isPending,
  initialValue,
  onCancel,
}: {
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onSubmit: (payload: MedicationPlanPayload) => void;
  submitLabel: string;
  isPending: boolean;
  initialValue?: MedicationPlanPayload | null;
  onCancel?: () => void;
}) {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const isCabinetPickerOpen = searchParams.get("picker") === "cabinet";
  const defaultPlanMode: "cabinet" | "manual" = initialValue?.householdMedicineId
    ? "cabinet"
    : "manual";
  const hasAdvancedInitialValue = Boolean(
    initialValue?.maxDosesPerDay || initialValue?.weightKg || initialValue?.doseMgPerKg
  );
  const [planMode, setPlanMode] = useState<"cabinet" | "manual">(defaultPlanMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(hasAdvancedInitialValue);
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
  const [firstDoseStatus, setFirstDoseStatus] = useState<"already_given" | "not_given">(
    initialValue?.firstDoseStatus ?? "not_given"
  );
  const [firstDoseDate, setFirstDoseDate] = useState(getLocalIsoDate());
  const [firstDoseTime, setFirstDoseTime] = useState(getCurrentLocalTimeValue());
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) ?? null;
  const parsedWeightKg = parseNullableNumber(weightKg);
  const weightHint = buildWeightDoseHint(
    selectedMedicine,
    parsedWeightKg,
    parseNullableNumber(doseMgPerKg)
  );
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
    minIntervalInput,
    parsedIntervalMinutes,
    hasFutureFirstDoseSelection,
  });
  const latestWeightValue = latestWeight?.valueKg ?? null;
  const shouldOfferWeightSync =
    parsedWeightKg !== null &&
    (latestWeightValue === null || Math.abs(parsedWeightKg - latestWeightValue) >= 0.1);

  const syncWeightMutation = useMutation({
    mutationFn: (valueKg: number) =>
      createWeightEntry({
        child_id: childId,
        value_kg: valueKg,
        measured_at: getCurrentDeviceTimestampIso(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", childId] });
    },
  });

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
      setHasKeyboardFocus(true);
      scrollFieldIntoView(target, { delayMs: 140, block: "center" });
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        const stillInForm =
          activeElement instanceof HTMLElement &&
          root.contains(activeElement) &&
          activeElement.matches(
            "input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable='true']"
          );
        setHasKeyboardFocus(Boolean(stillInForm));
      }, 0);
    };

    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);
    return () => {
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

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

          <div>
            <label className="block space-y-1.5">
              <span className="soft-field-label">
                {language === "ru"
                  ? "Сколько дать"
                  : "How much to give"}
              </span>
              <input
                type="text"
                value={doseAmount}
                onChange={(e) => setDoseAmount(e.target.value)}
                placeholder={
                  language === "ru" ? "Например: 10 мл или 1 таб." : "Example: 10 ml or 1 tab"
                }
                className={illnessCompactInputClass}
              />
              {shouldShowDoseUnitHint && (
                <p className="mt-2 text-xs text-muted">
                  {language === "ru"
                    ? "Лучше добавить единицу дозы: мл, таб., мг, кап. и т.д."
                    : "Better add a dose unit: ml, tab, mg, drops, etc."}
                </p>
              )}
            </label>
          </div>

          <div>
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

      <div className={`${illnessPanelSoftClass} rounded-[28px] p-4 sm:p-5`}>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm leading-6 text-muted">
              {language === "ru"
                ? "Проверка по весу и лимитам приёма, если она нужна."
                : "Weight and dose-limit checks if you need them."}
            </p>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((current) => !current)}
              className={reminderComposerSecondaryActionClass}
            >
              {isAdvancedOpen
                ? language === "ru"
                  ? "Скрыть"
                  : "Hide"
                : language === "ru"
                  ? "Доп. настройки"
                  : "Advanced"}
            </button>
          </div>

          {isAdvancedOpen && (
            <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 xl:grid-cols-2">
              <div>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">
                    {language === "ru" ? "Максимум в сутки" : "Max per day"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxDosesPerDay}
                    onChange={(e) => setMaxDosesPerDay(e.target.value)}
                    placeholder={language === "ru" ? "Необязательно" : "Optional"}
                    className={illnessCompactInputClass}
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    {language === "ru"
                      ? "Вес ребёнка для проверки, кг"
                      : "Child weight for check, kg"}
                    <InlineHint
                      text={
                        language === "ru"
                          ? "Нужен только для проверки по мг/кг. Если доза уже известна, поле можно пропустить."
                          : "Needed only for the mg/kg check. If the dose is already known, you can skip this field."
                      }
                    />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder={
                      latestWeight
                        ? String(latestWeight.valueKg)
                        : language === "ru"
                          ? "Необязательно"
                          : "Optional"
                    }
                    className={illnessCompactInputClass}
                  />
                  {latestWeight && (
                    <p className="mt-2 text-xs text-muted">
                      {language === "ru" ? "Последний вес" : "Latest weight"}:{" "}
                      {latestWeight.valueKg} {language === "ru" ? "кг" : "kg"}{" "}
                      {language === "ru" ? "от" : "from"}{" "}
                      {formatChildDate(latestWeight.measuredAt, language)}
                    </p>
                  )}
                  {shouldOfferWeightSync && (
                    <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">
                      <p>
                        {language === "ru"
                          ? `В плане указан вес ${parsedWeightKg} кг. Обновить его и в карточке ребёнка?`
                          : `The plan uses ${parsedWeightKg} kg. Update it in the child profile too?`}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (parsedWeightKg === null) {
                              return;
                            }
                            syncWeightMutation.mutate(parsedWeightKg);
                          }}
                          disabled={syncWeightMutation.isPending}
                          className={illnessCompactSecondaryButtonClass}
                        >
                          {syncWeightMutation.isPending
                            ? language === "ru"
                              ? "Сохраняем вес…"
                              : "Saving weight…"
                            : language === "ru"
                              ? "Обновить вес ребёнка"
                              : "Update child weight"}
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="xl:col-span-2">
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    {language === "ru" ? "Проверка по весу, мг/кг" : "Weight check, mg/kg"}
                    <InlineHint
                      text={
                        language === "ru"
                          ? "Если врач указал дозу в мг/кг, введи значение. Это проверка, основная доза задаётся выше."
                          : "If the doctor gave the dose in mg/kg, enter it here. This is a check, the main dose is set above."
                      }
                    />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={doseMgPerKg}
                    onChange={(e) => setDoseMgPerKg(e.target.value)}
                    placeholder={language === "ru" ? "Введите дозировку, мг" : "Optional"}
                    className={illnessCompactInputClass}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {weightHint && (
        <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">{weightHint}</div>
      )}

      <div className="grid gap-2 border-t border-border/60 pt-4">
        {isIosShell && hasKeyboardFocus ? (
          <button
            type="button"
            onClick={() => {
              blurActiveField();
              setHasKeyboardFocus(false);
            }}
            className={`${reminderComposerSecondaryActionClass} w-full`}
          >
            {language === "ru" ? "Скрыть клавиатуру" : "Hide keyboard"}
          </button>
        ) : null}
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
                weightKg: parseNullableNumber(weightKg),
                doseMgPerKg: parseNullableNumber(doseMgPerKg),
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
                setFirstDoseStatus("not_given");
                setFirstDoseDate(getLocalIsoDate());
                setFirstDoseTime(getCurrentLocalTimeValue());
              }
              clearCabinetPicker();
              onCancel?.();
            }}
            disabled={!canSubmit}
            className={`${reminderComposerPrimaryActionClass} w-full`}
          >
            {isPending ? (language === "ru" ? "Сохраняем…" : "Saving…") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
