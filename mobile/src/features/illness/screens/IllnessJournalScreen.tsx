import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import {
  buildIllnessJournalContent,
  getObservationChildStatsLabel,
  getObservationEntryCount,
} from "../model/illnessJournal";
import { getReminderPlanDisplayTitle } from "../model/illnessReminderPlanTitle";
import { getLeadMobileReminderPlan } from "../model/illnessReminderPlanStats";
import {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../model/illnessObservation";
import { groupIllnessEntriesByDay } from "../model/illnessJournalTimeline";
import {
  EntryRow,
  QuickActionButton,
} from "./IllnessJournalParts";
import { getReminderLeadStatusText } from "./illnessReminderCardStatus";
import { styles } from "./illnessJournalStyles";
import { formatIllnessDateLabel } from "../model/illnessOnboarding";
import { reminderFieldIcons } from "../assets";

type IllnessJournalScreenProps = {
  children: ChildCard[];
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  focusedChildId: string;
  visible: boolean;
  onAddEntry: (childId: string, kind: IllnessQuickActionKind) => void;
  onOpenReminders: (childId: string) => void;
  onTakeReminderDose: (payload: {
    childId: string;
    plan: MobileIllnessObservation["medicationPlans"][number];
  }) => void | Promise<void>;
  onFinishObservation: (childId: string) => void;
  onOpenChildren: () => void;
};

export function IllnessJournalScreen({
  children,
  observationsByChildId,
  focusedChildId,
  visible,
  onAddEntry,
  onOpenReminders,
  onTakeReminderDose,
  onFinishObservation,
  onOpenChildren,
}: IllnessJournalScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack: onOpenChildren,
  });
  const content = buildIllnessJournalContent(locale);
  const [expandedChildId, setExpandedChildId] = useState<string>("");
  const [pendingFinishChildId, setPendingFinishChildId] = useState<
    string | null
  >(null);

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
        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
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
                <Text style={styles.emptySubtitle}>
                  {content.emptySubtitle}
                </Text>
                <Pressable style={styles.emptyButton} onPress={onOpenChildren}>
                  <Text style={styles.emptyButtonText}>
                    {content.emptyPrimaryLabel}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {activeCards.map(({ child, observation }) => {
              const isExpanded = expandedChildId === child.nodeId;
              const now = new Date();
              const leadReminder = observation
                ? getLeadMobileReminderPlan(
                    observation.medicationPlans,
                    observation.entries,
                    now,
                  )
                : null;
              const leadReminderPlan = leadReminder?.plan ?? null;
              const leadReminderStats = leadReminder?.stats ?? null;
              const canTakeReminderNow = !!(
                leadReminderPlan &&
                leadReminderStats &&
                !leadReminderStats.isBlocked
              );

              return (
                <View key={child.nodeId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMainRow}>
                      <View style={styles.avatarWrap}>
                        {child.avatarSource ? (
                          <Image
                            source={child.avatarSource}
                            defaultSource={getLocalAssetDefaultSource(
                              child.avatarSource,
                            )}
                            style={styles.avatar as never}
                            resizeMode="contain"
                            fadeDuration={0}
                          />
                        ) : null}
                      </View>
                      <View style={styles.cardHeaderCopy}>
                        <View style={styles.headerTopRow}>
                          <View style={styles.nameRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.childName}>{child.name}</Text>
                          </View>
                          <Pressable
                            style={styles.finishButton}
                            onPress={() =>
                              setPendingFinishChildId(child.nodeId)
                            }
                          >
                            <Text style={styles.finishButtonText}>
                              {content.finishLabel}
                            </Text>
                          </Pressable>
                        </View>
                        <Text style={styles.childStats}>
                          {getObservationChildStatsLabel(child.stats)}
                        </Text>
                        <Text style={styles.observationSince}>
                          {content.observationSince(
                            formatIllnessDateLabel(
                              observation!.startedAt,
                              locale,
                            ),
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {leadReminderPlan ? (
                    <View style={styles.reminderLeadCard}>
                      <View style={styles.reminderLeadHeader}>
                        <View style={styles.reminderLeadIconWrap}>
                          <Image
                            source={reminderFieldIcons.medicine}
                            defaultSource={getLocalAssetDefaultSource(
                              reminderFieldIcons.medicine,
                            )}
                            style={styles.reminderLeadIconImage as never}
                            resizeMode="contain"
                            fadeDuration={0}
                          />
                        </View>
                        <View style={styles.reminderLeadCopy}>
                          <Text style={styles.reminderLeadTitle}>
                            {getReminderPlanDisplayTitle(leadReminderPlan, locale)}
                          </Text>
                          <Text style={styles.reminderLeadStatus}>
                            {leadReminderStats
                              ? getReminderLeadStatusText(
                                  leadReminderStats,
                                  {
                                    dailyLimitReached:
                                      locale === "ru"
                                        ? "Лимит на сегодня"
                                        : locale === "pl"
                                          ? "Limit na dziś"
                                          : locale === "de"
                                            ? "Tageslimit erreicht"
                                            : "Daily limit reached",
                                    giveAtLabel:
                                      locale === "ru"
                                        ? "Дать в"
                                        : locale === "pl"
                                          ? "Podać o"
                                          : locale === "de"
                                            ? "Geben um"
                                            : "Give at",
                                    nextDosePrefix:
                                      locale === "ru"
                                        ? "Следующий приём в"
                                        : locale === "pl"
                                          ? "Następne podanie o"
                                          : locale === "de"
                                            ? "Nächste Gabe um"
                                            : "Next dose at",
                                    giveNowLabel:
                                      locale === "ru"
                                        ? "Дать сейчас"
                                        : locale === "pl"
                                          ? "Podać teraz"
                                          : locale === "de"
                                            ? "Jetzt geben"
                                            : "Give now",
                                  },
                                  locale,
                                  now,
                                )
                              : ""}
                          </Text>
                        </View>
                      </View>
                      {canTakeReminderNow ? (
                        <View style={styles.reminderLeadActions}>
                          <Pressable
                            style={styles.reminderLeadPrimaryButton}
                            onPress={() => {
                              void onTakeReminderDose({
                                childId: child.nodeId,
                                plan: leadReminderPlan,
                              });
                            }}
                          >
                            <Text style={styles.reminderLeadPrimaryButtonText}>
                              {locale === "ru"
                                ? "Отметить приём"
                                : locale === "pl"
                                  ? "Zapisz podanie"
                                  : locale === "de"
                                    ? "Gabe eintragen"
                                    : "Log dose"}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

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
                      onPress={() => onOpenReminders(child.nodeId)}
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
                        {content.feedLabel(
                          getObservationEntryCount(observation!),
                        )}
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
                      {groupIllnessEntriesByDay(
                        observation!.entries,
                        locale,
                      ).map((section) => (
                        <View key={section.key} style={styles.entrySection}>
                          <Text style={styles.entrySectionTitle}>
                            {section.label}
                          </Text>
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
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setPendingFinishChildId(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{content.finishTitle}</Text>
            <Text style={styles.confirmDescription}>
              {content.finishDescription}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setPendingFinishChildId(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  {content.finishCancelLabel}
                </Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  onFinishObservation(pendingFinishChildId);
                  setPendingFinishChildId(null);
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {content.finishConfirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}
