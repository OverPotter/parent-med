import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@shared/hooks/useBodyScrollLock";
import { getLocalIsoDate } from "@shared/utils/date";

type CalendarPickerDialogProps = {
  isOpen: boolean;
  title: string;
  language: "ru" | "en";
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onCancel: () => void;
  onCloseComplete?: () => void;
  rangeStartDate?: string;
  rangeEndDate?: string;
  zIndexClassName?: string;
};

export function CalendarPickerDialog({
  isOpen,
  title,
  language,
  selectedDate,
  onSelectDate,
  onCancel,
  onCloseComplete,
  rangeStartDate,
  rangeEndDate,
  zIndexClassName = "z-[920]",
}: CalendarPickerDialogProps) {
  useBodyScrollLock(isOpen);

  const [viewDate, setViewDate] = useState(() => parseLocalDate(selectedDate || getLocalIsoDate()));
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const calendarDays = useMemo(() => buildPlainCalendarDays(viewDate), [viewDate]);
  const selected = useMemo(() => parseLocalDate(selectedDate || getLocalIsoDate()), [selectedDate]);
  const normalizedRange = useMemo(() => {
    if (!rangeStartDate || !rangeEndDate) {
      return null;
    }
    return buildDateRange(rangeStartDate, rangeEndDate);
  }, [rangeEndDate, rangeStartDate]);

  useEffect(() => {
    if (!isOpen) return;

    setViewDate(parseLocalDate(selectedDate || getLocalIsoDate()));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, selectedDate]);

  useEffect(() => {
    if (isOpen) return;
    onCloseComplete?.();
  }, [isOpen, onCloseComplete]);

  if (!isOpen) return null;

  const shiftViewMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const handleCalendarTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleCalendarTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
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
  const todayIso = getLocalIsoDate();

  return createPortal(
    <div
      data-ios-local-back-swipe="true"
      data-ios-disable-back-swipe="true"
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-[color:color-mix(in_srgb,var(--color-background)_84%,transparent)] p-4 backdrop-blur-md sm:p-6`}
    >
      <button
        type="button"
        aria-label={language === "ru" ? "Закрыть календарь" : "Close calendar"}
        onClick={onCancel}
        className="absolute inset-0"
      />
      <div className="soft-panel relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-[30px] border border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_94%,var(--color-background)_6%)] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)]">
        <div className="mb-2.5 space-y-1.5">
          <span className="mx-auto block h-1 w-10 rounded-full bg-[color:color-mix(in_srgb,var(--color-border)_74%,transparent)]" />
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
                {language === "ru" ? "Выбор даты" : "Date picker"}
              </p>
              <h3 className="app-card-title mt-1 min-w-0 truncate text-[1.02rem]">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="app-header-icon-button h-8 min-h-0 w-8 shrink-0 text-[0.82rem]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mb-2.5 space-y-2">
          <div className="grid grid-cols-[2.3rem_minmax(0,1fr)_2.3rem] items-center gap-2 rounded-[20px] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] p-1.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_42%,transparent)]">
            <button
              type="button"
              onClick={() => shiftViewMonth(-1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
              aria-label={language === "ru" ? "Предыдущий месяц" : "Previous month"}
            >
              ←
            </button>
            <p className="app-card-title min-w-0 truncate text-center text-[0.92rem]">
              {formatMonthTitle(viewDate, language)}
            </p>
            <button
              type="button"
              onClick={() => shiftViewMonth(1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
              aria-label={language === "ru" ? "Следующий месяц" : "Next month"}
            >
              →
            </button>
          </div>
        </div>

        <div
          className="touch-pan-y select-none rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]"
          onTouchStart={handleCalendarTouchStart}
          onTouchEnd={handleCalendarTouchEnd}
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
              const isCurrentSelected = isSameDay(date, selected);
              const isRangeEdge = day.date === rangeStartDate || day.date === rangeEndDate;
              const isInsideRange =
                normalizedRange ? isDateInsideRange(date, normalizedRange) : false;
              const isToday = day.date === todayIso;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onSelectDate(day.date)}
                  className={[
                    "flex h-8 items-center justify-center rounded-[1rem] text-[0.82rem] font-bold transition",
                    isRangeEdge || isCurrentSelected
                      ? "bg-primary text-primary-foreground shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                      : isInsideRange
                        ? "bg-primary/12 text-foreground"
                        : day.inMonth
                          ? "soft-tab bg-surface"
                          : "soft-tab bg-surface text-muted opacity-45",
                    isToday && !isRangeEdge && !isCurrentSelected ? "ring-1 ring-primary/25" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_5.9rem] gap-1.5">
          <label className="relative block">
            <span className="sr-only">{language === "ru" ? "Месяц" : "Month"}</span>
            <select
              value={viewDate.getMonth()}
              onChange={(event) =>
                setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))
              }
              className="soft-input min-h-[2.45rem] w-full appearance-none pr-8 pl-3 text-[0.82rem]"
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
              className="soft-input min-h-[2.45rem] w-full appearance-none pr-7 pl-2.5 text-[0.82rem]"
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
      </div>
    </div>,
    document.body
  );
}

function getMonthLabels(language: "ru" | "en") {
  return language === "ru"
    ? ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
}

function getWeekdayLabels(language: "ru" | "en") {
  return language === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
}

function formatMonthTitle(date: Date, language: "ru" | "en") {
  return `${getMonthLabels(language)[date.getMonth()] ?? ""} ${date.getFullYear()}`;
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
      date: toIsoDate(date),
      inMonth: date.getMonth() === month,
    };
  });
}

function buildDateRange(startDate: string, endDate: string) {
  const first = parseLocalDate(startDate);
  const second = parseLocalDate(endDate);
  return first <= second ? { start: first, end: second } : { start: second, end: first };
}

function isDateInsideRange(date: Date, range: { start: Date; end: Date }) {
  return date >= range.start && date <= range.end;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
