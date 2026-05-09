import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Text,
  View,
} from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildFeedingHistoryScreenContent,
  FeedingMetric,
  FeedingTimelineItem,
} from "../model/feedingHistoryScreen";
import { styles } from "./feedingHistoryScreenStyles";

const feedingHeroDecor = journalHeroAssets.feeding;

type FeedingHistoryScreenProps = {
  child: ChildCard;
  onBack?: () => void;
};

const noop = () => {};

export function FeedingHistoryScreen({
  child,
  onBack = noop,
}: FeedingHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildFeedingHistoryScreenContent(locale);
  const [activePeriodId, setActivePeriodId] = useState(
    content.periods.find((item) => item.active)?.id ?? content.periods[0]?.id ?? "",
  );
  const [timeline, setTimeline] = useState(content.timeline);

  return (
    <JournalScreenScaffold
      backLabel={content.backLabel}
      title={content.title}
      subtitle={content.subtitle}
      periods={content.periods}
      activePeriodId={activePeriodId}
      onSelectPeriod={setActivePeriodId}
      onBack={onBack}
      activeBackgroundColor="#FFEDE7"
      activeTextColor="#FF6E61"
      headerMarginBottom={14}
      segmentedMarginBottom={12}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{content.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{content.heroSubtitle}</Text>
          </View>
          <View style={styles.heroVisual}>
            <Image
              source={feedingHeroDecor}
              style={styles.heroDecorAsset}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.metricsPanel}>
          {content.metrics.map((metric, index) => (
            <View key={metric.id} style={styles.metricColumn}>
              <MetricColumn metric={metric} />
              {index < content.metrics.length - 1 ? (
                <View style={styles.metricDivider} />
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.historyTitle}>{content.historyTitle}</Text>

      <View style={styles.timelineList}>
        {timeline.map((item) => (
          <TimelineRow
            key={item.id}
            item={item}
            onDelete={() =>
              setTimeline((current) => current.filter((entry) => entry.id !== item.id))
            }
          />
        ))}
      </View>
    </JournalScreenScaffold>
  );
}

function MetricColumn({ metric }: { metric: FeedingMetric }) {
  const iconName = {
    amount: "baby-bottle-outline",
    time: "clock-time-four-outline",
    drop: "water-outline",
  }[metric.icon] as
    | "baby-bottle-outline"
    | "clock-time-four-outline"
    | "water-outline";

  return (
    <View style={styles.metricInner}>
      <View style={styles.metricIconWrap}>
        <MaterialCommunityIcons name={iconName} size={18} color="#FF7668" />
      </View>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricLabel}>{metric.label}</Text>
    </View>
  );
}

function TimelineRow({
  item,
  onDelete,
}: {
  item: FeedingTimelineItem;
  onDelete: () => void;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeftColumn}>
        <View style={styles.timeCard}>
          <Text style={styles.timeValue}>{item.time}</Text>
          <Text style={styles.dayValue}>{item.day}</Text>
        </View>
      </View>

      <View style={styles.timelineCenterColumn}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>

      <SwipeToDeleteRow
        onPress={noop}
        onDelete={onDelete}
        deleteColor="#F29C86"
        deletePressedColor="#E88973"
      >
        <View style={styles.entryCard}>
          <View
            style={[
              styles.entryBadge,
              { backgroundColor: item.badgeBackground },
            ]}
          >
            <MaterialCommunityIcons
              name="baby-bottle-outline"
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.entryCopy}>
            <Text style={styles.entryTitle}>{item.type}</Text>
            <Text style={styles.entryMeta}>{item.meta}</Text>
          </View>
        </View>
      </SwipeToDeleteRow>
    </View>
  );
}
