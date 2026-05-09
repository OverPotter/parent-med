import { Linking, Platform } from "react-native";

const APPLE_NATIVE_SUBSCRIPTIONS_URL = "itms-apps://apps.apple.com/account/subscriptions";
const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

export async function openSystemSubscriptionManagement() {
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
