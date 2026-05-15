import { StyleSheet } from "react-native";
import { journalTypography } from "../../../shared/theme/journalTypography";
import { pillboxStyleTokens as tokens } from "./pillboxStyleTokens";

export const pillboxPlanOnboardingChromeStyleParts = {
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32,
    backgroundColor: tokens.colors.canvas,
  },
  overlayLayerVisible: {
    opacity: 1,
  },
  overlayLayerHidden: {
    opacity: 0,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: tokens.colors.canvas,
  },
  animatedLayer: {
    flex: 1,
  },
  background: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: tokens.colors.overlay,
  },
  swipeBackEdge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 80,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 132,
  },
  topNav: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backLink: {
    minHeight: 34,
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backLinkPressed: {
    opacity: 0.88,
  },
  backLinkText: {
    color: "#3E4B5C",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "500",
    fontFamily: journalTypography.body,
  },
  topNavSpacer: {
    width: 42,
    height: 42,
  },
  stepper: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    ...tokens.border.default,
    backgroundColor: "#FFFFFF",
  },
  stepCircleActive: {
    borderColor: "#F56565",
    backgroundColor: "#F56565",
  },
  stepCircleCompleted: {
    borderColor: "#F0D8CC",
    backgroundColor: "#FFFFFF",
  },
  stepCircleText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "600",
    color: "#8A94A6",
    fontFamily: journalTypography.body,
  },
  stepCircleTextActive: {
    color: "#FFFFFF",
  },
  stepCircleTextCompleted: {
    color: "#F56565",
  },
  stepConnector: {
    width: 28,
    height: 1,
    backgroundColor: "#EEDBD1",
    marginHorizontal: 6,
  },
  stepConnectorActive: {
    backgroundColor: "#F56565",
  },
  heroRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  headingBlock: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  title: {
    color: "#172033",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.45,
    fontFamily: journalTypography.display,
  },
  subtitle: {
    color: "#5F6B7A",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    fontFamily: journalTypography.body,
  },
  bottomActionDock: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
    gap: 10,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.cta,
    ...tokens.shadow.cta,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23,32,51,0.26)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  alertCard: {
    borderRadius: 26,
    ...tokens.border.default,
    backgroundColor: "#FFFBF7",
    padding: 20,
    gap: 10,
  },
  alertTitle: {
    color: "#172033",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: journalTypography.display,
  },
  alertText: {
    color: "#5F6B7A",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    fontFamily: journalTypography.body,
  },
  alertActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  alertAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    ...tokens.border.default,
  },
  alertActionDanger: {
    backgroundColor: "#F56565",
    borderColor: "#F56565",
  },
  alertActionText: {
    color: "#172033",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  alertActionTextDanger: {
    color: "#FFFFFF",
  },
} as const;
