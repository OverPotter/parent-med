import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import type {
  GrowthMetric,
  GrowthTimelineItem,
} from "../model/growthHistoryScreen";
import { styles } from "./growthHistoryScreenStyles";

export function MetricColumn({ metric }: { metric: GrowthMetric }) {
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

export function TimelineRow({
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
