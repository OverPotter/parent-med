import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "../../illness/api/illnessApiClient";

type RawHouseholdMedicine = {
  id: string;
  family_id: string;
  medicine_name: string;
  medicine_form: string;
  medicine_category: string | null;
  medicine_concentration: string | null;
  medicine_description: string | null;
  medicine_dosage: string | null;
  pediatric_dose_mg_per_kg_min: number | null;
  pediatric_dose_mg_per_kg_max: number | null;
  pediatric_dose_note: string | null;
  expiry_date: string;
  opened_at: string | null;
  opened_shelf_days: number | null;
  effective_opened_shelf_days: number | null;
  comment: string | null;
  status: string;
  status_label: string;
  expiry_alert_date: string | null;
  expires_in_days: number;
  opened_expires_at: string | null;
  opened_expires_in_days: number | null;
};

export type MobileHouseholdMedicine = {
  id: string;
  familyId: string;
  medicineName: string;
  medicineForm: string;
  medicineCategory: string | null;
  medicineConcentration: string | null;
  medicineDescription: string | null;
  medicineDosage: string | null;
  pediatricDoseMgPerKgMin: number | null;
  pediatricDoseMgPerKgMax: number | null;
  pediatricDoseNote: string | null;
  expiryDate: string;
  openedAt: string | null;
  openedShelfDays: number | null;
  effectiveOpenedShelfDays: number | null;
  comment: string | null;
  status: string;
  statusLabel: string;
  expiryAlertDate: string | null;
  expiresInDays: number;
  openedExpiresAt: string | null;
  openedExpiresInDays: number | null;
};

export class MobileHouseholdMedicinesApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileHouseholdMedicinesApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileHouseholdMedicine(
  raw: RawHouseholdMedicine,
): MobileHouseholdMedicine {
  return {
    id: raw.id,
    familyId: raw.family_id,
    medicineName: raw.medicine_name,
    medicineForm: raw.medicine_form,
    medicineCategory: raw.medicine_category ?? null,
    medicineConcentration: raw.medicine_concentration ?? null,
    medicineDescription: raw.medicine_description ?? null,
    medicineDosage: raw.medicine_dosage ?? null,
    pediatricDoseMgPerKgMin: raw.pediatric_dose_mg_per_kg_min ?? null,
    pediatricDoseMgPerKgMax: raw.pediatric_dose_mg_per_kg_max ?? null,
    pediatricDoseNote: raw.pediatric_dose_note ?? null,
    expiryDate: raw.expiry_date,
    openedAt: raw.opened_at ?? null,
    openedShelfDays: raw.opened_shelf_days ?? null,
    effectiveOpenedShelfDays: raw.effective_opened_shelf_days ?? null,
    comment: raw.comment ?? null,
    status: raw.status,
    statusLabel: raw.status_label,
    expiryAlertDate: raw.expiry_alert_date ?? null,
    expiresInDays: raw.expires_in_days,
    openedExpiresAt: raw.opened_expires_at ?? null,
    openedExpiresInDays: raw.opened_expires_in_days ?? null,
  };
}

export async function fetchMobileHouseholdMedicines(payload: {
  accessToken: string | null;
}): Promise<MobileHouseholdMedicine[]> {
  const response = await requestIllnessAuthedJson<RawHouseholdMedicine[]>(
    "/household-medicines",
    { method: "GET" },
    payload.accessToken,
    (message, options) => new MobileHouseholdMedicinesApiError(message, options),
  );

  return (response ?? []).map(toMobileHouseholdMedicine);
}

export async function createMobileHouseholdMedicine(payload: {
  accessToken: string | null;
  medicineName: string;
  medicineForm: string | null;
  medicineCategory?: string | null;
  medicineConcentration?: string | null;
  medicineDescription?: string | null;
  medicineDosage?: string | null;
  pediatricDoseMgPerKgMin?: number | null;
  pediatricDoseMgPerKgMax?: number | null;
  pediatricDoseNote?: string | null;
  expiryDate: string;
  openedAt?: string | null;
  openedShelfDays?: number | null;
  comment?: string | null;
}): Promise<MobileHouseholdMedicine> {
  const response = await requestIllnessAuthedJson<RawHouseholdMedicine>(
    "/household-medicines",
    {
      method: "POST",
      body: JSON.stringify({
        medicine_name: payload.medicineName,
        medicine_form: payload.medicineForm,
        medicine_category: payload.medicineCategory ?? null,
        medicine_concentration: payload.medicineConcentration ?? null,
        medicine_description: payload.medicineDescription ?? null,
        medicine_dosage: payload.medicineDosage ?? null,
        pediatric_dose_mg_per_kg_min: payload.pediatricDoseMgPerKgMin ?? null,
        pediatric_dose_mg_per_kg_max: payload.pediatricDoseMgPerKgMax ?? null,
        pediatric_dose_note: payload.pediatricDoseNote ?? null,
        expiry_date: payload.expiryDate,
        opened_at: payload.openedAt ?? null,
        opened_shelf_days: payload.openedShelfDays ?? null,
        comment: payload.comment ?? null,
      }),
    },
    payload.accessToken,
    (message, options) => new MobileHouseholdMedicinesApiError(message, options),
  );

  return toMobileHouseholdMedicine(response);
}

export async function updateMobileHouseholdMedicine(payload: {
  accessToken: string | null;
  id: string;
  medicineName?: string | null;
  medicineForm?: string | null;
  medicineCategory?: string | null;
  medicineConcentration?: string | null;
  medicineDescription?: string | null;
  medicineDosage?: string | null;
  pediatricDoseMgPerKgMin?: number | null;
  pediatricDoseMgPerKgMax?: number | null;
  pediatricDoseNote?: string | null;
  expiryDate?: string | null;
  openedAt?: string | null;
  openedShelfDays?: number | null;
  comment?: string | null;
}): Promise<MobileHouseholdMedicine> {
  const response = await requestIllnessAuthedJson<RawHouseholdMedicine>(
    `/household-medicines/${payload.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        medicine_name: payload.medicineName,
        medicine_form: payload.medicineForm,
        medicine_category: payload.medicineCategory,
        medicine_concentration: payload.medicineConcentration,
        medicine_description: payload.medicineDescription,
        medicine_dosage: payload.medicineDosage,
        pediatric_dose_mg_per_kg_min: payload.pediatricDoseMgPerKgMin,
        pediatric_dose_mg_per_kg_max: payload.pediatricDoseMgPerKgMax,
        pediatric_dose_note: payload.pediatricDoseNote,
        expiry_date: payload.expiryDate,
        opened_at: payload.openedAt,
        opened_shelf_days: payload.openedShelfDays,
        comment: payload.comment,
      }),
    },
    payload.accessToken,
    (message, options) => new MobileHouseholdMedicinesApiError(message, options),
  );

  return toMobileHouseholdMedicine(response);
}

export async function deleteMobileHouseholdMedicine(payload: {
  accessToken: string | null;
  id: string;
}): Promise<void> {
  await requestIllnessAuthedJson<void>(
    `/household-medicines/${payload.id}`,
    { method: "DELETE" },
    payload.accessToken,
    (message, options) => new MobileHouseholdMedicinesApiError(message, options),
  );
}
