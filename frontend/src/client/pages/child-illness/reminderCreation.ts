import { createAdministrationEvent } from "@shared/api/administrationEvents";
import {
  createEpisodeMedicationPlan,
  deleteEpisodeMedicationPlan,
} from "@shared/api/episodeMedicationPlans";
import type { EpisodeMedicationPlan } from "@shared/types/api";

export type ReminderCreationPayload = {
  episodeId: string;
  householdMedicineId?: string | null;
  customMedicineName?: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay?: number | null;
  weightKg?: number | null;
  doseMgPerKg?: number | null;
  notes?: string | null;
  firstDoseStatus?: "already_given" | "not_given";
  firstDoseAt?: string | null;
};

type ReminderCreationDeps = {
  createPlan?: typeof createEpisodeMedicationPlan;
  createAdministration?: typeof createAdministrationEvent;
  rollbackPlan?: typeof deleteEpisodeMedicationPlan;
};

export async function createReminderWithOptionalFirstAdministration(
  payload: ReminderCreationPayload,
  language: "ru" | "en",
  deps: ReminderCreationDeps = {}
): Promise<EpisodeMedicationPlan> {
  const createPlan = deps.createPlan ?? createEpisodeMedicationPlan;
  const createAdministration = deps.createAdministration ?? createAdministrationEvent;
  const rollbackPlan = deps.rollbackPlan ?? deleteEpisodeMedicationPlan;

  const createdPlan = await createPlan({
    episode_id: payload.episodeId,
    household_medicine_id: payload.householdMedicineId,
    custom_medicine_name: payload.customMedicineName,
    dose_amount: payload.doseAmount,
    min_interval_minutes: payload.minIntervalMinutes,
    max_doses_per_day: payload.maxDosesPerDay ?? null,
    weight_kg: payload.weightKg ?? null,
    dose_mg_per_kg: payload.doseMgPerKg ?? null,
    notes: payload.notes ?? null,
  });

  try {
    if (payload.firstDoseStatus === "already_given" && payload.firstDoseAt) {
      await createAdministration({
        episode_id: payload.episodeId,
        household_medicine_id: payload.householdMedicineId,
        custom_medicine_name: payload.customMedicineName ?? undefined,
        administered_at: payload.firstDoseAt,
        amount: payload.doseAmount,
        reason: "Лекарство уже дали при создании напоминания",
      });
    }

    return createdPlan;
  } catch (error) {
    try {
      await rollbackPlan(createdPlan.id);
    } catch {
      throw Object.assign(new Error("Failed to keep reminder creation consistent"), {
        response: {
          data: {
            detail:
              language === "ru"
                ? "Не удалось полностью сохранить напоминание. Проверьте список напоминаний и ленту приёмов перед повтором."
                : "The reminder could not be saved consistently. Check reminders and administrations before trying again.",
          },
        },
        cause: error,
      });
    }

    throw Object.assign(new Error("Failed to create first administration"), {
      response: {
        data: {
          detail:
            language === "ru"
              ? "Не удалось отметить первый приём, поэтому напоминание не было сохранено."
              : "The first administration could not be logged, so the reminder was not saved.",
        },
      },
      cause: error,
    });
  }
}
