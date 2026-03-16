/**
 * Преобразование snake_case из бэка в camelCase для фронта.
 */

import type {
  Family,
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
}

interface RawHouseholdMedicine {
  id: string;
  family_id: string;
  catalog_item_id: string;
  expiry_date: string;
  opened_at: string | null;
  storage_place: string | null;
  comment: string | null;
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
  };
}

export function toHouseholdMedicine(r: RawHouseholdMedicine): HouseholdMedicine {
  return {
    id: r.id,
    familyId: r.family_id,
    catalogItemId: r.catalog_item_id,
    expiryDate: r.expiry_date,
    openedAt: r.opened_at ?? null,
    storagePlace: r.storage_place ?? null,
    comment: r.comment ?? null,
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
