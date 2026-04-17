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
    <div className="space-y-3">
      <Surface className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
            <SummaryPill label={latestLabel} value={latestValue} tone="bg-emerald-500" />
            <SummaryPill label={trendLabel} value={trendValue} tone="bg-lime-500" />
            <SummaryPill
              label={language === "ru" ? "Последнее измерение" : "Last measured"}
              value={latestDate ?? "—"}
              tone="bg-sky-500"
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
              className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.75rem] px-4 disabled:opacity-50"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </Surface>

      <div className="space-y-2">
        <p className="px-1 text-sm font-medium text-foreground">{historyTitle}</p>
        {history.length === 0 ? (
          <Surface className="p-5 sm:p-6">
            <p className="text-sm text-muted">{emptyText}</p>
          </Surface>
        ) : (
          <div className="overflow-hidden rounded-[22px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)]">
            {history.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:px-4"
              >
                <span className="truncate text-sm font-semibold text-foreground">{item.value}</span>
                <span className="shrink-0 text-xs font-semibold text-muted">{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex min-h-[2.05rem] min-w-0 items-center gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-[0.72rem] font-extrabold tracking-[-0.02em] text-foreground">
        {label}:{" "}
        <span className="text-[0.68rem] font-semibold tracking-[-0.015em] text-muted">{value}</span>
      </span>
    </div>
  );
}
