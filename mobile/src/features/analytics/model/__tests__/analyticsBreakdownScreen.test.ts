import type { ChildCard } from "../../../children/model/childrenRedesign";
import type { MobileIllnessEpisodeInsights } from "../../../illness/api/illnessAnalyticsApi";
import type { AnalyticsEpisodeCard } from "../analyticsScreen";
import { buildAnalyticsBreakdownContent } from "../analyticsBreakdownScreen";

function makeChildCard(): ChildCard {
  return {
    nodeId: "child-card-1",
    name: "Мила",
    stats: "2.4",
    child: {
      id: "child-1",
      name: "Мила",
      ageLabel: "2 года",
      weightValue: "12 кг",
      heightValue: "86 см",
      birthDate: "2024-05-01",
      babyModeEnabled: true,
      avatarKey: "girl",
      gender: "girl",
      allergies: null,
      notes: null,
    },
    avatarSource: 1,
    quickActions: [],
    isLocked: false,
  };
}

function makeEpisodeCard(overrides: Partial<AnalyticsEpisodeCard> = {}): AnalyticsEpisodeCard {
  return {
    id: "episode-1",
    monthLabel: "Май",
    dayLabel: "3",
    meta: "Эпизод 4 • май",
    title: "ОРВИ",
    closedAt: "Закрыт 21:04",
    description: "Температура",
    startedAt: "2026-05-03T08:00:00.000Z",
    closedAtIso: "2026-05-04T09:30:00.000Z",
    ...overrides,
  };
}

function makeInsights(
  overrides: Partial<MobileIllnessEpisodeInsights> = {},
): MobileIllnessEpisodeInsights {
  return {
    episodeId: "episode-1",
    durationDays: 3,
    peakTemperatureCelsius: 39.1,
    peakTemperatureAt: "2026-05-03T19:00:00.000Z",
    lastTemperatureCelsius: 37.2,
    lastEventAt: "2026-05-04T20:00:00.000Z",
    temperatureCount: 4,
    administrationCount: 2,
    commentCount: 1,
    medicationMode: "guided",
    medicineNames: ["Ibuprofen"],
    totalEvents: 7,
    firstTemperatureAt: "2026-05-03T09:00:00.000Z",
    lastAdministrationAt: "2026-05-04T18:00:00.000Z",
    temperaturePoints: [],
    ...overrides,
  };
}

describe("buildAnalyticsBreakdownContent", () => {
  it("builds detailed russian breakdown with mapped tips", () => {
    const content = buildAnalyticsBreakdownContent(makeEpisodeCard(), "ru", {
      child: makeChildCard(),
      insights: makeInsights(),
    });

    expect(content.childName).toBe("Мила");
    expect(content.episodeChipLabel).toBe("Эпизод 4");
    expect(content.summaryLines).toEqual(["Пик температуры: 39.1°C."]);
    expect(content.summaryTips.map((tip) => tip.text)).toEqual([
      "3 дн.",
      "2 приёма",
      "4",
      "1 напоминание",
    ]);
    expect(content.temperatureEmptyState).toBe(
      "Замеров: 4. Последний: 37.2°C.",
    );
  });

  it("returns empty-state text and zero tips when insights are missing", () => {
    const content = buildAnalyticsBreakdownContent(
      makeEpisodeCard({
        meta: "Episode 2 • May",
        startedAt: null,
        closedAtIso: null,
      }),
      "en",
      {
        child: makeChildCard(),
        insights: null,
      },
    );

    expect(content.childDate).toBe("—");
    expect(content.episodeChipLabel).toBe("Episode 2");
    expect(content.summaryLines).toEqual([]);
    expect(content.summaryTips.map((tip) => tip.text)).toEqual([
      "—",
      "0 doses",
      "0",
      "0 reminders",
    ]);
    expect(content.temperatureEmptyState).toBe(
      "There were no temperature\nreadings for this episode.",
    );
  });

  it("uses localized plural forms for doses and reminders", () => {
    const content = buildAnalyticsBreakdownContent(
      makeEpisodeCard({
        meta: "Episode 2 • May",
        startedAt: null,
        closedAtIso: null,
      }),
      "pl",
      {
        child: makeChildCard(),
        insights: makeInsights({
          administrationCount: 2,
          medicationMode: "observation_only",
        }),
      },
    );

    expect(content.summaryTips.map((tip) => tip.text)).toEqual([
      "3 dni",
      "2 dawki",
      "4",
      "0 przypomnień",
    ]);
  });
});
