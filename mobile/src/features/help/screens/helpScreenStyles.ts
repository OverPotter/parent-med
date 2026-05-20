import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "#FBF3EC",
  },
  overlayLayerVisible: {
    opacity: 1,
  },
  overlayLayerHidden: {
    opacity: 0,
  },
  background: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  backgroundImage: {
    opacity: 0.98,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,241,0.72)",
  },
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  swipeBackEdge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  topBar: {
    height: 40,
    justifyContent: "center",
  },
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backLinkText: {
    color: "#3E4B5C",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  introBlock: {
    gap: 6,
    paddingRight: 8,
  },
  title: {
    color: "#243142",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6A7889",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  sectionCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    color: "#243142",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  sectionDescription: {
    color: "#6A7889",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  sectionActionButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sectionActionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  sectionActionButtonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
  sectionCaseExample: {
    paddingTop: 2,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    textAlign: "left",
    opacity: 0.9,
  },
});
