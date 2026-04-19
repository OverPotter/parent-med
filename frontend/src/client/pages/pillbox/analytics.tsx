import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPillboxHistorySummary, fetchPillboxPlan } from "@shared/api/pillboxPlans";
import type { AppLanguage } from "@shared/i18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import type { PillboxHistorySummary } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import {
  EditorShell,
  FlowScreenHeader,
  displayPillboxText,
  PillboxGroup,
  PillboxPlanListFilter,
  actionSecondaryClass,
  segmentedButtonActiveClass,
  segmentedButtonClass,
  segmentedControlClass,
  tPillbox,
} from "./shared";

export function PillboxAnalyticsScreen({
  language,
  groups,
  selectedPlanId,
  initialFilter,
  onBack,
  onSelectPlan,
}: {
  language: AppLanguage;
  groups: PillboxGroup[];
  selectedPlanId: string | null;
  initialFilter: PillboxPlanListFilter;
  onBack: () => void;
  onSelectPlan: (planId: string, filter: PillboxPlanListFilter) => void;
}) {
  const [planFilter, setPlanFilter] = useState<PillboxPlanListFilter>(initialFilter);
  const filteredGroups = groups.filter((group) =>
    planFilter === "archive" ? group.status === "archived" : group.status !== "archived"
  );
  const activePlanId =
    selectedPlanId && filteredGroups.some((group) => group.id === selectedPlanId)
      ? selectedPlanId
      : (filteredGroups[0]?.id ?? null);
  const { data: activePlan } = useQuery({
    queryKey: ["pillbox-plan", activePlanId],
    queryFn: () => fetchPillboxPlan(activePlanId!),
    enabled: Boolean(activePlanId),
    staleTime: 60_000,
  });
  const periodDates = useMemo(() => {
    if (!activePlan) return { start: null as string | null, end: null as string | null };
    const courseStarts = activePlan.medications
      .map((item) => item.courseStartDate)
      .filter((value): value is string => Boolean(value));
    const courseEnds = activePlan.medications
      .map((item) => item.courseEndDate)
      .filter((value): value is string => Boolean(value));
    return {
      start: courseStarts.length > 0 ? courseStarts.sort()[0] : null,
      end: courseEnds.length > 0 ? courseEnds.sort()[courseEnds.length - 1] : null,
    };
  }, [activePlan]);
  const analyticsPeriod: "half_year" | "all" =
    periodDates.start && periodDates.end ? "all" : "half_year";
  const { data: summary, isLoading } = useQuery({
    queryKey: ["pillbox-history-summary", activePlanId, analyticsPeriod, language],
    queryFn: () => fetchPillboxHistorySummary(activePlanId!, analyticsPeriod, language),
    enabled: Boolean(activePlanId),
  });

  return (
    <EditorShell>
      <FlowScreenHeader
        backLabel={tPillbox(language, "analyticsBack")}
        onBack={onBack}
        eyebrow={tPillbox(language, "eyebrow")}
        title={language === "ru" ? "Аналитика приёмов" : "Dose analytics"}
        subtitle={
          language === "ru"
            ? "История выполнения и рисков по выбранному плану."
            : "History of adherence and missed-dose risks for the selected plan."
        }
      />

      <section className="soft-panel space-y-4 rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
        <div
          className={`${segmentedControlClass} max-w-[16rem]`}
          aria-label={language === "ru" ? "Фильтр планов" : "Plan filter"}
        >
          <button
            type="button"
            onClick={() => setPlanFilter("active")}
            className={planFilter === "active" ? segmentedButtonActiveClass : segmentedButtonClass}
            aria-pressed={planFilter === "active"}
          >
            {tPillbox(language, "activeFilter")}
          </button>
          <button
            type="button"
            onClick={() => setPlanFilter("archive")}
            className={planFilter === "archive" ? segmentedButtonActiveClass : segmentedButtonClass}
            aria-pressed={planFilter === "archive"}
          >
            {tPillbox(language, "archiveFilter")}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-[0.78rem] font-semibold tracking-[0.08em] text-muted">
            {language === "ru" ? "План" : "Plan"}
          </p>
          <div className="flex flex-wrap gap-2">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectPlan(group.id, planFilter)}
                className={
                  group.id === activePlanId
                    ? actionSecondaryClass.replace(
                        "soft-pill ",
                        "soft-pill-primary app-profile-action app-profile-action--selected "
                      )
                    : actionSecondaryClass
                }
              >
                {displayPillboxText(group.title)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!activePlanId ? (
        <div className="soft-empty rounded-[22px] px-4 py-5 text-sm text-muted">
          {planFilter === "archive"
            ? language === "ru"
              ? "В архиве пока нет планов для аналитики."
              : "There are no archived plans for analytics yet."
            : language === "ru"
              ? "Нет планов для аналитики. Создайте хотя бы один план."
              : "No plans for analytics yet. Create at least one plan."}
        </div>
      ) : isLoading || !summary ? (
        <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
          {language === "ru" ? "Готовим сводку…" : "Preparing summary…"}
        </div>
      ) : (
        <PillboxAnalyticsContent
          summary={summary}
          language={language}
          planStartDate={periodDates.start ?? null}
          planEndDate={periodDates.end ?? null}
        />
      )}
    </EditorShell>
  );
}

function PillboxAnalyticsContent({
  summary,
  language,
  planStartDate,
  planEndDate,
}: {
  summary: PillboxHistorySummary;
  language: AppLanguage;
  planStartDate: string | null;
  planEndDate: string | null;
}) {
  const isIosShell = useIsIosShell();
  const formattedPlanContext = useMemo(() => {
    const formatPlanDate = (value: string) => formatDate(value);
    if (planStartDate && planEndDate) {
      return language === "ru"
        ? `С ${formatPlanDate(planStartDate)} по ${formatPlanDate(planEndDate)}`
        : `From ${formatPlanDate(planStartDate)} to ${formatPlanDate(planEndDate)}`;
    }
    if (planStartDate && !planEndDate) {
      return language === "ru"
        ? `С ${formatPlanDate(planStartDate)} по сейчас`
        : `From ${formatPlanDate(planStartDate)} to now`;
    }
    return language === "ru" ? "Постоянный план" : "Continuous plan";
  }, [language, planEndDate, planStartDate]);
  const filteredTimeline = useMemo(
    () => filterTimelineByPlanBounds(summary.timeline, language, planStartDate, planEndDate),
    [language, planEndDate, planStartDate, summary.timeline]
  );

  const kpiCards = [
    {
      label: language === "ru" ? "Соблюдение" : "Adherence",
      value: `${Math.round(summary.adherenceRate * 100)}%`,
      hint: language === "ru" ? "Из всех запланированных" : "Of all scheduled doses",
      badgeClass: "soft-pill-success",
    },
    {
      label: language === "ru" ? "Вовремя" : "On time",
      value: `${Math.round(summary.onTimeRate * 100)}%`,
      hint: language === "ru" ? "Без задержки" : "Without delay",
      badgeClass: "soft-pill-primary",
    },
    {
      label: language === "ru" ? "Отмечено слотов" : "Logged slots",
      value: `${summary.takenSlots}/${summary.scheduledSlots}`,
      hint: language === "ru" ? "Факт против плана" : "Actual vs planned",
      badgeClass: "soft-pill",
    },
    {
      label: language === "ru" ? "Пропуски" : "Missed slots",
      value: String(summary.missedSlots),
      hint: language === "ru" ? "Не отмечены совсем" : "Not logged at all",
      badgeClass: "soft-pill-danger",
    },
  ];
  const summaryGridClass = isIosShell
    ? "grid grid-cols-2 gap-3"
    : "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";
  const planCardClass = isIosShell
    ? "soft-panel-muted rounded-[22px] px-4 py-4 col-span-2"
    : "soft-panel-muted rounded-[22px] px-4 py-4 sm:col-span-2 xl:col-span-4";
  const kpiHintClass =
    "inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-medium leading-tight";
  const timelineMax = Math.max(...filteredTimeline.map((point) => point.value), 1);
  const timelineTotal = filteredTimeline.reduce((total, point) => total + point.value, 0);
  const timelineAverage =
    filteredTimeline.length > 0 ? Math.round(timelineTotal / filteredTimeline.length) : 0;
  const timelinePeak = filteredTimeline.reduce<PillboxHistorySummary["timeline"][number] | null>(
    (best, point) => (best === null || point.value > best.value ? point : best),
    null
  );
  const timelineLow = filteredTimeline.reduce<PillboxHistorySummary["timeline"][number] | null>(
    (worst, point) => (worst === null || point.value < worst.value ? point : worst),
    null
  );
  const latestTimelinePoint =
    filteredTimeline.length > 0 ? filteredTimeline[filteredTimeline.length - 1] : null;
  const previousTimelinePoint =
    filteredTimeline.length > 1 ? filteredTimeline[filteredTimeline.length - 2] : null;
  const latestTimelineDelta =
    latestTimelinePoint && previousTimelinePoint
      ? latestTimelinePoint.value - previousTimelinePoint.value
      : 0;
  const latestTimelineBadge = latestTimelinePoint
    ? latestTimelineDelta > 0
      ? language === "ru"
        ? "Растёт"
        : "Improving"
      : latestTimelineDelta < 0
        ? language === "ru"
          ? "Просело"
          : "Dropped"
        : language === "ru"
          ? "Без изменений"
          : "No change"
    : null;
  const latestTimelineBadgeClass = latestTimelinePoint
    ? latestTimelineDelta > 0
      ? "soft-pill-success"
      : latestTimelineDelta < 0
        ? "soft-pill-danger"
        : "soft-pill"
    : "soft-pill";
  const timelineInsight =
    timelinePeak && timelineLow
      ? timelinePeak.label === timelineLow.label
        ? language === "ru"
          ? "План отмечался ровно: периоды без выраженных провалов."
          : "Tracking stayed even across periods without clear drops."
        : language === "ru"
          ? `Лучше всего отмечали в период ${timelinePeak.label}, слабее всего в ${timelineLow.label}.`
          : `Tracking was strongest in ${timelinePeak.label} and weakest in ${timelineLow.label}.`
      : language === "ru"
        ? "Данных пока мало, чтобы увидеть выраженную динамику."
        : "There is not enough data yet to show a strong trend.";
  const planStatusLabel =
    summary.planStatus === "active"
      ? language === "ru"
        ? "Активен"
        : "Active"
      : summary.planStatus === "paused"
        ? language === "ru"
          ? "На паузе"
          : "Paused"
        : language === "ru"
          ? "В архиве"
          : "Archived";
  const topMissedMedication = summary.topMissedMedications[0] ?? null;
  const planInsight =
    summary.missedSlots === 0
      ? language === "ru"
        ? "План держится стабильно: пропусков нет."
        : "This plan is stable: no missed slots."
      : summary.adherenceRate >= 0.85
        ? language === "ru"
          ? "В целом план соблюдается, но есть отдельные сбои."
          : "Overall adherence is good, but there are occasional misses."
        : topMissedMedication
          ? language === "ru"
            ? `Основная проблема сейчас: пропуски по «${displayPillboxText(topMissedMedication.medicationName)}».`
            : `The main issue right now is missed doses for “${displayPillboxText(topMissedMedication.medicationName)}”.`
          : language === "ru"
            ? "План сбивается: пропусков уже заметно больше нормы."
            : "This plan is slipping: missed doses are already above a healthy range.";

  return (
    <div className="space-y-4">
      <section className={summaryGridClass}>
        <div className={planCardClass}>
          <p className="text-[0.82rem] leading-5 text-muted sm:text-sm">
            {language === "ru" ? "План:" : "Plan:"}{" "}
            <span className="font-semibold text-foreground">{summary.planTitle}</span>
          </p>
          <div className="mt-2">
            <span className={`soft-pill-info ${kpiHintClass}`}>{formattedPlanContext}</span>
          </div>
          <p className="mt-3 text-sm font-medium leading-5 text-foreground">{planInsight}</p>
        </div>
        {kpiCards.map((item) => (
          <div key={item.label} className="soft-card rounded-[22px] px-4 py-4 sm:px-5">
            <p className="text-[0.82rem] leading-5 text-muted sm:text-sm">{item.label}</p>
            <div className="mt-2">
              <span className={`${item.badgeClass} ${kpiHintClass}`}>{item.hint}</span>
            </div>
            <p className="app-card-title mt-3 text-[1rem] sm:text-[1.04rem]">{item.value}</p>
          </div>
        ))}
      </section>
      <section className="soft-panel rounded-[28px] p-4 sm:p-5">
        <h3 className="app-card-title">
          {language === "ru" ? "Динамика по периодам" : "Period trend"}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          {language === "ru"
            ? "Показывает, в какие периоды план отмечался стабильнее."
            : "Shows which periods were tracked more consistently."}
        </p>
        <p className="mt-3 text-sm font-medium leading-5 text-foreground">{timelineInsight}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {timelinePeak ? (
            <span className="soft-pill-primary rounded-full px-3 py-1.5 text-xs">
              {language === "ru"
                ? `Лучший период: ${timelinePeak.label}`
                : `Best period: ${timelinePeak.label}`}
            </span>
          ) : null}
          {timelineLow && timelinePeak?.label !== timelineLow.label ? (
            <span className="soft-pill-danger rounded-full px-3 py-1.5 text-xs">
              {language === "ru"
                ? `Слабый период: ${timelineLow.label}`
                : `Weakest period: ${timelineLow.label}`}
            </span>
          ) : null}
          {latestTimelinePoint && latestTimelineBadge ? (
            <span className={`${latestTimelineBadgeClass} rounded-full px-3 py-1.5 text-xs`}>
              {language === "ru"
                ? `Последний: ${latestTimelinePoint.label} — ${latestTimelineBadge}`
                : `Latest: ${latestTimelinePoint.label} — ${latestTimelineBadge}`}
            </span>
          ) : null}
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {language === "ru" ? `В среднем: ${timelineAverage}` : `Average: ${timelineAverage}`}
          </span>
          <span className="soft-pill-info rounded-full px-3 py-1.5 text-xs">
            {language === "ru" ? `Всего: ${timelineTotal}` : `Total: ${timelineTotal}`}
          </span>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {filteredTimeline.map((item) => (
            <SimpleStatRow
              key={item.label}
              language={language}
              label={item.label}
              value={item.value}
              max={timelineMax}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="soft-panel rounded-[28px] p-4 sm:p-5">
          <h3 className="app-card-title">
            {language === "ru" ? "Что важно по плану" : "What matters about this plan"}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="soft-panel-muted rounded-[20px] px-4 py-3">
              <p className="text-xs tracking-[0.08em] text-muted">
                {language === "ru" ? "Статус" : "Status"}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{planStatusLabel}</p>
            </div>
            <div className="soft-panel-muted rounded-[20px] px-4 py-3">
              <p className="text-xs tracking-[0.08em] text-muted">
                {language === "ru" ? "Период плана" : "Plan period"}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{formattedPlanContext}</p>
            </div>
          </div>
        </div>
        <div className="soft-panel rounded-[28px] p-4 sm:p-5">
          <h3 className="app-card-title">
            {language === "ru" ? "Где чаще пропуски" : "Most missed medicines"}
          </h3>
          <div className="mt-4 space-y-3">
            {summary.topMissedMedications.length > 0 ? (
              summary.topMissedMedications.map((item) => (
                <div
                  key={`${item.medicationName}-${item.missedSlots}`}
                  className="soft-panel-muted flex items-center justify-between gap-3 rounded-[20px] px-4 py-3"
                >
                  <p className="text-sm text-foreground">{item.medicationName}</p>
                  <span className="soft-pill-danger rounded-full px-2.5 py-1 text-xs">
                    {language === "ru"
                      ? `Пропусков: ${item.missedSlots}`
                      : `Missed: ${item.missedSlots}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="soft-empty rounded-[20px] px-4 py-5 text-sm text-muted">
                {language === "ru"
                  ? "Пропусков в рамках этого плана не найдено."
                  : "No missed slots found for this plan."}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function filterTimelineByPlanBounds(
  timeline: PillboxHistorySummary["timeline"],
  language: AppLanguage,
  planStartDate: string | null,
  planEndDate: string | null
) {
  if (!planStartDate && !planEndDate) return timeline;
  const start = planStartDate ? new Date(`${planStartDate}T00:00:00`) : null;
  const end = planEndDate ? new Date(`${planEndDate}T00:00:00`) : null;
  const monthMap =
    language === "en"
      ? {
          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        }
      : {
          янв: 0,
          фев: 1,
          мар: 2,
          апр: 3,
          май: 4,
          июн: 5,
          июл: 6,
          авг: 7,
          сен: 8,
          окт: 9,
          ноя: 10,
          дек: 11,
        };

  const filtered = timeline.filter((item) => {
    const [monthLabelRaw, yearLabelRaw] = item.label.trim().split(/\s+/);
    const monthLabel = monthLabelRaw?.toLowerCase();
    const yearLabel = yearLabelRaw?.trim();
    if (!monthLabel || !yearLabel || !(monthLabel in monthMap)) return true;
    const monthIndex = monthMap[monthLabel as keyof typeof monthMap];
    if (monthIndex === undefined) return true;
    const fullYear = Number(`20${yearLabel}`);
    if (Number.isNaN(fullYear)) return true;
    const pointDate = new Date(fullYear, monthIndex, 1);
    const isAfterStart = !start || pointDate >= new Date(start.getFullYear(), start.getMonth(), 1);
    const isBeforeEnd = !end || pointDate <= new Date(end.getFullYear(), end.getMonth(), 1);
    return isAfterStart && isBeforeEnd;
  });
  return filtered.length > 0 ? filtered : timeline;
}

function SimpleStatRow({
  label,
  value,
  max,
  language,
}: {
  label: string;
  value: number;
  max: number;
  language: AppLanguage;
}) {
  const width = Math.max(10, Math.round((value / Math.max(max, 1)) * 100));
  const averageLabel =
    width >= 90
      ? language === "ru"
        ? "Сильный период"
        : "Strong period"
      : width >= 65
        ? language === "ru"
          ? "Ровно по плану"
          : "Steady period"
        : language === "ru"
          ? "Нужно внимание"
          : "Needs attention";
  const averageBadgeClass =
    width >= 90 ? "soft-pill-success" : width >= 65 ? "soft-pill" : "soft-pill-warning";

  return (
    <div className="soft-panel-muted rounded-[20px] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full border border-[color:color-mix(in_srgb,var(--color-border)_76%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_7%,white)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-primary)_68%,white_20%)_0%,color-mix(in_srgb,var(--color-primary)_88%,black_4%)_100%)]"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.76rem] leading-5 text-muted">
          {language === "ru" ? `${width}% от лучшего периода` : `${width}% of best period`}
        </p>
        <span className={`${averageBadgeClass} rounded-full px-2.5 py-1 text-[10px]`}>
          {averageLabel}
        </span>
      </div>
    </div>
  );
}
