import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MONTH_LABELS = [
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
];

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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

function formatDisplayDate(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
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
  placeholder = "Выберите дату",
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
    if (!isOpen || !rootRef.current) {
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
  }, [isOpen, viewDate]);

  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const monthLabel = `${MONTH_LABELS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const today = new Date();
  const yearOptions = useMemo(
    () => buildYearOptions(selectedDate, minDate, maxDate),
    [selectedDate, minDate, maxDate]
  );
  const panel =
    isOpen && panelPosition
      ? createPortal(
          <div
            ref={panelRef}
            className="soft-panel fixed z-[140] overflow-y-auto rounded-[24px] p-3.5"
            style={{
              top: panelPosition.top,
              left: panelPosition.left,
              width: panelPosition.width,
              maxHeight: panelPosition.maxHeight,
            }}
          >
            <div className="mb-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setViewDate(
                      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                  className="soft-button-secondary rounded-2xl px-2.5 py-1.5 text-sm"
                  aria-label="Предыдущий месяц"
                >
                  ←
                </button>
                <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() =>
                    setViewDate(
                      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                    )
                  }
                  className="soft-button-secondary rounded-2xl px-2.5 py-1.5 text-sm"
                  aria-label="Следующий месяц"
                >
                  →
                </button>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">Месяц</span>
                  <select
                    value={viewDate.getMonth()}
                    onChange={(event) =>
                      setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))
                    }
                    className="soft-input w-full rounded-2xl px-3 py-1.5 text-sm"
                  >
                    {MONTH_LABELS.map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">Год</span>
                  <select
                    value={viewDate.getFullYear()}
                    onChange={(event) =>
                      setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))
                    }
                    className="soft-input w-full rounded-2xl px-3 py-1.5 text-sm"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-0.5">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-7 gap-1">
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
                      "flex h-9 items-center justify-center rounded-2xl text-sm transition-colors",
                      isSelected
                        ? "soft-tab-active"
                        : inCurrentMonth
                          ? "soft-button-secondary"
                          : "soft-button-secondary text-muted opacity-65",
                      isToday && !isSelected ? "ring-1 ring-primary/30" : "",
                      disabledDate ? "cursor-not-allowed opacity-35" : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
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
                className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
              >
                Сегодня
              </button>
              {allowClear && value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "soft-input flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <span className="soft-pill rounded-full px-2.5 py-1 text-xs">Дата</span>
      </button>
      {panel}
    </div>
  );
}
