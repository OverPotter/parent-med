/**
 * Типы под ответы бэкенда (семьи, дети, аптечка, эпизоды, приёмы и т.д.).
 */

export interface Family {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  login: string;
  email: string | null;
  familyId: string;
  displayName: string;
  relationshipLabel: string | null;
  phone: string | null;
  preferredLanguage: "ru" | "en";
  familyRole: string;
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

export interface FamilyMember extends Account {}

export interface FamilyInvite {
  token: string;
  familyId: string;
  familyName: string;
  familyRole: string;
  invitePath: string;
  expiresAt: string;
}

export interface FamilyInvitePreview {
  familyId: string;
  familyName: string;
  familyRole: string;
  expiresAt: string;
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
  babyModeEnabled: boolean;
  institutionName: string | null;
  institutionPhone: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
  allergies: string | null;
  notes: string | null;
}

export interface WeightEntry {
  id: string;
  childId: string;
  valueKg: number;
  measuredAt: string;
}

export interface HeightEntry {
  id: string;
  childId: string;
  valueCm: number;
  measuredAt: string;
}

export interface SleepSession {
  id: string;
  childId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  status: string;
  createdByAccountId: string | null;
}

export interface FeedingRecord {
  id: string;
  childId: string;
  feedingType: string;
  breastSide: string | null;
  isExpressed: boolean;
  formulaVolumeMl: number | null;
  recordedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  status: string;
  note: string | null;
  createdByAccountId: string | null;
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

export interface IllnessAnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface IllnessAnalyticsDurationBucket {
  label: string;
  value: number;
}

export interface IllnessHistorySummary {
  period: string;
  totalClosedEpisodes: number;
  episodeCount: number;
  lastEpisodeStartedAt: string | null;
  daysSinceLastEpisode: number | null;
  mostActivePeriodLabel: string | null;
  averageDurationDays: number;
  longestDurationDays: number;
  episodesWithTemperature38Plus: number;
  episodesWithTemperature39Plus: number;
  episodesWithAdministrations: number;
  observationOnlyEpisodes: number;
  guidedEpisodes: number;
  totalTemperatureEntries: number;
  timeline: IllnessAnalyticsSeriesPoint[];
  durationBuckets: IllnessAnalyticsDurationBucket[];
}

export interface EpisodeTemperaturePoint {
  measuredAt: string;
  valueCelsius: number;
}

export interface IllnessEpisodeInsights {
  episodeId: string;
  durationDays: number;
  peakTemperatureCelsius: number | null;
  peakTemperatureAt: string | null;
  lastTemperatureCelsius: number | null;
  lastEventAt: string | null;
  temperatureCount: number;
  administrationCount: number;
  commentCount: number;
  medicationMode: string;
  medicineNames: string[];
  totalEvents: number;
  firstTemperatureAt: string | null;
  lastAdministrationAt: string | null;
  temperaturePoints: EpisodeTemperaturePoint[];
}

export interface IllnessComment {
  id: string;
  episodeId: string;
  createdAt: string;
  text: string;
  createdByAccountId: string | null;
  createdByNameSnapshot: string | null;
}

export interface TemperatureEntry {
  id: string;
  episodeId: string;
  valueCelsius: number;
  measuredAt: string;
  method: string | null;
  comment: string | null;
  createdByAccountId: string | null;
  createdByNameSnapshot: string | null;
}

export interface AdministrationEvent {
  id: string;
  episodeId: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  administeredAt: string;
  administeredByAccountId: string | null;
  administeredByNameSnapshot: string | null;
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
  pillboxBeforeReminderMinutes: number;
  dueReminderEnabled: boolean;
  cabinetNotify10Days: boolean;
  cabinetNotify7Days: boolean;
  cabinetNotify3Days: boolean;
  liveActivitySleepEnabled: boolean;
  liveActivityFeedingEnabled: boolean;
}

export interface PillboxAnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface PillboxTopMedication {
  medicationName: string;
  missedSlots: number;
}

export interface PillboxHistorySummary {
  planId: string;
  planTitle: string;
  planStatus: "active" | "paused" | "completed" | "archived";
  memberCount: number;
  period: string;
  totalMedications: number;
  scheduledSlots: number;
  takenSlots: number;
  missedSlots: number;
  lateSlots: number;
  onTimeSlots: number;
  adherenceRate: number;
  onTimeRate: number;
  timeline: PillboxAnalyticsSeriesPoint[];
  topMissedMedications: PillboxTopMedication[];
}

/** Ответ API с ошибкой (detail + code). */
export interface ApiErrorBody {
  detail: string;
  code?: string;
}
