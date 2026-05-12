import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import {
  AnalyticsEpisodeCard,
  AnalyticsPeriodOption,
  buildAnalyticsScreenContent,
} from "../model/analyticsScreen";
import {
  AnalyticsEpisodeRow,
  AnalyticsPeriodTabs,
  AnalyticsSummaryCard,
} from "./AnalyticsScreenParts";
import { styles } from "./analyticsScreenStyles";
import { useAnalyticsScreenState } from "./useAnalyticsScreenState";

type AnalyticsScreenProps = {
  child: ChildCard;
  authSession: Pick<MobileAuthSession, "accessToken">;
  visible?: boolean;
  onBack?: () => void;
  onOpenEpisode?: (episode: AnalyticsEpisodeCard) => void;
};

const noop = () => {};

export function AnalyticsScreen({
  child,
  authSession,
  visible = true,
  onBack = noop,
  onOpenEpisode = noop,
}: AnalyticsScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const {
    selectedPeriodId,
    setSelectedPeriodId,
    summary,
    episodes,
    openSwipeEpisodeId,
    setOpenSwipeEpisodeId,
    pendingDeleteEpisode,
    handleDeleteEpisode,
    handleCloseDeleteDialog,
    handleRequestDeleteEpisode,
  } = useAnalyticsScreenState({
    authSession,
    child,
    locale,
    visible,
  });
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const content = buildAnalyticsScreenContent(locale, {
    summary,
    episodes,
    period:
      selectedPeriodId === "halfYear"
        ? "half_year"
        : selectedPeriodId === "allTime"
          ? "all"
          : selectedPeriodId,
  });
  const selectedPeriod =
    content.periodOptions.find((option) => option.id === selectedPeriodId) ??
    content.periodOptions[2] ??
    content.periodOptions[0];

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
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.topChrome}>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.section}>
              <AnalyticsPeriodTabs
                items={content.periodOptions}
                activeId={selectedPeriod.id}
                onSelect={setSelectedPeriodId}
              />
            </View>

            <AnalyticsSummaryCard
              title={content.mainSummaryTitle}
              insights={content.mainSummaryInsights}
              highlights={content.highlights}
              avatarSource={child.avatarSource}
            />

            <View style={styles.episodesSection}>
              <Text style={styles.sectionTitle}>{content.episodesTitle}</Text>
              <Text style={styles.sectionHelper}>{content.episodesHelper}</Text>
              <View style={styles.episodesList}>
                {content.episodes.map((episode, index) => (
                  <AnalyticsEpisodeRow
                    key={episode.id}
                    episode={episode}
                    isLast={index === content.episodes.length - 1}
                    isDeleteOpen={openSwipeEpisodeId === episode.id}
                    deleteLabel={content.deleteActionLabel}
                    onDeleteOpenChange={(isOpen) => {
                      setOpenSwipeEpisodeId(isOpen ? episode.id : null);
                    }}
                    onRequestDeleteEpisode={handleRequestDeleteEpisode}
                    onOpenEpisode={onOpenEpisode}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
        {pendingDeleteEpisode ? (
          <View style={styles.confirmOverlay}>
            <Pressable
              style={styles.confirmBackdrop}
              onPress={handleCloseDeleteDialog}
            />
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>{content.deleteDialog.title}</Text>
              <Text style={styles.confirmDescription}>{content.deleteDialog.description}</Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={handleCloseDeleteDialog}
                  style={({ pressed }) => [
                    styles.confirmButtonSecondary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonSecondaryText}>
                    {content.deleteDialog.cancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleDeleteEpisode(pendingDeleteEpisode.id);
                  }}
                  style={({ pressed }) => [
                    styles.confirmButtonPrimary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonPrimaryText}>{content.deleteDialog.confirm}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </ImageBackground>
    </Animated.View>
  );
}
