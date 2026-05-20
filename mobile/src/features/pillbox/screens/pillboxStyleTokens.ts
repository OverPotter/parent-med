export const pillboxStyleTokens = {
  colors: {
    canvas: "#FBF3EC",
    overlay: "rgba(255,248,243,0.56)",
    overlayHome: "rgba(255,248,241,0.54)",
    textPrimary: "#172033",
    border: "#F0D8CC",
    borderInput: "#E5D9D1",
    surfaceStrong: "rgba(255,255,255,0.9)",
    surfacePrimary: "rgba(255,255,255,0.88)",
    surfaceSoft: "rgba(255,255,255,0.86)",
    surfaceSubtle: "rgba(255,255,255,0.82)",
    cta: "#CF4750",
    ctaAlt: "#F56565",
  },
  border: {
    default: {
      borderWidth: 1,
      borderColor: "#F0D8CC",
    },
  },
  shadow: {
    cardSoft: {
      shadowColor: "#172033",
      shadowOpacity: 0.05,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
    cardMedium: {
      shadowColor: "#172033",
      shadowOpacity: 0.06,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 10 },
    },
    cardLarge: {
      shadowColor: "#172033",
      shadowOpacity: 0.06,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 10 },
    },
    cta: {
      shadowColor: "rgba(245,101,101,0.24)",
      shadowOpacity: 1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
  },
} as const;
