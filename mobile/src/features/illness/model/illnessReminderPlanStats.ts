import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import type { MobileIllnessEntry } from "./illnessObservation";
import { normalizeIllnessMedicineName } from "./illnessMedicineNames";

const INTERVAL_MINUTE_MS = 60 * 1000;
export const REMINDER_DOSE_TIME_CONFIRMATION_GRACE_MS = 7 * 60 * 1000;

export type MobileReminderPlanAdministrationStats = {
  todayCount: number;
  lastAdministration: MobileIllnessEntry | null;
  nextAllowedAt: Date | null;
  blockedByInterval: boolean;
  blockedByDailyLimit: boolean;
  isBlocked: boolean;
};

function matchesPlanEntry(
  plan: Pick<MobileEpisodeMedicationPlan, "householdMedicineId" | "customMedicineName">,
  entry: Pick<MobileIllnessEntry, "householdMedicineId" | "medicineName">,
) {
  if (plan.householdMedicineId) {
    return entry.householdMedicineId === plan.householdMedicineId;
  }

  const normalizedPlanName = normalizeIllnessMedicineName(plan.customMedicineName);
  return (
    !!normalizedPlanName &&
    normalizeIllnessMedicineName(entry.medicineName) === normalizedPlanName
  );
}

export function buildMobileReminderPlanAdministrationStats(
  plan: Pick<
    MobileEpisodeMedicationPlan,
    "householdMedicineId" | "customMedicineName" | "minIntervalMinutes" | "maxDosesPerDay" | "createdAt"
  >,
  entries: MobileIllnessEntry[],
  now = new Date(),
): MobileReminderPlanAdministrationStats {
  const relatedAdministrations = entries
    .filter((entry) => entry.kind === "medicine" && matchesPlanEntry(plan, entry))
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  const lastAdministration = relatedAdministrations[0] ?? null;
  const todayCount = relatedAdministrations.filter(
    (entry) => new Date(entry.createdAt).toDateString() === now.toDateString(),
  ).length;
  const createdAt = new Date(plan.createdAt);
  const createdAtIsValid = !Number.isNaN(createdAt.getTime());
  const firstDoseScheduledAt =
    !lastAdministration && createdAtIsValid
      ? new Date(createdAt.getTime() + plan.minIntervalMinutes * INTERVAL_MINUTE_MS)
      : null;

  const nextAllowedAt = lastAdministration
    ? new Date(
        new Date(lastAdministration.createdAt).getTime() +
          plan.minIntervalMinutes * INTERVAL_MINUTE_MS,
      )
    : firstDoseScheduledAt;
  const blockedByInterval = !!nextAllowedAt && nextAllowedAt > now;
  const blockedByDailyLimit = !!plan.maxDosesPerDay && todayCount >= plan.maxDosesPerDay;

  return {
    todayCount,
    lastAdministration,
    nextAllowedAt,
    blockedByInterval,
    blockedByDailyLimit,
    isBlocked: blockedByInterval || blockedByDailyLimit,
  };
}

export function shouldRequestMobileReminderDoseTimeConfirmation(
  nextAllowedAt: Date | null | undefined,
  now = new Date(),
  graceMs = REMINDER_DOSE_TIME_CONFIRMATION_GRACE_MS,
) {
  if (!nextAllowedAt) {
    return false;
  }

  return now.getTime() - nextAllowedAt.getTime() > graceMs;
}

export function compareMobileReminderPlanStats(
  left: MobileReminderPlanAdministrationStats,
  right: MobileReminderPlanAdministrationStats,
) {
  const leftRank = left.blockedByDailyLimit ? 2 : left.isBlocked ? 1 : 0;
  const rightRank = right.blockedByDailyLimit ? 2 : right.isBlocked ? 1 : 0;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (left.nextAllowedAt && right.nextAllowedAt) {
    return left.nextAllowedAt.getTime() - right.nextAllowedAt.getTime();
  }

  if (left.nextAllowedAt) {
    return -1;
  }

  if (right.nextAllowedAt) {
    return 1;
  }

  return 0;
}

export function sortMobileReminderPlansByPriority<
  TPlan extends MobileEpisodeMedicationPlan,
>(
  plans: TPlan[],
  entries: MobileIllnessEntry[],
  now = new Date(),
) {
  return plans.slice().sort((left, right) => {
    const leftStats = buildMobileReminderPlanAdministrationStats(left, entries, now);
    const rightStats = buildMobileReminderPlanAdministrationStats(right, entries, now);
    const priorityDiff = compareMobileReminderPlanStats(leftStats, rightStats);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function getLeadMobileReminderPlan<TPlan extends MobileEpisodeMedicationPlan>(
  plans: TPlan[],
  entries: MobileIllnessEntry[],
  now = new Date(),
) {
  const sortedPlans = sortMobileReminderPlansByPriority(plans, entries, now);
  const leadPlan = sortedPlans[0] ?? null;

  return leadPlan
    ? {
        plan: leadPlan,
        stats: buildMobileReminderPlanAdministrationStats(leadPlan, entries, now),
      }
    : null;
}
