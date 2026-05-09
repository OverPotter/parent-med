import { type ReactNode } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../hooks/useEdgeSwipeBack";
import { journalTypography } from "../theme/journalTypography";
import { useMobileSurfaceTheme } from "../theme/mobileSurfaceTheme";
import {
  type SegmentedPillTabItem,
  SegmentedPillTabs,
} from "./SegmentedPillTabs";

type JournalScreenScaffoldProps = {
  visible?: boolean;
  backLabel: string;
  title: string;
  subtitle: string;
  periods: SegmentedPillTabItem[];
  activePeriodId: string;
  onSelectPeriod: (id: string) => void;
  onBack?: () => void;
  activeBackgroundColor: string;
  activeTextColor: string;
  headerMarginBottom?: number;
  segmentedMarginBottom?: number;
  children: ReactNode;
};

const noop = () => {};

export function JournalScreenScaffold({
  visible = true,
  backLabel,
  title,
  subtitle,
  periods,
  activePeriodId,
  onSelectPeriod,
  onBack = noop,
  activeBackgroundColor,
  activeTextColor,
  headerMarginBottom = 20,
  segmentedMarginBottom = 18,
  children,
}: JournalScreenScaffoldProps) {
  const { width } = useWindowDimensions();
  const surfaceTheme = useMobileSurfaceTheme();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <ImageBackground
        source={redesignBackgrounds.childrenModule}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                  styles.backLink,
                  pressed ? styles.backLinkPressed : null,
                ]}
              >
                <Text style={styles.backLinkText}>{"← "}{backLabel}</Text>
              </Pressable>
            </View>

            <View style={[styles.headerBlock, { marginBottom: headerMarginBottom }]}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={[styles.segmentedWrap, { marginBottom: segmentedMarginBottom }]}>
              <SegmentedPillTabs
                items={periods}
                activeId={activePeriodId}
                onSelect={onSelectPeriod}
                activeBackgroundColor={activeBackgroundColor}
                activeTextColor={activeTextColor}
              />
            </View>

            {children}
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 16,
  },
  overlayLayerVisible: {
    opacity: 1,
  },
  overlayLayerHidden: {
    opacity: 0,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,241,0.52)",
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
    paddingBottom: 38,
  },
  topBar: {
    height: 40,
    justifyContent: "center",
  },
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backLinkPressed: {
    opacity: 0.88,
  },
  backLinkText: {
    color: "#3E4B5C",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  headerBlock: {
    marginTop: 6,
  },
  title: {
    color: "#1E2A38",
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "700",
    fontFamily: journalTypography.display,
    letterSpacing: -0.6,
    marginBottom: 7,
    maxWidth: 280,
  },
  subtitle: {
    color: "#66758A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: journalTypography.body,
    maxWidth: 340,
  },
  segmentedWrap: {
  },
});
