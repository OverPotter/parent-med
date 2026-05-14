import { getReminderCardStatusText, getReminderLeadStatusText } from "../illnessReminderCardStatus";

const copy = {
  dailyLimitReached: "Лимит на сегодня",
  giveAtLabel: "Дать в",
  nextDosePrefix: "Следующий приём в",
  giveNowLabel: "Дать сейчас",
};

describe("illnessReminderCardStatus", () => {
  it("returns give-now label for due reminders", () => {
    const now = new Date("2026-05-14T10:00:00.000Z");
    const status = getReminderCardStatusText(
      {
        todayCount: 0,
        lastAdministration: null,
        nextAllowedAt: null,
        blockedByInterval: false,
        blockedByDailyLimit: false,
        isBlocked: false,
      },
      copy,
      "ru",
      now,
    );

    expect(status.collapsedLabel).toBe("Дать сейчас");
    expect(getReminderLeadStatusText(
      {
        todayCount: 0,
        lastAdministration: null,
        nextAllowedAt: null,
        blockedByInterval: false,
        blockedByDailyLimit: false,
        isBlocked: false,
      },
      copy,
      "ru",
      now,
    )).toBe("Дать сейчас");
  });

  it("returns a timed status when the next dose is still blocked by interval", () => {
    const now = new Date("2026-05-14T10:00:00.000Z");
    const nextAllowedAt = new Date("2026-05-14T12:30:00.000Z");

    const status = getReminderCardStatusText(
      {
        todayCount: 1,
        lastAdministration: null,
        nextAllowedAt,
        blockedByInterval: true,
        blockedByDailyLimit: false,
        isBlocked: true,
      },
      copy,
      "ru",
      now,
    );

    expect(status.collapsedLabel).toBe("Следующий приём в 15:30");
    expect(status.disabledActionLabel).toBe("Дать в 15:30");
  });

  it("returns daily-limit copy when plan is blocked by daily limit", () => {
    const now = new Date("2026-05-14T10:00:00.000Z");

    const status = getReminderCardStatusText(
      {
        todayCount: 4,
        lastAdministration: null,
        nextAllowedAt: new Date("2026-05-14T11:00:00.000Z"),
        blockedByInterval: true,
        blockedByDailyLimit: true,
        isBlocked: true,
      },
      copy,
      "ru",
      now,
    );

    expect(status.collapsedLabel).toBe("Лимит на сегодня");
    expect(status.disabledActionLabel).toBe("Лимит на сегодня");
  });
});
