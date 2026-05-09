import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
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
import { ChildCard } from "../../children/model/childrenRedesign";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { MobileLocale, useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildChildOverviewScreenContent,
  ChildOverviewCalendarDay,
  ChildOverviewCalendarStat,
  ChildOverviewEventRow,
  ChildOverviewIconToken,
  ChildOverviewBarDatum,
  ChildOverviewPeriodOption,
} from "../model/childOverviewScreen";
import { styles } from "./childOverviewScreenStyles";

type ChildOverviewScreenProps = {
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function ChildOverviewScreen({
  child,
  visible = true,
  onBack = noop,
}: ChildOverviewScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildChildOverviewScreenContent(child, locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const [activeTabId, setActiveTabId] = useState(
    content.tabs.find((item) => item.active)?.id ?? content.tabs[0]?.id ?? "",
  );
  const activeTab =
    content.tabs.find((item) => item.id === activeTabId) ?? content.tabs[0];
  const [activeFilterId, setActiveFilterId] = useState(
    content.filters.find((item) => item.active)?.id ?? "",
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<
    ChildOverviewPeriodOption["id"]
  >(content.periodOptions[0]?.id ?? "week");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const selectedPeriod =
    content.periodOptions.find((item) => item.id === selectedPeriodId) ??
    content.periodOptions[0];
  const maxGraphicsBarValue = Math.max(
    ...content.graphicsBarData.map((item) => item.value),
    1,
  );
  const [selectedCalendarDayId, setSelectedCalendarDayId] = useState(
    "",
  );
  const selectedCalendarDay =
    content.calendarDays.find((item) => item.id === selectedCalendarDayId) ?? null;
  const selectedDayEntries =
    selectedCalendarDay?.day === 3 ? content.selectedDayEntries : [];

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
                {activeTab?.kind !== "calendar" ? (
                  <Pressable
                    onPress={() => setIsPeriodOpen((current) => !current)}
                    style={({ pressed }) => [
                      styles.periodChip,
                      isPeriodOpen ? styles.periodChipOpen : null,
                      { borderColor: content.theme.colors.stroke },
                      pressed ? styles.periodChipPressed : null,
                    ]}
                  >
                    <Text style={styles.periodChipText}>{selectedPeriod?.label}</Text>
                    <Feather
                      name={isPeriodOpen ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={content.theme.colors.textSecondary}
                    />
                  </Pressable>
                ) : null}
              </View>
              {activeTab?.kind !== "calendar" && isPeriodOpen ? (
                <View
                  style={[
                    styles.periodDropdown,
                    {
                      backgroundColor: content.theme.colors.surface,
                      borderColor: content.theme.colors.stroke,
                    },
                  ]}
                >
                  {content.periodOptions.map((option, index) => {
                    const active = option.id === selectedPeriod?.id;

                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setSelectedPeriodId(option.id);
                          setIsPeriodOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.periodDropdownItem,
                          active ? styles.periodDropdownItemActive : null,
                          pressed ? styles.periodDropdownItemPressed : null,
                        ]}
                      >
                        <View style={styles.periodDropdownCopy}>
                          <Text
                            style={[
                              styles.periodDropdownLabel,
                              active ? styles.periodDropdownLabelActive : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.periodDropdownHelper}>
                            {option.helperLabel}
                          </Text>
                        </View>
                        {active ? (
                          <Feather
                            name="check"
                            size={15}
                            color={content.theme.colors.accentCoral}
                          />
                        ) : null}
                        {index < content.periodOptions.length - 1 ? (
                          <View
                            style={[
                              styles.periodDropdownDivider,
                              { backgroundColor: content.theme.colors.stroke },
                            ]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

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
                    <Image
                      source={content.avatarSource}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
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
              <>
                <View
                  style={[
                    styles.calendarCard,
                    {
                      backgroundColor: content.theme.colors.surface,
                      borderColor: content.theme.colors.stroke,
                    },
                  ]}
                >
                  <View style={styles.calendarHeaderRow}>
                    <Text style={styles.calendarMonthTitle}>
                      {content.calendarMonthLabel}
                    </Text>
                    <View style={styles.calendarNavButtons}>
                      <Pressable
                        onPress={noop}
                        style={({ pressed }) => [
                          styles.calendarNavButton,
                          { borderColor: content.theme.colors.stroke },
                          pressed ? styles.tabPressed : null,
                        ]}
                      >
                        <Feather
                          name="chevron-left"
                          size={16}
                          color={content.theme.colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={noop}
                        style={({ pressed }) => [
                          styles.calendarNavButton,
                          { borderColor: content.theme.colors.stroke },
                          pressed ? styles.tabPressed : null,
                        ]}
                      >
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={content.theme.colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.calendarWeekdaysRow}>
                    {content.calendarWeekdays.map((label) => (
                      <Text key={label} style={styles.calendarWeekdayLabel}>
                        {label}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {content.calendarDays.map((day) => (
                      <CalendarDayCell
                        key={day.id}
                        day={day}
                        selected={day.id === selectedCalendarDayId}
                        onPress={() =>
                          setSelectedCalendarDayId((current) =>
                            current === day.id ? "" : day.id,
                          )
                        }
                      />
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.calendarSummaryCard,
                    {
                      backgroundColor: content.theme.colors.surface,
                      borderColor: content.theme.colors.stroke,
                    },
                  ]}
                >
                  {selectedCalendarDay ? (
                    <>
                      <View style={styles.calendarSummaryHeader}>
                        <Text style={styles.calendarSummaryTitle}>
                          {buildSelectedDayTitle(selectedCalendarDay.day, locale)}
                        </Text>
                        <Text style={styles.calendarSummaryHint}>
                          {locale === "ru"
                            ? "Повторный тап по дню вернёт месячную сводку."
                            : "Tap the selected day again to return to month summary."}
                        </Text>
                      </View>
                      <View style={styles.calendarSummaryList}>
                        {selectedDayEntries.length > 0 ? (
                          selectedDayEntries.map((row) => (
                            <EventRow key={row.id} row={row} />
                          ))
                        ) : (
                          <Text style={styles.calendarSummaryEmpty}>
                            {locale === "ru"
                              ? "На выбранный день записей пока нет."
                              : "No entries for the selected day yet."}
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.calendarSummaryHeader}>
                        <Text style={styles.calendarSummaryTitle}>
                          {locale === "ru" ? "Итоги за месяц" : "Month summary"}
                        </Text>
                        <Text style={styles.calendarSummaryHint}>
                          {locale === "ru"
                            ? "Тапните день в календаре, чтобы увидеть записи за него."
                            : "Tap a day in the calendar to see entries for it."}
                        </Text>
                      </View>
                      <View style={styles.calendarSummaryStats}>
                        {content.calendarStats.map((item) => (
                          <CalendarStatCard key={item.id} item={item} />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </>
            ) : activeTab?.kind === "charts" ? (
              <>
                <View
                  style={[
                    styles.graphicsCard,
                    {
                      backgroundColor: content.theme.colors.surface,
                      borderColor: content.theme.colors.stroke,
                    },
                  ]}
                >
                  <View style={styles.graphicsCardHeader}>
                    <View style={styles.graphicsCardHeaderCopy}>
                      <Text style={styles.graphicsSectionTitle}>
                        {content.graphicsBarTitle}
                      </Text>
                      <Text style={styles.graphicsCardSubtitle}>
                        {content.graphicsBarSubtitle}
                      </Text>
                    </View>
                    <Text style={styles.graphicsCardMeta}>
                      {content.graphicsBarTotalLabel}
                    </Text>
                  </View>
                  <Text style={styles.graphicsPeakLabel}>
                    {content.graphicsBarPeakLabel}
                  </Text>

                  <View style={styles.barChartList}>
                    {content.graphicsBarData.map((item) => (
                      <View key={item.id} style={styles.barChartRow}>
                        <View style={styles.barChartRowHeader}>
                          <Text
                            style={[
                              styles.barChartCategoryLabel,
                              item.highlighted ? styles.barChartCategoryLabelActive : null,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.barChartRowValue,
                              item.highlighted ? styles.barChartRowValueActive : null,
                            ]}
                          >
                            {formatGraphicsUnitValue(item, locale)}
                          </Text>
                        </View>
                        <View style={styles.barChartRowTrack}>
                          <View
                            style={[
                              styles.barChartRowFill,
                              {
                                backgroundColor: item.color,
                                width: `${(item.value / maxGraphicsBarValue) * 100}%`,
                                opacity: item.highlighted ? 1 : 0.82,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.graphicsCard,
                    {
                      backgroundColor: content.theme.colors.surface,
                      borderColor: content.theme.colors.stroke,
                    },
                  ]}
                >
                  <Text style={styles.graphicsSectionTitle}>
                    {locale === "ru" ? "По категориям" : "By category"}
                  </Text>
                  <Text style={styles.graphicsCardSubtitle}>
                    {locale === "ru"
                      ? "Что видно по каждому модулю за выбранный период."
                      : "What each module shows during the selected period."}
                  </Text>
                  <View style={styles.graphicsCategoryGrid}>
                    {content.graphicsBarData.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.graphicsCategoryCard,
                            {
                              borderColor: content.theme.colors.stroke,
                              backgroundColor: content.theme.colors.surface,
                            },
                          ]}
                        >
                          <View style={styles.graphicsCategoryHeader}>
                            <View
                              style={[
                                styles.graphicsCategoryIconWrap,
                                {
                                  backgroundColor: getGraphicsBadgeBackground(item.icon),
                                  borderColor: getGraphicsBadgeBorder(item.icon),
                                },
                              ]}
                            >
                              <OverviewIcon
                                token={getGraphicsIconToken(item.icon)}
                                size={16}
                              />
                            </View>
                            <Text style={styles.graphicsCategoryLabel}>{item.label}</Text>
                          </View>
                          <Text style={styles.graphicsCategoryValue}>
                            {formatGraphicsUnitValue(item, locale)}
                          </Text>
                          <Text style={styles.graphicsCategoryMeta}>
                            {buildGraphicsCategoryHint(item, locale)}
                          </Text>
                          <View style={styles.graphicsCategoryTrendRow}>
                            {getGraphicsTrendSamples(item.label, locale).map((sample, index) => (
                              <View
                                key={`${item.id}-trend-${index}`}
                                style={[
                                  styles.graphicsCategoryTrendBar,
                                  {
                                    height: 14 + sample * 8,
                                    backgroundColor: item.color,
                                    opacity: sample > 0 ? 0.9 : 0.18,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <Text style={styles.graphicsCategoryFootnote}>
                            {buildGraphicsCategoryFootnote(item, locale)}
                          </Text>
                        </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.eventsTitle}>{content.eventsTitle}</Text>
                {content.events.map((section) => (
                  <View key={section.id} style={styles.eventSection}>
                    <Text style={styles.eventDate}>{section.date}</Text>
                    <View style={styles.eventList}>
                      {section.rows.map((row) => (
                        <EventRow key={row.id} row={row} />
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

        </View>
      </ImageBackground>
    </Animated.View>
  );
}

function formatGraphicsUnitValue(
  item: Pick<ChildOverviewBarDatum, "value" | "unit">,
  locale: MobileLocale,
) {
  if (locale === "ru") {
    if (item.unit === "episodes") {
      return `${item.value} ${item.value === 1 ? "эпизод" : item.value < 5 ? "эпизода" : "эпизодов"}`;
    }

    if (item.unit === "sleeps") {
      return `${item.value} ${item.value === 1 ? "сон" : item.value < 5 ? "сна" : "снов"}`;
    }

    if (item.unit === "measurements") {
      return `${item.value} ${item.value === 1 ? "замер" : item.value < 5 ? "замера" : "замеров"}`;
    }

    return `${item.value} ${item.value === 1 ? "запись" : item.value < 5 ? "записи" : "записей"}`;
  }

  if (item.unit === "episodes") {
    return `${item.value} ${item.value === 1 ? "episode" : "episodes"}`;
  }

  if (item.unit === "sleeps") {
    return `${item.value} ${item.value === 1 ? "sleep" : "sleeps"}`;
  }

  if (item.unit === "measurements") {
    return `${item.value} ${item.value === 1 ? "measurement" : "measurements"}`;
  }

  return `${item.value} ${item.value === 1 ? "entry" : "entries"}`;
}

function buildGraphicsCategoryHint(
  item: Pick<ChildOverviewBarDatum, "label" | "value" | "highlighted" | "unit">,
  locale: MobileLocale,
) {
  if (locale === "ru") {
    if (item.highlighted) {
      return "Чаще всего родители отмечали именно это.";
    }

    if (item.unit === "episodes") {
      return "Болезни встречались реже, чем повседневные записи.";
    }

    if (item.unit === "measurements") {
      return "Замеры пока редкие, поэтому динамика только намечается.";
    }

    return "По этой категории уже видно повторяющийся ритм.";
  }

  if (item.highlighted) {
    return "This was the category parents logged most often.";
  }

  if (item.unit === "episodes") {
    return "Illness appeared less often than everyday tracking.";
  }

  if (item.unit === "measurements") {
    return "Measurements are still sparse, so the trend is only starting to form.";
  }

  return "This category already shows a recurring rhythm.";
}

function buildGraphicsCategoryFootnote(
  item: Pick<ChildOverviewBarDatum, "label" | "unit" | "value">,
  locale: MobileLocale,
) {
  const label = item.label.toLowerCase();

  if (locale === "ru") {
    if (label.includes("корм")) {
      return "Пик пришёлся на середину периода.";
    }

    if (label.includes("сон")) {
      return "Сон отмечался не каждый день, но без длинных пауз.";
    }

    if (label.includes("бол")) {
      return "Последний эпизод попал ближе к концу периода.";
    }

    return "Для более уверенной тенденции нужно ещё несколько записей.";
  }

  if (label.includes("feed")) {
    return "The busiest point came around the middle of the period.";
  }

  if (label.includes("sleep")) {
    return "Sleep was not logged daily, but there were no long gaps.";
  }

  if (label.includes("ill")) {
    return "The latest episode landed closer to the end of the period.";
  }

  return "A few more records will make the trend more reliable.";
}

function getGraphicsTrendSamples(label: string, locale: MobileLocale) {
  const normalized = label.toLowerCase();

  if (locale === "ru") {
    if (normalized.includes("корм")) {
      return [0.2, 0.6, 0.9, 0.5, 0.8, 0.35, 0.55];
    }

    if (normalized.includes("сон")) {
      return [0.15, 0.5, 0.25, 0.7, 0.2, 0.6, 0.3];
    }

    if (normalized.includes("бол")) {
      return [0, 0.2, 0, 0, 0.55, 0, 0.45];
    }

    return [0, 0, 0.18, 0, 0.22, 0, 0.16];
  }

  if (normalized.includes("feed")) {
    return [0.2, 0.6, 0.9, 0.5, 0.8, 0.35, 0.55];
  }

  if (normalized.includes("sleep")) {
    return [0.15, 0.5, 0.25, 0.7, 0.2, 0.6, 0.3];
  }

  if (normalized.includes("ill")) {
    return [0, 0.2, 0, 0, 0.55, 0, 0.45];
  }

  return [0, 0, 0.18, 0, 0.22, 0, 0.16];
}

function EventRow({
  row,
}: {
  row: ChildOverviewEventRow;
}) {
  return (
    <View style={styles.eventRow}>
      <Text style={styles.eventTime}>{row.time}</Text>
      <View style={styles.eventTimelineColumn}>
        <View style={styles.eventDot} />
        <View style={styles.eventLine} />
      </View>
      <Pressable style={({ pressed }) => [
        styles.eventCard,
        pressed ? styles.eventCardPressed : null,
      ]}>
        <View
          style={[
            styles.eventIconWrap,
            {
              backgroundColor: getOverviewIconBadgeBackground(row.icon.key),
              borderColor: getOverviewIconBadgeBorder(row.icon.key),
            },
          ]}
        >
          <OverviewIcon token={row.icon} size={16} />
        </View>
        <View style={styles.eventCopy}>
          <Text style={styles.eventType}>{row.type}</Text>
          <Text style={styles.eventDetail}>{row.detail}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function CalendarDayCell({
  day,
  selected,
  onPress,
}: {
  day: ChildOverviewCalendarDay;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.calendarDayCell,
        day.muted ? styles.calendarDayCellMuted : null,
        selected ? styles.calendarDayCellSelected : null,
        pressed ? styles.tabPressed : null,
      ]}
    >
      <Text
        style={[
          styles.calendarDayNumber,
          day.muted ? styles.calendarDayNumberMuted : null,
          selected ? styles.calendarDayNumberSelected : null,
        ]}
      >
        {day.day}
      </Text>
      {day.dots.length > 0 ? (
        <View style={styles.calendarDayDots}>
          {day.dots.slice(0, 3).map((dot, index) => (
            <View
              key={`${day.id}-${dot}-${index}`}
              style={[
                styles.calendarDayDot,
                { backgroundColor: getCalendarDotColor(dot) },
              ]}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function CalendarStatCard({ item }: { item: ChildOverviewCalendarStat }) {
  const iconName =
    item.icon === "calendar"
      ? "calendar-month-outline"
      : item.icon === "star"
        ? "star-four-points-outline"
        : "clock-outline";

  return (
    <View style={styles.calendarStatCard}>
      <View style={[styles.calendarStatIconWrap, { backgroundColor: item.iconCircleBg }]}>
        <MaterialCommunityIcons name={iconName} size={16} color="#6C829D" />
      </View>
      <Text style={styles.calendarStatLabel}>{item.label}</Text>
      <Text style={styles.calendarStatValue}>{item.value}</Text>
    </View>
  );
}

function OverviewIcon({
  token,
  size,
}: {
  token: ChildOverviewIconToken;
  size: number;
}) {
  const sharedSource = getSharedOverviewIconSource(token.key);

  if (sharedSource) {
    return (
      <Image
        source={sharedSource}
        style={{ width: size + 12, height: size + 12 }}
        resizeMode="contain"
      />
    );
  }

  if (token.key === "sleep") {
    return <Feather name="moon" size={size} color={token.color} />;
  }

  if (token.key === "feeding") {
    return <MaterialCommunityIcons name="baby-bottle-outline" size={size} color={token.color} />;
  }

  if (token.key === "illness") {
    return <MaterialCommunityIcons name="thermometer" size={size} color={token.color} />;
  }

  if (token.key === "weightHeight") {
    return <MaterialCommunityIcons name="scale-bathroom" size={size} color={token.color} />;
  }

  if (token.key === "notes") {
    return <Feather name="clipboard" size={size} color={token.color} />;
  }

  if (token.key === "bottomChildren") {
    return <MaterialCommunityIcons name="human-child" size={size} color={token.color} />;
  }

  if (token.key === "bottomPills") {
    return <MaterialCommunityIcons name="pill" size={size} color={token.color} />;
  }

  if (token.key === "bottomMedicineCabinet") {
    return <MaterialCommunityIcons name="medical-bag" size={size} color={token.color} />;
  }

  return <Feather name="menu" size={size} color={token.color} />;
}

function getSharedOverviewIconSource(key: ChildOverviewIconToken["key"]) {
  if (key === "sleep") {
    return redesignSharedIcons.sleep;
  }

  if (key === "feeding") {
    return redesignSharedIcons.feeding;
  }

  if (key === "illness") {
    return redesignSharedIcons.illnessBadge;
  }

  if (key === "weightHeight") {
    return redesignSharedIcons.height;
  }

  if (key === "notes") {
    return redesignSharedIcons.observation;
  }

  if (key === "bottomChildren") {
    return redesignSharedIcons.profile;
  }

  return null;
}

function getCalendarDotColor(dot: ChildOverviewCalendarDay["dots"][number]) {
  if (dot === "sleep") {
    return "#4AA6F0";
  }

  if (dot === "feeding") {
    return "#F7A14C";
  }

  if (dot === "illness") {
    return "#F55F79";
  }

  if (dot === "weight") {
    return "#39C0A6";
  }

  if (dot === "growth") {
    return "#8CCB2E";
  }

  return "#8B74D9";
}

function buildSelectedDayTitle(day: number, locale: string) {
  return locale === "ru" ? `Записи за ${day} мая` : `Entries for May ${day}`;
}

function getGraphicsIconToken(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return { ...baseIconToken("feeding") };
  }

  if (key === "illness") {
    return { ...baseIconToken("illness") };
  }

  if (key === "sleep") {
    return { ...baseIconToken("sleep") };
  }

  if (key === "growth") {
    return {
      key: "weightHeight" as const,
      label: "Рост",
      symbol: "growth",
      color: "#8CCB2E",
      background: "#EEF9DD",
    };
  }

  return {
    key: "weightHeight" as const,
    label: "Вес",
    symbol: "weight",
    color: "#39C0A6",
    background: "#E4FAF5",
  };
}

function getGraphicsBadgeBackground(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return "#FFE7D4";
  }

  if (key === "illness") {
    return "#FFE0E5";
  }

  if (key === "sleep") {
    return "#E7DDFF";
  }

  if (key === "growth") {
    return "#EEF9DD";
  }

  return "#E4FAF5";
}

function getGraphicsBadgeBorder(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return "#F5C89F";
  }

  if (key === "illness") {
    return "#F2B6C0";
  }

  if (key === "sleep") {
    return "#D1BFF5";
  }

  if (key === "growth") {
    return "#D5EBB1";
  }

  return "#BEE7DE";
}

function baseIconToken(key: "feeding" | "illness" | "sleep") {
  if (key === "feeding") {
    return {
      key: "feeding" as const,
      label: "Кормление",
      symbol: "feeding",
      color: "#F7A14C",
      background: "#FFF0DE",
    };
  }

  if (key === "illness") {
    return {
      key: "illness" as const,
      label: "Болезни",
      symbol: "illness",
      color: "#F58E97",
      background: "#FFE8EA",
    };
  }

  return {
    key: "sleep" as const,
    label: "Сон",
    symbol: "sleep",
    color: "#8B74D9",
    background: "#ECE6FF",
  };
}


function getOverviewIconBadgeBackground(key: ChildOverviewIconToken["key"]) {
  if (key === "sleep") {
    return "#E7DDFF";
  }

  if (key === "feeding") {
    return "#FFE7D4";
  }

  if (key === "illness") {
    return "#FFE0E5";
  }

  if (key === "weightHeight") {
    return "#DFF2D8";
  }

  if (key === "notes") {
    return "#FFF0C8";
  }

  if (key === "bottomChildren") {
    return "#FFDCD5";
  }

  return "#EEF3F8";
}

function getOverviewIconBadgeBorder(key: ChildOverviewIconToken["key"]) {
  if (key === "sleep") {
    return "#D1BFF5";
  }

  if (key === "feeding") {
    return "#F5C89F";
  }

  if (key === "illness") {
    return "#F2B6C0";
  }

  if (key === "weightHeight") {
    return "#BFE0B2";
  }

  if (key === "notes") {
    return "#E9D98A";
  }

  if (key === "bottomChildren") {
    return "#F4B8AE";
  }

  return "#D9E3EC";
}
