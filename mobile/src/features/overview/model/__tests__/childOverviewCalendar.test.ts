import { buildOverviewCalendarData, buildOverviewEvent } from "../childOverviewCalendar";
import { getOverviewCopy } from "../childOverviewCopy";
import { overviewIconTokens } from "../childOverviewHelpers";

describe("childOverviewCalendar", () => {
  const copy = getOverviewCopy("ru");

  it("renders the requested month and keeps only that month's day entries", () => {
    const events = [
      buildOverviewEvent(
        "2026-03-15T10:30:00.000Z",
        "ru",
        copy.eventTypes.feeding,
        "120 ml",
        overviewIconTokens.feeding,
      ),
      buildOverviewEvent(
        "2026-04-02T08:00:00.000Z",
        "ru",
        copy.eventTypes.sleep,
        "45 мин",
        overviewIconTokens.sleep,
      ),
    ];

    const calendar = buildOverviewCalendarData(
      "ru",
      copy,
      events,
      new Date(2026, 2, 1),
      new Date(2026, 3, 30, 23, 59, 59, 999),
      "2026-03",
    );

    expect(calendar.availableMonthKeys).toEqual(["2026-03"]);
    expect(calendar.entriesByDay["2026-03-15"]).toHaveLength(1);
    expect(calendar.entriesByDay["2026-04-02"]).toBeUndefined();
  });

  it("clamps future month requests to the latest allowed month", () => {
    const events = [
      buildOverviewEvent(
        "2026-04-02T08:00:00.000Z",
        "ru",
        copy.eventTypes.sleep,
        "45 мин",
        overviewIconTokens.sleep,
      ),
    ];

    const calendar = buildOverviewCalendarData(
      "ru",
      copy,
      events,
      new Date(2026, 2, 1),
      new Date(2026, 3, 30, 23, 59, 59, 999),
      "2026-09",
    );

    expect(calendar.availableMonthKeys).toEqual(["2026-04"]);
    expect(calendar.entriesByDay["2026-04-02"]).toHaveLength(1);
  });

  it("builds a full month grid with leading muted cells", () => {
    const calendar = buildOverviewCalendarData(
      "ru",
      copy,
      [],
      new Date(2026, 7, 1),
      new Date(2026, 7, 31, 23, 59, 59, 999),
      "2026-08",
    );

    expect(calendar.months[0].days.length % 7).toBe(0);
    expect(calendar.months[0].days.length).toBeGreaterThanOrEqual(35);
    expect(calendar.months[0].days[0].muted).toBe(true);
    expect(calendar.months[0].days.some((day) => day.id === "2026-08-01")).toBe(true);
  });
});
