import type {
  AdministrationEvent,
  HouseholdMedicine,
  IllnessComment,
  TemperatureEntry,
} from "@shared/types/api";
import { formatChildDate, formatChildTime } from "@client/utils/childDateFormat";
import { illnessListClass } from "./shared";

export type EpisodeTimelineItem = {
  id: string;
  at: string;
  kind: "temperature" | "administration" | "comment";
  title: string;
  description: string;
  actorName: string | null;
  actorAccountId: string | null;
};

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
                className={`h-2 w-2 shrink-0 rounded-full ${getTimelineDotClass(item.kind)}`}
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

function getTimelineDotClass(kind: EpisodeTimelineItem["kind"]) {
  const classes: Record<EpisodeTimelineItem["kind"], string> = {
    temperature: "bg-rose-500",
    administration: "bg-amber-500",
    comment: "bg-sky-500",
  };

  return classes[kind];
}

export function formatEntrySummary(
  temperatureCount: number,
  administrationCount: number,
  commentCount: number,
  language: "ru" | "en"
) {
  return language === "ru"
    ? [`${temperatureCount} темп.`, `${administrationCount} приёма`, `${commentCount} комм.`].join(
        " • "
      )
    : [`${temperatureCount} temps`, `${administrationCount} doses`, `${commentCount} notes`].join(
        " • "
      );
}

export function buildEpisodeTimeline(
  temperatures: TemperatureEntry[],
  administrations: AdministrationEvent[],
  comments: IllnessComment[],
  medicines: HouseholdMedicine[],
  language: "ru" | "en" = "ru"
): EpisodeTimelineItem[] {
  const temperatureItems = temperatures.map((entry) => ({
    id: `temp-${entry.id}`,
    at: entry.measuredAt,
    kind: "temperature" as const,
    title: `${entry.valueCelsius} °C`,
    description:
      entry.comment?.trim() || (language === "ru" ? "Замер температуры" : "Temperature reading"),
    actorName: entry.createdByNameSnapshot?.trim() || null,
    actorAccountId: entry.createdByAccountId,
  }));

  const administrationItems = administrations.map((entry) => {
    const medicine = entry.householdMedicineId
      ? medicines.find((item) => item.id === entry.householdMedicineId)
      : null;
    const reason = entry.reason?.trim();
    const doseLabel = entry.amount?.trim();
    const descriptionLines: string[] = [];

    if (doseLabel) {
      descriptionLines.push(`${language === "ru" ? "Доза" : "Dose"}: ${doseLabel}`);
    }

    if (reason) {
      descriptionLines.push(reason);
    }

    return {
      id: `admin-${entry.id}`,
      at: entry.administeredAt,
      kind: "administration" as const,
      title:
        entry.customMedicineName ??
        medicine?.medicineName ??
        (language === "ru" ? "Приём лекарства" : "Dose logged"),
      description: descriptionLines.join("\n"),
      actorName: entry.administeredByNameSnapshot?.trim() || null,
      actorAccountId: entry.administeredByAccountId,
    };
  });

  const commentItems = comments.map((entry) => ({
    id: `comment-${entry.id}`,
    at: entry.createdAt,
    kind: "comment" as const,
    title: language === "ru" ? "Комментарий" : "Comment",
    description: entry.text,
    actorName: entry.createdByNameSnapshot?.trim() || null,
    actorAccountId: entry.createdByAccountId,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems].sort((left, right) =>
    right.at.localeCompare(left.at)
  );
}
