import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import type {
  ChildOverviewCalendarDay,
  ChildOverviewCalendarStat,
  ChildOverviewEventRow,
  ChildOverviewIconToken,
} from "../model/childOverviewScreen";
import { styles } from "./childOverviewScreenStyles";

export function EventRow({
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
      <Pressable
        style={({ pressed }) => [
          styles.eventCard,
          pressed ? styles.eventCardPressed : null,
        ]}
      >
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

export function CalendarDayCell({
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

export function CalendarStatCard({ item }: { item: ChildOverviewCalendarStat }) {
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

export function OverviewIcon({
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
    return (
      <MaterialCommunityIcons
        name="baby-bottle-outline"
        size={size}
        color={token.color}
      />
    );
  }

  if (token.key === "illness") {
    return <MaterialCommunityIcons name="thermometer" size={size} color={token.color} />;
  }

  if (token.key === "weightHeight") {
    return (
      <MaterialCommunityIcons
        name="scale-bathroom"
        size={size}
        color={token.color}
      />
    );
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

export function getOverviewIconBadgeBackground(key: ChildOverviewIconToken["key"]) {
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

export function getOverviewIconBadgeBorder(key: ChildOverviewIconToken["key"]) {
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
