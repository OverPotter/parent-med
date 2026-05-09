import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Text,
  View,
} from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildSleepHistoryScreenContent,
  SleepMetric,
  SleepTimelineItem,
} from "../model/sleepHistoryScreen";
import { styles } from "./sleepHistoryScreenStyles";

const sleepHeroDecor = journalHeroAssets.sleep;
const sleepUiIcon = redesignSharedIcons.sleep;

type SleepHistoryScreenProps = {
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function SleepHistoryScreen({
  child,
  visible = true,
  onBack = noop,
}: SleepHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildSleepHistoryScreenContent(locale);
  const [activePeriodId, setActivePeriodId] = useState(
    content.periods.find((item) => item.active)?.id ?? content.periods[0]?.id ?? "",
  );
  const [timeline, setTimeline] = useState(content.timeline);

  return (
    <JournalScreenScaffold
      visible={visible}
      backLabel={content.backLabel}
      title={content.title}
      subtitle={content.subtitle}
      periods={content.periods}
      activePeriodId={activePeriodId}
      onSelectPeriod={setActivePeriodId}
      onBack={onBack}
      activeBackgroundColor="#EFE9FF"
      activeTextColor="#6F67C9"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{content.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{content.heroSubtitle}</Text>
          </View>
          <View style={styles.heroDecorArea}>
            <Image
              source={sleepHeroDecor}
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

function MetricColumn({ metric }: { metric: SleepMetric }) {
  const iconConfig = {
    night_sleep: {
      kind: "vector" as const,
      name: "moon-waning-crescent" as const,
      color: "#7E69C7",
      bg: "#E8DDF9",
    },
    clock: {
      kind: "vector" as const,
      name: "clock-time-four-outline" as const,
      color: "#C78234",
      bg: "#FFF0DE",
    },
    zzz: {
      kind: "vector" as const,
      name: "sleep" as const,
      color: "#7E69C7",
      bg: "#E8DDF9",
    },
  }[metric.icon];

  return (
    <View style={styles.metricInner}>
      <View style={[styles.metricIconWrap, { backgroundColor: iconConfig.bg }]}>
        <MaterialCommunityIcons
          name={iconConfig.name}
          size={18}
          color={iconConfig.color}
        />
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{metric.value}</Text>
        {metric.suffix ? <Text style={styles.metricSuffix}>{metric.suffix}</Text> : null}
      </View>
      <Text style={styles.metricLabel}>{metric.label}</Text>
    </View>
  );
}

function TimelineRow({
  item,
  onDelete,
}: {
  item: SleepTimelineItem;
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
        deleteColor="#8F80E3"
        deletePressedColor="#7D6FD4"
        actionWidth={104}
      >
        <View style={styles.entryCard}>
          <View style={[styles.entryBadge, { backgroundColor: item.badgeBackground }]}>
            {item.icon === "night_sleep" ? (
              <Image
                source={sleepUiIcon}
                style={styles.entryBadgeImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons
                name="weather-cloudy-clock"
                size={20}
                color={item.badgeIconColor}
              />
            )}
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
