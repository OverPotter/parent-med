import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useNow } from "@shared/hooks/useNow";
import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
} from "@shared/types/api";
import {
  buildPlanAdministrationStats,
  formatReminderTimeWithClock,
  getPrioritizedMedicationPlanItems,
} from "../../utils/medicationPlans";
import {
  appBtnJournalPrimaryClass,
  appBtnJournalSecondaryClass,
  illnessCompactSecondaryButtonClass,
  illnessListClass,
} from "./shared";

export function MedicationPlanList({
  plans,
  medicines,
  administrations,
  onOpen,
  onTakeDose,
  isSubmittingAdministration = false,
}: {
  plans: EpisodeMedicationPlan[];
  medicines: HouseholdMedicine[];
  administrations?: AdministrationEvent[];
  onOpen: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
}) {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const now = useNow(isIosShell ? 30_000 : 15_000);
  const currentTime = new Date(now);
  const prioritizedPlans = administrations
    ? getPrioritizedMedicationPlanItems(plans, administrations, medicines, currentTime)
    : plans.map((plan) => ({
        plan,
        medicine: medicines.find((item) => item.id === plan.householdMedicineId) ?? null,
        stats: buildPlanAdministrationStats(plan, [], currentTime),
        isUnavailable: false,
      }));

  return (
    <div className={illnessListClass}>
      {prioritizedPlans.map(({ plan, medicine, stats, isUnavailable }) => {
        const planName =
          plan.customMedicineName ??
          medicine?.medicineName ??
          (language === "ru" ? "Лекарство" : "Medicine");
        const nextDoseLabel = isUnavailable
          ? language === "ru"
            ? "Упаковка сейчас недоступна"
            : "This pack is currently unavailable"
          : stats?.blockedByDailyLimit
            ? language === "ru"
              ? `Сегодня ${planName.toLowerCase()}: лимит приёмов уже достигнут`
              : `${planName}: today's dose limit is already reached`
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? language === "ru"
                  ? "Следующий приём: можно сейчас"
                  : "Next dose: available now"
                : language === "ru"
                  ? `Следующий приём: ${formatReminderTimeWithClock(stats.nextAllowedAt, language, currentTime)}`
                  : `Next dose: ${formatReminderTimeWithClock(stats.nextAllowedAt, language, currentTime)}`
              : language === "ru"
                ? "Следующий приём: можно сейчас"
                : "Next dose: available now";
        const statusDotClass = isUnavailable
          ? "bg-rose-500"
          : stats?.blockedByDailyLimit
            ? "bg-rose-500"
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? "bg-emerald-500"
                : "bg-sky-500"
              : "bg-sky-500";

        return (
          <article
            key={plan.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(plan.id)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") {
                return;
              }
              event.preventDefault();
              onOpen(plan.id);
            }}
            className="cursor-pointer border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--color-surface)_78%,var(--color-background)_22%)] focus:outline-none focus-visible:bg-[color:color-mix(in_srgb,var(--color-surface)_78%,var(--color-background)_22%)] last:border-b-0"
          >
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.95rem] font-semibold leading-5 text-foreground">
                      {planName}
                    </p>
                    <p className="mt-1 text-sm text-muted">{nextDoseLabel}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-[1.125rem] text-xs text-muted">
                  {plan.doseAmount ? (
                    <span>
                      {language === "ru" ? "Доза" : "Dose"}: {plan.doseAmount}
                    </span>
                  ) : null}
                  {plan.maxDosesPerDay ? (
                    <span>
                      {language === "ru" ? "Сегодня отмечено" : "Logged today"}:{" "}
                      {stats?.todayCount ?? 0} {language === "ru" ? "из" : "of"}{" "}
                      {plan.maxDosesPerDay}
                    </span>
                  ) : (stats?.todayCount ?? 0) > 0 ? (
                    <span>
                      {language === "ru" ? "Сегодня отмечено" : "Logged today"}:{" "}
                      {stats?.todayCount ?? 0}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {onTakeDose && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onTakeDose(plan);
                    }}
                    disabled={isSubmittingAdministration || !!stats?.isBlocked || isUnavailable}
                    className={`transition ${
                      isUnavailable || stats?.isBlocked
                        ? `${appBtnJournalSecondaryClass} text-muted`
                        : appBtnJournalPrimaryClass
                    }`}
                  >
                    {isSubmittingAdministration
                      ? language === "ru"
                        ? "Отмечаем…"
                        : "Logging…"
                      : isUnavailable
                        ? language === "ru"
                          ? "Недоступно"
                          : "Unavailable"
                        : language === "ru"
                          ? "Отметить сейчас"
                          : "Log now"}
                  </button>
                )}
                <div className={illnessCompactSecondaryButtonClass} aria-hidden="true">
                  {language === "ru" ? "Открыть детали" : "Open details"}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
