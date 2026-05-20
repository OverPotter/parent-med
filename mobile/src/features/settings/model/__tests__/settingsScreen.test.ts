import { buildSettingsScreenContent } from "../settingsScreen";

describe("buildSettingsScreenContent", () => {
  it("returns polish copy for app and notification settings", () => {
    const content = buildSettingsScreenContent("pl");

    expect(content.title).toBe("Ustawienia");
    expect(content.languageTitle).toBe("Język aplikacji");
    expect(content.medicationPlansTitle).toBe("Plany leków");
    expect(content.medicationIntervalChoices).toEqual([
      { key: "hours", label: "Godziny" },
      { key: "minutes", label: "Minuty" },
    ]);
    expect(content.pushMasterTitle).toBe("Wszystkie powiadomienia");
    expect(content.subscriptionManageLabel).toBe("Zarządzaj subskrypcją");
    expect(content.confirmDeleteOwnerMessage).toBe(
      "To usunie całą rodzinę i Twoje konto. Tej operacji nie można cofnąć.",
    );
    expect(content.confirmDeleteMemberMessage).toBe(
      "To usunie tylko Twoje konto. Tej operacji nie można cofnąć.",
    );
  });

  it("returns german copy for app and notification settings", () => {
    const content = buildSettingsScreenContent("de");

    expect(content.title).toBe("Einstellungen");
    expect(content.languageTitle).toBe("App-Sprache");
    expect(content.medicationPlansTitle).toBe("Medikamentenpläne");
    expect(content.medicationIntervalChoices).toEqual([
      { key: "hours", label: "Stunden" },
      { key: "minutes", label: "Minuten" },
    ]);
    expect(content.pushMasterTitle).toBe("Alle Benachrichtigungen");
    expect(content.subscriptionManageLabel).toBe("Abo verwalten");
  });
});
