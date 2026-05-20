import { finalizeSuccessfulPaywallPurchase } from "../useRevenueCatPaywallController";

describe("finalizeSuccessfulPaywallPurchase", () => {
  it("awaits the post-purchase refresh before completing", async () => {
    const callOrder: string[] = [];
    let resolveRefresh!: () => void;

    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });

    const resultPromise = finalizeSuccessfulPaywallPurchase({
      onPurchased: async () => {
        callOrder.push("refresh-start");
        await refreshPromise;
        callOrder.push("refresh-end");
      },
    });

    expect(callOrder).toEqual(["refresh-start"]);

    resolveRefresh();
    await resultPromise;

    expect(callOrder).toEqual(["refresh-start", "refresh-end"]);
  });

  it("still resolves when the post-purchase refresh fails", async () => {
    const onPurchased = jest.fn().mockRejectedValue(new Error("refresh failed"));

    await expect(
      finalizeSuccessfulPaywallPurchase({
        onPurchased,
      }),
    ).resolves.toBeUndefined();

    expect(onPurchased).toHaveBeenCalledTimes(1);
  });
});
