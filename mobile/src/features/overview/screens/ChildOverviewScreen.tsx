import { Feather, Ionicons } from "@expo/vector-icons";
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
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import {
  buildChildOverviewScreenContent,
  ChildOverviewPeriodOption,
} from "../model/childOverviewScreen";
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
  const surfaceTheme = useMobileSurfaceTheme();
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
              <OverviewCalendarSection
                content={content}
                locale={locale}
                selectedCalendarDayId={selectedCalendarDayId}
                selectedCalendarDay={selectedCalendarDay}
                selectedDayEntries={selectedDayEntries}
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
    </Animated.View>
  );
}
