import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";

export function RecordHistoryRow({
  at,
  language,
  dotClassName,
  title,
  description,
  action,
}: {
  at: string;
  language: "ru" | "en";
  dotClassName: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4.1rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:px-4">
      <span className="min-w-0 text-xs font-semibold tabular-nums text-muted">
        <span className="block leading-4 text-foreground">{formatChildTime(at, language)}</span>
        <span className="block truncate text-[0.68rem] leading-4">
          {formatChildDate(at, language, { month: "short" })}
        </span>
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`} />
          <p className="truncate text-sm font-semibold leading-5 text-foreground">{title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs leading-5 text-muted">{description}</p>
      </div>
      {action ?? <span className="shrink-0" aria-hidden="true" />}
    </div>
  );
}
