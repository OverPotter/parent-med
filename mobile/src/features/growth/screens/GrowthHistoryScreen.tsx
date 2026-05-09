import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { journalHeroAssets } from "../../../redesign/screens/journal/assets";
import { JournalScreenScaffold } from "../../../shared/components/JournalScreenScaffold";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  buildGrowthHistoryScreenContent,
  GrowthMetric,
  GrowthTimelineItem,
} from "../model/growthHistoryScreen";
import { styles } from "./growthHistoryScreenStyles";

const growthHeroDecor = journalHeroAssets.growth;

type GrowthHistoryScreenProps = {
  child: ChildCard;
  visible?: boolean;
  onBack?: () => void;
};

const noop = () => {};

export function GrowthHistoryScreen({
  child,
  visible = true,
  onBack = noop,
}: GrowthHistoryScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildGrowthHistoryScreenContent(locale);
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
      activeBackgroundColor="#ECEBFF"
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
              source={growthHeroDecor}
              style={styles.heroDecorAsset}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.metricsPanel}>
          <View style={styles.metricsTopRow}>
            {content.metrics.map((metric, index) => (
              <View key={metric.id} style={styles.metricColumn}>
                <MetricColumn metric={metric} />
                {index < content.metrics.length - 1 ? (
                  <View style={styles.metricDivider} />
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            onPress={noop}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed ? styles.ctaButtonPressed : null,
            ]}
          >
            <View style={styles.ctaIconWrap}>
              <Ionicons name="add" size={20} color="#6F67C9" />
            </View>
            <Text style={styles.ctaLabel}>{content.ctaLabel}</Text>
          </Pressable>
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

function MetricColumn({ metric }: { metric: GrowthMetric }) {
  const iconConfig = {
    ruler: {
      name: "ruler" as const,
      color: "#6F67C9",
      bg: "#E9E6FA",
    },
    minus: {
      name: "minus" as const,
      color: "#6F67C9",
      bg: "#F1EEFF",
    },
    calendar: {
      name: "calendar-month-outline" as const,
      color: "#6F67C9",
      bg: "#E9E6FA",
    },
  }[metric.icon];

  return (
    <View style={styles.metricInner}>
      <View style={[styles.metricIconWrap, { backgroundColor: iconConfig.bg }]}>
        <MaterialCommunityIcons name={iconConfig.name} size={18} color={iconConfig.color} />
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
  item: GrowthTimelineItem;
  onDelete: () => void;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeftColumn}>
        <View style={styles.dateCard}>
          <Text style={styles.dateValue}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.timelineCenterColumn}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      <SwipeToDeleteRow
        onPress={noop}
        onDelete={onDelete}
        deleteColor="#A7A2E8"
        deletePressedColor="#9690DE"
      >
        <View style={styles.entryCard}>
          <View style={styles.entryCopy}>
            <Text style={styles.entryValue}>{item.value}</Text>
            <Text style={styles.entryMeta}>{item.meta}</Text>
          </View>
        </View>
      </SwipeToDeleteRow>
    </View>
  );
}
