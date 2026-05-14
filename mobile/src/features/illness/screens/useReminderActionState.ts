import { useEffect, useMemo, useState } from "react";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { useStoredMedicationIntervalUnit } from "../../settings/session/useStoredMedicationIntervalUnit";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import {
  extractIllnessMedicineNameFromTitle,
  normalizeIllnessMedicineName,
} from "../model/illnessMedicineNames";
import type { MobileIllnessObservation } from "../model/illnessObservation";
import {
  buildReminderIntervalSheetOptions,
  buildReminderLimitSheetOptions,
  getReminderIntervalCustomLabel,
  getReminderLimitCustomLabel,
} from "./reminderNumberOptions";

export function formatReminderIntervalForUnit(
  minutes: number,
  unit: "hours" | "minutes",
  locale: MobileLocale,
) {
  if (unit === "hours") {
    const hours = Math.round((minutes / 60) * 10) / 10;
    const formatted = Number.isInteger(hours) ? String(hours) : String(hours).replace(".", ",");
    return locale === "ru"
      ? `${formatted} ч`
      : locale === "de"
        ? `${formatted} Std.`
        : locale === "pl"
          ? `${formatted} godz.`
          : `${formatted} h`;
  }

  return locale === "ru"
    ? `${minutes} мин`
    : locale === "de"
      ? `${minutes} Min.`
      : locale === "pl"
        ? `${minutes} min`
        : `${minutes} min`;
}

export function useReminderActionState({
  visible,
  observation,
  locale,
  initialPlan,
}: {
  visible: boolean;
  observation: MobileIllnessObservation | null;
  locale: MobileLocale;
  initialPlan?: MobileEpisodeMedicationPlan | null;
}) {
  const [reminderMedicineValue, setReminderMedicineValue] = useState("");
  const [reminderDoseValue, setReminderDoseValue] = useState("");
  const [reminderIntervalMinutesValue, setReminderIntervalMinutesValue] =
    useState("180");
  const [reminderMaxDosesPerDay, setReminderMaxDosesPerDay] = useState<number | null>(
    null,
  );
  const [activeReminderNumberSheet, setActiveReminderNumberSheet] = useState<
    "interval" | "limit" | null
  >(null);
  const [customIntervalModalVisible, setCustomIntervalModalVisible] = useState(false);
  const [customIntervalValue, setCustomIntervalValue] = useState("");
  const [customLimitModalVisible, setCustomLimitModalVisible] = useState(false);
  const [customLimitValue, setCustomLimitValue] = useState("");
  const [reminderAlreadyGiven, setReminderAlreadyGiven] = useState(true);
  const [reminderAlreadyGivenExpanded, setReminderAlreadyGivenExpanded] =
    useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const { medicationIntervalUnit } = useStoredMedicationIntervalUnit();
  const {
    selectedDate: reminderLastGivenAt,
    activePickerField: activeReminderPickerField,
    pickerDay: reminderPickerDay,
    pickerMonthIndex: reminderPickerMonthIndex,
    pickerYear: reminderPickerYear,
    pickerHour: reminderPickerHour,
    pickerMinute: reminderPickerMinute,
    setPickerDay: setReminderPickerDay,
    setPickerMonthIndex: setReminderPickerMonthIndex,
    setPickerYear: setReminderPickerYear,
    setPickerHour: setReminderPickerHour,
    setPickerMinute: setReminderPickerMinute,
    reset: resetReminderPicker,
    openPicker: openReminderPicker,
    closePicker: closeReminderPicker,
    confirmPicker: confirmReminderPicker,
  } = useBackdatedDateTimePicker(new Date());

  const reminderEntries = useMemo(
    () =>
      (observation?.entries ?? [])
        .filter((entry) => entry.kind === "reminder")
        .slice(0, 5),
    [observation?.entries],
  );
  const allMedicineEntries = useMemo(
    () => (observation?.entries ?? []).filter((entry) => entry.kind === "medicine"),
    [observation?.entries],
  );
  const normalizedReminderMedicineName =
    normalizeIllnessMedicineName(reminderMedicineValue);
  const matchingMedicineEntries = useMemo(() => {
    if (!normalizedReminderMedicineName) {
      return [];
    }

    return allMedicineEntries.filter(
      (entry) =>
        normalizeIllnessMedicineName(
          entry.medicineName ?? extractIllnessMedicineNameFromTitle(entry.title),
        ) === normalizedReminderMedicineName,
    );
  }, [allMedicineEntries, normalizedReminderMedicineName]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setReminderMedicineValue("");
    setReminderDoseValue("");
    setReminderIntervalMinutesValue("180");
    setReminderMaxDosesPerDay(null);
    setActiveReminderNumberSheet(null);
    setCustomIntervalModalVisible(false);
    setCustomIntervalValue("");
    setCustomLimitModalVisible(false);
    setCustomLimitValue("");
    setReminderAlreadyGiven(false);
    setReminderAlreadyGivenExpanded(false);
    resetReminderPicker(new Date());
    setReminderError(null);
    if (initialPlan) {
      setReminderMedicineValue(initialPlan.customMedicineName?.trim() ?? "");
      setReminderDoseValue(initialPlan.doseAmount ?? "");
      setReminderIntervalMinutesValue(String(initialPlan.minIntervalMinutes));
      setReminderMaxDosesPerDay(initialPlan.maxDosesPerDay ?? null);
    }
  }, [initialPlan, resetReminderPicker, visible]);

  const reminderNumberSheetCustomLabel = getReminderIntervalCustomLabel(locale);
  const reminderLimitSheetCustomLabel = getReminderLimitCustomLabel(locale);
  const intervalSheetOptions = buildReminderIntervalSheetOptions(
    medicationIntervalUnit,
    locale,
  );
  const limitSheetOptions = buildReminderLimitSheetOptions();

  return {
    medicationIntervalUnit,
    reminderMedicineValue,
    setReminderMedicineValue,
    reminderDoseValue,
    setReminderDoseValue,
    reminderIntervalMinutesValue,
    setReminderIntervalMinutesValue,
    reminderMaxDosesPerDay,
    setReminderMaxDosesPerDay,
    activeReminderNumberSheet,
    setActiveReminderNumberSheet,
    customIntervalModalVisible,
    setCustomIntervalModalVisible,
    customIntervalValue,
    setCustomIntervalValue,
    customLimitModalVisible,
    setCustomLimitModalVisible,
    customLimitValue,
    setCustomLimitValue,
    reminderAlreadyGiven,
    setReminderAlreadyGiven,
    reminderAlreadyGivenExpanded,
    setReminderAlreadyGivenExpanded,
    reminderError,
    setReminderError,
    reminderLastGivenAt,
    activeReminderPickerField,
    reminderPickerDay,
    reminderPickerMonthIndex,
    reminderPickerYear,
    reminderPickerHour,
    reminderPickerMinute,
    setReminderPickerDay,
    setReminderPickerMonthIndex,
    setReminderPickerYear,
    setReminderPickerHour,
    setReminderPickerMinute,
    openReminderPicker,
    closeReminderPicker,
    confirmReminderPicker,
    reminderEntries,
    matchingMedicineEntries,
    normalizedReminderMedicineName,
    reminderNumberSheetCustomLabel,
    reminderLimitSheetCustomLabel,
    intervalSheetOptions,
    limitSheetOptions,
  };
}
