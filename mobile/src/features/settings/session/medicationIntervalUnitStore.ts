import {
  readStoredSettingsPreferences,
  type MedicationIntervalUnit,
} from "./mobileSettingsPreferencesStorage";

let currentMedicationIntervalUnit: MedicationIntervalUnit = "hours";
let hasHydratedMedicationIntervalUnit = false;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<(unit: MedicationIntervalUnit) => void>();

function notifyListeners(unit: MedicationIntervalUnit) {
  listeners.forEach((listener) => listener(unit));
}

export function getMedicationIntervalUnitSnapshot() {
  return currentMedicationIntervalUnit;
}

export function subscribeMedicationIntervalUnit(
  listener: (unit: MedicationIntervalUnit) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMedicationIntervalUnitSnapshot(
  medicationIntervalUnit: MedicationIntervalUnit,
) {
  currentMedicationIntervalUnit = medicationIntervalUnit;
  hasHydratedMedicationIntervalUnit = true;
  notifyListeners(medicationIntervalUnit);
}

export async function ensureMedicationIntervalUnitHydrated() {
  if (hasHydratedMedicationIntervalUnit) {
    return;
  }

  if (!hydrationPromise) {
    hydrationPromise = readStoredSettingsPreferences()
      .then((preferences) => {
        currentMedicationIntervalUnit = preferences.medicationIntervalUnit;
        hasHydratedMedicationIntervalUnit = true;
        notifyListeners(currentMedicationIntervalUnit);
      })
      .finally(() => {
        hydrationPromise = null;
      });
  }

  await hydrationPromise;
}
