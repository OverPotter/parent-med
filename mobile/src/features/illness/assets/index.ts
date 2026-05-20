const onboardingSuggestionAssets = {
  boys: {
    feverChild: require("./onboarding/suggestions/boys/thumbs/fever_ui.png"),
    coughChild: require("./onboarding/suggestions/boys/thumbs/cough_ui.png"),
    runnyNoseChild: require("./onboarding/suggestions/boys/thumbs/runny_nose_ui.png"),
    soreThroatChild: require("./onboarding/suggestions/boys/thumbs/sore_throat_ui.png"),
    rashChild: require("./onboarding/suggestions/boys/thumbs/rash_ui.png"),
    nauseaChild: require("./onboarding/suggestions/boys/thumbs/nausea_ui.png"),
  },
  girls: {
    feverChild: require("./onboarding/suggestions/girls/thumbs/fever_ui.png"),
    coughChild: require("./onboarding/suggestions/girls/thumbs/cough_ui.png"),
    runnyNoseChild: require("./onboarding/suggestions/girls/thumbs/runny_nose_ui.png"),
    soreThroatChild: require("./onboarding/suggestions/girls/thumbs/sore_throat_ui.png"),
    rashChild: require("./onboarding/suggestions/girls/thumbs/rash_ui.png"),
    nauseaChild: require("./onboarding/suggestions/girls/thumbs/nausea_ui.png"),
  },
} as const;

export { reminderFieldIcons } from "./reminderFieldIcons";

export const illnessAssets = {
  onboarding: {
    careHint: require("./onboarding/care-hint.png"),
    startDate: require("./onboarding/start-date.png"),
    commonReasons: require("./onboarding/common-reasons.png"),
    reason: require("./onboarding/reason.png"),
    suggestions: onboardingSuggestionAssets,
  },
  journal: {
    quickTemperature: require("./journal/quick-temperature.png"),
    quickMedicine: require("./journal/quick-medicine.png"),
    quickNote: require("./journal/quick-note.png"),
    quickReminder: require("./journal/quick-reminder.png"),
  },
} as const;

export const illnessOnboardingSuggestionAssetGroups =
  onboardingSuggestionAssets;

export const illnessOnboardingSuggestionAssetLists = {
  boys: Object.values(onboardingSuggestionAssets.boys),
  girls: Object.values(onboardingSuggestionAssets.girls),
} as const;
