import { Linking, Platform } from "react-native";
import { showNativeManageSubscriptions } from "../../../shared/billing/nativeRevenueCat";

const APPLE_NATIVE_SUBSCRIPTIONS_URL = "itms-apps://apps.apple.com/account/subscriptions";
const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

export async function openSystemSubscriptionManagement() {
  const openedByRevenueCat = await showNativeManageSubscriptions().catch(
    () => false,
  );
  if (openedByRevenueCat) {
    return;
  }

  if (Platform.OS === "ios") {
    try {
      await Linking.openURL(APPLE_NATIVE_SUBSCRIPTIONS_URL);
      return;
    } catch {
      await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
      return;
    }
  }

  await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
}
