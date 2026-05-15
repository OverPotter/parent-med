import { StyleSheet } from "react-native";
import { pillboxPlanOnboardingChromeStyleParts } from "./pillboxPlanOnboardingChromeStyleParts";
import { pillboxPlanOnboardingEditorStyleParts } from "./pillboxPlanOnboardingEditorStyleParts";
import { pillboxPlanOnboardingListStyleParts } from "./pillboxPlanOnboardingListStyleParts";
import { pillboxPlanOnboardingSheetStyleParts } from "./pillboxPlanOnboardingSheetStyleParts";

export const pillboxPlanOnboardingStyles = StyleSheet.create({
  ...pillboxPlanOnboardingChromeStyleParts,
  ...pillboxPlanOnboardingListStyleParts,
  ...pillboxPlanOnboardingEditorStyleParts,
  ...pillboxPlanOnboardingSheetStyleParts,
});
