import { isRevenueCatPackageMatchingPlan } from "../nativeRevenueCat";

describe("isRevenueCatPackageMatchingPlan", () => {
  it("recognizes RevenueCat annual aliases", () => {
    expect(
      isRevenueCatPackageMatchingPlan(
        {
          identifier: "$rc_annual",
          packageType: "$rc_annual",
          product: {
            identifier: "pillpath_plus_yearly",
            title: "PillPath Plus Yearly",
          },
        },
        "annual",
      ),
    ).toBe(true);
  });

  it("does not treat monthly package as annual", () => {
    expect(
      isRevenueCatPackageMatchingPlan(
        {
          identifier: "$rc_monthly",
          packageType: "$rc_monthly",
          product: {
            identifier: "pillpath_plus_monthly",
            title: "PillPath Plus Monthly",
          },
        },
        "annual",
      ),
    ).toBe(false);
  });
});
