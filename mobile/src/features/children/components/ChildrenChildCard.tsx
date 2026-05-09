import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { ChildCard, ChildQuickAction } from "../model/childrenRedesign";
import { styles } from "../screens/childrenRedesignStyles";
import { getChildModuleTint } from "../../../shared/theme/childModuleTints";
import { JournalEntryKind } from "../../journal/model/journalEntryScreen";

const noop = () => {};

type ChildrenChildCardProps = {
  card: ChildCard;
  collapsed: boolean;
  onToggleCollapse: (cardId: string) => void;
  sleepElapsedLabel: string | null;
  feedingElapsedLabel: string | null;
  onSleepPress?: (cardId: string) => void;
  onFeedingPress?: (cardId: string) => void;
  onOpenProfile?: (cardId: string) => void;
  onOpenJournalEntry?: (cardId: string, kind: JournalEntryKind) => void;
};

export function ChildrenChildCard({
  card,
  collapsed,
  onToggleCollapse,
  sleepElapsedLabel,
  feedingElapsedLabel,
  onSleepPress = noop,
  onFeedingPress = noop,
  onOpenProfile = noop,
  onOpenJournalEntry = noop,
}: ChildrenChildCardProps) {
  return (
    <View style={[styles.card, collapsed ? styles.cardCollapsed : null]}>
      <Pressable
        onPress={() => onToggleCollapse(card.nodeId)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.collapseButton,
          pressed ? styles.collapseButtonPressed : null,
        ]}
      >
        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color="#F26F6C"
        />
      </Pressable>

      <Pressable
        onPress={() => onToggleCollapse(card.nodeId)}
        style={({ pressed }) => [
          styles.cardHeroRow,
          pressed ? styles.cardHeroRowPressed : null,
        ]}
      >
        <View style={styles.avatarShell}>
          <Image
            source={card.avatarSource}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.childName}>{card.name}</Text>
          {card.liveActivityVisible ? (
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveChipText}>{card.liveActivityText}</Text>
            </View>
          ) : null}
          <Text style={styles.childStats}>{card.stats}</Text>
        </View>
      </Pressable>

      {!collapsed ? (
        <View style={styles.quickActionsGrid}>
          {card.quickActions.map((action) => (
            <QuickActionCard
              key={action.nodeId}
              action={action}
              sleepElapsedLabel={sleepElapsedLabel}
              feedingElapsedLabel={feedingElapsedLabel}
              onPress={() => {
                if (action.kind === "sleep") {
                  onSleepPress(card.nodeId);
                  return;
                }
                if (action.kind === "profile") {
                  onOpenProfile(card.nodeId);
                  return;
                }
                if (action.kind === "feeding") {
                  onFeedingPress(card.nodeId);
                  return;
                }
                noop();
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function QuickActionCard({
  action,
  sleepElapsedLabel,
  feedingElapsedLabel,
  onPress,
}: {
  action: ChildQuickAction;
  sleepElapsedLabel: string | null;
  feedingElapsedLabel: string | null;
  onPress: () => void;
}) {
  const isSleepAction = action.kind === "sleep";
  const isFeedingAction = action.kind === "feeding";
  const isActive =
    (isSleepAction && Boolean(sleepElapsedLabel)) ||
    (isFeedingAction && Boolean(feedingElapsedLabel));
  const actionLabel = isSleepAction
    ? isActive && sleepElapsedLabel
      ? sleepElapsedLabel
      : action.label
    : isFeedingAction
      ? isActive && feedingElapsedLabel
        ? feedingElapsedLabel
        : action.label
      : action.label;
  const tint = getQuickActionTint(action.kind);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        {
          backgroundColor: tint.backgroundColor,
          borderColor: tint.borderColor,
        },
        pressed ? styles.quickActionCardPressed : null,
      ]}
    >
      <View style={styles.quickActionContent}>
        <View
          style={[
            styles.quickActionIconSlot,
            isSleepAction ? styles.quickActionIconSlotSleep : null,
          ]}
        >
          <Image
            source={action.imageSource}
            style={styles.quickActionArt}
            resizeMode="contain"
          />
        </View>
        <Text
          style={[
            styles.quickActionLabel,
            isActive ? styles.quickActionLabelActive : null,
          ]}
          numberOfLines={1}
        >
          {actionLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function getQuickActionTint(kind: ChildQuickAction["kind"]) {
  if (kind === "sleep") {
    return getChildModuleTint("sleep");
  }

  if (kind === "feeding") {
    return getChildModuleTint("feeding");
  }

  if (kind === "observation") {
    return getChildModuleTint("observation");
  }

  return getChildModuleTint("profile");
}
