import {
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { NotificationDisabledBanner } from "../../../shared/components/NotificationDisabledBanner";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { journalTypography } from "../../../shared/theme/journalTypography";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type { MobilePillboxMedication } from "../api/mobilePillboxPlansApi";
import { InstantReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
import { pillboxTimeIcons } from "../assets/time";
import { buildPillboxHomeScreenContent } from "../model/pillboxHomeScreen";
import type { PillboxDraftMedicine } from "../model/pillboxPlanOnboarding";
import { pillboxHomeScreenStyles as styles } from "./pillboxHomeScreenStyles";
import { PillboxPlanMedicineEditorOverlay } from "./PillboxPlanMedicineEditorOverlay";
import { PillboxPlanOnboardingFlow } from "./PillboxPlanOnboardingFlow";
import { SwipeablePillboxPlanCard } from "./SwipeablePillboxPlanCard";
import { usePillboxHomeController } from "./usePillboxHomeController";

const noop = () => {};

function getCreatePlanLockedHint(locale: string) {
  if (locale === "ru") {
    return "В бесплатной версии доступен 1 план. Чтобы добавить ещё, нужен Plus.";
  }
  if (locale === "de") {
    return "Im Free-Tarif ist 1 Plan verfügbar. Für weitere Pläne ist Plus nötig.";
  }
  if (locale === "pl") {
    return "W wersji bezpłatnej dostępny jest 1 plan. Aby dodać więcej, potrzebny jest Plus.";
  }
  return "Free includes 1 plan. Upgrade to Plus to add more.";
}

export function PillboxHomeScreen({
  accessToken,
  currentAccountId,
  onOpenCreatePlan = noop,
  onOpenAnalytics = noop,
  createPlanLocked = false,
  onOpenLockedPlan = noop,
  onOpenPlan = noop,
  onMarkIntake = noop,
  familyMembers = [],
  pushNotificationsBannerVisible = false,
  pushNotificationsBannerTitle,
  pushNotificationsBannerBody,
  pushNotificationsBannerActionLabel,
  onOpenPushNotificationSettings = noop,
  onTabBarModeChange,
}: {
  accessToken: string | null;
  currentAccountId: string;
  onOpenCreatePlan?: () => void;
  onOpenAnalytics?: () => void;
  createPlanLocked?: boolean;
  onOpenLockedPlan?: () => void;
  onOpenPlan?: (planId: string) => void;
  onMarkIntake?: (intakeId: string) => void;
  familyMembers?: MobileFamilyMember[];
  pushNotificationsBannerVisible?: boolean;
  pushNotificationsBannerTitle?: string;
  pushNotificationsBannerBody?: string;
  pushNotificationsBannerActionLabel?: string;
  onOpenPushNotificationSettings?: () => void;
  onTabBarModeChange?: (mode: "foreground" | "background" | "hidden") => void;
}) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = useMemo(() => buildPillboxHomeScreenContent(locale), [locale]);
  const { width } = useWindowDimensions();
  const [activeIntakePage, setActiveIntakePage] = useState(0);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [medicineDraft, setMedicineDraft] = useState<PillboxDraftMedicine | null>(null);
  const [activePickerField, setActivePickerField] = useState<"time" | null>(null);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [isCustomCourseSheetOpen, setIsCustomCourseSheetOpen] = useState(false);
  const [customCourseDays, setCustomCourseDays] = useState("");
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(30);
  const [recipientsPlanId, setRecipientsPlanId] = useState<string | null>(null);
  const carouselPageWidth = width - 44;
  const isPreControllerOverlayActive =
    medicineDraft !== null || recipientsPlanId !== null;
  const {
    displayedPlans,
    todayIntakes,
    summaryStats,
    isPlanFlowVisible,
    setIsPlanFlowVisible,
    openSwipePlanId,
    setOpenSwipePlanId,
    pendingDeletePlanId: controllerPendingDeletePlanId,
    deletingPlanId,
    updatingPlanId,
    expandedPlanId,
    expandedPlansById,
    takingPlanId,
    isLoadingPlans,
    plansError,
    handleDeletePlan,
    handleCancelDeletePlan,
    handleConfirmDeletePlan,
    handleToggleExpandedPlan,
    handleSavePlanRecipients,
    handleSaveExpandedPlanMedicine,
    handleMarkIntake,
    handlePlanSaved,
    reloadPlans,
    setIsLoadingPlans,
  } = usePillboxHomeController({
    accessToken,
    currentAccountId,
    familyMembers,
    isOverlayActive: isPreControllerOverlayActive,
    locale,
    onMarkIntake,
    onTabBarModeChange,
  });
  const pendingDeletePlanId = controllerPendingDeletePlanId;
  const recipientsPlan = recipientsPlanId ? expandedPlansById[recipientsPlanId] ?? null : null;
  const recipientSheetMembers =
    familyMembers.length > 0
      ? familyMembers
      : recipientsPlan
        ? recipientsPlan.memberAccountIds.map((memberId) => ({
            id: memberId,
            email: null,
            familyId: recipientsPlan.familyId,
            displayName: memberId,
            relationshipLabel: null,
            phone: null,
            preferredLanguage: "ru" as const,
            familyRole: "member" as const,
            accessPolicy: {
              allChildren: true,
              childIds: [],
              childrenAccess: "edit" as const,
              cabinetAccess: "edit" as const,
              pillboxAccess: "edit" as const,
              cabinetPushEnabled: true,
            },
          }))
        : [];
  const eligibleRecipientIds = recipientSheetMembers.map((member) => member.id);

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextPage = Math.round(
      event.nativeEvent.contentOffset.x /
        Math.max(event.nativeEvent.layoutMeasurement.width, 1),
    );
    setActiveIntakePage(nextPage);
  };

  const currentCourseDurationDays = medicineDraft?.courseDurationDays ?? null;
  const pendingDeletePlan = pendingDeletePlanId
    ? displayedPlans.find((plan) => plan.id === pendingDeletePlanId) ?? null
    : null;
  const canSaveMedicine = Boolean(
    medicineDraft?.name.trim() &&
      medicineDraft.dose.trim() &&
      medicineDraft.times.length > 0 &&
      (medicineDraft.intakeMode !== "course" || medicineDraft.courseDurationDays),
  );

  const closeMedicineEditor = () => {
    setEditingPlanId(null);
    setEditingMedicineId(null);
    setMedicineDraft(null);
    setActivePickerField(null);
    setEditingTimeIndex(null);
    setIsCourseSheetOpen(false);
    setIsCustomCourseSheetOpen(false);
    setCustomCourseDays("");
    setPickerHour(8);
    setPickerMinute(30);
  };

  const openRecipientsSheet = (planId: string) => {
    const plan = expandedPlansById[planId];
    if (!plan) {
      return;
    }
    setRecipientsPlanId(planId);
  };

  const openMedicineEditor = (planId: string, medicineId: string) => {
    const plan = expandedPlansById[planId];
    const medication = plan?.medications.find((item) => item.id === medicineId);
    if (!plan || !medication) {
      return;
    }
    setEditingPlanId(planId);
    setEditingMedicineId(medicineId);
    setMedicineDraft(buildDraftMedicineFromMedication(medication));
  };

  const handleOpenTimePicker = (time?: string, index?: number) => {
    if (time) {
      const [rawHour = "8", rawMinute = "30"] = time.split(":");
      setPickerHour(Number.parseInt(rawHour, 10) || 8);
      setPickerMinute(Number.parseInt(rawMinute, 10) || 30);
    } else {
      setPickerHour(8);
      setPickerMinute(30);
    }
    setEditingTimeIndex(index ?? null);
    setActivePickerField("time");
  };

  const handleConfirmTime = () => {
    const nextTime = `${String(pickerHour).padStart(2, "0")}:${String(pickerMinute).padStart(2, "0")}`;
    setMedicineDraft((current) => {
      if (!current) {
        return current;
      }
      const nextTimes =
        editingTimeIndex === null
          ? [...current.times, nextTime]
          : current.times.map((time, index) =>
              index === editingTimeIndex ? nextTime : time,
            );
      return {
        ...current,
        times: sortTimes(nextTimes),
      };
    });
    setEditingTimeIndex(null);
    setActivePickerField(null);
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            times: current.times.filter((time) => time !== timeToRemove),
          }
        : current,
    );
  };

  const handleSelectCourseOption = (value: number | null) => {
    if (value === null) {
      return;
    }
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            intakeMode: "course",
            courseDurationDays: value,
          }
        : current,
    );
    setIsCourseSheetOpen(false);
  };

  const handleSaveCustomCourseDays = () => {
    const normalized = customCourseDays.trim().replace(/[^\d]/g, "").replace(/^0+/, "");
    if (!normalized) {
      return false;
    }
    setMedicineDraft((current) =>
      current
        ? {
            ...current,
            intakeMode: "course",
            courseDurationDays: Number(normalized),
          }
        : current,
    );
    return true;
  };

  const handleSaveMedicine = async () => {
    if (!editingPlanId || !editingMedicineId || !medicineDraft || !canSaveMedicine) {
      return;
    }

    const plan = expandedPlansById[editingPlanId];
    const originalMedication = plan?.medications.find((item) => item.id === editingMedicineId);
    if (!originalMedication) {
      return;
    }

    await handleSaveExpandedPlanMedicine({
      planId: editingPlanId,
      medicationId: editingMedicineId,
      medication: buildUpdatedMedication({
        original: originalMedication,
        draft: medicineDraft,
      }),
    });
    closeMedicineEditor();
  };

  const handleOpenCreatePlanFlow = () => {
    if (createPlanLocked) {
      onOpenLockedPlan();
      return;
    }

    onOpenCreatePlan();
    setIsPlanFlowVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
      <ImageBackground
        source={redesignBackgrounds.childrenModule}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>
            <Pressable
              onPress={onOpenAnalytics}
              style={({ pressed }) => [
                styles.headerGhostAction,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Image
                source={pillboxTimeIcons.modeCourse}
                style={styles.headerGhostActionIcon}
                resizeMode="contain"
              />
              <Text style={styles.headerGhostActionText}>
                {content.analyticsLabel}
              </Text>
            </Pressable>
          </View>

          {pushNotificationsBannerVisible ? (
            <NotificationDisabledBanner
              title={pushNotificationsBannerTitle}
              body={pushNotificationsBannerBody}
              actionLabel={pushNotificationsBannerActionLabel}
              onPress={onOpenPushNotificationSettings}
              palette={{
                borderColor: "#D9E2F2",
                backgroundColor: "rgba(248,250,255,0.96)",
                iconBackgroundColor: "#7B8FD8",
                titleColor: "#172033",
                bodyColor: "#5F6B7A",
                actionColor: "#6B7DB7",
                shadowColor: "#172033",
                chevronColor: "#6B7DB7",
              }}
              typography={{
                titleFontFamily: journalTypography.body,
                bodyFontFamily: journalTypography.body,
                actionFontFamily: journalTypography.body,
              }}
            />
          ) : null}
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={handleOpenCreatePlanFlow}
            style={({ pressed }) => [
              styles.createPlanCta,
              createPlanLocked ? styles.createPlanCtaLocked : null,
              pressed ? styles.createPlanCtaPressed : null,
            ]}
          >
            <View style={styles.createPlanIconCircle}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.createPlanLabelWrap}>
              <Text style={styles.createPlanLabel}>{content.createPlanLabel}</Text>
              {createPlanLocked ? (
                <View style={styles.createPlanLockedBadge}>
                  <Text style={styles.createPlanLockedBadgeText}>Plus</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
          {createPlanLocked ? (
            <Text style={styles.createPlanLockedHint}>
              {getCreatePlanLockedHint(locale)}
            </Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            {summaryStats.map((item, index) => (
              <View key={item.id} style={styles.statColumn}>
                <View style={styles.statInner}>
                  <Text style={styles.statNumber}>{item.number}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
                {index < summaryStats.length - 1 ? (
                  <View style={styles.statDivider} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {todayIntakes.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{content.nextIntakeLabel}</Text>
            </View>

            <View style={styles.carouselWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={handleCarouselScroll}
                scrollEventThrottle={16}
              >
                {todayIntakes.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.carouselPage, { width: carouselPageWidth }]}
                  >
                    <View style={styles.intakeCard}>
                      <View style={styles.intakeCardTopRow}>
                        <View style={styles.intakeLabelPill}>
                          <Text style={styles.intakeLabel}>
                            {content.nextIntakeLabel}
                          </Text>
                        </View>
                        <View style={styles.countdownChip}>
                          <Text style={styles.countdownChipText}>
                            {item.countdown}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.intakeHeroRow}>
                        <View style={styles.intakeTimeBlock}>
                          <Text style={styles.intakeTime}>{item.time}</Text>
                          <Text style={styles.intakeDate}>{item.relativeDate}</Text>
                        </View>

                        <View style={styles.intakeBody}>
                          <Text style={styles.intakePlanTitle}>{item.planTitle}</Text>
                          <Text style={styles.intakeMedicine}>
                            {item.medicineSummary}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() =>
                          handleMarkIntake(
                            item.id,
                            item.medicationId,
                            item.scheduledFor ?? null,
                          )
                        }
                        style={({ pressed }) => [
                          styles.intakeActionButton,
                          pressed ? styles.buttonPressed : null,
                        ]}
                      >
                        <Text
                          style={styles.intakeActionText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {content.nextIntakeAction}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {todayIntakes.length > 1 ? (
                <View style={styles.dotsRow}>
                  {todayIntakes.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.dot,
                        index === activeIntakePage ? styles.dotActive : null,
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{content.activePlansTitle}</Text>
          <View style={styles.sectionCounterInline}>
            <Text style={styles.sectionCounterInlineText}>
              {displayedPlans.length}
            </Text>
          </View>
        </View>

        {isLoadingPlans && displayedPlans.length === 0 ? (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>{content.loadingPlansTitle}</Text>
            <Text style={styles.emptyDescription}>
              {content.loadingPlansDescription}
            </Text>
          </View>
        ) : plansError && displayedPlans.length === 0 ? (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>{content.loadingErrorTitle}</Text>
            <Text style={styles.emptyDescription}>{plansError}</Text>
            <Pressable
              onPress={() => {
                setIsLoadingPlans(true);
                void reloadPlans().finally(() => setIsLoadingPlans(false));
              }}
              style={({ pressed }) => [
                styles.emptyRetryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.emptyRetryButtonText}>
                {content.retryLabel}
              </Text>
            </Pressable>
          </View>
        ) : displayedPlans.length > 0 ? (
          <View style={styles.plansList}>
            {displayedPlans.map((plan) => (
              <SwipeablePillboxPlanCard
                key={plan.id}
                locale={locale}
                item={plan}
                isOpen={openSwipePlanId === plan.id}
                isExpanded={expandedPlanId === plan.id}
                isLoadingExpanded={
                  expandedPlanId === plan.id && !expandedPlansById[plan.id]
                }
                expandedPlan={expandedPlansById[plan.id] ?? null}
                deleting={deletingPlanId === plan.id}
                updating={updatingPlanId === plan.id}
                taking={takingPlanId === plan.id}
                onOpenSwipe={() => setOpenSwipePlanId(plan.id)}
                onCloseSwipe={() =>
                  setOpenSwipePlanId((current) =>
                    current === plan.id ? null : current,
                  )
                }
                onToggleExpand={() => handleToggleExpandedPlan(plan.id)}
                onOpenMedicine={(medicineId) => openMedicineEditor(plan.id, medicineId)}
                onOpenRecipients={() => openRecipientsSheet(plan.id)}
                onMarkIntake={() =>
                  handleMarkIntake(
                    plan.id,
                    plan.nextMedicationId ?? undefined,
                    plan.nextDoseAt ?? undefined,
                  )
                }
                onDelete={() => handleDeletePlan(plan.id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { marginTop: 22 }]}>
            <Text style={styles.emptyTitle}>{content.emptyPlansTitle}</Text>
            <Text style={styles.emptyDescription}>
              {content.emptyPlansDescription}
            </Text>
            <Pressable
              onPress={handleOpenCreatePlanFlow}
              style={({ pressed }) => [
                styles.createPlanCta,
                createPlanLocked ? styles.createPlanCtaLocked : null,
                pressed ? styles.createPlanCtaPressed : null,
              ]}
            >
              <View style={styles.createPlanIconCircle}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.createPlanLabelWrap}>
                <Text style={styles.createPlanLabel}>{content.createPlanLabel}</Text>
                {createPlanLocked ? (
                  <View style={styles.createPlanLockedBadge}>
                    <Text style={styles.createPlanLockedBadgeText}>Plus</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <PillboxPlanOnboardingFlow
        visible={isPlanFlowVisible}
        accessToken={accessToken}
        currentAccountId={currentAccountId}
        familyMembers={familyMembers}
        onClose={() => setIsPlanFlowVisible(false)}
        onPlanSaved={() => handlePlanSaved()}
      />

      <PillboxPlanMedicineEditorOverlay
        visible={medicineDraft !== null}
        locale={locale}
        planTitle={
          editingPlanId
            ? displayedPlans.find((plan) => plan.id === editingPlanId)?.title ?? ""
            : ""
        }
        medicineDraft={medicineDraft}
        pickerHour={pickerHour}
        pickerMinute={pickerMinute}
        activePickerVisible={activePickerField === "time"}
        currentCourseDurationDays={currentCourseDurationDays}
        isCourseSheetOpen={isCourseSheetOpen}
        isCustomCourseSheetOpen={isCustomCourseSheetOpen}
        customCourseDays={customCourseDays}
        saving={editingPlanId !== null && updatingPlanId === editingPlanId}
        canSaveMedicine={canSaveMedicine}
        onClose={closeMedicineEditor}
        onChangeName={(value) =>
          setMedicineDraft((current) => (current ? { ...current, name: value } : current))
        }
        onChangeDose={(value) =>
          setMedicineDraft((current) => (current ? { ...current, dose: value } : current))
        }
        onOpenTimePicker={handleOpenTimePicker}
        onRemoveTime={handleRemoveTime}
        onSelectContinuousMode={() =>
          setMedicineDraft((current) =>
            current
              ? { ...current, intakeMode: "continuous", courseDurationDays: null }
              : current,
          )
        }
        onSelectCourseMode={() => {
          setMedicineDraft((current) =>
            current ? { ...current, intakeMode: "course" } : current,
          );
          setIsCourseSheetOpen(true);
        }}
        onToggleWeekday={(day) =>
          setMedicineDraft((current) => {
            if (!current) {
              return current;
            }
            const isActive = current.weekdays.includes(day);
            return {
              ...current,
              weekdays: isActive
                ? current.weekdays.filter((item) => item !== day)
                : [...current.weekdays, day],
            };
          })
        }
        onSelectMealRelation={(mealRelation) =>
          setMedicineDraft((current) =>
            current ? { ...current, mealRelation } : current,
          )
        }
        onConfirmTime={handleConfirmTime}
        onCloseTimePicker={() => {
          setEditingTimeIndex(null);
          setActivePickerField(null);
        }}
        onSetPickerHour={setPickerHour}
        onSetPickerMinute={setPickerMinute}
        onSetCourseSheetOpen={setIsCourseSheetOpen}
        onSetCustomCourseSheetOpen={(value) => {
          if (value) {
            setCustomCourseDays(
              currentCourseDurationDays ? String(currentCourseDurationDays) : "",
            );
          }
          setIsCustomCourseSheetOpen(value);
        }}
        onSelectCourseOption={handleSelectCourseOption}
        onSetCustomCourseDays={setCustomCourseDays}
        onSaveCustomCourseDays={handleSaveCustomCourseDays}
        onSave={() => {
          void handleSaveMedicine();
        }}
      />

      <InstantReminderRecipientsSheet
        title="Кому придут уведомления"
        subtitle="Если снять всех, по умолчанию останетесь вы."
        currentUserLabel="Вы"
        visible={recipientsPlan !== null}
        isSaving={recipientsPlanId !== null && updatingPlanId === recipientsPlanId}
        members={recipientSheetMembers}
        currentAccountId={currentAccountId}
        selectedIds={recipientsPlan?.memberAccountIds ?? []}
        onToggleMember={(memberId) => {
          if (!recipientsPlanId || !recipientsPlan) {
            return;
          }

          const nextRecipientIds = recipientsPlan.memberAccountIds.includes(memberId)
            ? recipientsPlan.memberAccountIds.filter((id) => id !== memberId)
            : [...recipientsPlan.memberAccountIds, memberId];

          handleSavePlanRecipients(recipientsPlanId, nextRecipientIds);
        }}
        onClose={() => {
          setRecipientsPlanId(null);
        }}
      />

      {pendingDeletePlan ? (
        <View style={styles.overlayScrim}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Удалить план?</Text>
            <Text style={styles.alertText}>
              {`План «${pendingDeletePlan.title}» удалится вместе с историей, восстановить его не получится.`}
            </Text>
            <View style={styles.alertActions}>
              <Pressable
                onPress={handleCancelDeletePlan}
                style={({ pressed }) => [
                  styles.alertAction,
                  styles.alertActionSecondary,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.alertActionSecondaryText}>Отмена</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDeletePlan}
                disabled={deletingPlanId === pendingDeletePlan.id}
                style={({ pressed }) => [
                  styles.alertAction,
                  styles.alertActionPrimary,
                  pressed ? styles.buttonPressed : null,
                  deletingPlanId === pendingDeletePlan.id ? styles.alertActionDisabled : null,
                ]}
              >
                <Text style={styles.alertActionPrimaryText}>
                  {deletingPlanId === pendingDeletePlan.id ? "Удаляем..." : "Удалить"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

function buildDraftMedicineFromMedication(
  medication: MobilePillboxMedication,
): PillboxDraftMedicine {
  return {
    id: medication.id,
    name: medication.customMedicineName?.trim() ?? "",
    dose: medication.doseAmount,
    times: [...medication.times],
    intakeMode: medication.courseMode === "period" ? "course" : "continuous",
    courseDurationDays: resolveCourseDurationDays(
      medication.courseStartDate,
      medication.courseEndDate,
    ),
    mealRelation: mapMealRuleFromApi(medication.mealRule),
    weekdays: medication.repeatDays
      .map((day) => WEEKDAYS_RU[day - 1])
      .filter((day): day is (typeof WEEKDAYS_RU)[number] => day !== undefined),
  };
}

function buildUpdatedMedication(input: {
  original: MobilePillboxMedication;
  draft: PillboxDraftMedicine;
}): MobilePillboxMedication {
  const { original, draft } = input;
  const courseDurationDays =
    draft.intakeMode === "course" ? draft.courseDurationDays ?? null : null;
  const baseStartDate =
    original.courseMode === "period" && original.courseStartDate
      ? original.courseStartDate
      : formatDateOnly(new Date());

  return {
    ...original,
    customMedicineName: draft.name.trim(),
    doseAmount: draft.dose.trim(),
    mealRule: mapMealRuleToApi(draft.mealRelation),
    repeatDays: draft.weekdays
      .map((day) => (WEEKDAYS_RU as readonly string[]).indexOf(day) + 1)
      .filter((day) => day > 0),
    times: sortTimes(draft.times),
    courseMode: draft.intakeMode === "course" ? "period" : "continuous",
    courseStartDate:
      draft.intakeMode === "course" && courseDurationDays ? baseStartDate : null,
    courseEndDate:
      draft.intakeMode === "course" && courseDurationDays
        ? addDaysToIso(baseStartDate, courseDurationDays - 1)
        : null,
  };
}

function resolveCourseDurationDays(
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate || !endDate) {
    return null;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

function mapMealRuleFromApi(
  value: MobilePillboxMedication["mealRule"],
): PillboxDraftMedicine["mealRelation"] {
  if (value === "before_meal") return "before_food";
  if (value === "with_meal") return "with_food";
  if (value === "after_meal") return "after_food";
  return "not_matter";
}

function mapMealRuleToApi(
  value: PillboxDraftMedicine["mealRelation"],
): MobilePillboxMedication["mealRule"] {
  if (value === "before_food") return "before_meal";
  if (value === "with_food") return "with_meal";
  if (value === "after_food") return "after_meal";
  return "not_matter";
}

function sortTimes(times: string[]) {
  return Array.from(new Set(times)).sort((left, right) => left.localeCompare(right));
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToIso(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map((item) => Number.parseInt(item, 10));
  const value = new Date(year, (month || 1) - 1, day || 1);
  value.setDate(value.getDate() + days);
  return formatDateOnly(value);
}
