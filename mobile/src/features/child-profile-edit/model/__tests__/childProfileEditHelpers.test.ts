import {
  getEditProfileSheetCopy,
  getMonths,
} from "../childProfileEditHelpers";

describe("childProfileEditHelpers", () => {
  it("returns german sheet copy", () => {
    expect(getEditProfileSheetCopy("de")).toMatchObject({
      avatarTitle: "Icon ändern",
      dateTitle: "Geburtsdatum",
      apply: "Fertig",
    });
  });

  it("returns polish month names", () => {
    expect(getMonths("pl")[0]).toBe("stycznia");
    expect(getMonths("pl")[11]).toBe("grudnia");
  });
});
