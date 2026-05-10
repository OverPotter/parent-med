import { buildChildrenStopActionCopy } from "../childrenRedesign";

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
