import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLocalIsoDate } from "@shared/utils/date";

export type ChildRecordsPeriod = "today" | "week" | "twoWeeks" | "month" | "custom";

const periodOptions: ChildRecordsPeriod[] = ["today", "week", "twoWeeks", "month", "custom"];

type ChildRecordsPeriodSelectorProps = {
  language: "ru" | "en";
  period: ChildRecordsPeriod;
  customStartDate: string;
  customEndDate: string;
  onPeriodChange: (period: ChildRecordsPeriod) => void;
  onCustomRangeChange: (startDate: string, endDate: string) => void;
};

export function ChildRecordsPeriodSelector({
  language,
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onCustomRangeChange,
}: ChildRecordsPeriodSelectorProps) {
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false);
  const [draftCustomStartDate, setDraftCustomStartDate] = useState(customStartDate);
  const [draftCustomEndDate, setDraftCustomEndDate] = useState(customEndDate);
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const periodLabel = getChildRecordsPeriodLabel(period, customStartDate, customEndDate, language);

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

  const openCustomPeriodDialog = () => {
    setDraftCustomStartDate(customStartDate);
    setDraftCustomEndDate(customEndDate);
    setIsCustomPeriodOpen(true);
  };

  const handlePeriodChange = (value: ChildRecordsPeriod) => {
    setIsPeriodMenuOpen(false);
    if (value === "custom") {
      openCustomPeriodDialog();
      return;
    }
    onPeriodChange(value);
  };

  const applyCustomPeriod = () => {
    const startDate = draftCustomStartDate || getLocalIsoDate();
    const endDate = draftCustomEndDate || getLocalIsoDate();
    onCustomRangeChange(startDate, endDate);
    onPeriodChange("custom");
    setIsCustomPeriodOpen(false);
  };

  return (
    <>
      <div ref={periodMenuRef} className="relative z-50">
        <button
          type="button"
          onClick={() => setIsPeriodMenuOpen((current) => !current)}
          className="soft-pill app-profile-action app-profile-action--split min-h-[2.45rem] w-full gap-2 rounded-[18px] text-left text-xs font-extrabold"
          aria-haspopup="listbox"
          aria-expanded={isPeriodMenuOpen}
        >
          <span className="min-w-0 truncate">{periodLabel}</span>
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
          >
            ▾
          </span>
        </button>
        {isPeriodMenuOpen ? (
          <div
            role="listbox"
            className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-full min-w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-border bg-background p-2 shadow-[0_24px_64px_rgba(15,23,42,0.28)]"
          >
            {periodOptions.map((option) => {
              const isActive = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handlePeriodChange(option)}
                  className={[
                    "flex min-h-[2.45rem] w-full items-center justify-between rounded-[17px] px-3 text-left text-sm font-extrabold tracking-[-0.02em] transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                      : "bg-surface text-foreground hover:bg-surface-muted",
                  ].join(" ")}
                >
                  <span>{getChildRecordsPeriodOptionLabel(option, language)}</span>
                  {isActive ? <span aria-hidden="true">✓</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <CustomPeriodDialog
        isOpen={isCustomPeriodOpen}
        language={language}
        startDate={draftCustomStartDate}
        endDate={draftCustomEndDate}
        onStartDateChange={setDraftCustomStartDate}
        onEndDateChange={setDraftCustomEndDate}
        onCancel={() => setIsCustomPeriodOpen(false)}
        onApply={applyCustomPeriod}
      />
    </>
  );
}

export function matchesChildRecordsPeriod(
  value: string,
  period: ChildRecordsPeriod,
  customStartDate: string,
  customEndDate: string
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (period === "custom") {
    const start = parseLocalDate(customStartDate || getLocalIsoDate());
    const end = parseLocalDate(customEndDate || getLocalIsoDate());
    const rangeStart = start <= end ? start : end;
    const rangeEnd = start <= end ? end : start;
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);
    return date >= rangeStart && date <= rangeEnd;
  }

  const now = new Date();
  if (period === "today") {
    return date.toDateString() === now.toDateString();
  }

  const days = period === "week" ? 7 : period === "twoWeeks" ? 14 : 30;
  const threshold = new Date(now);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));
  return date >= threshold;
}

export function getChildRecordsPeriodDayCount(
  period: ChildRecordsPeriod,
  customStartDate: string,
  customEndDate: string
) {
  if (period === "today") return 1;
  if (period === "week") return 7;
  if (period === "twoWeeks") return 14;
  if (period === "month") return 30;

  const start = parseLocalDate(customStartDate || getLocalIsoDate());
  const end = parseLocalDate(customEndDate || getLocalIsoDate());
  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / msInDay) + 1);
}

export function getShiftedLocalIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalIsoDate(date);
}

function CustomPeriodDialog({
  isOpen,
  language,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onCancel,
  onApply,
}: {
  isOpen: boolean;
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [calendarEdge, setCalendarEdge] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCalendarEdge(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const selectDate = (date: string) => {
    if (calendarEdge === "start") {
      onStartDateChange(date);
      if (parseLocalDate(date) > parseLocalDate(endDate)) {
        onEndDateChange(date);
      }
      setCalendarEdge(null);
      return;
    }

    onEndDateChange(date);
    if (parseLocalDate(date) < parseLocalDate(startDate)) {
      onStartDateChange(date);
    }
    setCalendarEdge(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--color-background)_82%,transparent)] p-4 backdrop-blur-md sm:p-6">
      <button
        type="button"
        aria-label={language === "ru" ? "Закрыть выбор периода" : "Close period picker"}
        onClick={onCancel}
        className="absolute inset-0"
      />
      <div className="soft-panel relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[30px] border border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_94%,var(--color-background)_6%)] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="mb-4 h-1.5 w-14 rounded-full bg-primary/45" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            {language === "ru" ? "За период" : "For period"}
          </p>
          <h2 className="app-card-title text-[1.15rem]">
            {language === "ru" ? "Выбор даты" : "Custom dates"}
          </h2>
          <p className="text-sm leading-5 text-muted">
            {language === "ru"
              ? "Выберите период для ленты и краткой аналитики."
              : "Choose the period for feed and quick summary."}
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          <DateRangeButton
            label={language === "ru" ? "Начало" : "Start"}
            value={formatShortDate(parseLocalDate(startDate), language)}
            onClick={() => setCalendarEdge("start")}
          />
          <DateRangeButton
            label={language === "ru" ? "Конец" : "End"}
            value={formatShortDate(parseLocalDate(endDate), language)}
            onClick={() => setCalendarEdge("end")}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="soft-pill app-profile-action min-h-[2.9rem] px-4 text-sm font-extrabold"
          >
            {language === "ru" ? "Отмена" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.9rem] px-4 text-sm font-extrabold"
          >
            {language === "ru" ? "Применить" : "Apply"}
          </button>
        </div>
      </div>

      <CalendarPickerDialog
        isOpen={calendarEdge !== null}
        title={
          calendarEdge === "start"
            ? language === "ru"
              ? "Начало"
              : "Start"
            : language === "ru"
              ? "Конец"
              : "End"
        }
        language={language}
        startDate={startDate}
        endDate={endDate}
        selectedDate={calendarEdge === "start" ? startDate : endDate}
        onSelectDate={selectDate}
        onCancel={() => setCalendarEdge(null)}
      />
    </div>,
    document.body
  );
}

function DateRangeButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[22px] border border-[color:color-mix(in_srgb,var(--color-border)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-3.5 py-2.5 text-left text-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)] transition hover:border-primary/30"
    >
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.08em] opacity-70">
          {label}
        </span>
        <span className="mt-1 block text-sm font-extrabold">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]"
      >
        ▾
      </span>
    </button>
  );
}

function CalendarPickerDialog({
  isOpen,
  title,
  language,
  startDate,
  endDate,
  selectedDate,
  onSelectDate,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onCancel: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => parseLocalDate(selectedDate || getLocalIsoDate()));
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const calendarDays = useMemo(() => buildPlainCalendarDays(viewDate), [viewDate]);
  const normalizedRange = useMemo(
    () => buildCustomDateRange(startDate, endDate),
    [endDate, startDate]
  );

  useEffect(() => {
    if (!isOpen) return;
    setViewDate(parseLocalDate(selectedDate || getLocalIsoDate()));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, selectedDate]);

  if (!isOpen) return null;

  const shiftViewMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    shiftViewMonth(deltaX < 0 ? 1 : -1);
  };
  const yearOptions = buildCalendarYearOptions(viewDate);

  return createPortal(
    <div className="fixed inset-0 z-[920] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--color-background)_84%,transparent)] p-4 backdrop-blur-md sm:p-6">
      <button
        type="button"
        aria-label={language === "ru" ? "Закрыть календарь" : "Close calendar"}
        onClick={onCancel}
        className="absolute inset-0"
      />
      <div className="soft-panel relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-[30px] border border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_94%,var(--color-background)_6%)] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              {language === "ru" ? "Выбор даты" : "Date picker"}
            </p>
            <h3 className="app-card-title mt-1 truncate text-[1.05rem]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="app-header-icon-button h-9 min-h-0 w-9 shrink-0 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="rounded-[26px] border border-[color:color-mix(in_srgb,var(--color-border)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]">
          <div className="grid grid-cols-[2.35rem_minmax(0,1fr)_2.35rem] items-center gap-2 rounded-[20px] bg-surface p-1.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_42%,transparent)]">
            <button
              type="button"
              onClick={() => shiftViewMonth(-1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
            >
              ←
            </button>
            <p className="app-card-title min-w-0 truncate text-center text-[0.95rem]">
              {formatMonthTitle(viewDate, language)}
            </p>
            <button
              type="button"
              onClick={() => shiftViewMonth(1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
            >
              →
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_6.6rem] gap-2">
            <label className="relative block">
              <span className="sr-only">{language === "ru" ? "Месяц" : "Month"}</span>
              <select
                value={viewDate.getMonth()}
                onChange={(event) =>
                  setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))
                }
                className="soft-input min-h-[2.35rem] w-full appearance-none rounded-[16px] px-3 pr-8 text-[0.82rem] font-bold"
              >
                {getMonthLabels(language).map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </label>
            <label className="relative block">
              <span className="sr-only">{language === "ru" ? "Год" : "Year"}</span>
              <select
                value={viewDate.getFullYear()}
                onChange={(event) =>
                  setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))
                }
                className="soft-input min-h-[2.35rem] w-full appearance-none rounded-[16px] px-3 pr-7 text-[0.82rem] font-bold"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </label>
          </div>

          <div
            className="touch-pan-y select-none px-1 pb-1 pt-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-muted">
              {getWeekdayLabels(language).map((label) => (
                <div key={label} className="py-0.5">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const date = parseLocalDate(day.date);
                const isSelected =
                  day.date === startDate ||
                  day.date === endDate ||
                  isDateInsideRange(date, normalizedRange);
                const isEdge = day.date === startDate || day.date === endDate;
                const isToday = day.date === getLocalIsoDate();

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDate(day.date)}
                    className={[
                      "flex h-8 items-center justify-center rounded-[1rem] text-[0.82rem] font-bold transition",
                      isEdge
                        ? "bg-primary text-primary-foreground shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                        : isSelected
                          ? "bg-primary/12 text-foreground"
                          : day.inMonth
                            ? "bg-surface text-foreground"
                            : "bg-surface text-muted opacity-45",
                      isToday && !isEdge ? "ring-1 ring-primary/25" : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getChildRecordsPeriodOptionLabel(period: ChildRecordsPeriod, language: "ru" | "en") {
  const labels: Record<ChildRecordsPeriod, { ru: string; en: string }> = {
    today: { ru: "Сегодня", en: "Today" },
    week: { ru: "7 дней", en: "7 days" },
    twoWeeks: { ru: "14 дней", en: "14 days" },
    month: { ru: "30 дней", en: "30 days" },
    custom: { ru: "Выбор даты", en: "Custom dates" },
  };
  return labels[period][language];
}

function getChildRecordsPeriodLabel(
  period: ChildRecordsPeriod,
  customStartDate: string,
  customEndDate: string,
  language: "ru" | "en"
) {
  if (period !== "custom") {
    return getChildRecordsPeriodOptionLabel(period, language);
  }
  return `${formatShortDate(parseLocalDate(customStartDate), language)}–${formatShortDate(
    parseLocalDate(customEndDate),
    language
  )}`;
}

function parseLocalDate(value: string) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0] ?? 1970, ((parts[1] ?? 1) || 1) - 1, (parts[2] ?? 1) || 1);
}

function formatShortDate(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatMonthTitle(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getMonthLabels(language: "ru" | "en") {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
      month: "long",
    }).format(new Date(2024, index, 1))
  );
}

function getWeekdayLabels(language: "ru" | "en") {
  const base =
    language === "ru"
      ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
      : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  return base;
}

function buildCalendarYearOptions(date: Date) {
  const currentYear = new Date().getFullYear();
  const center = Math.max(currentYear, date.getFullYear());
  return Array.from({ length: 9 }, (_, index) => center - 6 + index).filter((year) => year >= 2000);
}

function buildPlainCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date: getLocalIsoDate(date),
      inMonth: date.getMonth() === month,
    };
  });
}

function buildCustomDateRange(startDate: string, endDate: string) {
  const first = parseLocalDate(startDate);
  const second = parseLocalDate(endDate);
  return first <= second ? { start: first, end: second } : { start: second, end: first };
}

function isDateInsideRange(date: Date, range: { start: Date; end: Date }) {
  return date >= range.start && date <= range.end;
}
