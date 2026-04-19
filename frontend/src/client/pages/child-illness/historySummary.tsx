import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIllnessHistorySummary } from "@shared/api/illnessEpisodes";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { getHistoryPeriodHint } from "./shared";

export function HistoryInsightsPreview({ childId }: { childId: string }) {
  const { language } = useI18n();
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodOptions = [
    { key: "month", label: language === "ru" ? "Месяц" : "Month" },
    { key: "quarter", label: language === "ru" ? "3 месяца" : "3 months" },
    { key: "half_year", label: language === "ru" ? "6 месяцев" : "6 months" },
    { key: "year", label: language === "ru" ? "Год" : "Year" },
    { key: "all", label: language === "ru" ? "Всё время" : "All time" },
  ] as const;
  const [selectedPeriod, setSelectedPeriod] =
    useState<(typeof periodOptions)[number]["key"]>("half_year");
  const liveQueryOptions = useLiveQueryOptions(10000);
  const {
    data: summary,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["illness-history-summary", childId, selectedPeriod],
    queryFn: () => fetchIllnessHistorySummary(childId, selectedPeriod),
    enabled: !!childId,
    placeholderData: (previous) => previous,
    ...liveQueryOptions,
  });

  useEffect(() => {
    if (!isPeriodMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !periodMenuRef.current?.contains(target)) {
        setIsPeriodMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPeriodMenuOpen]);

  if (isLoading || !summary) {
    return (
      <div className="soft-panel-muted rounded-[28px] px-5 py-8 text-sm text-muted">
        {language === "ru" ? "Готовим сводку…" : "Preparing summary…"}
      </div>
    );
  }

  const selectedPeriodLabel =
    periodOptions.find((item) => item.key === selectedPeriod)?.label ??
    (language === "ru" ? "Период" : "Period");
  const selectedPeriodHint = getHistoryPeriodHint(selectedPeriod, language);
  const isSummaryUpdating = isFetching || summary.period !== selectedPeriod;

  const summaryPills = [
    {
      label: language === "ru" ? "За период" : "In period",
      value: language === "ru" ? `${summary.episodeCount} эп.` : `${summary.episodeCount} ep.`,
      tone: "bg-rose-500",
    },
    {
      label: language === "ru" ? "Средняя" : "Average",
      value: formatDurationValue(summary.averageDurationDays, language),
      tone: "bg-amber-500",
    },
    {
      label: language === "ru" ? "Долгий" : "Longest",
      value:
        summary.longestDurationDays > 0
          ? formatDurationValue(summary.longestDurationDays, language)
          : language === "ru"
            ? "Нет данных"
            : "No data",
      tone: "bg-orange-500",
    },
    {
      label:
        selectedPeriod === "month"
          ? language === "ru"
            ? "Напоминания"
            : "Reminders"
          : language === "ru"
            ? "Активный"
            : "Active",
      value:
        selectedPeriod === "month"
          ? String(summary.guidedEpisodes)
          : (translateAnalyticsLabel(summary.mostActivePeriodLabel, language) ??
            (language === "ru" ? "Нет данных" : "No data")),
      tone: "bg-sky-500",
    },
    {
      label: language === "ru" ? "Лекарства" : "Meds",
      value: String(summary.episodesWithAdministrations),
      tone: "bg-teal-500",
    },
    {
      label: language === "ru" ? "Всего" : "Total",
      value: String(summary.totalClosedEpisodes),
      tone: "bg-violet-500",
    },
  ];

  return (
    <Surface className="relative z-30 overflow-visible p-4 sm:p-5">
      <div className="space-y-4">
        <div ref={periodMenuRef} className="relative z-50">
          <button
            type="button"
            onClick={() => setIsPeriodMenuOpen((current) => !current)}
            className="soft-pill app-profile-action app-profile-action--split min-h-[2.45rem] w-full gap-2 rounded-[18px] text-left text-xs font-extrabold"
            aria-haspopup="listbox"
            aria-expanded={isPeriodMenuOpen}
            aria-busy={isSummaryUpdating}
          >
            <span className="min-w-0 truncate">{selectedPeriodLabel}</span>
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
            >
              ▾
            </span>
          </button>
          <p className="mt-2 px-1 text-[0.78rem] leading-5 text-muted">{selectedPeriodHint}</p>
          {isPeriodMenuOpen ? (
            <div
              role="listbox"
              className="soft-panel absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-full min-w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] p-2 shadow-[0_24px_64px_rgba(15,23,42,0.28)]"
            >
              {periodOptions.map((item) => {
                const isActive = selectedPeriod === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedPeriod(item.key);
                      setIsPeriodMenuOpen(false);
                    }}
                    className={[
                      "flex min-h-[2.45rem] w-full items-center justify-between rounded-[17px] px-3 text-left text-sm font-extrabold tracking-[-0.02em] transition",
                      isActive
                        ? "soft-pill-primary app-profile-action--selected text-foreground"
                        : "soft-pill text-foreground hover:opacity-90",
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    {isActive ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div
          key={summary.period}
          className={[
            "grid grid-cols-2 gap-1.5 transition-opacity sm:gap-2",
            isSummaryUpdating ? "opacity-55" : "opacity-100",
          ].join(" ")}
        >
          {summaryPills.map((item) => (
            <SummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </div>
    </Surface>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex min-h-[3.05rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block whitespace-normal break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
          {value}
        </span>
      </span>
    </div>
  );
}

function formatDurationValue(days: number, language: "ru" | "en") {
  if (language === "ru") {
    if (days === 1) return "1 день";
    if (days < 5) return `${days} дня`;
    return `${days} дней`;
  }
  return days === 1 ? "1 day" : `${days} days`;
}

function translateAnalyticsLabel(label: string | null | undefined, language: "ru" | "en") {
  if (!label || language === "ru") {
    return label ?? null;
  }

  const exactMap: Record<string, string> = {
    Янв: "Jan",
    Фев: "Feb",
    Мар: "Mar",
    Апр: "Apr",
    Май: "May",
    Июн: "Jun",
    Июл: "Jul",
    Авг: "Aug",
    Сен: "Sep",
    Окт: "Oct",
    Ноя: "Nov",
    Дек: "Dec",
    "1-2 дня": "1-2 days",
    "3-5 дней": "3-5 days",
    "6+ дней": "6+ days",
  };

  if (exactMap[label]) {
    return exactMap[label];
  }

  return label.replace(/\bдн\./g, "days");
}
