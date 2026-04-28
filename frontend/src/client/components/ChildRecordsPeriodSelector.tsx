import { useEffect, useState } from "react";
import { CalendarPickerDialog as SharedCalendarPickerDialog } from "@shared/components/CalendarPickerDialog";
import { OverlayDialog } from "@shared/components/OverlayDialog";
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
  const periodLabel = getChildRecordsPeriodLabel(period, customStartDate, customEndDate, language);

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
      <button
        type="button"
        onClick={() => setIsPeriodMenuOpen(true)}
        className="soft-input flex min-h-[2.95rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.92rem] tracking-[-0.02em] sm:min-h-[3.1rem]"
        aria-haspopup="dialog"
        aria-expanded={isPeriodMenuOpen}
      >
        <span className="min-w-0 truncate text-foreground">{periodLabel}</span>
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
        >
          ▾
        </span>
      </button>

      <PeriodOptionsDialog
        isOpen={isPeriodMenuOpen}
        language={language}
        activePeriod={period}
        onClose={() => setIsPeriodMenuOpen(false)}
        onSelect={handlePeriodChange}
      />

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

function PeriodOptionsDialog({
  isOpen,
  language,
  activePeriod,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  language: "ru" | "en";
  activePeriod: ChildRecordsPeriod;
  onClose: () => void;
  onSelect: (value: ChildRecordsPeriod) => void;
}) {
  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      zIndexClassName="z-[890]"
      backdropAriaLabel={language === "ru" ? "Закрыть выбор периода" : "Close period options"}
      containerClassName="flex items-end"
      backdropClassName="bg-[rgba(15,23,42,0.32)]"
    >
      <div
        data-ios-disable-back-swipe="true"
        className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            {language === "ru" ? "За период" : "For period"}
          </p>
          <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">
            {language === "ru" ? "Выберите период" : "Choose period"}
          </h2>
          <p className="text-sm leading-5 text-muted">
            {language === "ru"
              ? "Это влияет на ленту, календарь и графики."
              : "This updates feed, calendar and charts."}
          </p>
        </div>

        <div className="soft-choice-list mt-4">
          {periodOptions.map((option) => {
            const isActive = option === activePeriod;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={["soft-choice-row", isActive ? "soft-choice-row-active" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="min-w-0 text-left text-sm font-semibold tracking-[-0.02em] text-foreground">
                  {getChildRecordsPeriodOptionLabel(option, language)}
                </span>
                <span className="soft-choice-check">
                  {isActive ? "✓" : language === "ru" ? "Выбрать" : "Select"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </OverlayDialog>
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

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onCancel}
      zIndexClassName="z-[900]"
      backdropAriaLabel={language === "ru" ? "Закрыть выбор периода" : "Close period picker"}
    >
      <div className="soft-panel relative z-[1] max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[30px] border border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_94%,var(--color-background)_6%)] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
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

        <div className="mt-4 grid gap-3">
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
            className="soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.9rem] px-4 text-sm font-extrabold"
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
    </OverlayDialog>
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
      className="flex min-h-[3.5rem] items-center justify-between gap-3 rounded-[22px] border border-[color:color-mix(in_srgb,var(--color-border)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 text-left text-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)] transition hover:border-primary/30 active:scale-[0.995]"
    >
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.08em] opacity-70">
          {label}
        </span>
        <span className="mt-1 block text-[0.95rem] font-extrabold">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_48%,transparent)]"
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
  return (
    <SharedCalendarPickerDialog
      isOpen={isOpen}
      title={title}
      language={language}
      selectedDate={selectedDate}
      rangeStartDate={startDate}
      rangeEndDate={endDate}
      onSelectDate={onSelectDate}
      onCancel={onCancel}
    />
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
