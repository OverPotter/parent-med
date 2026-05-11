/**
 * Преобразование snake_case из бэка в camelCase для фронта.
 */

import { detectPreferredLanguage } from "@shared/i18n";
import { LEGACY_FULL_FAMILY_ACCESS_POLICY } from "@shared/familyAccess/policy";
import {
  localizeGenericAccountDisplayName,
  localizeGenericFamilyName,
} from "@shared/utils/genericLabels";
import type {
  Family,
  Account,
  FamilyAccessPolicy,
  FamilyMember,
  FamilyInvite,
  FamilyInvitePreview,
  HeightEntry,
  Parent,
  Child,
  FeedingRecord,
  WeightEntry,
  SleepSession,
  MedicineCatalogItem,
  HouseholdMedicine,
  IllnessComment,
  IllnessEpisode,
  EpisodeMedicationPlan,
  TemperatureEntry,
  AdministrationEvent,
} from "./api";
export { toFamilySubscriptionAccess } from "./familySubscriptionAccess";

interface RawFamily {
  id: string;
  name: string;
  cabinet_member_account_ids?: string[] | null;
  owner_account_id?: string | null;
  billing_account_id?: string | null;
  free_primary_child_id?: string | null;
  free_primary_pillbox_plan_id?: string | null;
  plan_code?: "free" | "plus" | "pro" | null;
  subscription_status?:
    | "inactive"
    | "trialing"
    | "active"
    | "grace"
    | "canceled"
    | "expired"
    | null;
  subscription_provider?: string | null;
  subscription_product_id?: string | null;
  subscription_expires_at?: string | null;
  premium_active?: boolean | null;
}

interface RawAccount {
  id: string;
  login?: string | null;
  email: string | null;
  family_id: string;
  display_name: string;
  needs_profile_completion?: boolean | null;
  has_recovery_code?: boolean | null;
  relationship_label: string | null;
  phone: string | null;
  preferred_language?: "ru" | "en" | null;
  family_role: string;
  access_policy?: {
    all_children?: boolean;
    child_ids?: string[] | null;
    children_access?: "view" | "act" | "edit";
    cabinet_access?: "none" | "view" | "edit";
    pillbox_access?: "none" | "view" | "act" | "edit";
    cabinet_push_enabled?: boolean;
  } | null;
}

interface RawChild {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
  age_label: string | null;
  baby_mode_enabled: boolean;
  avatar_key?: string | null;
  gender?: string | null;
  institution_name: string | null;
  institution_phone: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  allergies: string | null;
  notes: string | null;
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

interface RawHeightEntry {
  id: string;
  child_id: string;
  value_cm: number;
  measured_at: string;
}

interface RawSleepSession {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  created_by_account_id: string | null;
}

interface RawFeedingRecord {
  id: string;
  child_id: string;
  feeding_type: string;
  breast_side: string | null;
  is_expressed: boolean;
  formula_volume_ml: number | null;
  recorded_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
  note: string | null;
  created_by_account_id: string | null;
}

interface RawMedicineCatalogItem {
  id: string;
  name: string;
  form: string;
  concentration: string | null;
  description?: string | null;
  dosage?: string | null;
  pediatric_dose_mg_per_kg_min?: number | null;
  pediatric_dose_mg_per_kg_max?: number | null;
  pediatric_dose_note?: string | null;
  default_opened_shelf_days?: number | null;
}

interface RawHouseholdMedicine {
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
}

interface RawEpisodeMedicationPlan {
  id: string;
  episode_id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  dose_amount: string;
  min_interval_minutes: number;
  max_doses_per_day: number | null;
  weight_kg: number | null;
  dose_mg_per_kg: number | null;
  calculated_dose_mg: number | null;
  calculated_dose_value: number | null;
  calculated_dose_unit: string | null;
  dose_calc_mode: string | null;
  dose_calc_warning: string | null;
  manual_dose_override: boolean | null;
  notes: string | null;
  member_account_ids: string[] | null;
  created_at: string;
}

interface RawIllnessEpisode {
  id: string;
  child_id: string;
  started_at: string;
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  member_account_ids: string[] | null;
  created_by_account_id: string | null;
  closed_at: string | null;
}

interface RawIllnessComment {
  id: string;
  episode_id: string;
  created_at: string;
  text: string;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
}

interface RawTemperatureEntry {
  id: string;
  episode_id: string;
  value_celsius: number;
  measured_at: string;
  method: string | null;
  comment: string | null;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
}

interface RawAdministrationEvent {
  id: string;
  episode_id: string;
  household_medicine_id: string | null;
  custom_medicine_name: string | null;
  administered_at: string;
  administered_by_account_id: string | null;
  administered_by_name_snapshot: string | null;
  amount: string;
  unit: string | null;
  reason: string | null;
}

interface RawFamilyInvite {
  token: string;
  family_id: string;
  family_name: string;
  family_role: string;
  expires_at: string;
}

interface RawFamilyInvitePreview {
  family_id: string;
  family_name: string;
  family_role: string;
  expires_at: string;
}

export function toFamily(r: RawFamily): Family {
  const language = detectPreferredLanguage();
  return {
    id: r.id,
    name: localizeGenericFamilyName(r.name, language),
    cabinetMemberAccountIds: r.cabinet_member_account_ids ?? [],
    ownerAccountId: r.owner_account_id ?? null,
    billingAccountId: r.billing_account_id ?? null,
    freePrimaryChildId: r.free_primary_child_id ?? null,
    freePrimaryPillboxPlanId: r.free_primary_pillbox_plan_id ?? null,
    planCode: r.plan_code ?? "free",
    subscriptionStatus: r.subscription_status ?? "inactive",
    subscriptionProvider: r.subscription_provider ?? null,
    subscriptionProductId: r.subscription_product_id ?? null,
    subscriptionExpiresAt: r.subscription_expires_at ?? null,
    premiumActive: r.premium_active ?? false,
  };
}

function toFamilyAccessPolicy(raw: RawAccount["access_policy"]): FamilyAccessPolicy {
  if (!raw) {
    return LEGACY_FULL_FAMILY_ACCESS_POLICY;
  }

  return {
    allChildren: raw.all_children ?? true,
    childIds: raw.child_ids ?? [],
    childrenAccess:
      raw.children_access === "view" || raw.children_access === "act"
        ? raw.children_access
        : "edit",
    cabinetAccess:
      raw.cabinet_access === "none" || raw.cabinet_access === "view" ? raw.cabinet_access : "edit",
    pillboxAccess:
      raw.pillbox_access === "none" || raw.pillbox_access === "view" || raw.pillbox_access === "act"
        ? raw.pillbox_access
        : "edit",
    cabinetPushEnabled: raw.cabinet_push_enabled ?? true,
  };
}

export function toAccount(r: RawAccount): Account {
  const preferredLanguage = r.preferred_language ?? detectPreferredLanguage();
  return {
    id: r.id,
    email: r.email,
    familyId: r.family_id,
    displayName: localizeGenericAccountDisplayName(r.display_name, preferredLanguage),
    needsProfileCompletion: Boolean(r.needs_profile_completion),
    hasRecoveryCode: Boolean(r.has_recovery_code),
    relationshipLabel: r.relationship_label ?? null,
    phone: r.phone ?? null,
    preferredLanguage,
    familyRole: r.family_role,
    accessPolicy: toFamilyAccessPolicy(r.access_policy),
  };
}

export function toFamilyMember(r: RawAccount): FamilyMember {
  return toAccount(r);
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
    ageLabel: r.age_label ?? null,
    babyModeEnabled: r.baby_mode_enabled ?? false,
    avatarKey: r.avatar_key ?? null,
    gender: r.gender ?? null,
    institutionName: r.institution_name ?? null,
    institutionPhone: r.institution_phone ?? null,
    doctorName: r.doctor_name ?? null,
    doctorPhone: r.doctor_phone ?? null,
    allergies: r.allergies ?? null,
    notes: r.notes ?? null,
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

export function toHeightEntry(r: RawHeightEntry): HeightEntry {
  return {
    id: r.id,
    childId: r.child_id,
    valueCm: r.value_cm,
    measuredAt: r.measured_at,
  };
}

export function toSleepSession(r: RawSleepSession): SleepSession {
  return {
    id: r.id,
    childId: r.child_id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? null,
    durationMinutes: r.duration_minutes ?? null,
    status: r.status,
    createdByAccountId: r.created_by_account_id ?? null,
  };
}

export function toFeedingRecord(r: RawFeedingRecord): FeedingRecord {
  return {
    id: r.id,
    childId: r.child_id,
    feedingType: r.feeding_type,
    breastSide: r.breast_side ?? null,
    isExpressed: r.is_expressed ?? false,
    formulaVolumeMl: r.formula_volume_ml ?? null,
    recordedAt: r.recorded_at,
    startedAt: r.started_at ?? null,
    endedAt: r.ended_at ?? null,
    durationMinutes: r.duration_minutes ?? null,
    status: r.status,
    note: r.note ?? null,
    createdByAccountId: r.created_by_account_id ?? null,
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
    pediatricDoseMgPerKgMin: r.pediatric_dose_mg_per_kg_min ?? null,
    pediatricDoseMgPerKgMax: r.pediatric_dose_mg_per_kg_max ?? null,
    pediatricDoseNote: r.pediatric_dose_note ?? null,
    defaultOpenedShelfDays: r.default_opened_shelf_days ?? null,
  };
}

export function toHouseholdMedicine(r: RawHouseholdMedicine): HouseholdMedicine {
  return {
    id: r.id,
    familyId: r.family_id,
    medicineName: r.medicine_name,
    medicineForm: r.medicine_form,
    medicineCategory: r.medicine_category ?? null,
    medicineConcentration: r.medicine_concentration ?? null,
    medicineDescription: r.medicine_description ?? null,
    medicineDosage: r.medicine_dosage ?? null,
    pediatricDoseMgPerKgMin: r.pediatric_dose_mg_per_kg_min ?? null,
    pediatricDoseMgPerKgMax: r.pediatric_dose_mg_per_kg_max ?? null,
    pediatricDoseNote: r.pediatric_dose_note ?? null,
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
    title: r.title ?? null,
    status: r.status,
    medicationMode: r.medication_mode,
    note: r.note ?? null,
    notificationRecipientAccountIds: r.member_account_ids ?? [],
    createdByAccountId: r.created_by_account_id ?? null,
    closedAt: r.closed_at ?? null,
  };
}

export function toIllnessComment(r: RawIllnessComment): IllnessComment {
  return {
    id: r.id,
    episodeId: r.episode_id,
    createdAt: r.created_at,
    text: r.text,
    createdByAccountId: r.created_by_account_id ?? null,
    createdByNameSnapshot: r.created_by_name_snapshot ?? null,
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
    createdByAccountId: r.created_by_account_id ?? null,
    createdByNameSnapshot: r.created_by_name_snapshot ?? null,
  };
}

export function toAdministrationEvent(r: RawAdministrationEvent): AdministrationEvent {
  return {
    id: r.id,
    episodeId: r.episode_id,
    householdMedicineId: r.household_medicine_id ?? null,
    customMedicineName: r.custom_medicine_name ?? null,
    administeredAt: r.administered_at,
    administeredByAccountId: r.administered_by_account_id ?? null,
    administeredByNameSnapshot: r.administered_by_name_snapshot ?? null,
    amount: r.amount,
    unit: r.unit ?? null,
    reason: r.reason ?? null,
  };
}

export function toFamilyInvite(r: RawFamilyInvite): FamilyInvite {
  return {
    token: r.token,
    familyId: r.family_id,
    familyName: r.family_name,
    familyRole: r.family_role,
    expiresAt: r.expires_at,
  };
}

export function toFamilyInvitePreview(r: RawFamilyInvitePreview): FamilyInvitePreview {
  return {
    familyId: r.family_id,
    familyName: r.family_name,
    familyRole: r.family_role,
    expiresAt: r.expires_at,
  };
}

export function toEpisodeMedicationPlan(r: RawEpisodeMedicationPlan): EpisodeMedicationPlan {
  return {
    id: r.id,
    episodeId: r.episode_id,
    householdMedicineId: r.household_medicine_id ?? null,
    customMedicineName: r.custom_medicine_name ?? null,
    doseAmount: r.dose_amount,
    minIntervalMinutes: r.min_interval_minutes,
    maxDosesPerDay: r.max_doses_per_day ?? null,
    weightKg: r.weight_kg ?? null,
    doseMgPerKg: r.dose_mg_per_kg ?? null,
    calculatedDoseMg: r.calculated_dose_mg ?? null,
    calculatedDoseValue: r.calculated_dose_value ?? null,
    calculatedDoseUnit: r.calculated_dose_unit ?? null,
    doseCalcMode: r.dose_calc_mode ?? null,
    doseCalcWarning: r.dose_calc_warning ?? null,
    manualDoseOverride: r.manual_dose_override ?? false,
    notes: r.notes ?? null,
    memberAccountIds: r.member_account_ids ?? [],
    createdAt: r.created_at,
  };
}
