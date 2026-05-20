import { StyleSheet } from "react-native";
import { journalTypography } from "../../../shared/theme/journalTypography";

export const pillboxPlanOnboardingSheetStyleParts = {
  sheetOverlay: {
    backgroundColor: "rgba(23,32,51,0.2)",
  },
  sheetBackdrop: {
    backgroundColor: "rgba(23,32,51,0.24)",
  },
  customValueSheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFCF8",
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#EED8CE",
  },
  sheetDragZone: {
    alignItems: "center",
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#DDC8BE",
    marginBottom: 14,
  },
  sheetTitle: {
    color: "#1E2A3A",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    fontFamily: journalTypography.display,
  },
  sheetSubtitle: {
    marginTop: 8,
    color: "#6B7787",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    fontFamily: journalTypography.body,
    textAlign: "center",
  },
  customValueInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEDBD1",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 16,
    marginTop: 18,
    color: "#172033",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
    fontFamily: journalTypography.body,
    textAlign: "center",
  },
  customValueActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  customValueCancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#EED8CE",
  },
  secondaryButtonPressed: {
    opacity: 0.84,
  },
  customValueCancelText: {
    color: "#172033",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  customValueSaveButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  customValueSaveGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  customValueSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
} as const;
