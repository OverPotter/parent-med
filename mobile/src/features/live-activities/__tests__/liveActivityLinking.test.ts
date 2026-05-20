import {
  buildLiveActivityUrl,
  parseLiveActivityNavigation,
} from "../liveActivityLinking";

describe("liveActivityLinking", () => {
  it("builds and parses a sleep live activity URL", () => {
    const url = buildLiveActivityUrl("child-1", "sleep");

    expect(url).toBe("pillpath://children?liveChild=child-1&liveAction=sleep");
    expect(parseLiveActivityNavigation(url)).toEqual({
      childId: "child-1",
      action: "sleep",
    });
  });

  it("keeps encoded child ids round-trippable", () => {
    const url = buildLiveActivityUrl("child id/1", "illness");

    expect(parseLiveActivityNavigation(url)).toEqual({
      childId: "child id/1",
      action: "illness",
    });
  });

  it("rejects unrelated or malformed URLs", () => {
    expect(parseLiveActivityNavigation("pillpath://children?liveChild=child-1")).toBeNull();
    expect(
      parseLiveActivityNavigation(
        "pillpath://children?liveChild=child-1&liveAction=unknown",
      ),
    ).toBeNull();
    expect(parseLiveActivityNavigation("not-a-url")).toBeNull();
  });
});
