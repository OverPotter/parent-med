import { useI18n } from "@shared/hooks/useI18n";
import type {
  AdministrationEvent,
  HouseholdMedicine,
  IllnessComment,
  TemperatureEntry,
} from "@shared/types/api";
import { getAdministrationActorLabel } from "../../utils/medicationPlans";
import { formatChildDateTime } from "@client/utils/childDateFormat";
import { InfoPill, illnessListClass, illnessListRowClass } from "./shared";

export type EpisodeTimelineItem = {
  id: string;
  at: string;
  kind: "temperature" | "administration" | "comment";
  title: string;
  description: string;
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
          className={`${illnessListRowClass} grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_auto]`}
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <TimelineKindPill kind={item.kind} />
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
              {item.description}
            </p>
          </div>
          <InfoPill label={formatChildDateTime(item.at, language)} />
        </li>
      ))}
    </ul>
  );
}

function TimelineKindPill({ kind }: { kind: EpisodeTimelineItem["kind"] }) {
  const { language } = useI18n();
  const config: Record<EpisodeTimelineItem["kind"], { label: string; className: string }> = {
    temperature: {
      label: language === "ru" ? "Температура" : "Temperature",
      className: "soft-note-danger",
    },
    administration: {
      label: language === "ru" ? "Лекарство" : "Medicine",
      className: "soft-note-info",
    },
    comment: {
      label: language === "ru" ? "Комментарий" : "Comment",
      className: "soft-note-warning",
    },
  };

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${config[kind].className}`}>
      {config[kind].label}
    </span>
  );
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
  }));

  const administrationItems = administrations.map((entry) => {
    const medicine = entry.householdMedicineId
      ? medicines.find((item) => item.id === entry.householdMedicineId)
      : null;
    const reason = entry.reason?.trim();
    const actorLabel = getAdministrationActorLabel(entry, language);
    const doseLabel = entry.amount?.trim();
    const descriptionLines: string[] = [];

    if (doseLabel) {
      descriptionLines.push(`${language === "ru" ? "Доза" : "Dose"}: ${doseLabel}`);
    }

    if (actorLabel) {
      descriptionLines.push(actorLabel);
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
    };
  });

  const commentItems = comments.map((entry) => ({
    id: `comment-${entry.id}`,
    at: entry.createdAt,
    kind: "comment" as const,
    title: language === "ru" ? "Комментарий" : "Comment",
    description: entry.text,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems].sort((left, right) =>
    right.at.localeCompare(left.at)
  );
}
