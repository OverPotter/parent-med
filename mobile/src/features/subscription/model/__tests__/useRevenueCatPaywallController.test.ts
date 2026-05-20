import { finalizeSuccessfulPaywallPurchase } from "../useRevenueCatPaywallController";

describe("finalizeSuccessfulPaywallPurchase", () => {
  it("closes paywall before awaiting the post-purchase refresh", async () => {
    const callOrder: string[] = [];
    let resolveRefresh!: () => void;

    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });

    const resultPromise = finalizeSuccessfulPaywallPurchase({
      onClose: () => {
        callOrder.push("close");
      },
      onPurchased: async () => {
        callOrder.push("refresh-start");
        await refreshPromise;
        callOrder.push("refresh-end");
      },
    });

    expect(callOrder).toEqual(["close", "refresh-start"]);

    resolveRefresh();
    await resultPromise;

    expect(callOrder).toEqual(["close", "refresh-start", "refresh-end"]);
  });

  it("still closes paywall when the post-purchase refresh fails", async () => {
    const onClose = jest.fn();
    const onPurchased = jest.fn().mockRejectedValue(new Error("refresh failed"));

    await expect(
      finalizeSuccessfulPaywallPurchase({
        onClose,
        onPurchased,
      }),
    ).resolves.toBeUndefined();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPurchased).toHaveBeenCalledTimes(1);
  });
});
