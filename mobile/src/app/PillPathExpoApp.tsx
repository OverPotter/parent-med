import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthScreen } from "../features/auth/screens/AuthScreen";
import { MobileBottomTabBar } from "../shared/components/MobileBottomTabBar";
import { MobileI18nProvider } from "../shared/i18n/mobileI18n";
import {
  MobileThemeProvider,
  useMobileSurfaceTheme,
} from "../shared/theme/mobileSurfaceTheme";
import { OverlayScreens, RootTabContent } from "./PillPathExpoShellContent";
import { preloadMobileUiAssets } from "./mobileUiAssetPreload";
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
  const [areUiAssetsReady, setAreUiAssetsReady] = useState(false);
  const {
    authSession,
    isAuthBootstrapping,
    rootTabItems,
    handleAuthenticated,
    handleSelectRootTab,
    rootTabContentProps,
    overlayScreensProps,
  } = usePillPathExpoShellState();

  useEffect(() => {
    let cancelled = false;

    void preloadMobileUiAssets()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setAreUiAssetsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthBootstrapping) {
    return <View style={styles.root} />;
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
      </View>
    );
  }

  if (!areUiAssetsReady) {
    return <View style={styles.root} />;
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: surfaceTheme.appBackgroundColor },
      ]}
    >
      <StatusBar style={surfaceTheme.statusBarStyle} />
      <RootTabContent {...rootTabContentProps} />
      <MobileBottomTabBar
        items={rootTabItems}
        onSelectTab={handleSelectRootTab}
      />
      {overlayScreensProps ? <OverlayScreens {...overlayScreensProps} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
});
