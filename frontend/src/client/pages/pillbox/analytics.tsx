import { OverlayDialog } from "@shared/components/OverlayDialog";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPillboxHistorySummary, fetchPillboxPlan } from "@shared/api/pillboxPlans";
import type { AppLanguage } from "@shared/i18n";
import type { PillboxHistorySummary } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";
import {
  EditorShell,
  FlowScreenHeader,
  displayPillboxText,
  PillboxGroup,
  PillboxPlanListFilter,
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
  const [isPlanPickerOpen, setIsPlanPickerOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const filteredGroups = groups.filter((group) =>
    planFilter === "completed"
      ? group.status === "archived" || group.status === "completed"
      : group.status !== "archived" && group.status !== "completed"
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
  const activePlanLabel =
    filteredGroups.find((group) => group.id === activePlanId)?.title ??
    (language === "ru" ? "Выберите план" : "Choose a plan");
  const visiblePlanOptions = useMemo(() => {
    const query = planSearch.trim().toLowerCase();
    if (!query) return filteredGroups;
    return filteredGroups.filter((group) =>
      displayPillboxText(group.title).toLowerCase().includes(query)
    );
  }, [filteredGroups, planSearch]);

  useEffect(() => {
    setPlanFilter(initialFilter);
  }, [initialFilter]);

  const handleFilterChange = (nextFilter: PillboxPlanListFilter) => {
    setPlanFilter(nextFilter);
    const nextGroups = groups.filter((group) =>
      nextFilter === "completed"
        ? group.status === "archived" || group.status === "completed"
        : group.status !== "archived" && group.status !== "completed"
    );
    if (nextGroups[0]) {
      onSelectPlan(nextGroups[0].id, nextFilter);
    }
  };

  useEffect(() => {
    setIsPlanPickerOpen(false);
    setPlanSearch("");
  }, [planFilter, activePlanId]);

  return (
    <EditorShell>
      <FlowScreenHeader
        backLabel={tPillbox(language, "analyticsBack")}
        onBack={onBack}
        eyebrow=""
        title={
          language === "ru"
            ? `${tPillbox(language, "eyebrow")} · Как идёт план`
            : `${tPillbox(language, "eyebrow")} · How the plan is going`
        }
        subtitle={
          language === "ru"
            ? "Короткая сводка: что идёт ровно и где режим уже сбивается."
            : "A quick summary of what stays on track and where the routine starts slipping."
        }
      />

      <section className="soft-panel space-y-4 rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="soft-field-label">{language === "ru" ? "Показывать" : "Show"}</p>
            <div className="mt-1 flex items-center gap-2 text-[0.88rem] font-medium tracking-[-0.02em]">
              <span className={planFilter === "active" ? "text-foreground" : "text-muted"}>
                {tPillbox(language, "activeFilter")}
              </span>
              <span className="text-muted/60">/</span>
              <span className={planFilter === "completed" ? "text-foreground" : "text-muted"}>
                {tPillbox(language, "archiveFilter")}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={planFilter === "completed"}
            aria-label={
              planFilter === "completed"
                ? tPillbox(language, "archiveFilter")
                : tPillbox(language, "activeFilter")
            }
            onClick={() => handleFilterChange(planFilter === "completed" ? "active" : "completed")}
            className={[
              "baby-mode-switch relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors",
              planFilter === "completed" ? "baby-mode-switch--active" : "",
            ].join(" ")}
          >
            <span
              className={[
                "baby-mode-switch__thumb absolute left-1 inline-block h-6 w-6 rounded-full transition-transform",
                planFilter === "completed" ? "translate-x-6" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
        <div className="space-y-2">
          <p className="soft-field-label">{language === "ru" ? "План" : "Plan"}</p>
          <button
            type="button"
            onClick={() => setIsPlanPickerOpen(true)}
            className="soft-pill app-profile-action app-profile-action--split min-h-[2.45rem] w-full gap-2 rounded-[18px] text-left text-xs font-extrabold"
            aria-haspopup="dialog"
            aria-expanded={isPlanPickerOpen}
            disabled={filteredGroups.length === 0}
          >
            <span className="min-w-0 truncate">{displayPillboxText(activePlanLabel)}</span>
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted disabled:opacity-50"
            >
              ▾
            </span>
          </button>
        </div>
      </section>

      <OverlayDialog
        isOpen={isPlanPickerOpen}
        onClose={() => setIsPlanPickerOpen(false)}
        placement="bottom"
        zIndexClassName="z-[130]"
        backdropAriaLabel={language === "ru" ? "Закрыть выбор плана" : "Close plan picker"}
        containerClassName="flex items-end"
        backdropClassName="bg-[rgba(15,23,42,0.32)]"
      >
        <div className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-2xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="app-card-title">
                  {language === "ru" ? "Выбрать план" : "Choose plan"}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {language === "ru"
                    ? "Так удобнее переключаться между планами, даже если их много."
                    : "This makes it easier to switch between plans when there are many."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanPickerOpen(false)}
                className="soft-pill app-profile-action inline-flex min-h-[2.3rem] min-w-[2.3rem] items-center justify-center px-0"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={planSearch}
              onChange={(event) => setPlanSearch(event.target.value)}
              placeholder={language === "ru" ? "Найти план по названию" : "Find a plan by name"}
              className="soft-input w-full px-4"
            />
            <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
              <div className="space-y-2 pb-1">
                {visiblePlanOptions.length > 0 ? (
                  visiblePlanOptions.map((group) => {
                    const isActive = group.id === activePlanId;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          onSelectPlan(group.id, planFilter);
                          setIsPlanPickerOpen(false);
                        }}
                        className={`w-full rounded-[20px] px-4 py-3 text-left transition ${
                          isActive
                            ? "soft-pill-primary app-profile-action--selected"
                            : "soft-panel-muted hover:opacity-95"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
                            {displayPillboxText(group.title)}
                          </span>
                          {isActive ? <span aria-hidden="true">✓</span> : null}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-2 py-4 text-sm text-muted">
                    {language === "ru"
                      ? "По этому запросу планы не найдены."
                      : "No plans found for this search."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </OverlayDialog>

      {!activePlanId ? (
        <div className="soft-empty rounded-[22px] px-4 py-5 text-sm text-muted">
          {planFilter === "completed"
            ? language === "ru"
              ? "Нет завершённых планов для аналитики."
              : "There are no completed plans for analytics yet."
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
      tone: "bg-emerald-500",
    },
    {
      label: language === "ru" ? "Вовремя" : "On time",
      value: `${Math.round(summary.onTimeRate * 100)}%`,
      tone: "bg-sky-500",
    },
    {
      label: language === "ru" ? "С задержкой" : "Late",
      value: String(summary.lateSlots),
      tone: summary.lateSlots > 0 ? "bg-violet-500" : "bg-slate-400",
    },
    {
      label: language === "ru" ? "Пропуски" : "Missed slots",
      value: String(summary.missedSlots),
      tone: summary.missedSlots > 0 ? "bg-amber-500" : "bg-slate-400",
    },
  ];
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
  const topMissedMedication = summary.topMissedMedications[0] ?? null;
  const planInsight =
    summary.missedSlots === 0
      ? language === "ru"
        ? "План идёт ровно: пропусков пока нет."
        : "This plan is stable: no missed slots."
      : summary.adherenceRate >= 0.85
        ? language === "ru"
          ? "В целом всё идёт ровно, но местами уже есть сбои."
          : "Overall adherence is good, but there are occasional misses."
        : topMissedMedication
          ? language === "ru"
            ? `Чаще всего сбивается: «${displayPillboxText(topMissedMedication.medicationName)}».`
            : `The main issue right now is missed doses for “${displayPillboxText(topMissedMedication.medicationName)}”.`
          : language === "ru"
            ? "По плану уже есть заметные пропуски."
            : "This plan is slipping: missed doses are already above a healthy range.";

  return (
    <div className="space-y-4">
      <section className="soft-panel rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="app-card-title">{summary.planTitle}</p>
            <p className="text-[0.82rem] leading-5 text-muted">{formattedPlanContext}</p>
            <p className="text-[0.8rem] leading-5 text-muted">
              {formatAnalyticsFacts(summary.totalMedications, summary.memberCount, language)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {kpiCards.map((item) => (
              <SummaryPill
                key={item.label}
                label={item.label}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            <p className="text-sm font-medium leading-6 text-foreground">{planInsight}</p>
          </div>
        </div>
      </section>

      <section className="soft-panel rounded-[28px] p-4 sm:p-5">
        <h3 className="app-card-title">
          {language === "ru" ? "Как шёл план" : "How the plan went"}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          {language === "ru"
            ? "Помогает понять, в какие периоды было проще держать режим."
            : "Helps show which periods were easier to keep on track."}
        </p>
        <p className="mt-3 text-sm font-medium leading-5 text-foreground">{timelineInsight}</p>
        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:gap-2">
          {timelinePeak ? (
            <SummaryPill
              label={language === "ru" ? "Лучший" : "Best"}
              value={timelinePeak.label}
              tone="bg-emerald-500"
            />
          ) : null}
          {timelineLow ? (
            <SummaryPill
              label={language === "ru" ? "Слабый" : "Lowest"}
              value={timelineLow.label}
              tone="bg-amber-500"
            />
          ) : null}
          <SummaryPill
            label={language === "ru" ? "Среднее" : "Average"}
            value={String(timelineAverage)}
            tone="bg-sky-500"
          />
          <SummaryPill
            label={language === "ru" ? "Всего" : "Total"}
            value={String(timelineTotal)}
            tone="bg-violet-500"
          />
        </div>
        <div className="mt-4">
          <CompactTimelineChart items={filteredTimeline} max={timelineMax} language={language} />
        </div>
      </section>
      <section className="space-y-3">
        <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
          <div className="px-4 pb-2 pt-3">
            <h3 className="app-card-title">
              {language === "ru" ? "Где чаще сбивается" : "Where it slips most often"}
            </h3>
          </div>
          {summary.topMissedMedications.length > 0 ? (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)]">
              {summary.topMissedMedications.map((item) => (
                <div
                  key={`${item.medicationName}-${item.missedSlots}`}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                      />
                      <p className="min-w-0 text-sm font-semibold leading-5 text-foreground">
                        {displayPillboxText(item.medicationName)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-muted">
                      {language === "ru"
                        ? `Пропусков: ${item.missedSlots}`
                        : `Missed slots: ${item.missedSlots}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-muted">
              {language === "ru"
                ? "По этому плану пропусков пока нет."
                : "No missed slots found for this plan."}
            </div>
          )}
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

function CompactTimelineChart({
  items,
  max,
  language,
}: {
  items: PillboxHistorySummary["timeline"];
  max: number;
  language: AppLanguage;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-5 text-sm text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
        {language === "ru"
          ? "Для этого плана пока не хватает данных по периодам."
          : "There is not enough period data for this plan yet."}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
      <div className="flex min-h-[10rem] items-end gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const height = Math.max(16, Math.round((item.value / Math.max(max, 1)) * 120));
          return (
            <div key={item.label} className="flex min-w-[2.75rem] flex-col items-center gap-2">
              <span className="text-[0.7rem] font-semibold leading-4 text-foreground">
                {item.value}
              </span>
              <div className="flex h-[7.5rem] items-end">
                <div
                  className="w-7 rounded-[12px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_62%,white_18%)_0%,color-mix(in_srgb,var(--color-primary)_92%,black_4%)_100%)] shadow-[inset_0_1px_0_color-mix(in_srgb,white_45%,transparent)]"
                  style={{ height }}
                />
              </div>
              <span className="text-center text-[0.68rem] font-semibold leading-4 text-muted">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[0.76rem] leading-5 text-muted">
        {language === "ru"
          ? "Чем выше столбик, тем ровнее план шёл в этот период."
          : "The taller the bar, the steadier the plan was in that period."}
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
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

function formatAnalyticsFacts(
  totalMedications: number,
  memberCount: number,
  language: AppLanguage
) {
  if (language === "en") {
    const meds = totalMedications === 1 ? "1 medicine" : `${totalMedications} medicines`;
    const members = memberCount === 1 ? "1 member" : `${memberCount} members`;
    return `${meds} · ${members}`;
  }

  const meds =
    totalMedications % 10 === 1 && totalMedications % 100 !== 11
      ? `${totalMedications} лекарство`
      : totalMedications % 10 >= 2 &&
          totalMedications % 10 <= 4 &&
          (totalMedications % 100 < 12 || totalMedications % 100 > 14)
        ? `${totalMedications} лекарства`
        : `${totalMedications} лекарств`;
  const members =
    memberCount % 10 === 1 && memberCount % 100 !== 11
      ? `${memberCount} участник`
      : memberCount % 10 >= 2 &&
          memberCount % 10 <= 4 &&
          (memberCount % 100 < 12 || memberCount % 100 > 14)
        ? `${memberCount} участника`
        : `${memberCount} участников`;
  return `${meds} · ${members}`;
}
