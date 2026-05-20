import { buildSubscriptionPaywallCopy } from "../subscriptionPaywallCopy";

describe("buildSubscriptionPaywallCopy", () => {
  it("returns localized paywall strings for all 4 supported locales", () => {
    const ru = buildSubscriptionPaywallCopy("ru");
    const en = buildSubscriptionPaywallCopy("en");
    const pl = buildSubscriptionPaywallCopy("pl");
    const de = buildSubscriptionPaywallCopy("de");

    expect(ru.freeBadge).toBe("Бесплатно");
    expect(en.freeBadge).toBe("Free");
    expect(pl.freeBadge).toBe("Darmowy");
    expect(de.freeBadge).toBe("Kostenlos");

    expect(ru.purchaseNotActivated).toContain("Plus");
    expect(en.purchaseNotActivated).toContain("Plus access");
    expect(pl.purchaseNotActivated).toContain("Plus");
    expect(de.purchaseNotActivated).toContain("Plus");

    expect(ru.continueFree).toBe("Остаться на бесплатном плане");
    expect(en.continueFree).toBe("Continue with Free");
    expect(pl.continueFree).toBe("Zostań przy planie darmowym");
    expect(de.continueFree).toBe("Beim kostenlosen Plan bleiben");
  });
});
