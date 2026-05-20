import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { DateRangePickerSheet } from "../../../shared/components/DateRangePickerSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildRangeFromAllTime,
  buildRangeFromTrailingDays,
  formatDateRangeLabel,
  isDateWithinRange,
  localizeCustomDateRangeLabel,
  type DateRangeValue,
} from "../../../shared/lib/dateRange";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import {
  AnalyticsEpisodeCard,
  AnalyticsPeriodOption,
  buildAnalyticsScreenContent,
} from "../model/analyticsScreen";
import type {
  MobileIllnessEpisode,
  MobileIllnessHistorySummary,
} from "../../illness/api/illnessAnalyticsApi";
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
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
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
  const customEpisodes = useMemo(() => {
    if (!customRange || !episodes) {
      return episodes;
    }

    return episodes.filter((episode) =>
      isDateWithinRange(episode.closedAt ?? episode.startedAt, customRange),
    );
  }, [customRange, episodes]);
  const derivedSummary = useMemo(() => {
    if (!customRange || !customEpisodes) {
      return summary;
    }

    return buildCustomAnalyticsSummary(customEpisodes, locale);
  }, [customEpisodes, customRange, locale, summary]);
  const content = buildAnalyticsScreenContent(locale, {
    summary: derivedSummary,
    episodes: customRange ? customEpisodes : episodes,
    period:
      customRange
        ? "all"
        : selectedPeriodId === "halfYear"
          ? "half_year"
          : selectedPeriodId === "allTime"
            ? "all"
            : selectedPeriodId,
  });
  const selectedPeriod =
    content.periodOptions.find((option) => option.id === selectedPeriodId) ??
    content.periodOptions[2] ??
    content.periodOptions[0];
  const customRangeLabel = customRange
    ? formatDateRangeLabel(customRange, locale)
    : null;

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
                activeId={customRange ? "" : selectedPeriod.id}
                onSelect={(id) => {
                  setCustomRange(null);
                  setSelectedPeriodId(id);
                }}
                extraItem={{
                  label: localizeCustomDateRangeLabel(locale),
                  active: Boolean(customRange),
                  onPress: () => setIsCustomRangeOpen(true),
                }}
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
        <DateRangePickerSheet
          visible={visible && isCustomRangeOpen}
          locale={locale}
          title={localizeCustomDateRangeLabel(locale)}
          subtitle={localizeRangeSheetSubtitle(locale)}
          initialRange={resolveInitialRange(selectedPeriodId, customRange, episodes)}
          onClose={() => setIsCustomRangeOpen(false)}
          onApply={(range) => {
            setCustomRange(range);
            setIsCustomRangeOpen(false);
          }}
        />
      </ImageBackground>
    </Animated.View>
  );
}

function resolveInitialRange(
  periodId: AnalyticsPeriodOption["id"],
  customRange: DateRangeValue | null,
  episodes: MobileIllnessEpisode[] | null,
) {
  if (customRange) {
    return customRange;
  }

  if (periodId === "month") return buildRangeFromTrailingDays(30);
  if (periodId === "quarter") return buildRangeFromTrailingDays(90);
  if (periodId === "halfYear") return buildRangeFromTrailingDays(180);
  if (periodId === "year") return buildRangeFromTrailingDays(365);
  return buildRangeFromAllTime(
    (episodes ?? []).map((episode) => episode.closedAt ?? episode.startedAt),
  );
}

function buildCustomAnalyticsSummary(
  episodes: MobileIllnessEpisode[],
  locale: string,
): MobileIllnessHistorySummary {
  const closedEpisodes = episodes.filter((episode) => episode.status === "closed");
  const durations = closedEpisodes
    .map((episode) => {
      const startedAt = new Date(episode.startedAt);
      const closedAt = episode.closedAt ? new Date(episode.closedAt) : null;

      if (
        Number.isNaN(startedAt.getTime()) ||
        !closedAt ||
        Number.isNaN(closedAt.getTime())
      ) {
        return null;
      }

      return Math.max(
        Math.ceil((closedAt.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000)),
        1,
      );
    })
    .filter((value): value is number => typeof value === "number");
  const monthlyCounts = new Map<string, { label: string; count: number }>();

  closedEpisodes.forEach((episode) => {
    const date = new Date(episode.closedAt ?? episode.startedAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString(resolveAnalyticsLocale(locale), {
      month: "long",
      year: "numeric",
    });
    const current = monthlyCounts.get(key);
    monthlyCounts.set(key, {
      label,
      count: (current?.count ?? 0) + 1,
    });
  });

  const mostActivePeriod = Array.from(monthlyCounts.values()).sort(
    (left, right) => right.count - left.count,
  )[0];
  const latestStartedAt = closedEpisodes
    .map((episode) => new Date(episode.startedAt))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return {
    period: "custom",
    totalClosedEpisodes: closedEpisodes.length,
    episodeCount: closedEpisodes.length,
    lastEpisodeStartedAt: latestStartedAt ? latestStartedAt.toISOString() : null,
    daysSinceLastEpisode: latestStartedAt
      ? Math.max(
          Math.floor((Date.now() - latestStartedAt.getTime()) / (24 * 60 * 60 * 1000)),
          0,
        )
      : null,
    mostActivePeriodLabel: mostActivePeriod?.label ?? null,
    averageDurationDays:
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : 0,
    longestDurationDays: durations.length > 0 ? Math.max(...durations) : 0,
    episodesWithTemperature38Plus: 0,
    episodesWithTemperature39Plus: 0,
    episodesWithAdministrations: closedEpisodes.filter(
      (episode) => episode.medicationMode === "guided",
    ).length,
    observationOnlyEpisodes: closedEpisodes.filter(
      (episode) => episode.medicationMode === "observation_only",
    ).length,
    guidedEpisodes: closedEpisodes.filter(
      (episode) => episode.medicationMode === "guided",
    ).length,
    totalTemperatureEntries: 0,
    timeline: [],
    durationBuckets: [],
  };
}

function localizeRangeSheetSubtitle(locale: string) {
  if (locale === "ru") return "Выберите диапазон, чтобы посмотреть свои даты.";
  if (locale === "de") return "Wähle einen eigenen Zeitraum für die Anzeige.";
  if (locale === "pl") return "Wybierz własny zakres dat do podglądu.";
  return "Choose a custom date range to review data.";
}

function resolveAnalyticsLocale(locale: string) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}
