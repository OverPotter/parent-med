export type EpisodeTimelineItem = {
  id: string;
  at: string;
  kind: "temperature" | "administration" | "comment";
  title: string;
  description: string;
  actorName: string | null;
  actorAccountId: string | null;
};

export const episodeTimelineKindStyles: Record<EpisodeTimelineItem["kind"], string> = {
  temperature: "bg-rose-500",
  administration: "bg-sky-500",
  comment: "bg-amber-500",
};

type TemperatureEntryLite = {
  id: string;
  episodeId?: string;
  valueCelsius: number;
  measuredAt: string;
  method?: string | null;
  comment: string | null;
  createdByNameSnapshot: string | null;
  createdByAccountId: string | null;
};

type AdministrationEventLite = {
  id: string;
  episodeId?: string;
  householdMedicineId: string | null;
  customMedicineName: string | null;
  amount: string | null;
  unit?: string | null;
  administeredAt: string;
  administeredByNameSnapshot: string | null;
  administeredByAccountId: string | null;
  reason: string | null;
};

type IllnessCommentLite = {
  id: string;
  createdAt: string;
  text: string;
  createdByNameSnapshot: string | null;
  createdByAccountId: string | null;
};

type HouseholdMedicineLite = {
  id: string;
  medicineName: string;
};

type FamilyMemberActorLite = {
  id: string;
  relationshipLabel?: string | null;
};

function isGenericActorFallbackName(value: string | null) {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "участник семьи" ||
    normalized === "family member" ||
    normalized === "без имени" ||
    normalized === "no name"
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
  temperatures: TemperatureEntryLite[],
  administrations: AdministrationEventLite[],
  comments: IllnessCommentLite[],
  medicines: HouseholdMedicineLite[],
  language: "ru" | "en" = "ru",
  currentActor?: {
    accountId: string | null;
  },
  familyMembers: FamilyMemberActorLite[] = []
): EpisodeTimelineItem[] {
  const relationshipByAccountId = new Map(
    familyMembers.map((member) => [member.id, member.relationshipLabel?.trim() || null])
  );

  const resolveActorName = (actorName: string | null | undefined, actorAccountId: string | null) => {
    const explicitName = actorName?.trim() || null;
    const relationshipLabel = actorAccountId ? relationshipByAccountId.get(actorAccountId) : null;

    if (relationshipLabel) {
      return relationshipLabel;
    }
    if (
      currentActor?.accountId &&
      actorAccountId &&
      actorAccountId === currentActor.accountId &&
      (!explicitName || isGenericActorFallbackName(explicitName))
    ) {
      return language === "ru" ? "Вы" : "You";
    }
    if (actorAccountId && (!explicitName || isGenericActorFallbackName(explicitName))) {
      return language === "ru" ? "Участник семьи" : "Family member";
    }
    if (explicitName) {
      return explicitName;
    }
    return null;
  };

  const temperatureItems = temperatures.map((entry) => ({
    id: `temp-${entry.id}`,
    at: entry.measuredAt,
    kind: "temperature" as const,
    title: `${formatTemperatureValue(entry.valueCelsius)} °C`,
    description:
      entry.comment?.trim() || (language === "ru" ? "Замер температуры" : "Temperature reading"),
    actorName: resolveActorName(entry.createdByNameSnapshot, entry.createdByAccountId),
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
      actorName: resolveActorName(entry.administeredByNameSnapshot, entry.administeredByAccountId),
      actorAccountId: entry.administeredByAccountId,
    };
  });

  const commentItems = comments.map((entry) => ({
    id: `comment-${entry.id}`,
    at: entry.createdAt,
    kind: "comment" as const,
    title: language === "ru" ? "Комментарий" : "Comment",
    description: entry.text,
    actorName: resolveActorName(entry.createdByNameSnapshot, entry.createdByAccountId),
    actorAccountId: entry.createdByAccountId,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems].sort((left, right) =>
    right.at.localeCompare(left.at)
  );
}

function formatTemperatureValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
