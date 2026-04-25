import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import { illnessListClass } from "./shared";
import {
  buildEpisodeTimeline,
  episodeTimelineKindStyles,
  formatEntrySummary,
  type EpisodeTimelineItem,
} from "./timelineHelpers";

export { buildEpisodeTimeline, formatEntrySummary };
export { episodeTimelineKindStyles } from "./timelineHelpers";
export type { EpisodeTimelineItem };

export function EpisodeTimelineList({
  items,
  language,
}: {
  items: EpisodeTimelineItem[];
  language: "ru" | "en";
}) {
  return (
    <ul className={illnessListClass}>
      {items.map((item) => (
        <li
          key={item.id}
          className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-start gap-3 border-b border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] px-3 py-3 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-4"
        >
          <span className="min-w-0 pt-0.5 text-xs font-semibold tabular-nums text-muted">
            <span className="block leading-4 text-foreground">{formatChildTime(item.at, language)}</span>
            <span className="block truncate text-[0.68rem] leading-4">
              {formatChildDate(item.at, language, { month: "short" })}
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${episodeTimelineKindStyles[item.kind]}`}
                aria-hidden="true"
              />
              <p className="truncate text-sm font-semibold leading-5 text-foreground">
                {item.title}
              </p>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {getTimelineKindLabel(item.kind, language)}
              {item.actorName ? ` · ${item.actorName}` : ""}
              {item.description.trim() ? ` · ${item.description.replace(/\n+/g, " · ")}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function getTimelineKindLabel(kind: EpisodeTimelineItem["kind"], language: "ru" | "en") {
  const labels: Record<EpisodeTimelineItem["kind"], string> = {
    temperature: language === "ru" ? "Замер" : "Reading",
    administration: language === "ru" ? "Приём" : "Dose",
    comment: language === "ru" ? "Заметка" : "Note",
  };

  return labels[kind];
}
