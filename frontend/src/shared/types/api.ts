/**
 * Типы под ответы бэкенда (семьи, дети, аптечка, эпизоды, приёмы и т.д.).
 */

export interface Family {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  email: string;
  familyId: string;
}

export interface AuthSessionResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  account: Account;
  family: Family;
}

export interface AuthStateResponse {
  account: Account;
  family: Family;
}

export interface Parent {
  id: string;
  familyId: string;
  name: string;
  role: string;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  birthDate: string | null;
  ageLabel: string | null;
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
  description?: string | null;
  dosage?: string | null;
  defaultOpenedShelfDays?: number | null;
}

export interface HouseholdMedicine {
  id: string;
  familyId: string;
  catalogItemId: string | null;
  medicineName: string;
  medicineForm: string;
  medicineConcentration: string | null;
  medicineDescription: string | null;
  medicineDosage: string | null;
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
}

export interface IllnessEpisode {
  id: string;
  childId: string;
  startedAt: string;
  title: string | null;
  status: string;
  medicationMode: string;
  note: string | null;
  closedAt: string | null;
}

export interface IllnessComment {
  id: string;
  episodeId: string;
  createdAt: string;
  text: string;
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
  householdMedicineId: string | null;
  customMedicineName: string | null;
  administeredAt: string;
  amount: string;
  unit: string | null;
  reason: string | null;
}

export interface EpisodeMedicationPlan {
  id: string;
  episodeId: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  weightKg: number | null;
  doseMgPerKg: number | null;
  notes: string | null;
  createdAt: string;
}

export interface PushNotificationConfig {
  enabled: boolean;
  vapidPublicKey: string | null;
}

export interface PushNotificationPreferences {
  beforeReminderMinutes: number;
  dueReminderEnabled: boolean;
  cabinetNotify10Days: boolean;
  cabinetNotify7Days: boolean;
  cabinetNotify3Days: boolean;
}

/** Ответ API с ошибкой (detail + code). */
export interface ApiErrorBody {
  detail: string;
  code?: string;
}
