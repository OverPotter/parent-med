import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AnalyticsScreen } from "../features/analytics/screens/AnalyticsScreen";
import { ChildProfileEditScreen } from "../features/child-profile-edit/screens/ChildProfileEditScreen";
import { ChildProfileRedesignScreen } from "../features/child-profile/screens/ChildProfileRedesignScreen";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import { ChildrenRedesignScreen } from "../features/children/screens/ChildrenRedesignScreen";
import { MobileI18nProvider, useMobileI18n } from "../shared/i18n/mobileI18n";

export function PillPathExpoApp() {
  return (
    <MobileI18nProvider>
      <PillPathExpoShell />
    </MobileI18nProvider>
  );
}

function PillPathExpoShell() {
  const { locale } = useMobileI18n();
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const [activeScreen, setActiveScreen] = useState<
    "children" | "analytics" | "childProfile" | "childProfileEdit"
  >("children");
  const [selectedChildId, setSelectedChildId] = useState(
    childrenScreenContent.cards[0]?.nodeId ?? "",
  );

  const selectedChild =
    childrenScreenContent.cards.find(
      (card) => card.nodeId === selectedChildId,
    ) ?? childrenScreenContent.cards[0];

  const handleOpenChildProfile = useCallback((cardId: string) => {
    setSelectedChildId(cardId);
    setActiveScreen("childProfile");
  }, []);

  const handleCloseChildProfile = useCallback(() => {
    setActiveScreen("children");
  }, []);

  const handleOpenEditProfile = useCallback(() => {
    setActiveScreen("childProfileEdit");
  }, []);

  const handleCloseEditProfile = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  const handleOpenAnalytics = useCallback(() => {
    setActiveScreen("analytics");
  }, []);

  const handleCloseAnalytics = useCallback(() => {
    setActiveScreen("childProfile");
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.screenLayer}>
        <ChildrenRedesignScreen onOpenChildProfile={handleOpenChildProfile} />
      </View>
      {selectedChild ? (
        <>
          <ChildProfileRedesignScreen
            child={selectedChild}
            visible={
              activeScreen === "childProfile" ||
              activeScreen === "childProfileEdit" ||
              activeScreen === "analytics"
            }
            onBack={handleCloseChildProfile}
            onEditProfile={handleOpenEditProfile}
            onOpenAnalytics={handleOpenAnalytics}
          />
          <ChildProfileEditScreen
            child={selectedChild}
            visible={activeScreen === "childProfileEdit"}
            onBack={handleCloseEditProfile}
          />
          {activeScreen === "analytics" ? (
            <AnalyticsScreen onBack={handleCloseAnalytics} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FBF3EC",
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
