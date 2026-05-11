import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import {
  AnalyticsEpisodeCard,
  AnalyticsHighlightCard,
  AnalyticsInsightItem,
  AnalyticsPeriodOption,
} from "../model/analyticsScreen";
import { styles } from "./analyticsScreenStyles";

export function AnalyticsPeriodTabs({
  items,
  activeId,
  onSelect,
}: {
  items: AnalyticsPeriodOption[];
  activeId: AnalyticsPeriodOption["id"];
  onSelect: (id: AnalyticsPeriodOption["id"]) => void;
}) {
  return (
    <View style={styles.periodTabsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodTabs}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [
                styles.periodTab,
                isActive ? styles.periodTabActive : null,
                pressed ? styles.periodTabPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.periodTabText,
                  isActive ? styles.periodTabTextActive : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function AnalyticsSummaryCard({
  title,
  insights,
  highlights,
  avatarSource,
}: {
  title: string;
  insights: AnalyticsInsightItem[];
  highlights: AnalyticsHighlightCard[];
  avatarSource: any;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <View style={styles.summaryInsights}>
          {insights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </View>
        <View style={styles.summaryHighlightsList}>
          {highlights.map((highlight) => (
            <HighlightRow key={highlight.id} card={highlight} />
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
          <Ionicons name="leaf-outline" size={16} color="#D79B87" />
        </View>
        <View style={[styles.decorBadge, styles.decorHeartBottom]}>
          <Ionicons name="heart" size={14} color="#E3A393" />
        </View>
        <View style={[styles.decorBadge, styles.decorHeartBottomLeft]}>
          <Ionicons name="heart" size={13} color="#E7AA9B" />
        </View>
        <View style={[styles.decorBadge, styles.decorLeafMidLeft]}>
          <Ionicons name="leaf-outline" size={14} color="#D49A86" />
        </View>
        <View style={[styles.decorBadge, styles.decorHeartMidRight]}>
          <Ionicons name="heart" size={12} color="#E5A193" />
        </View>
        <View style={[styles.decorBadge, styles.decorLeafBottomCenter]}>
          <Ionicons name="leaf-outline" size={13} color="#DCA08E" />
        </View>
        <View style={[styles.decorBadge, styles.decorLeafNearFeet]}>
          <Ionicons name="leaf-outline" size={11} color="#CF947F" />
        </View>
        <Image source={avatarSource} style={styles.summaryAvatar} resizeMode="contain" />
      </View>
    </View>
  );
}

export function AnalyticsEpisodeRow({
  episode,
  isLast,
  isDeleteOpen,
  deleteLabel,
  onDeleteOpenChange,
  onRequestDeleteEpisode,
  onOpenEpisode,
}: {
  episode: AnalyticsEpisodeCard;
  isLast: boolean;
  isDeleteOpen: boolean;
  deleteLabel: string;
  onDeleteOpenChange: (isOpen: boolean) => void;
  onRequestDeleteEpisode: (episode: AnalyticsEpisodeCard) => void;
  onOpenEpisode: (episode: AnalyticsEpisodeCard) => void;
}) {
  return (
    <View style={styles.episodeRow}>
      <View style={styles.episodeLeftColumn}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeMonth}>{episode.monthLabel}</Text>
          <Text style={styles.dateBadgeDay}>{episode.dayLabel}</Text>
        </View>
      </View>
      <View style={styles.episodeCenterColumn}>
        <View style={styles.episodeTimelineAxis}>
          <View style={styles.episodeTimelineDot} />
          {!isLast ? <View style={styles.episodeTimelineLine} /> : null}
        </View>
      </View>
      <View style={styles.episodeSwipeWrap}>
        <SwipeToDeleteRow
          isOpen={isDeleteOpen}
          onPress={() => onOpenEpisode(episode)}
          onDelete={() => {
            onRequestDeleteEpisode(episode);
          }}
          onOpenChange={onDeleteOpenChange}
          deleteColor="#F29C86"
          deletePressedColor="#E88973"
          deleteLabel={deleteLabel}
          actionWidth={92}
          borderRadius={24}
        >
          <View style={styles.episodeCard}>
            <View style={styles.episodeCopy}>
              <Text style={styles.episodeMeta}>{episode.meta}</Text>
              <Text style={styles.episodeTitle}>{episode.title}</Text>
              <Text style={styles.episodeSubtitle}>
                {episode.closedAt} {"•"} {episode.description}
              </Text>
            </View>
          </View>
        </SwipeToDeleteRow>
      </View>
    </View>
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

function HighlightRow({ card }: { card: AnalyticsHighlightCard }) {
  const iconName = {
    duration: "clock-time-four-outline",
    longest: "star-four-points-outline",
  }[card.icon] as "clock-time-four-outline" | "star-four-points-outline";

  return (
    <View style={styles.insightRow}>
      <View
        style={[
          styles.insightIconWrap,
          { backgroundColor: card.accent.iconBackground },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color={card.accent.iconColor}
        />
      </View>
      <View style={styles.insightCopy}>
        <Text style={styles.insightTitle}>{card.value}</Text>
        <Text style={styles.insightSubtitle}>{card.label}</Text>
      </View>
    </View>
  );
}
