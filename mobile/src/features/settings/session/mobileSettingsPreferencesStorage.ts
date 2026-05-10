import * as SecureStore from "expo-secure-store";

export type MedicationIntervalUnit = "hours" | "minutes";

type MobileSettingsPreferences = {
  medicationIntervalUnit: MedicationIntervalUnit;
};

const STORAGE_KEY = "pillpath.mobile.settings-preferences";

const defaultPreferences: MobileSettingsPreferences = {
  medicationIntervalUnit: "hours",
};

export async function readStoredSettingsPreferences(): Promise<MobileSettingsPreferences> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<MobileSettingsPreferences>;

    return {
      medicationIntervalUnit:
        parsed.medicationIntervalUnit === "minutes" ? "minutes" : "hours",
    };
  } catch {
    return defaultPreferences;
  }
}

export async function writeStoredMedicationIntervalUnit(
  medicationIntervalUnit: MedicationIntervalUnit,
): Promise<void> {
  await SecureStore.setItemAsync(
    STORAGE_KEY,
    JSON.stringify({ medicationIntervalUnit }),
  );
}
