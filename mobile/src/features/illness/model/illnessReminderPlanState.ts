import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  createMobileIllnessEntryFromAdministration,
  createMobileIllnessEntryFromMedicationPlan,
} from "./illnessObservation";
import type { MobileIllnessObservation } from "./illnessObservation";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import {
  extractIllnessMedicineNameFromTitle,
  normalizeIllnessMedicineName,
} from "./illnessMedicineNames";

export function hasMatchingReminderAdministration(
  observation: MobileIllnessObservation,
  customMedicineName: string,
  administeredAt: string,
) {
  const normalizedMedicineName = normalizeIllnessMedicineName(customMedicineName);

  return observation.entries.some((entry) => {
    if (entry.kind !== "medicine") {
      return false;
    }

    const medicineName = normalizeIllnessMedicineName(
      entry.medicineName ?? extractIllnessMedicineNameFromTitle(entry.title),
    );

    return (
      medicineName === normalizedMedicineName &&
      new Date(entry.createdAt).getTime() === new Date(administeredAt).getTime()
    );
  });
}

export function buildReminderPlanObservationState(
  observation: MobileIllnessObservation,
  plan: MobileEpisodeMedicationPlan,
  locale: MobileLocale,
  options?: {
    administrationEntryForState?:
      | ReturnType<typeof createMobileIllnessEntryFromAdministration>
      | null;
    notificationRecipientAccountIds?: string[];
  },
): MobileIllnessObservation {
  const reminderEntry = createMobileIllnessEntryFromMedicationPlan(plan, locale);
  const baseEntries = [
    reminderEntry,
    ...observation.entries.filter((entry) => entry.id !== plan.id),
  ];
  const nextEntries = options?.administrationEntryForState
    ? [
        options.administrationEntryForState,
        ...baseEntries.filter(
          (entry) => entry.id !== options.administrationEntryForState?.id,
        ),
      ]
    : baseEntries;

  return {
    ...observation,
    notificationRecipientAccountIds:
      options?.notificationRecipientAccountIds ??
      observation.notificationRecipientAccountIds,
    medicationPlans: [
      plan,
      ...observation.medicationPlans.filter(
        (currentPlan) => currentPlan.id !== plan.id,
      ),
    ],
    entries: nextEntries.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  };
}
