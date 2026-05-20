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
    lineHeight: 19,
    fontWeight: "500",
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: "#243142",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0DDD5",
    backgroundColor: "#FFFDF9",
    paddingHorizontal: 14,
    color: "#243142",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "500",
  },
  messageInput: {
    minHeight: 156,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  privacyHint: {
    color: "#6A7889",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  errorNote: {
    borderRadius: 18,
    backgroundColor: "#FFF1EE",
    borderWidth: 1,
    borderColor: "#F4C8C1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#C75C52",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  successNote: {
    borderRadius: 18,
    backgroundColor: "#EEF8F1",
    borderWidth: 1,
    borderColor: "#CDE8D5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#3D7D56",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  submitButton: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F47667",
    shadowColor: "#F47667",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  submitButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
  },
});
