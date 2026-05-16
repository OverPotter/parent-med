import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthScreen } from "../features/auth/screens/AuthScreen";
import { redesignBackgrounds } from "../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../redesign/shared/icons";
import { AssetWarmupLayer } from "../shared/components/AssetWarmupLayer";
import { MobileBottomTabBar } from "../shared/components/MobileBottomTabBar";
import { MobileI18nProvider, useMobileI18n } from "../shared/i18n/mobileI18n";
import {
  MobileThemeProvider,
  useMobileSurfaceTheme,
} from "../shared/theme/mobileSurfaceTheme";
import { PostAuthOnboardingOverlay } from "./PostAuthOnboardingOverlay";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import {
  getCriticalMobileUiAssetModules,
  getInitialShellAssetModules,
  getPersistentMobileUiAssetModules,
} from "./mobileUiAssetPreload";
import { shouldShowRootTabBarUnderlay } from "./pillPathExpoShellModel";
import { usePillPathExpoShellState } from "./usePillPathExpoShellState";

export function PillPathExpoApp() {
  return (
    <MobileThemeProvider>
      <MobileI18nProvider>
        <PillPathExpoShell />
      </MobileI18nProvider>
    </MobileThemeProvider>
  );
}

function PillPathExpoShell() {
  const surfaceTheme = useMobileSurfaceTheme();
  const [areCriticalUiAssetsReady, setAreCriticalUiAssetsReady] =
    useState(false);
  const [isInitialShellVisualReady, setIsInitialShellVisualReady] =
    useState(false);
  const [cabinetTabBarMode, setCabinetTabBarMode] = useState<
    "foreground" | "background" | "hidden"
  >("foreground");
  const {
    authSession,
    isAuthBootstrapping,
    isShellBootstrapping,
    rootTabItems,
    shouldShowRootTabBar,
    handleAuthenticated,
    handleSavePostAuthDisplayName,
    handleSavePostAuthRecoveryCode,
    handleSelectRootTab,
    handleSkipDisplayNameOnboarding,
    handleSkipRecoveryCodeOnboarding,
    postAuthOnboardingStep,
    rootTabContentProps,
    overlayScreensProps,
  } = usePillPathExpoShellState();
  const shouldShowRootTabBarBackground =
    (overlayScreensProps
      ? shouldShowRootTabBarUnderlay(overlayScreensProps.activeScreen)
      : false) || cabinetTabBarMode === "background";
  const shouldRenderRootTabBar =
    shouldShowRootTabBar &&
    cabinetTabBarMode !== "hidden" &&
    postAuthOnboardingStep == null;
  const criticalAssetModules = useMemo(
    () => getCriticalMobileUiAssetModules(),
    [],
  );
  const selectedChild = rootTabContentProps.selectedChildId
    ? (rootTabContentProps.childrenCards.find(
        (card) => card.nodeId === rootTabContentProps.selectedChildId,
      ) ?? null)
    : null;
  const initialShellAssetModules = useMemo(
    () => getInitialShellAssetModules(rootTabContentProps.childrenCards),
    [rootTabContentProps.childrenCards],
  );
  const initialShellAssetKey = useMemo(
    () => initialShellAssetModules.join(","),
    [initialShellAssetModules],
  );
  const persistentAssetModules = useMemo(
    () =>
      getPersistentMobileUiAssetModules(rootTabContentProps.childrenCards, {
        activeRootTab: rootTabContentProps.activeRootTab,
        activeScreen: overlayScreensProps?.activeScreen,
        selectedChild,
      }),
    [
      overlayScreensProps?.activeScreen,
      rootTabContentProps.childrenCards,
      selectedChild,
    ],
  );

  useEffect(() => {
    if (!authSession) {
      setIsInitialShellVisualReady(false);
      return;
    }

    if (isShellBootstrapping) {
      setIsInitialShellVisualReady(false);
    }
  }, [authSession, initialShellAssetKey, isShellBootstrapping]);

  if (isAuthBootstrapping || !areCriticalUiAssetsReady) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: surfaceTheme.appBackgroundColor },
        ]}
      >
        <StatusBar style={surfaceTheme.statusBarStyle} />
        <AppWarmupScreen />
        <CriticalAssetBootLayer
          assetModules={criticalAssetModules}
          onReady={() => setAreCriticalUiAssetsReady(true)}
        />
      </View>
    );
  }

  if (authSession && (isShellBootstrapping || !isInitialShellVisualReady)) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: surfaceTheme.appBackgroundColor },
        ]}
      >
        <StatusBar style={surfaceTheme.statusBarStyle} />
        <AppWarmupScreen />
        <CriticalAssetBootLayer
          key={initialShellAssetKey}
          assetModules={initialShellAssetModules}
          onReady={() => setIsInitialShellVisualReady(true)}
        />
      </View>
    );
  }

  if (!authSession) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: surfaceTheme.appBackgroundColor },
        ]}
      >
        <StatusBar style={surfaceTheme.statusBarStyle} />
        <AuthScreen onAuthenticated={handleAuthenticated} />
        <AssetWarmupLayer active assetModules={persistentAssetModules} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: surfaceTheme.appBackgroundColor },
      ]}
    >
      <StatusBar style={surfaceTheme.statusBarStyle} />
      <RootTabContent
        {...rootTabContentProps}
        onRootTabBarModeChange={setCabinetTabBarMode}
      />
      <View
        pointerEvents={shouldRenderRootTabBar ? "auto" : "none"}
        style={[
          styles.rootTabBarLayer,
          shouldRenderRootTabBar
            ? styles.rootTabBarLayerForeground
            : shouldShowRootTabBarBackground
              ? styles.rootTabBarLayerBackground
            : styles.rootTabBarLayerHidden,
        ]}
      >
        <MobileBottomTabBar
          items={rootTabItems}
          onSelectTab={handleSelectRootTab}
        />
      </View>
      {overlayScreensProps ? <OverlayScreens {...overlayScreensProps} /> : null}
      {authSession ? (
        <PostAuthOnboardingOverlay
          session={authSession}
          visibleStep={postAuthOnboardingStep}
          onSkipDisplayName={handleSkipDisplayNameOnboarding}
          onSkipRecoveryCode={handleSkipRecoveryCodeOnboarding}
          onSaveDisplayName={handleSavePostAuthDisplayName}
          onRecoveryCodeSaved={handleSavePostAuthRecoveryCode}
        />
      ) : null}
      <AssetWarmupLayer active assetModules={persistentAssetModules} />
    </View>
  );
}

function CriticalAssetBootLayer({
  assetModules,
  onReady,
}: {
  assetModules: number[];
  onReady: () => void;
}) {
  const [loadedCount, setLoadedCount] = useState(0);
  const readyRef = useRef(false);
  const total = assetModules.length;

  useEffect(() => {
    let cancelled = false;

    if (readyRef.current) {
      return;
    }

    if (total === 0) {
      readyRef.current = true;
      onReady();
      return;
    }

    Promise.all(
      assetModules.map(async (moduleId) => {
        const resolved = Image.resolveAssetSource(moduleId as ImageSourcePropType);

        if (resolved?.uri) {
          await Image.prefetch(resolved.uri).catch(() => false);
        }
      }),
    )
      .catch(() => {})
      .finally(() => {
        if (cancelled || readyRef.current) {
          return;
        }

        readyRef.current = true;
        onReady();
      });

    return () => {
      cancelled = true;
    };
  }, [onReady, total]);

  useEffect(() => {
    if (readyRef.current || total === 0 || loadedCount < total) {
      return;
    }

    readyRef.current = true;
    onReady();
  }, [loadedCount, onReady, total]);

  return (
    <View pointerEvents="none" style={styles.assetWarmupBootLayer}>
      {assetModules.map((moduleId) => (
        <Image
          key={moduleId}
          source={moduleId as ImageSourcePropType}
          style={styles.assetWarmupBootImage}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={() => setLoadedCount((current) => current + 1)}
          onError={() => setLoadedCount((current) => current + 1)}
        />
      ))}
    </View>
  );
}

function AppWarmupScreen() {
  const { locale } = useMobileI18n();
  const loadingLabel =
    locale === "ru"
      ? "Загрузка"
      : locale === "de"
        ? "Wird geladen"
        : locale === "pl"
          ? "Ładowanie"
          : "Loading";
  const icons = useMemo(
    () => [
      redesignSharedIcons.feeding,
      redesignSharedIcons.sleep,
      redesignSharedIcons.observation,
      redesignSharedIcons.profile,
      redesignSharedIcons.journalBook,
    ],
    [],
  );
  const [dotCount, setDotCount] = useState(1);
  const pulseTop = useRef(new Animated.Value(0.75)).current;
  const pulseRight = useRef(new Animated.Value(0.75)).current;
  const pulseBottom = useRef(new Animated.Value(0.75)).current;
  const pulseLeft = useRef(new Animated.Value(0.75)).current;
  const pulseCenter = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    function makePulse(value: Animated.Value, delay: number, duration: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1.08,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.75,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    }

    const animations = [
      makePulse(pulseTop, 0, 1200),
      makePulse(pulseRight, 220, 1200),
      makePulse(pulseBottom, 440, 1200),
      makePulse(pulseLeft, 660, 1200),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseCenter, {
            toValue: 1.12,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseCenter, {
            toValue: 0.92,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    const dotsInterval = setInterval(() => {
      setDotCount((current) => (current % 3) + 1);
    }, 420);

    animations.forEach((animation) => animation.start());
    return () => {
      clearInterval(dotsInterval);
      animations.forEach((animation) => animation.stop());
    };
  }, [pulseBottom, pulseCenter, pulseLeft, pulseRight, pulseTop]);

  return (
    <ImageBackground
      source={redesignBackgrounds.childrenModule}
      resizeMode="cover"
      style={styles.warmupScreen}
      imageStyle={styles.warmupBackgroundImage}
    >
      <View style={styles.warmupOverlay} />
      <View style={styles.warmupContent}>
        <View style={styles.warmupOrbit}>
          <Animated.View
            style={[
              styles.warmupIconSlot,
              styles.warmupIconTop,
              {
                opacity: pulseTop,
                transform: [{ scale: pulseTop }],
              },
            ]}
          >
            <Image
              source={icons[0]}
              style={styles.warmupIcon}
              resizeMode="contain"
              fadeDuration={0}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.warmupIconSlot,
              styles.warmupIconRight,
              {
                opacity: pulseRight,
                transform: [{ scale: pulseRight }],
              },
            ]}
          >
            <Image
              source={icons[1]}
              style={styles.warmupIcon}
              resizeMode="contain"
              fadeDuration={0}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.warmupIconSlot,
              styles.warmupIconBottom,
              {
                opacity: pulseBottom,
                transform: [{ scale: pulseBottom }],
              },
            ]}
          >
            <Image
              source={icons[2]}
              style={styles.warmupIcon}
              resizeMode="contain"
              fadeDuration={0}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.warmupIconSlot,
              styles.warmupIconLeft,
              {
                opacity: pulseLeft,
                transform: [{ scale: pulseLeft }],
              },
            ]}
          >
            <Image
              source={icons[3]}
              style={styles.warmupIcon}
              resizeMode="contain"
              fadeDuration={0}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.warmupCenterIcon,
              {
                opacity: pulseCenter,
                transform: [{ scale: pulseCenter }],
              },
            ]}
          >
            <Image
              source={icons[4]}
              style={styles.warmupCenterIconImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          </Animated.View>
        </View>
        <Text style={styles.warmupTitle}>
          {loadingLabel + ".".repeat(dotCount)}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  warmupScreen: {
    flex: 1,
  },
  warmupBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  warmupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,241,0.78)",
  },
  warmupContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    paddingHorizontal: 24,
  },
  warmupOrbit: {
    width: 176,
    height: 176,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  warmupIconSlot: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  warmupIconTop: {
    top: 0,
  },
  warmupIconRight: {
    right: 0,
  },
  warmupIconBottom: {
    bottom: 0,
  },
  warmupIconLeft: {
    left: 0,
  },
  warmupIcon: {
    width: 34,
    height: 34,
  },
  warmupCenterIcon: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  warmupCenterIconImage: {
    width: 42,
    height: 42,
  },
  warmupTitle: {
    color: "#31485C",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  assetWarmupBootLayer: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
  assetWarmupBootImage: {
    width: 1,
    height: 1,
  },
  rootTabBarLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  rootTabBarLayerHidden: {
    opacity: 0,
  },
  rootTabBarLayerForeground: {
    opacity: 1,
    zIndex: 90,
  },
  rootTabBarLayerBackground: {
    opacity: 1,
    zIndex: 5,
  },
});
