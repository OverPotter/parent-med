import { Platform } from "react-native";

const roundedIosFamily = "Avenir Next Rounded";

export const journalTypography = {
  display: Platform.select({
    ios: roundedIosFamily,
    default: undefined,
  }),
  body: Platform.select({
    ios: roundedIosFamily,
    default: undefined,
  }),
} as const;
