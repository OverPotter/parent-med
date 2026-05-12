import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import type {
  WeightMetric,
  WeightTimelineItem,
} from "../model/weightHistoryScreen";
import { styles } from "./weightHistoryScreenStyles";

export function MetricColumn({ metric }: { metric: WeightMetric }) {
  const iconConfig = {
    weight: {
      name: "scale-bathroom" as const,
      color: "#2C8F85",
      bg: "#CBEFEA",
    },
    minus: {
      name: "minus" as const,
      color: "#2C8F85",
      bg: "#EAF7F4",
    },
    calendar: {
      name: "calendar-month-outline" as const,
      color: "#2C8F85",
      bg: "#E3F8F4",
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
  item: WeightTimelineItem;
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
        deleteColor="#7FCDBF"
        deletePressedColor="#6BBBAC"
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
