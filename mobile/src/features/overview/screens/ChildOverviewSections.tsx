import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type {
  ChildOverviewCalendarDay,
  ChildOverviewScreenContent,
} from "../model/childOverviewScreen";
import {
  buildGraphicsCategoryFootnote,
  buildGraphicsCategoryHint,
  buildSelectedDayTitle,
  CalendarDayCell,
  CalendarStatCard,
  EventRow,
  formatGraphicsUnitValue,
  getGraphicsBadgeBackground,
  getGraphicsBadgeBorder,
  getGraphicsIconToken,
  getGraphicsTrendSamples,
  OverviewIcon,
} from "./ChildOverviewScreenParts";
import { styles } from "./childOverviewScreenStyles";

export function OverviewCalendarSection({
  content,
  locale,
  selectedCalendarDayId,
  selectedCalendarDay,
  selectedDayEntries,
  onSelectCalendarDay,
}: {
  content: ChildOverviewScreenContent;
  locale: MobileLocale;
  selectedCalendarDayId: string;
  selectedCalendarDay: ChildOverviewCalendarDay | null;
  selectedDayEntries: ChildOverviewScreenContent["selectedDayEntries"];
  onSelectCalendarDay: (dayId: string) => void;
}) {
  return (
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
              disabled
              style={({ pressed }) => [
                styles.calendarNavButton,
                styles.calendarNavButtonDisabled,
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
              disabled
              style={({ pressed }) => [
                styles.calendarNavButton,
                styles.calendarNavButtonDisabled,
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
              onPress={() => onSelectCalendarDay(day.id)}
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
                {content.selectedDayToggleHint}
              </Text>
            </View>
            <View style={styles.calendarSummaryList}>
              {selectedDayEntries.length > 0 ? (
                selectedDayEntries.map((row) => (
                  <EventRow key={row.id} row={row} />
                ))
              ) : (
                <Text style={styles.calendarSummaryEmpty}>
                  {content.selectedDayEmptyLabel}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.calendarSummaryHeader}>
              <Text style={styles.calendarSummaryTitle}>
                {content.calendarMonthSummaryTitle}
              </Text>
              <Text style={styles.calendarSummaryHint}>
                {content.calendarMonthSummaryHint}
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
  );
}

export function OverviewChartsSection({
  content,
  locale,
  maxGraphicsBarValue,
}: {
  content: ChildOverviewScreenContent;
  locale: MobileLocale;
  maxGraphicsBarValue: number;
}) {
  return (
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
          {content.graphicsCategoryTitle}
        </Text>
        <Text style={styles.graphicsCardSubtitle}>
          {content.graphicsCategorySubtitle}
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
                  <OverviewIcon token={getGraphicsIconToken(item.icon)} size={16} />
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
  );
}

export function OverviewEventsSection({
  content,
}: {
  content: ChildOverviewScreenContent;
}) {
  return (
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
  );
}
