import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  overlayLayerVisible: {
    opacity: 1,
  },
  overlayLayerHidden: {
    opacity: 0,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.98,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,247,240,0.32)",
  },
  root: {
    flex: 1,
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
    lineHeight: 19,
    fontWeight: "500",
  },
  updatedAt: {
    color: "#8B7A72",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    color: "#243142",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  paragraph: {
    color: "#5F6B79",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F26F6C",
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: "#5F6B79",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
});
