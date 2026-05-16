import { buildChildrenScreenContent } from "../../../children/model/childrenRedesign";
import { buildChildProfileScreenContent } from "../childProfileRedesign";

describe("childProfileRedesign", () => {
  it("maps journal actions by stable spec ids instead of russian labels", () => {
    const child = buildChildrenScreenContent("ru").cards[0];
    const content = buildChildProfileScreenContent(child, "de");

    expect(content.journalRows[0]?.[0]).toMatchObject({
      label: "Krankheiten",
      iconVariant: "illnessBadge",
    });
    expect(content.journalRows[0]?.[1]).toMatchObject({
      label: "Fütterung",
      targetKind: "feeding",
    });
    expect(content.journalRows[2]?.[1]).toMatchObject({
      label: "Übersicht",
      targetKind: "overview",
    });
  });
});
