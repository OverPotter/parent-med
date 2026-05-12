import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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
import type { MobileAuthSession } from "../../auth/api/authApi";
import { ChildCard } from "../../children/model/childrenRedesign";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { DateRangePickerSheet } from "../../../shared/components/DateRangePickerSheet";
import { SegmentedPillTabs } from "../../../shared/components/SegmentedPillTabs";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildRangeFromAllTime,
  buildRangeFromTrailingDays,
  localizeCustomDateRangeLabel,
  type DateRangeValue,
} from "../../../shared/lib/dateRange";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import {
  buildChildOverviewScreenContent,
  ChildOverviewPeriodOption,
} from "../model/childOverviewScreen";
import {
  fetchMobileChildOverview,
  type MobileChildOverview,
} from "../api/overviewApi";
import {
  getOverviewIconBadgeBackground,
  getOverviewIconBadgeBorder,
  OverviewIcon,
} from "./ChildOverviewScreenParts";
import {
  OverviewCalendarSection,
  OverviewChartsSection,
  OverviewEventsSection,
} from "./ChildOverviewSections";
import { styles } from "./childOverviewScreenStyles";

type ChildOverviewScreenProps = {
  authSession: Pick<MobileAuthSession, "accessToken">;
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function ChildOverviewScreen({
  authSession,
  child,
  visible = true,
  onBack = noop,
}: ChildOverviewScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const [initialState] = useState(() => {
    const initialContent = buildChildOverviewScreenContent(child, locale);
    return {
      activeTabId:
        initialContent.tabs.find((item) => item.active)?.id ??
        initialContent.tabs[0]?.id ??
        "",
      activeFilterId:
        initialContent.filters.find((item) => item.active)?.id ?? "",
      selectedPeriodId:
        initialContent.periodOptions[0]?.id ?? ("week" as ChildOverviewPeriodOption["id"]),
    };
  });
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const [activeTabId, setActiveTabId] = useState(initialState.activeTabId);
  const [activeFilterId, setActiveFilterId] = useState(initialState.activeFilterId);
  const [selectedPeriodId, setSelectedPeriodId] = useState<
    ChildOverviewPeriodOption["id"]
  >(initialState.selectedPeriodId);
  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [visibleCalendarMonthKey, setVisibleCalendarMonthKey] = useState<string | null>(
    null,
  );
  const [overviewData, setOverviewData] = useState<MobileChildOverview>({
    feedingRecords: [],
    sleepSessions: [],
    weightEntries: [],
    heightEntries: [],
    illnessEpisodes: [],
  });
  const content = useMemo(
    () =>
      buildChildOverviewScreenContent(child, locale, {
        periodId: selectedPeriodId,
        activeFilterId,
        data: overviewData,
        customRange,
        visibleCalendarMonthKey,
      }),
    [
      activeFilterId,
      child,
      customRange,
      locale,
      overviewData,
      selectedPeriodId,
      visibleCalendarMonthKey,
    ],
  );
  const activeTab =
    content.tabs.find((item) => item.id === activeTabId) ?? content.tabs[0];
  const maxGraphicsBarValue = Math.max(
    ...content.graphicsBarData.map((item) => item.value),
    1,
  );
  const [selectedCalendarDayId, setSelectedCalendarDayId] = useState(
    "",
  );
  const selectedCalendarDay =
    content.calendarMonths
      .flatMap((month) => month.days)
      .find((item) => item.id === selectedCalendarDayId) ?? null;
  const selectedDayEntries = selectedCalendarDay
    ? content.selectedDayEntriesByDay[selectedCalendarDay.id] ?? []
    : [];
  const todayMonthKey = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const currentCalendarMonthKey =
    visibleCalendarMonthKey ?? content.calendarAvailableMonthKeys[0] ?? todayMonthKey;
  const canGoPrevMonth = true;
  const canGoNextMonth = currentCalendarMonthKey < todayMonthKey;

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    async function loadOverviewData() {
      try {
        const nextOverviewData = await fetchMobileChildOverview(
          authSession,
          child.child.id,
        );

        if (cancelled) {
          return;
        }

        setOverviewData(nextOverviewData);
      } catch {
        if (cancelled) {
          return;
        }

        setOverviewData({
          feedingRecords: [],
          sleepSessions: [],
          weightEntries: [],
          heightEntries: [],
          illnessEpisodes: [],
        });
      }
    }

    void loadOverviewData();

    return () => {
      cancelled = true;
    };
  }, [authSession, child.child.id, visible]);

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
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.periodTabsWrap}>
              <SegmentedPillTabs
                items={content.periodOptions}
                activeId={customRange ? "" : selectedPeriodId}
                onSelect={(id) => {
                  setCustomRange(null);
                  setSelectedPeriodId(id as ChildOverviewPeriodOption["id"]);
                  setVisibleCalendarMonthKey(null);
                }}
                activeBackgroundColor="#FFEDE7"
                activeTextColor="#FF6E61"
                extraItem={{
                  label: localizeCustomDateRangeLabel(locale),
                  active: Boolean(customRange),
                  onPress: () => setIsCustomRangeOpen(true),
                }}
              />
            </View>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: content.theme.colors.surface,
                  borderColor: content.theme.colors.stroke,
                },
              ]}
            >
              <View style={styles.summaryTopRow}>
                <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
                <Text style={styles.summaryPeriodHint}>
                  {customRange
                    ? localizeCustomDateRangeLabel(locale)
                    : content.periodOptions.find((item) => item.id === selectedPeriodId)?.label}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryContentRow,
                  activeTab?.kind === "calendar"
                    ? styles.summaryContentRowCompact
                    : null,
                ]}
              >
                <View style={styles.insightList}>
                  {content.summaryInsights.map((item) => (
                    <View key={item.id} style={styles.insightRow}>
                      <View
                        style={[
                          styles.insightIconWrap,
                          {
                            backgroundColor: getOverviewIconBadgeBackground(item.icon.key),
                            borderColor: getOverviewIconBadgeBorder(item.icon.key),
                          },
                        ]}
                      >
                        <OverviewIcon token={item.icon} size={17} />
                      </View>
                      <View style={styles.insightCopy}>
                        <Text style={styles.insightTitle}>{item.title}</Text>
                        <Text style={styles.insightSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.avatarHeroWrap}>
                  <Ionicons
                    name="heart"
                    size={20}
                    color={content.theme.avatarDecoration.smallHeartColor}
                    style={[styles.decorIcon, styles.decorHeartTop]}
                  />
                  <Ionicons
                    name="leaf-outline"
                    size={20}
                    color={content.theme.avatarDecoration.smallLeafColor}
                    style={[styles.decorIcon, styles.decorLeafTopLeft]}
                  />
                  <Ionicons
                    name="heart"
                    size={14}
                    color={content.theme.avatarDecoration.smallHeartColor}
                    style={[styles.decorIcon, styles.decorHeartUpperLeft]}
                  />
                  <Ionicons
                    name="heart"
                    size={16}
                    color={content.theme.avatarDecoration.smallHeartColor}
                    style={[styles.decorIcon, styles.decorHeartLeft]}
                  />
                  <Ionicons
                    name="leaf-outline"
                    size={22}
                    color={content.theme.avatarDecoration.smallLeafColor}
                    style={[styles.decorIcon, styles.decorLeafRight]}
                  />
                  <Ionicons
                    name="leaf-outline"
                    size={14}
                    color={content.theme.avatarDecoration.smallLeafColor}
                    style={[styles.decorIcon, styles.decorLeafMidLeft]}
                  />
                  <Ionicons
                    name="heart"
                    size={18}
                    color={content.theme.avatarDecoration.smallHeartColor}
                    style={[styles.decorIcon, styles.decorHeartBottom]}
                  />
                  <Ionicons
                    name="leaf-outline"
                    size={16}
                    color={content.theme.avatarDecoration.smallLeafColor}
                    style={[styles.decorIcon, styles.decorLeafLowerRight]}
                  />
                  <Ionicons
                    name="heart"
                    size={14}
                    color={content.theme.avatarDecoration.smallHeartColor}
                    style={[styles.decorIcon, styles.decorHeartLowerRight]}
                  />
                  <Ionicons
                    name="leaf-outline"
                    size={18}
                    color={content.theme.avatarDecoration.smallLeafColor}
                    style={[styles.decorIcon, styles.decorLeafBottomLeft]}
                  />
                  <View
                    style={[
                      styles.avatarBlob,
                      { backgroundColor: content.theme.avatarBlobColor },
                    ]}
                  >
                    {content.avatarSource ? (
                      <Image
                        source={content.avatarSource}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.tabsRow}>
              {content.tabs.map((item) => {
                const active = item.id === activeTabId;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setActiveTabId(item.id)}
                    style={({ pressed }) => [
                      styles.tabButton,
                      {
                        borderColor: active
                          ? content.theme.colors.accentCoralSoft
                          : content.theme.colors.stroke,
                        backgroundColor: active
                          ? content.theme.colors.accentCoralSoft
                          : content.theme.colors.surface,
                      },
                      pressed ? styles.tabPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: active
                            ? content.theme.colors.accentCoral
                            : content.theme.colors.textPrimary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab?.kind !== "charts" ? (
              <View style={styles.filtersRow}>
                {content.filters.map((item) => {
                  const active = item.id === activeFilterId;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setActiveFilterId(item.id)}
                      style={({ pressed }) => [
                        styles.filterChip,
                        {
                          borderColor: active
                            ? content.theme.colors.accentCoral
                            : content.theme.colors.stroke,
                          backgroundColor: active
                            ? "#FFF1EE"
                            : content.theme.colors.surface,
                        },
                        pressed ? styles.filterChipPressed : null,
                      ]}
                    >
                      {item.dotColor ? (
                        <View style={[styles.filterDot, { backgroundColor: item.dotColor }]} />
                      ) : null}
                      <Text style={styles.filterText}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {activeTab?.kind === "calendar" ? (
              <OverviewCalendarSection
                content={content}
                locale={locale}
                selectedCalendarDayId={selectedCalendarDayId}
                selectedCalendarDay={selectedCalendarDay}
                selectedDayEntries={selectedDayEntries}
                canGoPrevMonth={canGoPrevMonth}
                canGoNextMonth={canGoNextMonth}
                onPrevMonth={() => {
                  setVisibleCalendarMonthKey(
                    shiftOverviewMonthKey(currentCalendarMonthKey, -1),
                  );
                  setSelectedCalendarDayId("");
                }}
                onNextMonth={() => {
                  if (!canGoNextMonth) return;
                  setVisibleCalendarMonthKey(
                    shiftOverviewMonthKey(currentCalendarMonthKey, 1),
                  );
                  setSelectedCalendarDayId("");
                }}
                onSelectCalendarDay={(dayId) =>
                  setSelectedCalendarDayId((current) =>
                    current === dayId ? "" : dayId,
                  )
                }
              />
            ) : activeTab?.kind === "charts" ? (
              <OverviewChartsSection
                content={content}
                locale={locale}
                maxGraphicsBarValue={maxGraphicsBarValue}
              />
            ) : (
              <OverviewEventsSection content={content} />
            )}
          </ScrollView>
        </View>
      </ImageBackground>
      <DateRangePickerSheet
        visible={visible && isCustomRangeOpen}
        locale={locale}
        title={localizeCustomDateRangeLabel(locale)}
        subtitle={content.subtitle}
        initialRange={resolveInitialRange(selectedPeriodId, customRange, overviewData)}
        onClose={() => setIsCustomRangeOpen(false)}
        onApply={(range) => {
          setCustomRange(range);
          setVisibleCalendarMonthKey(null);
          setSelectedCalendarDayId("");
          setIsCustomRangeOpen(false);
        }}
      />
    </Animated.View>
  );
}

function shiftOverviewMonthKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextDate = new Date(year, month - 1 + delta, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
}

function resolveInitialRange(
  periodId: ChildOverviewPeriodOption["id"],
  customRange: DateRangeValue | null,
  data: MobileChildOverview,
) {
  if (customRange) {
    return customRange;
  }

  if (periodId === "twoWeeks") return buildRangeFromTrailingDays(14);
  if (periodId === "month") return buildRangeFromTrailingDays(30);
  if (periodId === "week") return buildRangeFromTrailingDays(7);

  return buildRangeFromAllTime([
    ...data.feedingRecords.map((item) => item.recordedAt),
    ...data.sleepSessions.map((item) => item.startedAt),
    ...data.weightEntries.map((item) => item.measuredAt),
    ...data.heightEntries.map((item) => item.measuredAt),
    ...data.illnessEpisodes.map((item) => item.closedAt ?? item.startedAt),
  ]);
}
