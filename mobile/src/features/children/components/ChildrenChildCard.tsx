import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { ChildCard, ChildQuickAction } from "../model/childrenRedesign";
import { styles } from "../screens/childrenRedesignStyles";
import { getChildModuleTint } from "../../../shared/theme/childModuleTints";

const noop = () => {};

type ChildrenChildCardProps = {
  card: ChildCard;
  collapsed: boolean;
  onToggleCollapse: (cardId: string) => void;
  sleepElapsedLabel: string | null;
  onSleepPress?: (cardId: string) => void;
  onOpenProfile?: (cardId: string) => void;
};

export function ChildrenChildCard({
  card,
  collapsed,
  onToggleCollapse,
  sleepElapsedLabel,
  onSleepPress = noop,
  onOpenProfile = noop,
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

      <View style={styles.cardHeroRow}>
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
      </View>

      {!collapsed ? (
        <View style={styles.quickActionsGrid}>
          {card.quickActions.map((action) => (
            <QuickActionCard
              key={action.nodeId}
              action={action}
              sleepElapsedLabel={sleepElapsedLabel}
              onPress={() => {
                if (action.kind === "sleep") {
                  onSleepPress(card.nodeId);
                  return;
                }
                if (action.kind === "profile") {
                  onOpenProfile(card.nodeId);
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
  onPress,
}: {
  action: ChildQuickAction;
  sleepElapsedLabel: string | null;
  onPress: () => void;
}) {
  const isSleepAction = action.kind === "sleep";
  const isActive = isSleepAction && Boolean(sleepElapsedLabel);
  const actionLabel = isActive ? sleepElapsedLabel : action.label;
  const tint = getQuickActionTint(action.kind, isActive);

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

function getQuickActionTint(kind: ChildQuickAction["kind"], isActive: boolean) {
  if (kind === "sleep") {
    return getChildModuleTint("sleep", { active: isActive });
  }

  if (kind === "feeding") {
    return getChildModuleTint("feeding");
  }

  if (kind === "observation") {
    return getChildModuleTint("observation");
  }

  return getChildModuleTint("profile");
}
