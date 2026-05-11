import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Animated, Image, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import {
  MobileBottomTabBar,
  type MobileBottomTabItem,
  type MobileBottomTabKey,
} from "../../../shared/components/MobileBottomTabBar";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import {
  getIllnessSummaryChipAppearance,
} from "../model/illnessJournalAppearance";
import {
  buildIllnessJournalContent,
  getObservationChildStatsLabel,
  getObservationEntryCount,
} from "../model/illnessJournal";
import { IllnessQuickActionKind, MobileIllnessObservation } from "../model/illnessObservation";
import { groupIllnessEntriesByDay } from "../model/illnessJournalTimeline";
import { EntryRow, QuickActionButton, SummaryChip } from "./IllnessJournalParts";
import { styles } from "./illnessJournalStyles";
import { formatIllnessDateLabel } from "../model/illnessOnboarding";

type IllnessJournalScreenProps = {
  children: ChildCard[];
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  focusedChildId: string;
  visible: boolean;
  onAddEntry: (childId: string, kind: IllnessQuickActionKind) => void;
  onFinishObservation: (childId: string) => void;
  onOpenChildren: () => void;
  onSelectTab: (key: MobileBottomTabKey) => void;
};

function buildJournalTabItems(locale: ReturnType<typeof useMobileI18n>["locale"]): MobileBottomTabItem[] {
  return [
    {
      key: "journal",
      label: locale === "ru" ? "Журнал" : locale === "de" ? "Journal" : locale === "pl" ? "Dziennik" : "Journal",
      active: true,
    },
    {
      key: "children",
      label: locale === "ru" ? "Дети" : locale === "de" ? "Kinder" : locale === "pl" ? "Dzieci" : "Children",
      active: false,
    },
    {
      key: "pillbox",
      label: locale === "ru" ? "Таблетница" : locale === "de" ? "Pillenbox" : locale === "pl" ? "Pudełko leków" : "Pillbox",
      active: false,
    },
    {
      key: "cabinet",
      label: locale === "ru" ? "Аптечка" : locale === "de" ? "Hausapotheke" : locale === "pl" ? "Apteczka" : "Cabinet",
      active: false,
    },
  ];
}

export function IllnessJournalScreen({
  children,
  observationsByChildId,
  focusedChildId,
  visible,
  onAddEntry,
  onFinishObservation,
  onOpenChildren,
  onSelectTab,
}: IllnessJournalScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildIllnessJournalContent(locale);
  const [expandedChildId, setExpandedChildId] = useState<string>("");
  const [pendingFinishChildId, setPendingFinishChildId] = useState<string | null>(null);
  const tabItems = useMemo(() => buildJournalTabItems(locale), [locale]);

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
      ]}
    >
      <ImageBackground
        source={redesignBackgrounds.childrenModule}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.backgroundOverlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
      </ImageBackground>

      <View style={styles.screen}>
        <View style={styles.root}>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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
              const isExpanded = expandedChildId === child.nodeId;

              return (
                <View key={child.nodeId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMainRow}>
                      <View style={styles.avatarWrap}>
                        <Image source={child.avatarSource} style={styles.avatar as never} resizeMode="contain" />
                      </View>
                      <View style={styles.cardHeaderCopy}>
                        <View style={styles.headerTopRow}>
                          <View style={styles.nameRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.childName}>{child.name}</Text>
                          </View>
                          <Pressable
                            style={styles.finishButton}
                            onPress={() => setPendingFinishChildId(child.nodeId)}
                          >
                            <Text style={styles.finishButtonText}>{content.finishLabel}</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.childStats}>
                          {getObservationChildStatsLabel(child.stats)}
                        </Text>
                        <Text style={styles.observationSince}>
                          {content.observationSince(
                            formatIllnessDateLabel(observation!.startedAt, locale),
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    {(["temperature", "medicine", "reminder"] as const).map((kind) => {
                      const appearance = getIllnessSummaryChipAppearance(kind);

                      return (
                        <SummaryChip
                          key={kind}
                          icon={appearance.icon}
                          text={content.summaryChipLabels[kind]}
                          backgroundColor={appearance.backgroundColor}
                          borderColor={appearance.borderColor}
                        />
                      );
                    })}
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
                      {groupIllnessEntriesByDay(observation!.entries, locale).map((section) => (
                        <View key={section.key} style={styles.entrySection}>
                          <Text style={styles.entrySectionTitle}>{section.label}</Text>
                          <View style={styles.entrySectionRows}>
                            {section.entries.map((entry, index) => (
                              <EntryRow
                                key={entry.id}
                                entry={entry}
                                isLast={index === section.entries.length - 1}
                                locale={locale}
                              />
                            ))}
                          </View>
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

      <View style={styles.bottomBarLayer}>
        <MobileBottomTabBar items={tabItems} onSelectTab={onSelectTab} />
      </View>
    </Animated.View>
  );
}
