import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  AnalyticsEpisodeCard,
  AnalyticsHighlightCard,
  AnalyticsInsightItem,
  AnalyticsPeriodOption,
  buildAnalyticsScreenContent,
} from "../model/analyticsScreen";
import { styles } from "./analyticsScreenStyles";

type AnalyticsScreenProps = {
  visible?: boolean;
  onBack?: () => void;
  onOpenEpisode?: (episode: AnalyticsEpisodeCard) => void;
};

const noop = () => {};

export function AnalyticsScreen({
  visible = true,
  onBack = noop,
  onOpenEpisode = noop,
}: AnalyticsScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildAnalyticsScreenContent(locale);
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<AnalyticsPeriodOption["id"]>("halfYear");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: true,
    width,
    onBack,
  });
  const selectedPeriod =
    content.periodOptions.find((option) => option.id === selectedPeriodId) ??
    content.periodOptions[2] ??
    content.periodOptions[0];

  useEffect(() => {
    setSelectedPeriodId("halfYear");
    setIsPeriodOpen(false);
  }, [locale]);

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
        <View style={styles.overlay} />
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
              <Pressable
                onPress={() => setIsPeriodOpen((current) => !current)}
                style={[
                  styles.periodField,
                  isPeriodOpen ? styles.periodFieldOpen : null,
                ]}
              >
                <View style={styles.periodLeft}>
                  <View style={styles.periodIconBadge}>
                    <Ionicons name="calendar-outline" size={18} color="#FF7E73" />
                  </View>
                  <Text style={styles.periodValue}>{selectedPeriod?.label}</Text>
                </View>
                <Ionicons
                  name={isPeriodOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6F7C8C"
                />
              </Pressable>
              {isPeriodOpen ? (
                <View style={styles.periodDropdown}>
                  {content.periodOptions.map((option, index) => {
                    const isActive = option.id === selectedPeriod?.id;

                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setSelectedPeriodId(option.id);
                          setIsPeriodOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.periodDropdownItem,
                          isActive ? styles.periodDropdownItemActive : null,
                          pressed ? styles.periodDropdownItemPressed : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.periodDropdownText,
                            isActive ? styles.periodDropdownTextActive : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isActive ? (
                          <Ionicons name="checkmark" size={16} color="#FF7E73" />
                        ) : null}
                        {index < content.periodOptions.length - 1 ? (
                          <View style={styles.periodDropdownDivider} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              <Text style={styles.periodHelper}>{selectedPeriod?.helperLabel}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>{content.mainSummaryTitle}</Text>
                <View style={styles.summaryInsights}>
                  {content.mainSummaryInsights.map((insight) => (
                    <InsightRow key={insight.id} insight={insight} />
                  ))}
                </View>
              </View>
              <View style={styles.summaryVisual}>
                <View style={[styles.decorBadge, styles.decorHeartTop]}>
                  <Ionicons name="heart" size={18} color="#EBA89A" />
                </View>
                <View style={[styles.decorBadge, styles.decorLeafTopLeft]}>
                  <Ionicons name="leaf-outline" size={16} color="#DFA48F" />
                </View>
                <View style={[styles.decorBadge, styles.decorHeartLeft]}>
                  <Ionicons name="heart" size={14} color="#E6A495" />
                </View>
                <View style={[styles.decorBadge, styles.decorLeafRight]}>
                  <Ionicons name="leaf-outline" size={20} color="#D89D8D" />
                </View>
                <View style={[styles.decorBadge, styles.decorLeafLowerRight]}>
                  <Ionicons name="leaf-outline" size={15} color="#DDA08E" />
                </View>
                <View style={[styles.decorBadge, styles.decorHeartBottom]}>
                  <Ionicons name="heart" size={16} color="#E3A393" />
                </View>
                <View style={[styles.decorBadge, styles.decorHeartBottomLeft]}>
                  <Ionicons name="heart" size={13} color="#E8AE9F" />
                </View>
                <Image
                  source={childrenScreenAssets.avatars.boyBlackHair}
                  style={styles.summaryAvatar}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.highlightsGrid}>
              {content.highlights.map((highlight, index) => (
                <View
                  key={highlight.id}
                  style={[
                    styles.highlightCell,
                    index === content.highlights.length - 1
                      ? styles.highlightCellFull
                      : null,
                  ]}
                >
                  <HighlightCard card={highlight} />
                </View>
              ))}
            </View>

            <View style={styles.episodesSection}>
              <Text style={styles.sectionTitle}>{content.episodesTitle}</Text>
              <Text style={styles.sectionHelper}>{content.episodesHelper}</Text>
              <View style={styles.episodesList}>
                {content.episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    onOpenEpisode={onOpenEpisode}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

function InsightRow({ insight }: { insight: AnalyticsInsightItem }) {
  const config = {
    completed: {
      icon: "checkmark-circle-outline" as const,
      background: "#FFE8E1",
      color: "#FF7E73",
    },
    activeMonth: {
      icon: "calendar-clear-outline" as const,
      background: "#EAF4FF",
      color: "#5EA7F5",
    },
    medicine: {
      icon: "medical-outline" as const,
      background: "#EAF8EF",
      color: "#61C58B",
    },
  }[insight.icon];

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIconWrap, { backgroundColor: config.background }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.insightCopy}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightSubtitle}>{insight.subtitle}</Text>
      </View>
    </View>
  );
}

function HighlightCard({ card }: { card: AnalyticsHighlightCard }) {
  const iconName = {
    duration: "clock-time-four-outline",
    longest: "star-four-points-outline",
    observations: "clipboard-text-outline",
  }[card.icon] as
    | "clock-time-four-outline"
    | "star-four-points-outline"
    | "clipboard-text-outline";

  return (
    <View
      style={[
        styles.highlightCard,
        {
          backgroundColor: card.accent.background,
          borderColor: card.accent.border,
        },
      ]}
    >
      <View
        style={[
          styles.highlightIconWrap,
          { backgroundColor: card.accent.iconBackground },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={18}
          color={card.accent.iconColor}
        />
      </View>
      <View style={styles.highlightTextBlock}>
        <Text style={styles.highlightLabel}>{card.label}</Text>
        <Text style={styles.highlightValue}>{card.value}</Text>
      </View>
    </View>
  );
}

function EpisodeCard({
  episode,
  onOpenEpisode,
}: {
  episode: AnalyticsEpisodeCard;
  onOpenEpisode: (episode: AnalyticsEpisodeCard) => void;
}) {
  return (
    <View style={styles.episodeCard}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeMonth}>{episode.monthLabel}</Text>
        <Text style={styles.dateBadgeDay}>{episode.dayLabel}</Text>
      </View>

      <View style={styles.episodeCopy}>
        <Text style={styles.episodeMeta}>{episode.meta}</Text>
        <Text style={styles.episodeTitle}>{episode.title}</Text>
        <Text style={styles.episodeSubtitle}>
          {episode.closedAt} {"•"} {episode.description}
        </Text>
      </View>

      <Pressable
        onPress={() => onOpenEpisode(episode)}
        style={({ pressed }) => [
          styles.episodeAction,
          pressed ? styles.episodeActionPressed : null,
        ]}
      >
        <Text style={styles.episodeActionText}>{episode.actionLabel}</Text>
      </Pressable>
    </View>
  );
}
