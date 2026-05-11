export const illnessAssets = {
  onboarding: {
    careHint: require("./onboarding/care-hint.png"),
    startDate: require("./onboarding/start-date.png"),
    commonReasons: require("./onboarding/common-reasons.png"),
    reason: require("./onboarding/reason.png"),
    suggestions: {
      fever: require("./journal/quick-temperature.png"),
      cough: require("./journal/quick-note.png"),
      runnyNose: require("./onboarding/suggestions/runny-nose-boy.png"),
      soreThroat: require("./onboarding/suggestions/sore-throat-boy.png"),
      rash: require("./journal/quick-reminder.png"),
      nausea: require("./onboarding/suggestions/nausea-boy.png"),
    },
  },
  journal: {
    quickTemperature: require("./journal/quick-temperature.png"),
    quickMedicine: require("./journal/quick-medicine.png"),
    quickNote: require("./journal/quick-note.png"),
    quickReminder: require("./journal/quick-reminder.png"),
  },
} as const;
