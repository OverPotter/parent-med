import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChildrenChildCard } from "../components/ChildrenChildCard";
import {
  buildChildrenScreenContent,
  buildChildrenStopActionCopy,
} from "../model/childrenRedesign";
import { styles } from "./childrenRedesignStyles";
import { formatElapsedDuration } from "../utils/formatElapsedDuration";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { JournalEntryKind } from "../../journal/model/journalEntryScreen";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";

type ChildrenRedesignScreenProps = {
  onOpenChildProfile?: (cardId: string) => void;
  onOpenJournalEntry?: (cardId: string, kind: JournalEntryKind) => void;
  activeFeedingStartedAtByCardId?: Record<string, string | null>;
  onFeedingPress?: (cardId: string) => void;
};

const noop = () => {};
type PendingStopAction = {
  kind: "sleep" | "feeding";
  cardId: string;
} | null;

export function ChildrenRedesignScreen({
  onOpenChildProfile,
  onOpenJournalEntry,
  activeFeedingStartedAtByCardId = {},
  onFeedingPress = noop,
}: ChildrenRedesignScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const childrenScreenContent = buildChildrenScreenContent(locale, "children");
  const handleOpenChildProfile = onOpenChildProfile ?? noop;
  const handleOpenJournalEntry = onOpenJournalEntry ?? noop;
  const [collapsedCardIds, setCollapsedCardIds] = useState<string[]>(
    childrenScreenContent.cards.map((card) => card.nodeId),
  );
  const [activeSleepStartedAtByCardId, setActiveSleepStartedAtByCardId] =
    useState<Record<string, string | null>>({});
  const [now, setNow] = useState(Date.now());
  const [pendingStopAction, setPendingStopAction] =
    useState<PendingStopAction>(null);
  const stopActionCopy = pendingStopAction
    ? buildChildrenStopActionCopy(locale, pendingStopAction.kind)
    : null;

  const hasActiveSleep = Object.values(activeSleepStartedAtByCardId).some(
    Boolean,
  );
  const hasActiveFeeding = Object.values(activeFeedingStartedAtByCardId).some(
    Boolean,
  );

  useEffect(() => {
    if (!hasActiveSleep && !hasActiveFeeding) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasActiveFeeding, hasActiveSleep]);

  const handleToggleCollapse = (cardId: string) => {
    setCollapsedCardIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  };

  const handleSleepPress = (cardId: string) => {
    if (activeSleepStartedAtByCardId[cardId]) {
      setPendingStopAction({
        kind: "sleep",
        cardId,
      });
      return;
    }

    setNow(Date.now());
    setActiveSleepStartedAtByCardId((current) => ({
      ...current,
      [cardId]: new Date().toISOString(),
    }));
  };

  const handleFeedingQuickActionPress = (cardId: string) => {
    if (activeFeedingStartedAtByCardId[cardId]) {
      setPendingStopAction({
        kind: "feeding",
        cardId,
      });
      return;
    }

    handleOpenJournalEntry(cardId, "feeding");
  };

  const handleConfirmStopAction = () => {
    if (!pendingStopAction) {
      return;
    }

    if (pendingStopAction.kind === "sleep") {
      setNow(Date.now());
      setActiveSleepStartedAtByCardId((current) => ({
        ...current,
        [pendingStopAction.cardId]: null,
      }));
    } else {
      onFeedingPress(pendingStopAction.cardId);
    }

    setPendingStopAction(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
      <ImageBackground
        source={childrenScreenContent.backgroundSource}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
      </ImageBackground>

      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {childrenScreenContent.headerTitle}
            </Text>
            <Text style={styles.subtitle}>
              {childrenScreenContent.headerSubtitle}
            </Text>
          </View>

          <View style={styles.cardsStack}>
            {childrenScreenContent.cards.map((card) => (
              <ChildrenChildCard
                key={card.nodeId}
                card={card}
                collapsed={collapsedCardIds.includes(card.nodeId)}
                onToggleCollapse={handleToggleCollapse}
                sleepElapsedLabel={
                  activeSleepStartedAtByCardId[card.nodeId]
                    ? formatElapsedDuration(
                        activeSleepStartedAtByCardId[card.nodeId] as string,
                        now,
                      )
                    : null
                }
                feedingElapsedLabel={
                  activeFeedingStartedAtByCardId[card.nodeId]
                    ? formatElapsedDuration(
                        activeFeedingStartedAtByCardId[card.nodeId] as string,
                        now,
                      )
                    : null
                }
                onSleepPress={handleSleepPress}
                onFeedingPress={handleFeedingQuickActionPress}
                onOpenProfile={handleOpenChildProfile}
                onOpenJournalEntry={handleOpenJournalEntry}
              />
            ))}
          </View>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.addChildCta,
              pressed ? styles.addChildCtaPressed : null,
            ]}
          >
            <View style={styles.addChildIconCircle}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.addChildLabel}>
              {childrenScreenContent.addChildLabel}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {pendingStopAction ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setPendingStopAction(null)}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>
                {stopActionCopy?.title}
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setPendingStopAction(null)}
                  style={({ pressed }) => [
                    styles.confirmButtonSecondary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonSecondaryText}>
                    {stopActionCopy?.cancelLabel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmStopAction}
                  style={({ pressed }) => [
                    styles.confirmButtonPrimary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonPrimaryText}>
                    {stopActionCopy?.confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
