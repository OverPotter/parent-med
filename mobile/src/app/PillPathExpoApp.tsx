import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";
import { AuthScreen } from "../features/auth/screens/AuthScreen";
import { AssetWarmupLayer } from "../shared/components/AssetWarmupLayer";
import { MobileBottomTabBar } from "../shared/components/MobileBottomTabBar";
import { MobileI18nProvider } from "../shared/i18n/mobileI18n";
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

void SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const isAppReady =
    !isAuthBootstrapping &&
    areCriticalUiAssetsReady &&
    (!authSession || (!isShellBootstrapping && isInitialShellVisualReady));

  useEffect(() => {
    if (!authSession) {
      setIsInitialShellVisualReady(false);
      return;
    }

    if (isShellBootstrapping) {
      setIsInitialShellVisualReady(false);
    }
  }, [authSession, initialShellAssetKey, isShellBootstrapping]);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {});
  }, [isAppReady]);

  if (isAuthBootstrapping || !areCriticalUiAssetsReady) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: "#EBE4FF" },
        ]}
      >
        <StatusBar style={surfaceTheme.statusBarStyle} />
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
          { backgroundColor: "#EBE4FF" },
        ]}
      >
        <StatusBar style={surfaceTheme.statusBarStyle} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#EBE4FF",
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
