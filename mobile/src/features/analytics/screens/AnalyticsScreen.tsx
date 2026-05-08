import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  AnalyticsEpisodeCard,
  AnalyticsMetricCard,
  AnalyticsPeriodOption,
  buildAnalyticsScreenContent,
} from "../model/analyticsScreen";
import { styles } from "./analyticsScreenStyles";

type AnalyticsScreenProps = {
  onBack?: () => void;
};

const noop = () => {};

export function AnalyticsScreen({
  onBack = noop,
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
      style={[styles.overlayLayer, { transform: [{ translateX }] }]}
    >
      <ImageBackground
        source={childrenScreenAssets.background}
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
            <View style={styles.topChrome}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>

              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{content.periodTitle}</Text>
              <Pressable
                onPress={() => setIsPeriodOpen((current) => !current)}
                style={[
                  styles.periodField,
                  isPeriodOpen ? styles.periodFieldOpen : null,
                ]}
              >
                <View style={styles.periodLeft}>
                  <View style={styles.periodIconBadge}>
                    <Ionicons name="calendar-outline" size={18} color="#F47667" />
                  </View>
                  <Text style={styles.periodValue}>{selectedPeriod?.label}</Text>
                </View>
                <Ionicons
                  name={isPeriodOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6F7E8D"
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
                          <Ionicons name="checkmark" size={16} color="#F47667" />
                        ) : null}
                        {index < content.periodOptions.length - 1 ? (
                          <View style={styles.periodDropdownDivider} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              <Text style={styles.periodHelper}>
                {selectedPeriod?.helperLabel}
              </Text>

              <View style={styles.metricsGrid}>
                {content.metrics.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.episodesHeader}>
                <Text style={styles.sectionTitle}>{content.episodesTitle}</Text>
              </View>

              <View style={styles.episodesList}>
                {content.episodes.map((episode) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

function MetricCard({ metric }: { metric: AnalyticsMetricCard }) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: metric.accent.cardTint,
          borderColor: metric.accent.border,
        },
      ]}
    >
      <View
        style={[styles.metricChip, { backgroundColor: metric.accent.chipBg }]}
      >
        <View
          style={[styles.metricChipDot, { backgroundColor: metric.accent.dot }]}
        />
        <Text style={styles.metricChipText}>{metric.chip}</Text>
      </View>

      <View>
        <Text style={styles.metricValue}>{metric.value}</Text>
        <Text style={styles.metricSubtext}>{metric.subtext}</Text>
      </View>
    </View>
  );
}

function EpisodeCard({ episode }: { episode: AnalyticsEpisodeCard }) {
  return (
    <View style={styles.episodeCard}>
      <View style={styles.episodeCopy}>
        <Text style={styles.episodeMeta}>{episode.meta}</Text>
        <Text style={styles.episodeTitle}>{episode.title}</Text>
        <Text style={styles.episodeClosed}>{episode.closedAt}</Text>
        <Text style={styles.episodeDescription}>{episode.description}</Text>
      </View>

      <Pressable style={styles.episodeAction}>
        <Text style={styles.episodeActionText}>{episode.actionLabel}</Text>
      </Pressable>
    </View>
  );
}
