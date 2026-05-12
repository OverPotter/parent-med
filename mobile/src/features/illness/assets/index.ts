const onboardingSuggestionAssets = {
  boys: {
    feverChild: require("./onboarding/suggestions/fever.png"),
    coughChild: require("./onboarding/suggestions/cough.png"),
    runnyNoseChild: require("./onboarding/suggestions/runny-nose-boy.png"),
    soreThroatChild: require("./onboarding/suggestions/sore-throat-boy.png"),
    rashChild: require("./onboarding/suggestions/rash.png"),
    nauseaChild: require("./onboarding/suggestions/nausea-boy.png"),
  },
  girls: {
    feverChild: require("./onboarding/suggestions/fever.png"),
    coughChild: require("./onboarding/suggestions/cough.png"),
    runnyNoseChild: require("./onboarding/suggestions/runny-nose.png"),
    soreThroatChild: require("./onboarding/suggestions/sore-throat.png"),
    rashChild: require("./onboarding/suggestions/rash.png"),
    nauseaChild: require("./onboarding/suggestions/nausea-boy.png"),
  },
} as const;

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
