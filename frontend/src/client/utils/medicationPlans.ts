import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
} from "../../shared/types/api.js";

const INTERVAL_MINUTE_MS = 60 * 1000;
export const DOSE_TIME_CONFIRMATION_GRACE_MS = 7 * 60 * 1000;

type MedicationPlanLike = Pick<
  EpisodeMedicationPlan,
  | "householdMedicineId"
  | "customMedicineName"
  | "minIntervalMinutes"
  | "maxDosesPerDay"
  | "createdAt"
>;

export type MedicationPlanPriorityItem<TPlan extends MedicationPlanLike = EpisodeMedicationPlan> = {
  plan: TPlan;
  medicine: HouseholdMedicine | null;
  stats: ReturnType<typeof buildPlanAdministrationStats>;
  isUnavailable: boolean;
};

export function buildPlanAdministrationStats(
  plan: MedicationPlanLike,
  administrations: AdministrationEvent[],
  now = new Date()
) {
  const relatedAdministrations = administrations
    .filter((entry) =>
      plan.householdMedicineId
        ? entry.householdMedicineId === plan.householdMedicineId
        : !!plan.customMedicineName &&
          entry.customMedicineName?.trim().toLowerCase() ===
            plan.customMedicineName.trim().toLowerCase()
    )
    .sort((left, right) => right.administeredAt.localeCompare(left.administeredAt));
  const lastAdministration = relatedAdministrations[0] ?? null;
  const todayCount = relatedAdministrations.filter(
    (entry) => new Date(entry.administeredAt).toDateString() === now.toDateString()
  ).length;
  const createdAt = new Date(plan.createdAt);
  const createdAtIsValid = !Number.isNaN(createdAt.getTime());
  const firstDoseScheduledAt =
    !lastAdministration && createdAtIsValid
      ? new Date(createdAt.getTime() + plan.minIntervalMinutes * INTERVAL_MINUTE_MS)
      : null;

  const nextAllowedAt = lastAdministration
    ? new Date(
        new Date(lastAdministration.administeredAt).getTime() +
          plan.minIntervalMinutes * INTERVAL_MINUTE_MS
      )
    : firstDoseScheduledAt;
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
          ? "Можно дать"
          : formatDoseTimeLabel(nextAllowedAt)
        : "Пока приёмов не было, можно отметить первый",
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
  doseMgPerKg: number | null,
  language: "ru" | "en" = "ru"
) {
  return (
    calculateMedicationDoseRecommendation(medicine, weightKg, doseMgPerKg, language)?.hint ?? null
  );
}

type DoseUnit = "ml" | "tablet" | "capsule" | "suppository" | "spray" | "drop" | "mg";

type DoseConversion = {
  mgPerUnit: number;
  unit: Exclude<DoseUnit, "mg">;
  mode: "mg_ml" | "tablet" | "capsule" | "suppository" | "spray" | "drop";
  isInferred: boolean;
};

export type MedicationDosePerKgReference = {
  value: number;
  sourceLabel: string;
  sourceKind: "catalog" | "inferred";
};

export type MedicationDoseCalculation = {
  totalMg: number;
  calculatedDoseMg: number;
  calculatedDoseValue: number | null;
  calculatedDoseUnit: DoseUnit | null;
  doseCalcMode: string;
  doseCalcWarning: string | null;
  suggestedDoseText: string;
  hint: string;
};

export function calculateMedicationDoseRecommendation(
  medicine: Pick<HouseholdMedicine, "medicineConcentration" | "medicineForm"> | null,
  weightKg: number | null,
  doseMgPerKg: number | null,
  language: "ru" | "en" = "ru"
): MedicationDoseCalculation | null {
  if (
    weightKg === null ||
    doseMgPerKg === null ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(doseMgPerKg) ||
    weightKg <= 0 ||
    doseMgPerKg <= 0
  ) {
    return null;
  }

  const totalMg = weightKg * doseMgPerKg;
  const conversion = parseMedicineDoseConversion(
    medicine?.medicineConcentration ?? null,
    medicine?.medicineForm ?? null
  );

  if (!conversion) {
    const totalMgText = formatDecimal(totalMg);
    return {
      totalMg,
      calculatedDoseMg: totalMg,
      calculatedDoseValue: null,
      calculatedDoseUnit: "mg",
      doseCalcMode: "mg_only",
      doseCalcWarning:
        language === "ru"
          ? "Пересчёт в мл, таблетки, капли или дозы не удалось подтвердить по карточке препарата. Сверьте упаковку вручную."
          : "The app could not safely convert this into ml, tablets, drops, or sprays. Check the package manually.",
      suggestedDoseText: `${totalMgText} ${language === "ru" ? "мг" : "mg"}`,
      hint:
        language === "ru"
          ? `Проверка по весу: примерно ${totalMgText} мг. Пересчёт в форму препарата проверьте по упаковке и назначению врача.`
          : `Weight check: about ${totalMgText} mg. Verify the package-specific form and dosing with the label or clinician instructions.`,
    };
  }

  const calculatedDoseValue = totalMg / conversion.mgPerUnit;
  const doseUnitLabel = formatDoseUnitLabel(conversion.unit, language, calculatedDoseValue);
  const doseValueText = formatDecimal(calculatedDoseValue);
  const totalMgText = formatDecimal(totalMg);
  const warning = buildDoseWarning(conversion, calculatedDoseValue, language);

  return {
    totalMg,
    calculatedDoseMg: totalMg,
    calculatedDoseValue,
    calculatedDoseUnit: conversion.unit,
    doseCalcMode: conversion.mode,
    doseCalcWarning: warning,
    suggestedDoseText: `${doseValueText} ${doseUnitLabel}`,
    hint:
      language === "ru"
        ? `Проверка по весу: примерно ${totalMgText} мг, это около ${doseValueText} ${doseUnitLabel}.${warning ? ` ${warning}` : ""}`
        : `Weight check: about ${totalMgText} mg, which is roughly ${doseValueText} ${doseUnitLabel}.${warning ? ` ${warning}` : ""}`,
  };
}

export function getMedicationDosePerKgReference(
  medicine:
    | (Pick<HouseholdMedicine, "medicineName" | "medicineDosage"> &
        Partial<
          Pick<
            HouseholdMedicine,
            "pediatricDoseMgPerKgMin" | "pediatricDoseMgPerKgMax" | "pediatricDoseNote"
          >
        >)
    | null,
  language: "ru" | "en" = "ru"
): MedicationDosePerKgReference | null {
  if (
    medicine &&
    (medicine.pediatricDoseMgPerKgMin != null || medicine.pediatricDoseMgPerKgMax != null)
  ) {
    const minValue = medicine.pediatricDoseMgPerKgMin ?? medicine.pediatricDoseMgPerKgMax ?? null;
    const maxValue = medicine.pediatricDoseMgPerKgMax ?? medicine.pediatricDoseMgPerKgMin ?? null;
    const selectedValue = minValue ?? maxValue;
    if (selectedValue != null) {
      const rangeLabel =
        minValue != null && maxValue != null && Math.abs(minValue - maxValue) > 0.001
          ? `${formatDecimal(minValue)}-${formatDecimal(maxValue)} ${
              language === "ru" ? "мг/кг" : "mg/kg"
            }`
          : `${formatDecimal(selectedValue)} ${language === "ru" ? "мг/кг" : "mg/kg"}`;
      const suffix = medicine.pediatricDoseNote?.trim();
      return {
        value: selectedValue,
        sourceKind: "catalog",
        sourceLabel: suffix ? `${rangeLabel} · ${suffix}` : rangeLabel,
      };
    }
  }

  const explicitReference = parseDosePerKgFromGuidance(medicine?.medicineDosage ?? null, language);
  if (explicitReference) {
    return explicitReference;
  }

  const normalizedName = normalizeDoseText(medicine?.medicineName ?? null);
  if (!normalizedName) {
    return null;
  }

  if (
    normalizedName.includes("ибупрофен") ||
    normalizedName.includes("ibuprofen") ||
    normalizedName.includes("нурофен") ||
    normalizedName.includes("nurofen")
  ) {
    return {
      value: 10,
      sourceKind: "inferred",
      sourceLabel:
        language === "ru"
          ? "обычно 10 мг/кг на приём для детей"
          : "typically 10 mg/kg per dose for children",
    };
  }

  if (
    normalizedName.includes("парацетамол") ||
    normalizedName.includes("paracetamol") ||
    normalizedName.includes("acetaminophen") ||
    normalizedName.includes("ацетаминофен")
  ) {
    return {
      value: 15,
      sourceKind: "inferred",
      sourceLabel:
        language === "ru"
          ? "часто ориентируются на 10-15 мг/кг на приём"
          : "a common pediatric reference is 10 to 15 mg/kg per dose",
    };
  }

  return null;
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

  const items = getPrioritizedMedicationPlanItems(plans, administrations, medicines, now);

  const availableNow = items.find((item) => !item.isUnavailable && !item.stats.isBlocked);
  if (availableNow) {
    return {
      tone: "success" as const,
      text: `Можно дать: ${
        availableNow.plan.customMedicineName ?? availableNow.medicine?.medicineName ?? "лекарство"
      }`,
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
      text: `${
        upcoming.plan.customMedicineName ?? upcoming.medicine?.medicineName ?? "лекарство"
      } ${formatDoseTimeLabel(upcoming.stats.nextAllowedAt)}`,
    };
  }

  if (items.some((item) => item.isUnavailable)) {
    return {
      tone: "danger" as const,
      text: "Есть напоминание, но упаковку нужно проверить",
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
    text: "Напоминания уже настроены",
  };
}

export function getPrioritizedMedicationPlanItems<TPlan extends MedicationPlanLike>(
  plans: TPlan[],
  administrations: AdministrationEvent[],
  medicines: HouseholdMedicine[],
  now = new Date()
): MedicationPlanPriorityItem<TPlan>[] {
  return plans
    .map((plan) => {
      const medicine = medicines.find((item) => item.id === plan.householdMedicineId) ?? null;
      const stats = buildPlanAdministrationStats(plan, administrations, now);
      const isUnavailable =
        medicine?.status === "expired" || medicine?.status === "expired_after_opening";

      return { plan, medicine, stats, isUnavailable };
    })
    .sort((left, right) => compareMedicationPlanItems(left, right));
}

export function getEpisodeMedicationLead(
  plans: EpisodeMedicationPlan[],
  administrations: AdministrationEvent[],
  medicines: HouseholdMedicine[],
  now = new Date()
) {
  return getPrioritizedMedicationPlanItems(plans, administrations, medicines, now)[0] ?? null;
}

export function getAdministrationActorLabel(
  administration: AdministrationEvent,
  language: "ru" | "en" = "ru"
) {
  const actor = administration.administeredByNameSnapshot?.trim();
  return actor ? `${language === "ru" ? "Дал(а)" : "Given by"}: ${actor}` : null;
}

export function formatDoseClock(date: Date, language: "ru" | "en" = "ru") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDoseTimeLabel(date: Date, language: "ru" | "en" = "ru") {
  return language === "ru"
    ? `дать в ${formatDoseClock(date, language)}`
    : `give at ${formatDoseClock(date, language)}`;
}

export function formatDoseStatusLabel(
  date: Date | null | undefined,
  language: "ru" | "en" = "ru",
  now = new Date()
) {
  if (!date) {
    return language === "ru" ? "Можно дать" : "Available now";
  }

  return date <= now
    ? language === "ru"
      ? "Можно дать"
      : "Available now"
    : language === "ru"
      ? `Дать в ${formatDoseClock(date, language)}`
      : `Give at ${formatDoseClock(date, language)}`;
}

export function formatRelativeDateTime(date: Date, now = new Date()) {
  return formatDoseStatusLabel(date, "ru", now);
}

export function formatReminderTimeWithClock(date: Date, language: "ru" | "en", now = new Date()) {
  return formatDoseStatusLabel(date, language, now);
}

export function shouldRequestDoseTimeConfirmation(
  nextAllowedAt: Date | null | undefined,
  now = new Date(),
  graceMs = DOSE_TIME_CONFIRMATION_GRACE_MS
) {
  if (!nextAllowedAt) {
    return false;
  }

  return now.getTime() - nextAllowedAt.getTime() > graceMs;
}

function parseMedicineDoseConversion(
  concentration: string | null,
  form: string | null
): DoseConversion | null {
  const normalizedConcentration = normalizeDoseText(concentration);
  const normalizedForm = normalizeDoseText(form);

  if (!normalizedConcentration) {
    return null;
  }

  const explicitMatch = normalizedConcentration.match(
    /(\d+(?:\.\d+)?)\s*(мг|mg|мкг|mcg|μg|ug)\s*\/\s*(\d+(?:\.\d+)?)?\s*(мл|ml|таб(?:летк[аи])?|tablet|tab|капсул[аи]?|capsule|cap|свеч[аи]?|supp(?:ository)?|доз[аы]?|dose|пшик(?:а|ов)?|spray|кап(?:л[яеи])?|drop(?:s)?)/i
  );
  if (explicitMatch) {
    const massValue = parseMassValue(explicitMatch[1], explicitMatch[2]);
    const denominatorValue = explicitMatch[3] ? Number.parseFloat(explicitMatch[3]) : 1;
    const unit = parseDoseUnit(explicitMatch[4]);
    if (massValue && denominatorValue > 0 && unit) {
      return {
        mgPerUnit: massValue / denominatorValue,
        unit,
        mode: unitToMode(unit),
        isInferred: false,
      };
    }
  }

  const singleMassMatch = normalizedConcentration.match(/(\d+(?:\.\d+)?)\s*(мг|mg|мкг|mcg|μg|ug)/i);
  if (!singleMassMatch) {
    return null;
  }

  const massValue = parseMassValue(singleMassMatch[1], singleMassMatch[2]);
  const inferredUnit = inferDoseUnitFromForm(normalizedForm);
  if (!massValue || !inferredUnit) {
    return null;
  }

  return {
    mgPerUnit: massValue,
    unit: inferredUnit,
    mode: unitToMode(inferredUnit),
    isInferred: true,
  };
}

function parseDosePerKgFromGuidance(
  guidance: string | null,
  language: "ru" | "en"
): MedicationDosePerKgReference | null {
  const normalizedGuidance = normalizeDoseText(guidance);
  if (!normalizedGuidance) {
    return null;
  }

  const explicitRangeMatch = normalizedGuidance.match(
    /(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(мг|mg)\s*\/\s*(кг|kg)/i
  );
  if (explicitRangeMatch) {
    const lowerBound = parseMassValue(explicitRangeMatch[1], explicitRangeMatch[3]);
    const upperBound = parseMassValue(explicitRangeMatch[2], explicitRangeMatch[3]);
    const selectedValue = lowerBound ?? upperBound;
    if (!selectedValue) {
      return null;
    }
    return {
      value: selectedValue,
      sourceKind: "catalog",
      sourceLabel:
        language === "ru"
          ? `${explicitRangeMatch[1]}-${explicitRangeMatch[2]} мг/кг из карточки препарата`
          : `${explicitRangeMatch[1]}-${explicitRangeMatch[2]} mg/kg from this medicine card`,
    };
  }

  const explicitSingleMatch = normalizedGuidance.match(/(\d+(?:\.\d+)?)\s*(мг|mg)\s*\/\s*(кг|kg)/i);
  if (!explicitSingleMatch) {
    return null;
  }

  const value = parseMassValue(explicitSingleMatch[1], explicitSingleMatch[2]);
  if (!value) {
    return null;
  }

  return {
    value,
    sourceKind: "catalog",
    sourceLabel:
      language === "ru"
        ? `${formatDecimal(value)} мг/кг из карточки препарата`
        : `${formatDecimal(value)} mg/kg from this medicine card`,
  };
}

function normalizeDoseText(value: string | null) {
  return (value ?? "").trim().replace(",", ".").toLowerCase();
}

function parseMassValue(rawValue: string | undefined, rawUnit: string | undefined) {
  const value = Number.parseFloat(rawValue ?? "");
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const unit = (rawUnit ?? "").toLowerCase();
  if (unit === "мкг" || unit === "mcg" || unit === "μg" || unit === "ug") {
    return value / 1000;
  }

  return value;
}

function parseDoseUnit(rawUnit: string | undefined): Exclude<DoseUnit, "mg"> | null {
  const unit = (rawUnit ?? "").toLowerCase();
  if (unit.includes("мл") || unit === "ml") {
    return "ml";
  }
  if (unit.startsWith("таб") || unit === "tablet" || unit === "tab") {
    return "tablet";
  }
  if (unit.startsWith("капсул") || unit === "capsule" || unit === "cap") {
    return "capsule";
  }
  if (unit.startsWith("свеч") || unit.startsWith("supp")) {
    return "suppository";
  }
  if (unit.startsWith("доз") || unit === "dose" || unit.startsWith("пшик") || unit === "spray") {
    return "spray";
  }
  if (unit.startsWith("кап") || unit.startsWith("drop")) {
    return "drop";
  }
  return null;
}

function inferDoseUnitFromForm(form: string) {
  if (form.includes("таб") || form.includes("tablet")) {
    return "tablet";
  }
  if (form.includes("капсул") || form.includes("capsule")) {
    return "capsule";
  }
  if (form.includes("свеч") || form.includes("supp")) {
    return "suppository";
  }
  return null;
}

function unitToMode(unit: Exclude<DoseUnit, "mg">): DoseConversion["mode"] {
  switch (unit) {
    case "ml":
      return "mg_ml";
    case "tablet":
      return "tablet";
    case "capsule":
      return "capsule";
    case "suppository":
      return "suppository";
    case "spray":
      return "spray";
    case "drop":
      return "drop";
  }
}

function formatDoseUnitLabel(unit: Exclude<DoseUnit, "mg">, language: "ru" | "en", value: number) {
  const singular = Math.abs(value - 1) < 0.001;
  if (language === "en") {
    switch (unit) {
      case "ml":
        return "ml";
      case "tablet":
        return singular ? "tablet" : "tablets";
      case "capsule":
        return singular ? "capsule" : "capsules";
      case "suppository":
        return singular ? "suppository" : "suppositories";
      case "spray":
        return singular ? "spray" : "sprays";
      case "drop":
        return singular ? "drop" : "drops";
    }
  }

  switch (unit) {
    case "ml":
      return "мл";
    case "tablet":
      return "таб.";
    case "capsule":
      return "капс.";
    case "suppository":
      return "супп.";
    case "spray":
      return "пшика";
    case "drop":
      return "кап.";
  }
}

function buildDoseWarning(
  conversion: DoseConversion,
  calculatedDoseValue: number,
  language: "ru" | "en"
) {
  const needsWholeUnits =
    conversion.unit === "spray" || conversion.unit === "drop" || conversion.unit === "capsule";
  const hasFraction = Math.abs(calculatedDoseValue - Math.round(calculatedDoseValue)) > 0.05;

  if (needsWholeUnits && hasFraction) {
    return language === "ru"
      ? "Получилось нецелое количество доз. Проверьте округление по инструкции."
      : "This produces a non-integer number of doses. Verify rounding against the package instructions.";
  }

  if (conversion.unit === "tablet" && hasFraction) {
    return language === "ru"
      ? "Убедитесь, что таблетку можно делить именно так."
      : "Make sure the tablet can be split this way.";
  }

  if (conversion.isInferred) {
    return language === "ru"
      ? "Количество рассчитано по форме препарата. Сверьте силу одной единицы по упаковке."
      : "The amount was inferred from the dosage form. Verify the strength of one unit on the package.";
  }

  return null;
}

function formatDecimal(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function compareMedicationPlanItems<TPlan extends MedicationPlanLike>(
  left: MedicationPlanPriorityItem<TPlan>,
  right: MedicationPlanPriorityItem<TPlan>
) {
  const leftPriority = getMedicationPlanPriority(left);
  const rightPriority = getMedicationPlanPriority(right);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftTime = left.stats.nextAllowedAt?.getTime() ?? 0;
  const rightTime = right.stats.nextAllowedAt?.getTime() ?? 0;
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  const leftName = left.plan.customMedicineName ?? left.medicine?.medicineName ?? "";
  const rightName = right.plan.customMedicineName ?? right.medicine?.medicineName ?? "";
  return leftName.localeCompare(rightName, "ru");
}

function getMedicationPlanPriority<TPlan extends MedicationPlanLike>(
  item: MedicationPlanPriorityItem<TPlan>
) {
  if (item.isUnavailable) {
    return 3;
  }
  if (item.stats.blockedByDailyLimit) {
    return 2;
  }
  if (item.stats.blockedByInterval) {
    return 1;
  }
  return 0;
}
