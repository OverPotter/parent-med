/// <reference types="@capacitor/keyboard" />

import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.overpotter.pillpath",
  appName: "PillPath",
  webDir: "www",
  ios: {
    initialFocus: false,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
