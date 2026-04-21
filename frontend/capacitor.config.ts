/// <reference types="@capacitor/keyboard" />

import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig & { packageClassList: string[] } = {
  appId: "com.overpotter.pillpath",
  appName: "PillPath",
  webDir: "www",
  ios: {
    initialFocus: false,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  packageClassList: [
    "KeyboardPlugin",
    "LiveActivitiesPlugin",
    "PushNotificationsPlugin",
    "SecureStoragePlugin",
  ],
};

export default config;
