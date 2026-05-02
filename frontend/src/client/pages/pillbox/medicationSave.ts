import type { PillboxPlan } from "@shared/api/pillboxPlans.contract";
import type { MedicationItem } from "./shared";

export function buildOptimisticMedicationSavePlan(args: {
  plan: PillboxPlan;
  medication: MedicationItem;
  title: string;
  dose: string;
  times: string[];
}): PillboxPlan {
  const nextTitle = args.title.trim();
  const nextDose = args.dose.trim();
  const nextTimes = args.times.length > 0 ? args.times : ["08:30"];

  return {
    ...args.plan,
    medications: args.plan.medications.map((item) =>
      item.id === args.medication.id
        ? {
            ...item,
            customMedicineName: nextTitle || null,
            doseAmount: nextDose,
            times: nextTimes,
            mealRule: args.medication.mealRule,
            repeatDays: [...args.medication.repeatDays],
            courseMode: args.medication.courseMode,
            courseStartDate:
              args.medication.courseMode === "period" ? args.medication.courseStartDate || null : null,
            courseEndDate:
              args.medication.courseMode === "period" ? args.medication.courseEndDate || null : null,
          }
        : item
    ),
  };
}
