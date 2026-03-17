/**
 * Преобразование snake_case из бэка в camelCase для фронта.
 */

import type {
  Family,
  Parent,
  Child,
  WeightEntry,
  MedicineCatalogItem,
  HouseholdMedicine,
  IllnessEpisode,
  TemperatureEntry,
  AdministrationEvent,
} from "./api";

interface RawFamily {
  id: string;
  name: string;
}

interface RawChild {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
}

interface RawParent {
  id: string;
  family_id: string;
  name: string;
  role: string;
}

interface RawWeightEntry {
  id: string;
  child_id: string;
  value_kg: number;
  measured_at: string;
}

interface RawMedicineCatalogItem {
  id: string;
  name: string;
  form: string;
  concentration: string | null;
  description?: string | null;
  dosage?: string | null;
  default_opened_shelf_days?: number | null;
}

interface RawHouseholdMedicine {
  id: string;
  family_id: string;
  catalog_item_id: string | null;
  medicine_name: string;
  medicine_form: string;
  medicine_concentration: string | null;
  medicine_description: string | null;
  medicine_dosage: string | null;
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
}

interface RawIllnessEpisode {
  id: string;
  child_id: string;
  started_at: string;
  status: string;
  note: string | null;
  closed_at: string | null;
}

interface RawTemperatureEntry {
  id: string;
  episode_id: string;
  value_celsius: number;
  measured_at: string;
  method: string | null;
  comment: string | null;
}

interface RawAdministrationEvent {
  id: string;
  episode_id: string;
  household_medicine_id: string;
  administered_at: string;
  amount: string;
  unit: string | null;
  reason: string | null;
}

export function toFamily(r: RawFamily): Family {
  return { id: r.id, name: r.name };
}

export function toParent(r: RawParent): Parent {
  return {
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    role: r.role,
  };
}

export function toChild(r: RawChild): Child {
  return {
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    birthDate: r.birth_date ?? null,
  };
}

export function toWeightEntry(r: RawWeightEntry): WeightEntry {
  return {
    id: r.id,
    childId: r.child_id,
    valueKg: r.value_kg,
    measuredAt: r.measured_at,
  };
}

export function toMedicineCatalogItem(r: RawMedicineCatalogItem): MedicineCatalogItem {
  return {
    id: r.id,
    name: r.name,
    form: r.form,
    concentration: r.concentration ?? null,
    description: r.description ?? null,
    dosage: r.dosage ?? null,
    defaultOpenedShelfDays: r.default_opened_shelf_days ?? null,
  };
}

export function toHouseholdMedicine(r: RawHouseholdMedicine): HouseholdMedicine {
  return {
    id: r.id,
    familyId: r.family_id,
    catalogItemId: r.catalog_item_id ?? null,
    medicineName: r.medicine_name,
    medicineForm: r.medicine_form,
    medicineConcentration: r.medicine_concentration ?? null,
    medicineDescription: r.medicine_description ?? null,
    medicineDosage: r.medicine_dosage ?? null,
    expiryDate: r.expiry_date,
    openedAt: r.opened_at ?? null,
    openedShelfDays: r.opened_shelf_days ?? null,
    effectiveOpenedShelfDays: r.effective_opened_shelf_days ?? null,
    comment: r.comment ?? null,
    status: r.status,
    statusLabel: r.status_label,
    expiryAlertDate: r.expiry_alert_date ?? null,
    expiresInDays: r.expires_in_days,
    openedExpiresAt: r.opened_expires_at ?? null,
    openedExpiresInDays: r.opened_expires_in_days ?? null,
  };
}

export function toIllnessEpisode(r: RawIllnessEpisode): IllnessEpisode {
  return {
    id: r.id,
    childId: r.child_id,
    startedAt: r.started_at,
    status: r.status,
    note: r.note ?? null,
    closedAt: r.closed_at ?? null,
  };
}

export function toTemperatureEntry(r: RawTemperatureEntry): TemperatureEntry {
  return {
    id: r.id,
    episodeId: r.episode_id,
    valueCelsius: r.value_celsius,
    measuredAt: r.measured_at,
    method: r.method ?? null,
    comment: r.comment ?? null,
  };
}

export function toAdministrationEvent(r: RawAdministrationEvent): AdministrationEvent {
  return {
    id: r.id,
    episodeId: r.episode_id,
    householdMedicineId: r.household_medicine_id,
    administeredAt: r.administered_at,
    amount: r.amount,
    unit: r.unit ?? null,
    reason: r.reason ?? null,
  };
}
