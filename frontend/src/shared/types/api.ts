/**
 * Типы под ответы бэкенда (семьи, дети, аптечка, эпизоды, приёмы и т.д.).
 */

export interface Family {
  id: string;
  name: string;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  birthDate: string | null;
}

export interface WeightEntry {
  id: string;
  childId: string;
  valueKg: number;
  measuredAt: string;
}

export interface MedicineCatalogItem {
  id: string;
  name: string;
  form: string;
  concentration: string | null;
}

export interface HouseholdMedicine {
  id: string;
  familyId: string;
  catalogItemId: string;
  expiryDate: string;
  openedAt: string | null;
  storagePlace: string | null;
  comment: string | null;
}

export interface IllnessEpisode {
  id: string;
  childId: string;
  startedAt: string;
  status: string;
  note: string | null;
  closedAt: string | null;
}

export interface TemperatureEntry {
  id: string;
  episodeId: string;
  valueCelsius: number;
  measuredAt: string;
  method: string | null;
  comment: string | null;
}

export interface AdministrationEvent {
  id: string;
  episodeId: string;
  householdMedicineId: string;
  administeredAt: string;
  amount: string;
  unit: string | null;
  reason: string | null;
}

/** Ответ API с ошибкой (detail + code). */
export interface ApiErrorBody {
  detail: string;
  code?: string;
}
