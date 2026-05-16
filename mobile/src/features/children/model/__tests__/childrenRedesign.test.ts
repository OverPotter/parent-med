import type { MobileChildSummary } from "../../api/childrenApi";
import {
  buildChildrenScreenContent,
  buildChildrenCardsFromApi,
  buildChildrenStopActionCopy,
} from "../childrenRedesign";

function makeChild(overrides: Partial<MobileChildSummary> = {}): MobileChildSummary {
  return {
    id: "child-1",
    familyId: "family-1",
    name: "Mila",
    birthDate: "2024-05-01",
    ageLabel: "2 года",
    babyModeEnabled: true,
    avatarKey: null,
    gender: null,
    allergies: null,
    notes: null,
    ...overrides,
  };
}

describe("buildChildrenStopActionCopy", () => {
  it("returns polish feeding copy", () => {
    expect(buildChildrenStopActionCopy("pl", "feeding")).toEqual({
      title: "Zakończyć karmienie?",
      cancelLabel: "Nie",
      confirmLabel: "Tak",
    });
  });

  it("returns german sleep copy", () => {
    expect(buildChildrenStopActionCopy("de", "sleep")).toEqual({
      title: "Schlaf beenden?",
      cancelLabel: "Nein",
      confirmLabel: "Ja",
    });
  });
});

describe("buildChildrenCardsFromApi", () => {
  it("hides sleep and feeding quick actions when baby mode is off", () => {
    const [card] = buildChildrenCardsFromApi(
      [makeChild({ babyModeEnabled: false })],
      "ru",
    );

    expect(card.quickActions.map((action) => action.kind)).toEqual([
      "observation",
      "profile",
    ]);
  });

  it("keeps sleep and feeding quick actions when baby mode is on", () => {
    const [card] = buildChildrenCardsFromApi(
      [makeChild({ babyModeEnabled: true })],
      "ru",
    );

    expect(card.quickActions.map((action) => action.kind)).toEqual([
      "sleep",
      "feeding",
      "observation",
      "profile",
    ]);
  });

  it("keeps avatar empty when avatar key is missing", () => {
    const [card] = buildChildrenCardsFromApi(
      [makeChild({ gender: "boy", avatarKey: null })],
      "ru",
    );

    expect(card.avatarSource).toBeNull();
  });
});

describe("buildChildrenScreenContent", () => {
  it("keeps stable tab keys when labels are localized", () => {
    const germanTabs = buildChildrenScreenContent("de", "cabinet").tabs;
    const polishTabs = buildChildrenScreenContent("pl", "more").tabs;

    expect(germanTabs.map((tab) => [tab.key, tab.label, tab.active])).toEqual([
      ["children", "Kinder", false],
      ["pillbox", "Pillenbox", false],
      ["cabinet", "Hausapotheke", true],
      ["more", "Mehr", false],
    ]);
    expect(polishTabs.map((tab) => [tab.key, tab.label, tab.active])).toEqual([
      ["children", "Dzieci", false],
      ["pillbox", "Pudełko leków", false],
      ["cabinet", "Apteczka", false],
      ["more", "Więcej", true],
    ]);
  });
});
