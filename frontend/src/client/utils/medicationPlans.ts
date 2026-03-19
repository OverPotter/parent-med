import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
} from "@shared/types/api";

const INTERVAL_MINUTE_MS = 60 * 1000;

type MedicationPlanLike = Pick<
  EpisodeMedicationPlan,
  "householdMedicineId" | "minIntervalMinutes" | "maxDosesPerDay"
>;

export function buildPlanAdministrationStats(
  plan: MedicationPlanLike,
  administrations: AdministrationEvent[],
  now = new Date()
) {
  const relatedAdministrations = administrations
    .filter((entry) => entry.householdMedicineId === plan.householdMedicineId)
    .sort((left, right) => right.administeredAt.localeCompare(left.administeredAt));
  const lastAdministration = relatedAdministrations[0] ?? null;
  const todayCount = relatedAdministrations.filter(
    (entry) => new Date(entry.administeredAt).toDateString() === now.toDateString()
  ).length;

  const nextAllowedAt = lastAdministration
    ? new Date(
        new Date(lastAdministration.administeredAt).getTime() +
          plan.minIntervalMinutes * INTERVAL_MINUTE_MS
      )
    : null;
  const blockedByInterval = !!nextAllowedAt && nextAllowedAt > now;
  const blockedByDailyLimit = !!plan.maxDosesPerDay && todayCount >= plan.maxDosesPerDay;

  return {
    lastAdministration,
    todayCount,
    nextAllowedAt,
    blockedByInterval,
    blockedByDailyLimit,
    isBlocked: blockedByInterval || blockedByDailyLimit,
    availabilityLabel: blockedByDailyLimit
      ? "Дневной лимит уже достигнут"
      : nextAllowedAt
        ? nextAllowedAt <= now
          ? "Следующую дозу уже можно"
          : `Следующую дозу можно ${formatRelativeDateTime(nextAllowedAt, now)}`
        : "Пока не было приёма, первую дозу можно отметить сразу",
  };
}

export function formatIntervalForDisplay(intervalMinutes: number, unit: "hours" | "minutes") {
  if (unit === "minutes") {
    return `каждые ${intervalMinutes} мин`;
  }

  if (intervalMinutes % 60 === 0) {
    return `каждые ${intervalMinutes / 60} ч`;
  }

  const hours = Math.floor(intervalMinutes / 60);
  const minutes = intervalMinutes % 60;
  if (hours === 0) {
    return `каждые ${minutes} мин`;
  }
  return `каждые ${hours} ч ${minutes} мин`;
}

export function buildWeightDoseHint(
  medicine: HouseholdMedicine | null,
  weightKg: number | null,
  doseMgPerKg: number | null
) {
  if (!weightKg || !doseMgPerKg) {
    return null;
  }

  const totalMg = weightKg * doseMgPerKg;
  const concentration = parseMedicineConcentration(medicine?.medicineConcentration ?? null);
  if (concentration) {
    const totalMl = totalMg / concentration.mgPerMl;
    return `По весу: ${formatDecimal(totalMg)} мг, это примерно ${formatDecimal(totalMl)} мл.`;
  }

  return `По весу: ${formatDecimal(totalMg)} мг. Пересчёт в мл лучше проверить вручную по концентрации упаковки.`;
}

export function getEpisodeMedicationReminder(
  plans: EpisodeMedicationPlan[],
  administrations: AdministrationEvent[],
  medicines: HouseholdMedicine[],
  now = new Date()
) {
  if (plans.length === 0) {
    return null;
  }

  const items = plans.map((plan) => {
    const medicine = medicines.find((item) => item.id === plan.householdMedicineId) ?? null;
    const stats = buildPlanAdministrationStats(plan, administrations, now);
    const isUnavailable =
      medicine?.status === "expired" || medicine?.status === "expired_after_opening";

    return { plan, medicine, stats, isUnavailable };
  });

  const availableNow = items.find((item) => !item.isUnavailable && !item.stats.isBlocked);
  if (availableNow) {
    return {
      tone: "success" as const,
      text: `Сейчас можно дать ${availableNow.medicine?.medicineName ?? "лекарство"}`,
    };
  }

  const upcoming = items
    .filter(
      (item) => !item.isUnavailable && !item.stats.blockedByDailyLimit && item.stats.nextAllowedAt
    )
    .sort(
      (left, right) => left.stats.nextAllowedAt!.getTime() - right.stats.nextAllowedAt!.getTime()
    )[0];

  if (upcoming?.stats.nextAllowedAt) {
    return {
      tone: "warning" as const,
      text: `Следующее лекарство: ${upcoming.medicine?.medicineName ?? "лекарство"} ${formatRelativeDateTime(
        upcoming.stats.nextAllowedAt,
        now
      )}`,
    };
  }

  if (items.some((item) => item.isUnavailable)) {
    return {
      tone: "danger" as const,
      text: "Есть план лекарства, но упаковку нужно проверить",
    };
  }

  if (items.some((item) => item.stats.blockedByDailyLimit)) {
    return {
      tone: "muted" as const,
      text: "По текущему плану на сегодня лимит уже достигнут",
    };
  }

  return {
    tone: "muted" as const,
    text: "Планы лекарства уже настроены",
  };
}

export function formatRelativeDateTime(date: Date, now = new Date()) {
  const diffMs = date.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.ceil(diffMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  if (hours === 0 && minutes === 0) {
    return `через ${seconds} сек`;
  }
  if (hours === 0) {
    if (seconds === 0) {
      return `через ${minutes} мин`;
    }
    return `через ${minutes} мин ${seconds} сек`;
  }
  if (minutes === 0) {
    return `через ${hours} ч`;
  }
  return `через ${hours} ч ${minutes} мин`;
}

function parseMedicineConcentration(concentration: string | null) {
  if (!concentration) {
    return null;
  }

  const normalized = concentration.replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*мг\s*\/\s*(\d+(?:\.\d+)?)\s*мл/i);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  const mg = parseFloat(match[1]);
  const ml = parseFloat(match[2]);
  if (Number.isNaN(mg) || Number.isNaN(ml) || ml <= 0) {
    return null;
  }

  return { mgPerMl: mg / ml };
}

function formatDecimal(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
