/**
 * Преобразование snake_case из бэка в camelCase для фронта.
 */

import type {
  Family,
  Account,
  FamilyMember,
  FamilyInvite,
  FamilyInvitePreview,
  Parent,
  Child,
  WeightEntry,
  MedicineCatalogItem,
  HouseholdMedicine,
  IllnessComment,
  IllnessEpisode,
  EpisodeMedicationPlan,
  TemperatureEntry,
  AdministrationEvent,
} from "./api";

interface RawFamily {
  id: string;
  name: string;
}

interface RawAccount {
  id: string;
  login: string;
  email: string | null;
  family_id: string;
  display_name: string;
  relationship_label: string | null;
  phone: string | null;
  family_role: string;
}

interface RawChild {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
  age_label: string | null;
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
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  closed_at: string | null;
}

interface RawIllnessComment {
  id: string;
  episode_id: string;
  created_at: string;
  text: string;
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
  invite_path: string;
  expires_at: string;
}

interface RawFamilyInvitePreview {
  family_id: string;
  family_name: string;
  family_role: string;
  expires_at: string;
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
  notes: string | null;
  created_at: string;
}

export function toFamily(r: RawFamily): Family {
  return { id: r.id, name: r.name };
}

export function toAccount(r: RawAccount): Account {
  return {
    id: r.id,
    login: r.login,
    email: r.email,
    familyId: r.family_id,
    displayName: r.display_name,
    relationshipLabel: r.relationship_label ?? null,
    phone: r.phone ?? null,
    familyRole: r.family_role,
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
    title: r.title ?? null,
    status: r.status,
    medicationMode: r.medication_mode,
    note: r.note ?? null,
    closedAt: r.closed_at ?? null,
  };
}

export function toIllnessComment(r: RawIllnessComment): IllnessComment {
  return {
    id: r.id,
    episodeId: r.episode_id,
    createdAt: r.created_at,
    text: r.text,
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
    invitePath: r.invite_path,
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
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}
