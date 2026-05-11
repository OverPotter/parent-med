import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, useMemo, useState } from "react";
import { Animated, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { ChildCard } from "../../children/model/childrenRedesign";
import { illnessAssets } from "../assets";
import { buildIllnessJournalContent, getObservationEntryCount } from "../model/illnessJournal";
import { IllnessQuickActionKind, MobileIllnessObservation } from "../model/illnessObservation";
import { styles } from "./illnessJournalStyles";
import { formatIllnessDateLabel } from "../model/illnessOnboarding";

type IllnessJournalScreenProps = {
  children: ChildCard[];
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  focusedChildId: string;
  visible: boolean;
  onBack: () => void;
  onAddEntry: (childId: string, kind: IllnessQuickActionKind) => void;
  onFinishObservation: (childId: string) => void;
  onOpenChildren: () => void;
};

export function IllnessJournalScreen({
  children,
  observationsByChildId,
  focusedChildId,
  visible,
  onBack,
  onAddEntry,
  onFinishObservation,
  onOpenChildren,
}: IllnessJournalScreenProps) {
  const { locale } = useMobileI18n();
  const content = buildIllnessJournalContent(locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const [expandedChildId, setExpandedChildId] = useState<string>("");
  const [pendingFinishChildId, setPendingFinishChildId] = useState<string | null>(null);

  const activeCards = useMemo(() => {
    const mapped = children
      .map((child) => ({
        child,
        observation: observationsByChildId[child.nodeId] ?? null,
      }))
      .filter((item) => item.observation);

    return mapped.sort((left, right) => {
      if (left.child.nodeId === focusedChildId) return -1;
      if (right.child.nodeId === focusedChildId) return 1;
      return 0;
    });
  }, [children, focusedChildId, observationsByChildId]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <View style={styles.background}>
        <View style={styles.root}>
          <View style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]} {...panHandlers} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            {activeCards.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{content.emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{content.emptySubtitle}</Text>
                <Pressable style={styles.emptyButton} onPress={onOpenChildren}>
                  <Text style={styles.emptyButtonText}>{content.emptyPrimaryLabel}</Text>
                </Pressable>
              </View>
            ) : null}

            {activeCards.map(({ child, observation }) => {
              const latestTemperature = observation!.entries.find((entry) => entry.kind === "temperature");
              const latestMedicine = observation!.entries.find((entry) => entry.kind === "medicine");
              const latestReminder = observation!.entries.find((entry) => entry.kind === "reminder");
              const isExpanded = expandedChildId === child.nodeId;

              return (
                <View key={child.nodeId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarWrap}>
                      <Image source={child.avatarSource} style={styles.avatar as never} resizeMode="contain" />
                    </View>
                    <View style={styles.cardHeaderCopy}>
                      <View style={styles.nameRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.childName}>{child.name}</Text>
                        <View style={styles.illnessBadge}>
                          <Text style={styles.illnessBadgeText}>{content.illnessBadge}</Text>
                        </View>
                      </View>
                      <Text style={styles.childStats}>{child.stats}</Text>
                      <Text style={styles.observationSince}>
                        {content.observationSince(
                          formatIllnessDateLabel(observation!.startedAt, locale),
                        )}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.finishButton}
                      onPress={() => setPendingFinishChildId(child.nodeId)}
                    >
                      <Text style={styles.finishButtonText}>{content.finishLabel}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.chipsRow}>
                    <SummaryChip
                      icon="thermometer"
                      text={latestTemperature?.title ?? content.summaryChipFallbacks.temperature}
                      backgroundColor="#FFF9F8"
                      borderColor="#F1DAD4"
                      iconBackground="#FFD6D8"
                      iconColor="#F56F68"
                    />
                    <SummaryChip
                      icon="pill"
                      text={latestMedicine?.title ?? content.summaryChipFallbacks.medicine}
                      backgroundColor="#FFF9F2"
                      borderColor="#F1DAD0"
                      iconBackground="#FFE0B9"
                      iconColor="#F59B45"
                    />
                    <SummaryChip
                      icon="bell-outline"
                      text={latestReminder?.title ?? content.summaryChipFallbacks.reminder}
                      backgroundColor="#FFFAFF"
                      borderColor="#E8DDF5"
                      iconBackground="#E8DDFF"
                      iconColor="#8B5CF6"
                    />
                  </View>

                  <View style={styles.quickActionsGrid}>
                    <QuickActionButton
                      kind="temperature"
                      label={content.quickActionLabels.temperature}
                      onPress={() => onAddEntry(child.nodeId, "temperature")}
                    />
                    <QuickActionButton
                      kind="medicine"
                      label={content.quickActionLabels.medicine}
                      onPress={() => onAddEntry(child.nodeId, "medicine")}
                    />
                    <QuickActionButton
                      kind="note"
                      label={content.quickActionLabels.note}
                      onPress={() => onAddEntry(child.nodeId, "note")}
                    />
                    <QuickActionButton
                      kind="reminder"
                      label={content.quickActionLabels.reminder}
                      onPress={() => onAddEntry(child.nodeId, "reminder")}
                    />
                  </View>

                  <Pressable
                    style={styles.feedButton}
                    onPress={() =>
                      setExpandedChildId((current) =>
                        current === child.nodeId ? "" : child.nodeId,
                      )
                    }
                  >
                    <View style={styles.feedLeft}>
                      <View style={styles.feedIconWrap}>
                        <Feather name="list" size={18} color="#F56F68" />
                      </View>
                      <Text style={styles.feedLabel}>
                        {content.feedLabel(getObservationEntryCount(observation!))}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-right"}
                      size={20}
                      color="#A28B82"
                    />
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.entriesWrap}>
                      {observation!.entries.map((entry) => (
                        <View key={entry.id} style={styles.entryRow}>
                          <Text style={styles.entryTitle}>{entry.title}</Text>
                          <Text style={styles.entrySubtitle}>{entry.subtitle}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {pendingFinishChildId ? (
        <View style={styles.confirmOverlay}>
          <Pressable style={styles.confirmBackdrop} onPress={() => setPendingFinishChildId(null)} />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{content.finishTitle}</Text>
            <Text style={styles.confirmDescription}>{content.finishDescription}</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setPendingFinishChildId(null)}>
                <Text style={styles.secondaryButtonText}>{content.finishCancelLabel}</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  onFinishObservation(pendingFinishChildId);
                  setPendingFinishChildId(null);
                }}
              >
                <Text style={styles.primaryButtonText}>{content.finishConfirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

function SummaryChip({
  icon,
  text,
  backgroundColor,
  borderColor,
  iconBackground,
  iconColor,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  text: string;
  backgroundColor: string;
  borderColor: string;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor, borderColor }]}>
      <View style={[styles.chipIconWrap, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={styles.chipText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function QuickActionButton({
  kind,
  label,
  onPress,
}: {
  kind: IllnessQuickActionKind;
  label: string;
  onPress: () => void;
}) {
  const palette =
    kind === "temperature"
      ? {
          background: "#FFF0F0",
          border: "#F5C7C8",
          iconBg: "#FFD6D8",
          asset: illnessAssets.journal.quickTemperature,
        }
      : kind === "medicine"
        ? {
            background: "#FFF4E6",
            border: "#F2D4AF",
            iconBg: "#FFE0B9",
            asset: illnessAssets.journal.quickMedicine,
          }
        : kind === "note"
          ? {
              background: "#EFFAF3",
              border: "#C8E4D1",
              iconBg: "#D8F1E1",
              asset: illnessAssets.journal.quickNote,
            }
          : {
              background: "#F5F0FF",
              border: "#D9C9F6",
              iconBg: "#E8DDFF",
              asset: illnessAssets.journal.quickReminder,
            };

  return (
    <Pressable style={[styles.quickActionButton, { backgroundColor: palette.background, borderColor: palette.border }]} onPress={onPress}>
      <View style={[styles.quickActionIconWrap, { backgroundColor: palette.iconBg }]}>
        <Image source={palette.asset} style={styles.quickActionIconImage} resizeMode="contain" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}
