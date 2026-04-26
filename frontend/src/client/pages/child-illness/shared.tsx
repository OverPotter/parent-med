import type { ReactNode } from "react";
import { formatChildDateRange } from "@client/utils/childDateFormat";

export const appBtnFilledClass =
  "soft-pill-primary app-profile-action app-profile-action--selected";
export const appBtnSecondaryClass = "soft-pill app-profile-action";
export const appPillActionClass =
  "soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const appBtnDangerClass = "soft-pill-danger app-profile-action";
export const illnessPanelClass =
  "rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]";
export const illnessPanelSoftClass =
  "rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_42%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_62%,var(--color-background)_38%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]";
export const illnessListClass =
  "overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]";
export const illnessListRowClass =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:px-4";
export const appBtnJournalPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(15,23,42,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const appBtnJournalSecondaryClass =
  "soft-pill app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const appBtnJournalDangerClass =
  "soft-pill-danger app-profile-action min-h-[2.5rem] px-3.25 text-[0.8rem] tracking-[-0.025em] disabled:opacity-50 sm:min-h-[2.6rem] sm:text-[0.82rem]";
export const illnessCompactInputClass =
  "soft-input min-h-[2.82rem] w-full px-4 py-0 text-left text-[16px] leading-[1.15] placeholder:text-left sm:min-h-[2.92rem]";
export const illnessCompactPrimaryButtonClass = `${appBtnJournalPrimaryClass} illness-primary-action`;
export const illnessCompactSecondaryButtonClass = appBtnJournalSecondaryClass;

export function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel-muted rounded-[22px] px-4 py-3">
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">{value}</p>
    </div>
  );
}

export function formatDurationValue(days: number, language: "ru" | "en") {
  const normalized = Number.isInteger(days) ? String(days) : days.toFixed(1).replace(".0", "");
  return `${normalized} ${language === "ru" ? "дн." : "days"}`;
}

export function getHistoryPeriodHint(
  period: "month" | "quarter" | "half_year" | "year" | "all",
  language: "ru" | "en"
) {
  const labels = {
    month: language === "ru" ? "последние 30 дней" : "the last 30 days",
    quarter: language === "ru" ? "последние 3 месяца" : "the last 3 months",
    half_year: language === "ru" ? "последние 6 месяцев" : "the last 6 months",
    year: language === "ru" ? "последний год" : "the last year",
    all: language === "ru" ? "всё время" : "all time",
  };

  return language === "ru"
    ? `Сводка считает завершённые эпизоды за ${labels[period]}.`
    : `Summary counts completed episodes for ${labels[period]}.`;
}

export function SectionTitle({
  title,
  subtitle,
  subtitleAddon,
  action,
  actionInlineOnMobile = false,
}: {
  title: string;
  subtitle: string;
  subtitleAddon?: ReactNode;
  action?: ReactNode;
  actionInlineOnMobile?: boolean;
}) {
  return (
    <div
      className={
        actionInlineOnMobile
          ? "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"
          : "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
      }
    >
      <div className="min-w-0">
        <h2 className="app-card-title">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
        {subtitleAddon ? (
          <p className="mt-1 overflow-x-auto whitespace-nowrap text-xs leading-5 text-muted [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {subtitleAddon}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center justify-end">{action}</div> : null}
    </div>
  );
}

export function EpisodeMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
          {value}
        </span>
      </span>
    </div>
  );
}

export function EpisodeFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={illnessListRowClass}>
      <div className="min-w-0">
        <p className="truncate text-[0.82rem] font-semibold text-foreground sm:text-sm">{label}</p>
        <p className="mt-1 break-words text-[0.9rem] leading-6 text-muted sm:text-sm">{value}</p>
      </div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-1 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <p className="text-xs font-medium tracking-[0.04em] text-muted">{label}</p>
      <p className="text-sm font-medium leading-6 text-foreground sm:text-right">{value}</p>
    </div>
  );
}

export function formatEpisodePeriod(
  startedAt: string,
  closedAt: string | null,
  language: "ru" | "en"
) {
  return formatChildDateRange(startedAt, closedAt, language);
}

export function formatWeightValue(valueKg: number, language: "ru" | "en" = "ru"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
}
