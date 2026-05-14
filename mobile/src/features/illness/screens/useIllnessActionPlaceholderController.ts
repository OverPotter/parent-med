import { useEffect, useMemo, useState } from "react";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import type {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../model/illnessObservation";
import {
  formatReminderIntervalForUnit,
  useReminderActionState,
} from "./useReminderActionState";

const TEMPERATURE_MIN = 32;
const TEMPERATURE_MAX = 43;
const NOTE_MAX_LENGTH = 512;

type TemperatureCopy = {
  errorRequired: string;
  errorInvalid: string;
  errorRange: string;
};

type MedicineCopy = {
  errorMedicineRequired: string;
  errorAmountRequired: string;
};

type NoteCopy = {
  errorRequired: string;
  errorTooLong: string;
};

type ReminderCopy = {
  errorMedicineRequired: string;
  errorDoseRequired: string;
  errorIntervalRequired: string;
  errorIntervalInvalid: string;
  errorDailyLimitInvalid: string;
  errorLastGivenRequired: string;
};

export function useIllnessActionPlaceholderController({
  childId,
  kind,
  visible,
  observation,
  locale,
  editingReminderPlan,
  temperatureCopy,
  medicineCopy,
  noteCopy,
  reminderCopy,
  onSaveAdministration,
  onSaveNote,
  onSaveReminder,
  onUpdateReminder,
  onSaveTemperature,
}: {
  childId: string;
  kind: IllnessQuickActionKind;
  visible: boolean;
  observation: MobileIllnessObservation | null;
  locale: MobileLocale;
  editingReminderPlan?: MobileEpisodeMedicationPlan | null;
  temperatureCopy: TemperatureCopy;
  medicineCopy: MedicineCopy;
  noteCopy: NoteCopy;
  reminderCopy: ReminderCopy;
  onSaveAdministration: (payload: {
    childId: string;
    customMedicineName: string;
    amount: string;
    administeredAt: string;
  }) => void | Promise<void>;
  onSaveNote: (payload: {
    childId: string;
    text: string;
    createdAt: string;
  }) => void | Promise<void>;
  onSaveReminder: (payload: {
    childId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onUpdateReminder: (payload: {
    childId: string;
    planId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onSaveTemperature: (payload: {
    childId: string;
    valueCelsius: number;
    measuredAt: string;
  }) => void | Promise<void>;
}) {
  const [temperatureValue, setTemperatureValue] = useState("");
  const [medicineValue, setMedicineValue] = useState("");
  const [medicineAmountValue, setMedicineAmountValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [backdatedEnabled, setBackdatedEnabled] = useState(false);
  const [temperatureError, setTemperatureError] = useState<string | null>(null);
  const [medicineError, setMedicineError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<string | null>(
    null,
  );
  const [pendingDeleteEntryKind, setPendingDeleteEntryKind] = useState<
    "temperature" | "note" | "medicine" | "reminder" | null
  >(null);
  const reminderState = useReminderActionState({
    visible,
    observation,
    locale,
    initialPlan: kind === "reminder" ? editingReminderPlan : null,
  });
  const {
    selectedDate: measuredAt,
    activePickerField,
    pickerDay,
    pickerMonthIndex,
    pickerYear,
    pickerHour,
    pickerMinute,
    setPickerDay,
    setPickerMonthIndex,
    setPickerYear,
    setPickerHour,
    setPickerMinute,
    reset: resetBackdatedPicker,
    openPicker,
    closePicker,
    confirmPicker,
  } = useBackdatedDateTimePicker(new Date());

  const temperatureEntries = useMemo(
    () =>
      (observation?.entries ?? [])
        .filter((entry) => entry.kind === "temperature")
        .slice(0, 5),
    [observation?.entries],
  );
  const noteEntries = useMemo(
    () =>
      (observation?.entries ?? []).filter((entry) => entry.kind === "note").slice(0, 5),
    [observation?.entries],
  );
  const medicineEntries = useMemo(
    () =>
      (observation?.entries ?? []).filter((entry) => entry.kind === "medicine").slice(0, 5),
    [observation?.entries],
  );

  useEffect(() => {
    if (
      !visible ||
      (kind !== "temperature" &&
        kind !== "note" &&
        kind !== "medicine" &&
        kind !== "reminder")
    ) {
      return;
    }

    setTemperatureValue("");
    setMedicineValue("");
    setMedicineAmountValue("");
    setNoteValue("");
    setBackdatedEnabled(false);
    setTemperatureError(null);
    setMedicineError(null);
    setNoteError(null);
    resetBackdatedPicker(new Date());
  }, [kind, resetBackdatedPicker, visible]);

  const clearPendingDelete = () => {
    setPendingDeleteEntryId(null);
    setPendingDeleteEntryKind(null);
  };

  const handleSaveTemperature = () => {
    const normalizedValue = temperatureValue.trim().replace(",", ".");

    if (!normalizedValue) {
      setTemperatureError(temperatureCopy.errorRequired);
      return;
    }

    const parsedValue = Number.parseFloat(normalizedValue);

    if (Number.isNaN(parsedValue)) {
      setTemperatureError(temperatureCopy.errorInvalid);
      return;
    }

    if (parsedValue < TEMPERATURE_MIN || parsedValue > TEMPERATURE_MAX) {
      setTemperatureError(temperatureCopy.errorRange);
      return;
    }

    onSaveTemperature({
      childId,
      valueCelsius: parsedValue,
      measuredAt: backdatedEnabled ? measuredAt.toISOString() : new Date().toISOString(),
    });
  };

  const handleSaveNote = () => {
    const normalizedValue = noteValue.trim();

    if (!normalizedValue) {
      setNoteError(noteCopy.errorRequired);
      return;
    }

    if (normalizedValue.length > NOTE_MAX_LENGTH) {
      setNoteError(noteCopy.errorTooLong);
      return;
    }

    onSaveNote({
      childId,
      text: normalizedValue,
      createdAt: backdatedEnabled ? measuredAt.toISOString() : new Date().toISOString(),
    });
  };

  const handleSaveMedicine = () => {
    const normalizedMedicine = medicineValue.trim();
    const normalizedAmount = medicineAmountValue.trim();

    if (!normalizedMedicine) {
      setMedicineError(medicineCopy.errorMedicineRequired);
      return;
    }

    if (!normalizedAmount) {
      setMedicineError(medicineCopy.errorAmountRequired);
      return;
    }

    onSaveAdministration({
      childId,
      customMedicineName: normalizedMedicine,
      amount: normalizedAmount,
      administeredAt: backdatedEnabled ? measuredAt.toISOString() : new Date().toISOString(),
    });
  };

  const handleSaveReminder = () => {
    const normalizedMedicine = reminderState.reminderMedicineValue.trim();
    const normalizedDose = reminderState.reminderDoseValue.trim();

    if (!normalizedMedicine) {
      reminderState.setReminderError(reminderCopy.errorMedicineRequired);
      return;
    }

    if (!normalizedDose) {
      reminderState.setReminderError(reminderCopy.errorDoseRequired);
      return;
    }

    const normalizedInterval = reminderState.reminderIntervalMinutesValue.trim();

    if (!normalizedInterval) {
      reminderState.setReminderError(reminderCopy.errorIntervalRequired);
      return;
    }

    const parsedIntervalMinutes = Number.parseInt(normalizedInterval, 10);

    if (
      Number.isNaN(parsedIntervalMinutes) ||
      parsedIntervalMinutes < 30 ||
      parsedIntervalMinutes > 1440
    ) {
      reminderState.setReminderError(reminderCopy.errorIntervalInvalid);
      return;
    }

    if (
      reminderState.reminderMaxDosesPerDay !== null &&
      (reminderState.reminderMaxDosesPerDay < 1 ||
        reminderState.reminderMaxDosesPerDay > 24)
    ) {
      reminderState.setReminderError(reminderCopy.errorDailyLimitInvalid);
      return;
    }

    if (reminderState.reminderAlreadyGiven && !reminderState.reminderLastGivenAt) {
      reminderState.setReminderError(reminderCopy.errorLastGivenRequired);
      return;
    }

    const payload = {
      childId,
      customMedicineName: normalizedMedicine,
      doseAmount: normalizedDose,
      minIntervalMinutes: parsedIntervalMinutes,
      maxDosesPerDay: reminderState.reminderMaxDosesPerDay,
      alreadyGiven: reminderState.reminderAlreadyGiven,
      lastGivenAt: reminderState.reminderAlreadyGiven
        ? reminderState.reminderLastGivenAt.toISOString()
        : null,
      notes: null,
    };

    if (editingReminderPlan) {
      onUpdateReminder({
        ...payload,
        planId: editingReminderPlan.id,
      });
      return;
    }

    onSaveReminder(payload);
  };

  const reminderSaveEnabled = useMemo(() => {
    const normalizedMedicine = reminderState.reminderMedicineValue.trim();
    const normalizedDose = reminderState.reminderDoseValue.trim();
    const normalizedInterval = reminderState.reminderIntervalMinutesValue.trim();
    const parsedIntervalMinutes = Number.parseInt(normalizedInterval, 10);

    if (!normalizedMedicine || !normalizedDose || !normalizedInterval) {
      return false;
    }

    if (
      Number.isNaN(parsedIntervalMinutes) ||
      parsedIntervalMinutes < 30 ||
      parsedIntervalMinutes > 1440
    ) {
      return false;
    }

    if (
      reminderState.reminderMaxDosesPerDay !== null &&
      (reminderState.reminderMaxDosesPerDay < 1 ||
        reminderState.reminderMaxDosesPerDay > 24)
    ) {
      return false;
    }

    if (reminderState.reminderAlreadyGiven && !reminderState.reminderLastGivenAt) {
      return false;
    }

    return true;
  }, [
    reminderState.reminderAlreadyGiven,
    reminderState.reminderDoseValue,
    reminderState.reminderIntervalMinutesValue,
    reminderState.reminderLastGivenAt,
    reminderState.reminderMaxDosesPerDay,
    reminderState.reminderMedicineValue,
  ]);

  return {
    temperatureValue,
    setTemperatureValue,
    medicineValue,
    setMedicineValue,
    medicineAmountValue,
    setMedicineAmountValue,
    noteValue,
    setNoteValue,
    backdatedEnabled,
    setBackdatedEnabled,
    measuredAt,
    activePickerField,
    pickerDay,
    pickerMonthIndex,
    pickerYear,
    pickerHour,
    pickerMinute,
    setPickerDay,
    setPickerMonthIndex,
    setPickerYear,
    setPickerHour,
    setPickerMinute,
    openPicker,
    closePicker,
    confirmPicker,
    temperatureError,
    setTemperatureError,
    medicineError,
    setMedicineError,
    noteError,
    setNoteError,
    pendingDeleteEntryId,
    setPendingDeleteEntryId,
    pendingDeleteEntryKind,
    setPendingDeleteEntryKind,
    clearPendingDelete,
    temperatureEntries,
    noteEntries,
    medicineEntries,
    handleSaveTemperature,
    handleSaveNote,
    handleSaveMedicine,
    reminderState,
    handleSaveReminder,
    reminderSaveEnabled,
    formatReminderIntervalForUnit,
  };
}
