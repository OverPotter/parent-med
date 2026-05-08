import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChildrenBottomTabBar } from "../components/ChildrenBottomTabBar";
import { ChildrenChildCard } from "../components/ChildrenChildCard";
import { buildChildrenScreenContent } from "../model/childrenRedesign";
import { styles } from "./childrenRedesignStyles";
import { formatElapsedDuration } from "../utils/formatElapsedDuration";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";

type ChildrenRedesignScreenProps = {
  onOpenChildProfile?: (cardId: string) => void;
};

const noop = () => {};

export function ChildrenRedesignScreen({
  onOpenChildProfile,
}: ChildrenRedesignScreenProps) {
  const { locale } = useMobileI18n();
  const childrenScreenContent = buildChildrenScreenContent(locale);
  const handleOpenChildProfile = onOpenChildProfile ?? noop;
  const [collapsedCardIds, setCollapsedCardIds] = useState<string[]>([]);
  const [activeSleepStartedAtByCardId, setActiveSleepStartedAtByCardId] =
    useState<Record<string, string | null>>({});
  const [now, setNow] = useState(Date.now());

  const hasActiveSleep = Object.values(activeSleepStartedAtByCardId).some(
    Boolean,
  );

  useEffect(() => {
    if (!hasActiveSleep) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasActiveSleep]);

  const handleToggleCollapse = (cardId: string) => {
    setCollapsedCardIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  };

  const handleSleepPress = (cardId: string) => {
    setNow(Date.now());
    setActiveSleepStartedAtByCardId((current) => {
      const activeStartedAt = current[cardId];

      if (activeStartedAt) {
        return {
          ...current,
          [cardId]: null,
        };
      }

      return {
        ...current,
        [cardId]: new Date().toISOString(),
      };
    });
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={childrenScreenContent.backgroundSource}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
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
                onSleepPress={handleSleepPress}
                onOpenProfile={handleOpenChildProfile}
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

        <ChildrenBottomTabBar tabs={childrenScreenContent.tabs} />
      </View>
    </View>
  );
}
