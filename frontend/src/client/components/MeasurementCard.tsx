import { Surface } from "@shared/components/Surface";

type MeasurementHistoryItem = {
  id: string;
  value: string;
  date: string;
};

type MeasurementCardProps = {
  language: "ru" | "en";
  latestLabel: string;
  latestValue: string;
  latestDate: string | null;
  trendLabel: string;
  trendValue: string;
  inputValue: string;
  inputPlaceholder: string;
  actionLabel: string;
  isPending: boolean;
  isSubmitDisabled: boolean;
  history: MeasurementHistoryItem[];
  historyTitle: string;
  emptyText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

export function MeasurementCard({
  language,
  latestLabel,
  latestValue,
  latestDate,
  trendLabel,
  trendValue,
  inputValue,
  inputPlaceholder,
  actionLabel,
  isPending,
  isSubmitDisabled,
  history,
  historyTitle,
  emptyText,
  onInputChange,
  onSubmit,
}: MeasurementCardProps) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SummaryPill label={latestLabel} value={latestValue} />
          <SummaryPill label={trendLabel} value={trendValue} />
          <SummaryPill
            label={language === "ru" ? "Последнее измерение" : "Last measured"}
            value={latestDate ?? "—"}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            className="soft-input w-full px-4"
            placeholder={inputPlaceholder}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || isSubmitDisabled}
            className="soft-button-primary app-btn-primary-md inline-flex disabled:opacity-50"
          >
            {actionLabel}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{historyTitle}</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">{emptyText}</p>
          ) : (
            <div className="grid gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="soft-panel-muted flex items-center justify-between rounded-[18px] px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item.value}</span>
                  <span className="text-sm text-muted">{item.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="soft-panel-muted inline-flex min-h-[3.25rem] w-full flex-col items-start justify-center rounded-[1.1rem] border border-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-2.5">
      <span className="text-[11px] font-medium leading-4 tracking-[0.02em] text-muted">
        {label}
      </span>
      <span className="mt-0.5 text-[0.95rem] font-semibold leading-5 tracking-[-0.025em] text-foreground">
        {value}
      </span>
    </div>
  );
}
