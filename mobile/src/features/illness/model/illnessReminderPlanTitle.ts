import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";

export function getReminderPlanDisplayTitle(
  plan: Pick<MobileEpisodeMedicationPlan, "customMedicineName">,
  locale: MobileLocale,
) {
  return (
    plan.customMedicineName?.trim() ||
    (locale === "ru"
      ? "Лекарство"
      : locale === "de"
        ? "Medikament"
        : locale === "pl"
          ? "Lek"
          : "Medicine")
  );
}
