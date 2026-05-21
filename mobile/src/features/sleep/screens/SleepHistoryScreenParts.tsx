import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import type {
  SleepMetric,
  SleepTimelineItem,
} from "../model/sleepHistoryScreen";
import type { SleepDialogCopy } from "./sleepHistoryScreenCopy";
import { styles } from "./sleepHistoryScreenStyles";

const sleepUiIcon = redesignSharedIcons.sleep;

export function SleepDialogOverlay({
  copy,
  onDismiss,
  onConfirm,
}: {
  copy: SleepDialogCopy;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.confirmOverlay}>
      <Pressable style={styles.confirmBackdrop} onPress={onDismiss} />
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>{copy.title}</Text>
        <Text style={styles.confirmDescription}>{copy.message}</Text>
        <View style={styles.confirmActions}>
          {copy.cancel ? (
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.confirmButtonSecondary,
                pressed ? styles.confirmButtonPressed : null,
              ]}
            >
              <Text style={styles.confirmButtonSecondaryText}>{copy.cancel}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirmButtonPrimary,
              pressed ? styles.confirmButtonPressed : null,
            ]}
          >
            <Text style={styles.confirmButtonPrimaryText}>{copy.confirm}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MetricColumn({ metric }: { metric: SleepMetric }) {
  const iconConfig = {
    night_sleep: {
      name: "moon-waning-crescent" as const,
      color: "#7E69C7",
      bg: "#E8DDF9",
    },
    clock: {
      name: "clock-time-four-outline" as const,
      color: "#C78234",
      bg: "#FFF0DE",
    },
    zzz: {
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

export function TimelineRow({
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
        style={styles.timelineSwipeRow}
        onDelete={onDelete}
        deleteColor="#8F80E3"
        deletePressedColor="#7D6FD4"
        actionWidth={104}
      >
        <View style={styles.entryCard}>
          <View
            style={[styles.entryBadge, { backgroundColor: item.badgeBackground }]}
          >
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
