import { Feather, Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import {
  ChildCard,
  ChildQuickAction,
  getObservationActionLabel,
} from "../model/childrenRedesign";
import { styles } from "../screens/childrenRedesignStyles";
import { getChildModuleTint } from "../../../shared/theme/childModuleTints";
import { JournalEntryKind } from "../../journal/model/journalEntryScreen";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";

const noop = () => {};

type ChildrenChildCardProps = {
  card: ChildCard;
  collapsed: boolean;
  onToggleCollapse: (cardId: string) => void;
  onOpenLockedChild?: () => void;
  sleepElapsedLabel: string | null;
  feedingElapsedLabel: string | null;
  onSleepPress?: (cardId: string) => void;
  onFeedingPress?: (cardId: string) => void;
  onOpenObservation?: (cardId: string) => void;
  onOpenProfile?: (cardId: string) => void;
  onOpenJournalEntry?: (cardId: string, kind: JournalEntryKind) => void;
  hasActiveObservation?: boolean;
};

export function ChildrenChildCard({
  card,
  collapsed,
  onToggleCollapse,
  onOpenLockedChild = noop,
  sleepElapsedLabel,
  feedingElapsedLabel,
  onSleepPress = noop,
  onFeedingPress = noop,
  onOpenObservation = noop,
  onOpenProfile = noop,
  onOpenJournalEntry = noop,
  hasActiveObservation = false,
}: ChildrenChildCardProps) {
  const { locale } = useMobileI18n();
  const lockedHintLabel =
    locale === "ru"
      ? "Доступно только в Plus"
      : locale === "de"
        ? "Nur mit Plus verfügbar"
        : locale === "pl"
          ? "Dostępne tylko w Plus"
          : "Available only with Plus";
  const handleLockedPress = () => {
    onOpenLockedChild();
  };

  return (
    <View
      style={[
        styles.card,
        card.isLocked ? styles.cardLocked : null,
        collapsed ? styles.cardCollapsed : null,
      ]}
    >
      <Pressable
        onPress={
          card.isLocked
            ? () => onOpenProfile(card.nodeId)
            : () => onToggleCollapse(card.nodeId)
        }
        hitSlop={8}
        style={({ pressed }) => [
          styles.collapseButton,
          card.isLocked ? styles.lockedCollapseButton : null,
          pressed ? styles.collapseButtonPressed : null,
        ]}
      >
        <Ionicons
          name={card.isLocked ? "lock-closed" : collapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color={card.isLocked ? "#C0587B" : "#F26F6C"}
        />
      </Pressable>

      <Pressable
        onPress={
          card.isLocked
            ? () => onOpenProfile(card.nodeId)
            : () => onToggleCollapse(card.nodeId)
        }
        style={({ pressed }) => [
          styles.cardHeroRow,
          pressed ? styles.cardHeroRowPressed : null,
        ]}
      >
        <View style={styles.avatarShell}>
          {card.avatarSource ? (
            <Image
              source={card.avatarSource}
              defaultSource={getLocalAssetDefaultSource(card.avatarSource)}
              style={styles.avatarImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : null}
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.childNameRow}>
            <Text style={styles.childName}>{card.name}</Text>
            {card.child.gender ? (
              <View
                style={[
                  styles.genderTip,
                  card.child.gender === "boy"
                    ? styles.genderTipBoy
                    : styles.genderTipGirl,
                ]}
              >
                {card.child.gender === "boy" ? (
                  <Ionicons
                    name="car-sport-outline"
                    size={12}
                    color="#4E7DB0"
                  />
                ) : (
                  <Feather name="heart" size={11} color="#C56A95" />
                )}
              </View>
            ) : null}
          </View>
          {card.stats ? (
            <Text style={styles.childStats}>{card.stats}</Text>
          ) : null}
          {card.isLocked ? (
            <View style={styles.cardLockedHintRow}>
              <View style={styles.cardLockedBadge}>
                <Text style={styles.cardLockedBadgeText}>Plus</Text>
              </View>
              <Text style={styles.cardLockedHintText}>{lockedHintLabel}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View
        pointerEvents={collapsed ? "none" : "auto"}
        style={[
          styles.quickActionsGrid,
          collapsed ? styles.quickActionsGridHidden : null,
        ]}
      >
        {card.quickActions.map((action) => (
          <QuickActionCard
            key={action.nodeId}
            action={action}
            observationActionLabel={
              action.kind === "observation"
                ? getObservationActionLabel(locale, hasActiveObservation)
                : undefined
            }
            sleepElapsedLabel={sleepElapsedLabel}
            feedingElapsedLabel={feedingElapsedLabel}
            onPress={() => {
              if (card.isLocked) {
                handleLockedPress();
                return;
              }

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
              if (action.kind === "observation") {
                onOpenObservation(card.nodeId);
                return;
              }
              noop();
            }}
          />
        ))}
      </View>
    </View>
  );
}

function QuickActionCard({
  action,
  observationActionLabel,
  sleepElapsedLabel,
  feedingElapsedLabel,
  onPress,
}: {
  action: ChildQuickAction;
  observationActionLabel?: string;
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
      : action.kind === "observation" && observationActionLabel
        ? observationActionLabel
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
            defaultSource={getLocalAssetDefaultSource(action.imageSource)}
            style={styles.quickActionArt}
            resizeMode="contain"
            fadeDuration={0}
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
