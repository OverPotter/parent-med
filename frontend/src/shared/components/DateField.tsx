import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DateFieldLanguage = "ru" | "en";

const DATE_FIELD_COPY: Record<
  DateFieldLanguage,
  {
    months: string[];
    weekdays: string[];
    placeholder: string;
    prevMonth: string;
    nextMonth: string;
    month: string;
    year: string;
    today: string;
    clear: string;
    dateBadge: string;
  }
> = {
  ru: {
    months: [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ],
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    placeholder: "Выберите дату",
    prevMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
    month: "Месяц",
    year: "Год",
    today: "Сегодня",
    clear: "Очистить",
    dateBadge: "Дата",
  },
  en: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    placeholder: "Choose date",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    month: "Month",
    year: "Year",
    today: "Today",
    clear: "Clear",
    dateBadge: "Date",
  },
};

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string | null | undefined, language: DateFieldLanguage): string {
  const date = parseIsoDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isDateDisabled(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (minDate && current < minDate) {
    return true;
  }

  if (maxDate && current > maxDate) {
    return true;
  }

  return false;
}

function buildMonthDays(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function buildYearOptions(
  selectedDate: Date | null,
  minDate: Date | null,
  maxDate: Date | null
): number[] {
  const currentYear = new Date().getFullYear();
  const selectedYear = selectedDate?.getFullYear() ?? currentYear;
  const minYear = minDate?.getFullYear() ?? Math.min(selectedYear - 12, currentYear - 100);
  const maxYear = maxDate?.getFullYear() ?? Math.max(selectedYear + 5, currentYear + 5);

  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: DateFieldLanguage;
  disabled?: boolean;
  min?: string;
  max?: string;
  allowClear?: boolean;
  className?: string;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function DateField({
  value,
  onChange,
  placeholder,
  language = "ru",
  disabled = false,
  min,
  max,
  allowClear = true,
  className = "",
}: DateFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const minDate = useMemo(() => parseIsoDate(min), [min]);
  const maxDate = useMemo(() => parseIsoDate(max), [max]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const copy = DATE_FIELD_COPY[language];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const updateMode = () => setIsMobileViewport(mediaQuery.matches);

    updateMode();
    mediaQuery.addEventListener("change", updateMode);
    return () => mediaQuery.removeEventListener("change", updateMode);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobileViewport || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isMobileViewport]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideField = rootRef.current?.contains(target);
      const clickedInsidePanel = panelRef.current?.contains(target);

      if (!clickedInsideField && !clickedInsidePanel) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !rootRef.current || isMobileViewport) {
      return;
    }

    const updatePosition = () => {
      if (!rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const safeMargin = 12;
      const verticalGap = 8;
      const width = Math.min(312, viewportWidth - 24);
      const left = Math.min(Math.max(safeMargin, rect.left), viewportWidth - width - safeMargin);
      const panelHeight = panelRef.current?.offsetHeight ?? 364;
      const availableBelow = viewportHeight - rect.bottom - verticalGap - safeMargin;
      const availableAbove = rect.top - verticalGap - safeMargin;

      let top = rect.bottom + verticalGap;
      let maxHeight = Math.max(220, viewportHeight - safeMargin * 2);

      if (panelHeight <= availableBelow || availableBelow >= availableAbove) {
        maxHeight = Math.max(220, availableBelow);
      } else if (panelHeight <= availableAbove) {
        top = rect.top - panelHeight - verticalGap;
        maxHeight = Math.max(220, availableAbove);
      } else if (availableBelow >= availableAbove) {
        maxHeight = Math.max(220, availableBelow);
      } else {
        maxHeight = Math.max(220, availableAbove);
        top = Math.max(safeMargin, rect.top - maxHeight - verticalGap);
      }

      if (top + maxHeight > viewportHeight - safeMargin) {
        top = Math.max(safeMargin, viewportHeight - safeMargin - maxHeight);
      }

      setPanelPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, viewDate, isMobileViewport]);

  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const monthLabel = `${copy.months[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const today = new Date();
  const yearOptions = useMemo(
    () => buildYearOptions(selectedDate, minDate, maxDate),
    [selectedDate, minDate, maxDate]
  );
  const panel =
    isOpen && (isMobileViewport || panelPosition)
      ? createPortal(
          <div className="fixed inset-0 z-[140]">
            {isMobileViewport ? (
              <button
                type="button"
                aria-label="Close date picker"
                className="absolute inset-0 bg-black/35"
                onClick={() => setIsOpen(false)}
              />
            ) : null}
            <div
              ref={panelRef}
              className={[
                "soft-panel p-4",
                isMobileViewport
                  ? "absolute left-1/2 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] w-[min(calc(100%-1.5rem),22.25rem)] max-h-[78dvh] -translate-x-1/2 overflow-y-auto rounded-[22px] p-2.5"
                  : "fixed overflow-y-auto rounded-[28px]",
              ].join(" ")}
              style={
                isMobileViewport
                  ? undefined
                  : {
                      top: panelPosition!.top,
                      left: panelPosition!.left,
                      width: panelPosition!.width,
                      maxHeight: panelPosition!.maxHeight,
                    }
              }
            >
              {isMobileViewport ? (
                <div className="mb-2.5 space-y-1.5">
                  <span className="mx-auto block h-1 w-10 rounded-full bg-[color:color-mix(in_srgb,var(--color-border)_74%,transparent)]" />
                  <div className="flex items-center justify-between gap-3">
                    <p className="app-card-title text-[0.92rem]">{copy.dateBadge}</p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="soft-button-secondary min-h-0 px-2.5 py-1 text-[0.82rem]"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="mb-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setViewDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                      )
                    }
                    className="soft-button-secondary min-h-0 px-3 py-1.5 text-sm"
                    aria-label={copy.prevMonth}
                  >
                    ←
                  </button>
                  <p className={`${isMobileViewport ? "app-card-title text-[0.92rem]" : "app-card-title text-sm"}`}>
                    {monthLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setViewDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                      )
                    }
                    className="soft-button-secondary min-h-0 px-3 py-1.5 text-sm"
                    aria-label={copy.nextMonth}
                  >
                    →
                  </button>
                </div>

                {!isMobileViewport ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                    <label className="block">
                      <span className="soft-field-label mb-1 text-[0.8rem]">{copy.month}</span>
                      <select
                        value={viewDate.getMonth()}
                        onChange={(event) =>
                          setViewDate(
                            new Date(viewDate.getFullYear(), Number(event.target.value), 1)
                          )
                        }
                        className="soft-input min-h-[2.8rem] w-full px-3 text-sm"
                      >
                        {copy.months.map((label, index) => (
                          <option key={label} value={index}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="soft-field-label mb-1 text-[0.8rem]">{copy.year}</span>
                      <select
                        value={viewDate.getFullYear()}
                        onChange={(event) =>
                          setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))
                        }
                        className="soft-input min-h-[2.8rem] w-full px-3 text-sm"
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              <div
                className={`grid grid-cols-7 text-center text-muted ${isMobileViewport ? "gap-0.5 text-[10px]" : "gap-1 text-[11px]"}`}
              >
                {copy.weekdays.map((label) => (
                  <div key={label} className="py-0.5">
                    {label}
                  </div>
                ))}
              </div>

              <div className={`mt-2 grid grid-cols-7 ${isMobileViewport ? "gap-0.5" : "gap-1"}`}>
                {monthDays.map((date) => {
                  const isoValue = toIsoDate(date);
                  const inCurrentMonth = date.getMonth() === viewDate.getMonth();
                  const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                  const isToday = isSameDay(date, today);
                  const disabledDate = isDateDisabled(date, minDate, maxDate);

                  return (
                    <button
                      key={isoValue}
                      type="button"
                      disabled={disabledDate}
                      onClick={() => {
                        onChange(isoValue);
                        setIsOpen(false);
                      }}
                      className={[
                        isMobileViewport
                          ? "flex h-8 items-center justify-center rounded-[1rem] text-[0.82rem] transition-colors"
                          : "flex h-9 items-center justify-center rounded-2xl text-sm transition-colors",
                        isSelected
                          ? "soft-tab-active"
                          : inCurrentMonth
                            ? "soft-tab"
                            : "soft-tab text-muted opacity-60",
                        isToday && !isSelected ? "ring-1 ring-primary/20" : "",
                        disabledDate ? "cursor-not-allowed opacity-35" : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {isMobileViewport ? (
                <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_5.9rem] gap-1.5">
                  <label className="relative block">
                    <span className="sr-only">{copy.month}</span>
                    <select
                      value={viewDate.getMonth()}
                      onChange={(event) =>
                        setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))
                      }
                      className="soft-input min-h-[2.45rem] w-full appearance-none pr-8 pl-3 text-[0.82rem]"
                    >
                      {copy.months.map((label, index) => (
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
                    <span className="sr-only">{copy.year}</span>
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
              ) : null}

              <div className={`mt-2.5 flex flex-wrap gap-1.5 ${isMobileViewport ? "pb-0.5" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = toIsoDate(today);
                    if (!isDateDisabled(today, minDate, maxDate)) {
                      onChange(nextValue);
                      setViewDate(today);
                      setIsOpen(false);
                    }
                  }}
                  className={`${isMobileViewport ? "soft-button-secondary min-h-0 px-3 py-1.5 text-[0.82rem]" : "soft-button-secondary min-h-0 px-3.5 py-2 text-sm"}`}
                >
                  {copy.today}
                </button>
                {allowClear && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className={`${isMobileViewport ? "soft-button-secondary min-h-0 px-3 py-1.5 text-[0.82rem]" : "soft-button-secondary min-h-0 px-3.5 py-2 text-sm"}`}
                  >
                    {copy.clear}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={["w-full", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "soft-input flex min-h-[2.95rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.92rem] tracking-[-0.02em] sm:min-h-[3.1rem]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {value ? formatDisplayDate(value, language) : (placeholder ?? copy.placeholder)}
        </span>
        <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">{copy.dateBadge}</span>
      </button>
      {panel}
    </div>
  );
}
