import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { buildMobileReminderPlanAdministrationStats } from "../model/illnessReminderPlanStats";

type ReminderCardStatusCopy = {
  dailyLimitReached: string;
  giveAtLabel: string;
  nextDosePrefix: string;
  giveNowLabel?: string;
};

function formatReminderStatusTime(date: Date, locale: MobileLocale) {
  return new Intl.DateTimeFormat(
    locale === "ru"
      ? "ru-RU"
      : locale === "de"
        ? "de-DE"
        : locale === "pl"
          ? "pl-PL"
          : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getReminderStatusParts(
  stats: ReturnType<typeof buildMobileReminderPlanAdministrationStats>,
  copy: ReminderCardStatusCopy,
  locale: MobileLocale,
  now: Date,
) {
  if (stats.blockedByDailyLimit) {
    return {
      collapsedLabel: copy.dailyLimitReached,
      disabledActionLabel: copy.dailyLimitReached,
    };
  }

  if (!stats.nextAllowedAt || stats.nextAllowedAt <= now) {
    return {
      collapsedLabel: copy.giveNowLabel ?? "",
      disabledActionLabel: copy.giveNowLabel ?? "",
    };
  }

  const timeLabel = formatReminderStatusTime(stats.nextAllowedAt, locale);

  return {
    collapsedLabel: `${copy.nextDosePrefix} ${timeLabel}`,
    disabledActionLabel: `${copy.giveAtLabel} ${timeLabel}`,
  };
}

export function getReminderCardStatusText(
  stats: ReturnType<typeof buildMobileReminderPlanAdministrationStats>,
  copy: ReminderCardStatusCopy,
  locale: MobileLocale,
  now: Date,
) {
  return getReminderStatusParts(stats, copy, locale, now);
}

export function getReminderLeadStatusText(
  stats: ReturnType<typeof buildMobileReminderPlanAdministrationStats>,
  copy: ReminderCardStatusCopy,
  locale: MobileLocale,
  now: Date,
) {
  return getReminderStatusParts(stats, copy, locale, now).collapsedLabel;
}
