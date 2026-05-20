import { useEffect, useState } from "react";
import type { MedicationIntervalUnit } from "./mobileSettingsPreferencesStorage";
import {
  ensureMedicationIntervalUnitHydrated,
  getMedicationIntervalUnitSnapshot,
  subscribeMedicationIntervalUnit,
} from "./medicationIntervalUnitStore";

export function useStoredMedicationIntervalUnit() {
  const [medicationIntervalUnit, setMedicationIntervalUnit] =
    useState<MedicationIntervalUnit>(getMedicationIntervalUnitSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeMedicationIntervalUnit(setMedicationIntervalUnit);
    void ensureMedicationIntervalUnitHydrated();
    return unsubscribe;
  }, []);

  return {
    medicationIntervalUnit,
    setMedicationIntervalUnit,
  };
}
