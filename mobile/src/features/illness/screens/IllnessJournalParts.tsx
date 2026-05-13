import { Feather } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import { styles } from "./illnessJournalStyles";
import type { IllnessQuickActionKind, MobileIllnessObservation } from "../model/illnessObservation";
import type { IllnessJournalIconDescriptor } from "../model/illnessJournalAppearance";
import {
  getIllnessEntryAppearance,
  getIllnessQuickActionAppearance,
} from "../model/illnessJournalAppearance";
import { formatIllnessEntryTime } from "../model/illnessJournalTimeline";

export function EntryRow({
  entry,
  isLast,
  locale,
}: {
  entry: MobileIllnessObservation["entries"][number];
  isLast: boolean;
  locale: MobileLocale;
}) {
  const appearance = getIllnessEntryAppearance(entry.kind);

  return (
    <View style={styles.entryRow}>
      <Text style={styles.entryTime}>
        {formatIllnessEntryTime(entry.createdAt, locale)}
      </Text>
      <View style={styles.entryTimelineColumn}>
        <View
          style={[
            styles.entryDot,
            { backgroundColor: appearance.timelineColor },
          ]}
        />
        {!isLast ? <View style={styles.entryLine} /> : null}
      </View>
      <View style={styles.entryCard}>
        <View style={styles.entryIconWrap}>
          <JournalIcon icon={appearance.icon} context="entry" />
        </View>
        <View style={styles.entryCopy}>
          <Text style={styles.entryType}>{entry.subtitle}</Text>
          <Text style={styles.entryDetail}>{entry.title}</Text>
        </View>
      </View>
    </View>
  );
}

export function SummaryChip({
  icon,
  text,
  backgroundColor,
  borderColor,
}: {
  icon: IllnessJournalIconDescriptor;
  text: string;
  backgroundColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor, borderColor }]}>
      <View style={styles.chipIconWrap}>
        <JournalIcon icon={icon} context="chip" />
      </View>
      <Text style={styles.chipText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function QuickActionButton({
  kind,
  label,
  onPress,
}: {
  kind: IllnessQuickActionKind;
  label: string;
  onPress: () => void;
}) {
  const appearance = getIllnessQuickActionAppearance(kind);

  return (
    <Pressable
      style={[
        styles.quickActionButton,
        {
          backgroundColor: appearance.backgroundColor,
          borderColor: appearance.borderColor,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionIconWrap}>
        <JournalIcon icon={appearance.icon} context="quickAction" />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function JournalIcon({
  icon,
  context,
}: {
  icon: IllnessJournalIconDescriptor;
  context: "chip" | "quickAction" | "entry";
}) {
  if (icon.type === "feather") {
    return <Feather name={icon.name} size={icon.size} color={icon.color} />;
  }

  return (
    <Image
      source={icon.source}
      defaultSource={getLocalAssetDefaultSource(icon.source)}
      style={resolveJournalAssetIconStyle(context, icon.variant)}
      resizeMode="contain"
      fadeDuration={0}
    />
  );
}

function resolveJournalAssetIconStyle(
  context: "chip" | "quickAction" | "entry",
  variant?: "temperatureChip" | "temperatureQuick" | "temperatureEntry",
) {
  if (context === "chip") {
    return variant === "temperatureChip"
      ? [styles.chipIconImage, styles.temperatureChipIconImage]
      : styles.chipIconImage;
  }

  if (context === "quickAction") {
    return variant === "temperatureQuick"
      ? [styles.quickActionIconImage, styles.temperatureQuickActionIconImage]
      : styles.quickActionIconImage;
  }

  return variant === "temperatureEntry"
    ? [styles.entryIconImage, styles.temperatureEntryIconImage]
    : styles.entryIconImage;
}
