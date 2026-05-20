import { Feather, Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import {
  formatBackdatedDate,
  formatBackdatedTime,
} from "../../../shared/lib/backdatedDateTime";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import type { MobileIllnessObservation } from "../model/illnessObservation";
import {
  buildMobileReminderPlanAdministrationStats,
} from "../model/illnessReminderPlanStats";
import { useStoredMedicationIntervalUnit } from "../../settings/session/useStoredMedicationIntervalUnit";
import { ReminderPlanCard } from "./ReminderPlanCard";
import { ReminderRecipientsSheet } from "./ReminderRecipientsSheet";
import { ReminderPlanEditOverlays } from "./ReminderPlanEditOverlays";
import {
  buildReminderScreenCopy,
} from "./illnessReminderScreenCopy";
import {
  buildReminderIntervalSheetOptions,
  buildReminderLimitSheetOptions,
  getReminderCustomIntervalPlaceholder,
  getReminderIntervalCustomLabel,
  getReminderLimitCustomLabel,
  toReminderIntervalCustomValue,
} from "./reminderNumberOptions";
import { useIllnessReminderListController } from "./useIllnessReminderListController";

type IllnessReminderListScreenProps = {
  child: ChildCard;
  observation: MobileIllnessObservation | null;
  familyMembers: MobileFamilyMember[];
  currentAccountId: string;
  visible: boolean;
  backgroundVisible?: boolean;
  onBack: () => void;
  onOpenCreateReminder: () => void;
  onUpdateReminder: (payload: {
    planId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onDeleteReminder: (entryId: string) => void;
  onTakeDose: (payload: {
    plan: MobileEpisodeMedicationPlan;
    administeredAt?: string | null;
  }) => void | Promise<void>;
  onSaveRecipients: (memberAccountIds: string[]) => void | Promise<void>;
};

type ReminderAddCtaProps = {
  label: string;
  onPress: () => void;
};

function ReminderAddCta({ label, onPress }: ReminderAddCtaProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.addReminderCta,
        pressed ? styles.addReminderCtaPressed : null,
      ]}
    >
      <View style={styles.addReminderIconCircle}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </View>
      <Text numberOfLines={1} style={styles.addReminderLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IllnessReminderListScreen({
  child,
  observation,
  familyMembers,
  currentAccountId,
  visible,
  backgroundVisible = false,
  onBack,
  onOpenCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
  onTakeDose,
  onSaveRecipients,
}: IllnessReminderListScreenProps) {
  const { locale } = useMobileI18n();
  const copy = useMemo(() => buildReminderScreenCopy(locale), [locale]);
  const surfaceTheme = useMobileSurfaceTheme();
  const { medicationIntervalUnit } = useStoredMedicationIntervalUnit();
  const { width } = useWindowDimensions();
  const interactive = visible && !backgroundVisible;
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: interactive,
    width,
    onBack,
  });
  const intervalSheetOptions = useMemo(
    () => buildReminderIntervalSheetOptions(medicationIntervalUnit, locale),
    [locale, medicationIntervalUnit],
  );
  const limitSheetOptions = useMemo(() => buildReminderLimitSheetOptions(), []);
  const controller = useIllnessReminderListController({
    childId: child.nodeId,
    observation,
    familyMembers,
    currentAccountId,
    locale,
    copy,
    onTakeDose,
    onSaveRecipients,
    onUpdateReminder,
  });

  return (
    <Animated.View
      pointerEvents={interactive ? "auto" : "none"}
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
        {interactive ? (
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>{`\u2190 ${copy.back}`}</Text>
          </Pressable>

          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
              </View>
              <View style={styles.avatarWrap}>
                {child.avatarSource ? (
                  <Image
                    source={child.avatarSource}
                    defaultSource={getLocalAssetDefaultSource(child.avatarSource)}
                    style={styles.avatar as never}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.topActionsRow}>
              <Pressable
                style={styles.secondaryPillButton}
                onPress={() => controller.setRecipientSheetVisible(true)}
              >
                <Feather name="bell" size={16} color="#1E2A3A" />
                <Text style={styles.secondaryPillButtonText}>
                  {copy.notifications}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.recipientsSummary}>{controller.recipientSummary}</Text>
          </View>

          {controller.plans.length === 0 ? (
            <>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
                <Text style={styles.emptyBody}>{copy.emptyBody}</Text>
              </View>
            </>
          ) : (
            <View style={styles.listWrap}>
              <Text style={styles.sectionTitle}>{copy.todaySection}</Text>
              {controller.plans.map((plan) => {
                const stats = buildMobileReminderPlanAdministrationStats(
                  plan,
                  observation?.entries ?? [],
                  new Date(),
                );
                const canTakeNow = !stats.isBlocked && !controller.isSubmittingDose;

                return (
                  <View key={plan.id}>
                    {/** cards can collapse/expand inline without drilling into detail */}
                    {backgroundVisible ? (
                      <ReminderPlanCard
                        plan={plan}
                        stats={stats}
                        locale={locale}
                        medicationIntervalUnit={medicationIntervalUnit}
                        activeLabel={copy.active}
                        doseLabel={copy.dose}
                        intervalLabel={copy.interval}
                        limitLabel={copy.limit}
                        notesLabel={copy.notes}
                        loggedTodayLabel={copy.loggedToday}
                        ofLabel={copy.ofLabel}
                        lastDoseLabel={copy.lastDose}
                        dailyLimitReachedLabel={copy.dailyLimitReached}
                        giveAtLabel={copy.giveAtLabel}
                        nextDosePrefix={copy.nextDosePrefix}
                        takeDoseNowLabel={copy.takeDoseNow}
                        loggingNowLabel={copy.loggingNow}
                        canTakeNow={canTakeNow}
                        isSubmittingDose={false}
                        interactive={false}
                        expanded={controller.expandedPlanIds.includes(plan.id)}
                      />
                    ) : (
                      <SwipeToDeleteRow
                        onDelete={() => controller.setPendingDeletePlanId(plan.id)}
                        deleteColor="#F56F68"
                        deletePressedColor="#E95D56"
                        borderRadius={28}
                      >
                        <ReminderPlanCard
                          plan={plan}
                          stats={stats}
                          locale={locale}
                          medicationIntervalUnit={medicationIntervalUnit}
                          activeLabel={copy.active}
                          doseLabel={copy.dose}
                          intervalLabel={copy.interval}
                          limitLabel={copy.limit}
                          notesLabel={copy.notes}
                          loggedTodayLabel={copy.loggedToday}
                          ofLabel={copy.ofLabel}
                          lastDoseLabel={copy.lastDose}
                          dailyLimitReachedLabel={copy.dailyLimitReached}
                          giveAtLabel={copy.giveAtLabel}
                          nextDosePrefix={copy.nextDosePrefix}
                          takeDoseNowLabel={copy.takeDoseNow}
                          loggingNowLabel={copy.loggingNow}
                          canTakeNow={canTakeNow}
                          isSubmittingDose={controller.isSubmittingDose}
                          interactive
                          expanded={controller.expandedPlanIds.includes(plan.id)}
                          onToggleExpanded={() =>
                            controller.setExpandedPlanIds((current) =>
                              current.includes(plan.id)
                                ? current.filter((id) => id !== plan.id)
                                : [...current, plan.id],
                            )
                          }
                          onTakeDose={() => controller.handlePressTakeDose(plan)}
                          onEditDose={() => {
                            controller.setEditingPlan(plan);
                            controller.setEditingField("dose");
                            controller.setFieldValue(plan.doseAmount);
                          }}
                          onEditInterval={() => {
                            controller.setEditingPlan(plan);
                            controller.setEditingField("interval");
                            controller.setActiveNumberSheet("interval");
                          }}
                          onEditLimit={() => {
                            controller.setEditingPlan(plan);
                            controller.setEditingField("limit");
                            controller.setActiveNumberSheet("limit");
                          }}
                          onEditNotes={() => {
                            controller.setEditingPlan(plan);
                            controller.setEditingField("notes");
                            controller.setFieldValue(plan.notes ?? "");
                          }}
                        />
                      </SwipeToDeleteRow>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomActionBar}>
          <ReminderAddCta
            label={controller.plans.length === 0 ? copy.emptyAction : copy.add}
            onPress={onOpenCreateReminder}
          />
        </View>
      </View>

      <ReminderRecipientsSheet
        title={copy.recipientsTitle}
        subtitle={copy.recipientsSubtitle}
        cancelLabel={copy.cancel}
        saveLabel={copy.save}
        currentUserLabel={copy.currentUser}
        visible={controller.recipientSheetVisible}
        isSaving={controller.isSavingRecipients}
        members={controller.eligibleFamilyMembers}
        currentAccountId={currentAccountId}
        selectedIds={controller.draftRecipientIds}
        onToggleMember={controller.handleToggleRecipient}
        onClose={() => controller.setRecipientSheetVisible(false)}
        onSave={() => {
          void controller.handleSaveRecipients();
        }}
      />

      {controller.pendingDosePlan ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => {
              if (controller.isSubmittingDose) {
                return;
              }
              controller.setPendingDosePlan(null);
              controller.setPendingDoseHint("");
              controller.setPendingDoseError(null);
            }}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{copy.confirmDoseTitle}</Text>
            <Text style={styles.confirmBody}>
              {controller.pendingDoseHint || copy.confirmDoseHintDefault}
            </Text>
            <View style={styles.pendingDoseRows}>
              <Pressable
                onPress={() => controller.openPendingDosePicker("date")}
                style={styles.pendingDoseField}
              >
                <Text style={styles.pendingDoseLabel}>{copy.confirmDoseDate}</Text>
                <Text style={styles.pendingDoseValue}>
                  {formatBackdatedDate(controller.pendingDoseDate, locale)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => controller.openPendingDosePicker("time")}
                style={styles.pendingDoseField}
              >
                <Text style={styles.pendingDoseLabel}>{copy.confirmDoseTime}</Text>
                <Text style={styles.pendingDoseValue}>
                  {formatBackdatedTime(controller.pendingDoseDate)}
                </Text>
              </Pressable>
            </View>
            {controller.pendingDoseError ? (
              <Text style={styles.pendingDoseError}>{controller.pendingDoseError}</Text>
            ) : null}
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.sheetSecondaryButton}
                onPress={() => {
                  if (controller.isSubmittingDose) {
                    return;
                  }
                  controller.setPendingDosePlan(null);
                  controller.setPendingDoseHint("");
                  controller.setPendingDoseError(null);
                }}
              >
                <Text style={styles.sheetSecondaryButtonText}>{copy.cancel}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmTakeButton,
                  controller.isSubmittingDose ? styles.confirmTakeButtonDisabled : null,
                ]}
                disabled={controller.isSubmittingDose}
                onPress={controller.handleSubmitPendingDose}
              >
                <Text style={styles.confirmTakeButtonText}>
                  {controller.isSubmittingDose ? copy.loggingNow : copy.takeDoseNow}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <BackdatedDateTimePickerSheet
        visible={controller.activeDosePickerField !== null}
        locale={locale}
        activePickerField={controller.activeDosePickerField ?? "date"}
        pickerDay={controller.pendingDosePickerDay}
        pickerMonthIndex={controller.pendingDosePickerMonthIndex}
        pickerYear={controller.pendingDosePickerYear}
        pickerHour={controller.pendingDosePickerHour}
        pickerMinute={controller.pendingDosePickerMinute}
        setPickerDay={controller.setPendingDosePickerDay}
        setPickerMonthIndex={controller.setPendingDosePickerMonthIndex}
        setPickerYear={controller.setPendingDosePickerYear}
        setPickerHour={controller.setPendingDosePickerHour}
        setPickerMinute={controller.setPendingDosePickerMinute}
        onClose={controller.closePendingDosePicker}
        onConfirm={() => {
          controller.confirmPendingDosePicker();
          controller.setPendingDoseError(null);
        }}
      />

      {controller.pendingDeletePlanId ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => controller.setPendingDeletePlanId(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{copy.deletePromptTitle}</Text>
            <Text style={styles.confirmBody}>{copy.deletePromptBody}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.sheetSecondaryButton}
                onPress={() => controller.setPendingDeletePlanId(null)}
              >
                <Text style={styles.sheetSecondaryButtonText}>
                  {copy.cancel}
                </Text>
              </Pressable>
              <Pressable
                style={styles.confirmDeleteButton}
                onPress={() => {
                  onDeleteReminder(controller.pendingDeletePlanId!);
                  controller.setPendingDeletePlanId(null);
                }}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {copy.confirmDelete}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <ReminderPlanEditOverlays
        locale={locale}
        editingPlan={controller.editingPlan}
        editingField={controller.editingField}
        fieldValue={controller.fieldValue}
        activeNumberSheet={controller.activeNumberSheet}
        customValueVisible={controller.customValueVisible}
        customValue={controller.customValue}
        doseLabel={copy.dose}
        intervalLabel={copy.interval}
        limitLabel={copy.limit}
        notesLabel={copy.notes}
        cancelLabel={copy.cancel}
        saveLabel={copy.save}
        intervalOptions={intervalSheetOptions}
        limitOptions={limitSheetOptions}
        intervalCustomLabel={getReminderIntervalCustomLabel(locale)}
        limitCustomLabel={getReminderLimitCustomLabel(locale)}
        intervalPlaceholder={getReminderCustomIntervalPlaceholder(
          medicationIntervalUnit,
          locale,
        )}
        onChangeFieldValue={controller.setFieldValue}
        onCloseTextEdit={() => {
          if (controller.isSavingEdit) return;
          controller.setEditingPlan(null);
          controller.setEditingField(null);
          controller.setFieldValue("");
        }}
        onSaveTextEdit={() => {
          if (!controller.editingPlan || !controller.editingField) return;
          void controller.handleSavePlanPatch(controller.editingPlan, {
            [controller.editingField === "dose" ? "doseAmount" : "notes"]:
              controller.editingField === "dose"
                ? controller.fieldValue.trim()
                : controller.fieldValue.trim() || null,
          });
        }}
        onCloseNumberSheet={() => {
          controller.setActiveNumberSheet(null);
          controller.setEditingField(null);
          controller.setEditingPlan(null);
        }}
        onSelectNumberValue={(value) => {
          if (!controller.editingPlan || !controller.activeNumberSheet) return;
          void controller.handleSavePlanPatch(
            controller.editingPlan,
            controller.activeNumberSheet === "interval"
              ? { minIntervalMinutes: value ?? controller.editingPlan.minIntervalMinutes }
              : { maxDosesPerDay: value },
          );
        }}
        onOpenCustomValue={() => {
          controller.setActiveNumberSheet(null);
          controller.setCustomValue(
            controller.editingField === "interval"
              ? toReminderIntervalCustomValue(
                  controller.editingPlan?.minIntervalMinutes ?? 0,
                  medicationIntervalUnit,
                )
              : String(controller.editingPlan?.maxDosesPerDay ?? ""),
          );
          controller.setCustomValueVisible(true);
        }}
        onChangeCustomValue={(next) =>
          controller.setCustomValue(
            controller.editingField === "interval" && medicationIntervalUnit === "hours"
              ? next.replace(/[^0-9.,]/g, "").replace(",", ".")
              : next.replace(/[^0-9]/g, ""),
          )
        }
        onCloseCustomValue={() => {
          if (controller.isSavingEdit) return;
          controller.setCustomValueVisible(false);
          controller.setEditingPlan(null);
          controller.setEditingField(null);
        }}
        onSaveCustomValue={() => {
          if (!controller.editingPlan) return;
          const normalizedValue = controller.customValue.trim().replace(",", ".");
          if (!normalizedValue) return;

          if (controller.editingField === "interval" && medicationIntervalUnit === "hours") {
            const parsedHours = Number.parseFloat(normalizedValue);
            if (Number.isNaN(parsedHours)) return;
            void controller.handleSavePlanPatch(controller.editingPlan, {
              minIntervalMinutes: Math.round(parsedHours * 60),
            });
            return;
          }

          const parsed = Number.parseInt(
            normalizedValue.replace(/[^0-9]/g, ""),
            10,
          );
          if (Number.isNaN(parsed)) return;
          void controller.handleSavePlanPatch(
            controller.editingPlan,
            controller.editingField === "interval"
              ? { minIntervalMinutes: parsed }
              : { maxDosesPerDay: parsed },
          );
        }}
        isSaving={controller.isSavingEdit}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "#FBF3EC",
  },
  overlayLayerHidden: { opacity: 0 },
  overlayLayerVisible: { opacity: 1 },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FBF3EC",
  },
  backgroundImage: { width: "100%", height: "100%" },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,241,0.72)",
  },
  screen: { flex: 1, backgroundColor: "#FBF3EC" },
  swipeBackEdge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 188,
  },
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backLinkText: {
    color: "#1E2A3A",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EED8CE",
    backgroundColor: "#FFFCF8",
    padding: 20,
    marginBottom: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  title: {
    color: "#1E2A3A",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: 8,
    color: "#667386",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: "#F8EDE6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: { width: 80, height: 80 },
  topActionsRow: {
    marginTop: 18,
    marginBottom: 10,
  },
  secondaryPillButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFCF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryPillButtonText: {
    color: "#1E2A3A",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center",
  },
  addReminderCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 74,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#F2C2B8",
    backgroundColor: "rgba(255, 247, 241, 0.78)",
    marginTop: 4,
  },
  addReminderCtaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  addReminderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F26F6C",
    alignItems: "center",
    justifyContent: "center",
  },
  addReminderLabel: {
    color: "#F26F6C",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "center",
  },
  bottomActionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    paddingTop: 14,
    backgroundColor: "transparent",
  },
  recipientsSummary: {
    marginTop: 14,
    color: "#667386",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EED8CE",
    backgroundColor: "#FFFCF8",
    padding: 22,
  },
  emptyTitle: {
    color: "#1E2A3A",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  emptyBody: {
    marginTop: 8,
    color: "#667386",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  listWrap: { gap: 12 },
  sectionTitle: {
    color: "#667085",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  sheetSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFCF8",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSecondaryButtonText: {
    color: "#1E2A3A",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 32, 43, 0.24)",
  },
  confirmCard: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "#FFFCF8",
    padding: 22,
    borderWidth: 1,
    borderColor: "#EED8CE",
  },
  confirmTitle: {
    color: "#1E2A3A",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  confirmBody: {
    marginTop: 8,
    color: "#667386",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  pendingDoseRows: {
    marginTop: 14,
    gap: 10,
  },
  pendingDoseField: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EED8CE",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  pendingDoseLabel: {
    color: "#8A97A8",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  pendingDoseValue: {
    marginTop: 4,
    color: "#1E2A3A",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  pendingDoseError: {
    marginTop: 10,
    color: "#D14F5A",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  confirmDeleteButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#F56F68",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTakeButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#F56F68",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTakeButtonDisabled: {
    opacity: 0.7,
  },
  confirmDeleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  confirmTakeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});
