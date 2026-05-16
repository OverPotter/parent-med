import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ReminderNumberOptionsSheet } from "../../illness/screens/ReminderNumberOptionsSheet";
import { ReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type { ReminderNumberSheetOption } from "../../illness/screens/reminderNumberOptions";
import type { MobilePillboxPlan } from "../api/mobilePillboxPlansApi";
import { buildReviewMedicineLines } from "../model/pillboxPlanOnboarding";
import {
  PrimaryButton,
  Stepper,
  TopNav,
} from "./pillboxPlanOnboardingParts";
import { PillboxMedicineEditorStepSection } from "./PillboxMedicineEditorStepSection";
import { PillboxMedicineListStepSection } from "./PillboxMedicineListStepSection";
import { PillboxParticipantStepSection } from "./PillboxParticipantStepSection";
import { PillboxReviewStepSection } from "./PillboxReviewStepSection";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";
import { usePillboxPlanOnboardingController } from "./usePillboxPlanOnboardingController";

const PICKER_DAY = 15;
const PICKER_MONTH_INDEX = 4;
const PICKER_YEAR = 2026;
const COURSE_OPTIONS: ReminderNumberSheetOption[] = [14, 30, 40].map((value) => ({
  value,
  label: `${value} дн.`,
}));

export function PillboxPlanOnboardingFlow({
  visible,
  accessToken,
  currentAccountId,
  familyMembers,
  onClose,
  onPlanSaved,
}: {
  visible: boolean;
  accessToken: string | null;
  currentAccountId: string;
  familyMembers: MobileFamilyMember[];
  onClose: () => void;
  onPlanSaved: (payload: { plan: MobilePillboxPlan; participantId: string }) => void;
}) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const { width } = useWindowDimensions();
  const {
    step,
    setStep,
    draft,
    medicineDraft,
    setMedicineDraft,
    showDiscardAlert,
    setShowDiscardAlert,
    activePickerField,
    setActivePickerField,
    setEditingTimeIndex,
    isCourseSheetOpen,
    setIsCourseSheetOpen,
    isCustomCourseSheetOpen,
    setIsCustomCourseSheetOpen,
    isRecipientSheetOpen,
    setIsRecipientSheetOpen,
    draftRecipientIds,
    customCourseDays,
    setCustomCourseDays,
    pickerHour,
    setPickerHour,
    pickerMinute,
    setPickerMinute,
    participants,
    currentStepIndex,
    participantTitle,
    recipientSheetMembers,
    currentCourseDurationDays,
    canGoNextFromParticipant,
    canGoNextFromList,
    canSaveMedicine,
    isSavingPlan,
    handleSelectParticipant,
    handleRequestClose,
    handleOpenMedicineEditor,
    handleSaveMedicine,
    handleRemoveMedicine,
    handleCompletePlan,
    handleOpenTimePicker,
    handleConfirmTime,
    handleRemoveTime,
    handleSelectCourseOption,
    handleSaveCustomCourseDays,
    handleToggleWeekday,
    handleSelectContinuousMode,
    handleSelectCourseMode,
    handleSelectMealRelation,
    handleOpenRecipients,
    handleToggleRecipient,
    handleSaveRecipients,
    notificationRecipientTitle,
  } = usePillboxPlanOnboardingController({
    visible,
    accessToken,
    currentAccountId,
    familyMembers,
    locale,
    onClose,
    onPlanSaved,
  });

  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled:
      visible &&
      activePickerField === null &&
      !showDiscardAlert &&
      !isCourseSheetOpen &&
      !isCustomCourseSheetOpen &&
      !isRecipientSheetOpen,
    width,
    onBack: handleRequestClose,
    shouldCloseOnBack: false,
    shouldTranslateOnSwipe: true,
  });

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <View style={[styles.modalRoot, styles.animatedLayer]}>
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
          <TopNav
            step={step}
            onBack={handleRequestClose}
          />

          {step !== "medicine" ? <Stepper activeStep={currentStepIndex} /> : null}

          {step === "participant" ? (
            <PillboxParticipantStepSection
              locale={locale}
              participants={participants}
              participantId={draft.participantId}
              onSelectParticipant={handleSelectParticipant}
            />
          ) : null}

          {step === "list" ? (
            <PillboxMedicineListStepSection
              locale={locale}
              medicines={draft.medicines}
              onAddMedicine={() => handleOpenMedicineEditor()}
              onOpenMedicine={handleOpenMedicineEditor}
              onRemoveMedicine={handleRemoveMedicine}
            />
          ) : null}

          {step === "medicine" && medicineDraft ? (
            <PillboxMedicineEditorStepSection
              locale={locale}
              participantTitle={participantTitle}
              medicineDraft={medicineDraft}
              onChangeName={(value) =>
                setMedicineDraft((current) =>
                  current ? { ...current, name: value } : current,
                )
              }
              onChangeDose={(value) =>
                setMedicineDraft((current) =>
                  current ? { ...current, dose: value } : current,
                )
              }
              onOpenTimePicker={handleOpenTimePicker}
              onRemoveTime={handleRemoveTime}
              onSelectContinuousMode={handleSelectContinuousMode}
              onSelectCourseMode={handleSelectCourseMode}
              onToggleWeekday={handleToggleWeekday}
              onSelectMealRelation={handleSelectMealRelation}
            />
          ) : null}

          {step === "review" ? (
            <PillboxReviewStepSection
              locale={locale}
              recipientTitle={notificationRecipientTitle}
              medicines={draft.medicines}
              onOpenRecipients={handleOpenRecipients}
              buildMedicineLines={buildReviewMedicineLines}
            />
          ) : null}
        </ScrollView>

        <View style={styles.bottomActionDock}>
          {step === "participant" ? (
            <PrimaryButton
              label={
                canGoNextFromParticipant
                  ? locale === "ru"
                    ? "Далее"
                    : "Next"
                  : locale === "ru"
                    ? "Выберите участника"
                    : "Choose a participant"
              }
              disabled={!canGoNextFromParticipant}
              onPress={() => setStep("list")}
            />
          ) : null}
          {step === "list" ? (
            <PrimaryButton
              label={
                canGoNextFromList
                  ? locale === "ru"
                    ? "Далее"
                    : "Next"
                  : locale === "ru"
                    ? "Добавьте хотя бы одно лекарство"
                    : "Add at least one medicine"
              }
              disabled={!canGoNextFromList}
              onPress={() => setStep("review")}
            />
          ) : null}
          {step === "medicine" ? (
            <PrimaryButton
              label={
                !medicineDraft?.name.trim()
                  ? locale === "ru"
                    ? "Укажите препарат"
                    : "Enter medicine"
                  : !medicineDraft.dose.trim()
                    ? locale === "ru"
                      ? "Укажите дозу"
                      : "Enter dose"
                    : medicineDraft.times.length === 0
                      ? locale === "ru"
                        ? "Добавьте хотя бы одно время приёма"
                        : "Add at least one intake time"
                      : medicineDraft.intakeMode === "course" &&
                          !medicineDraft.courseDurationDays
                        ? locale === "ru"
                          ? "Выберите срок курса"
                          : "Choose course duration"
                        : locale === "ru"
                          ? "Сохранить лекарство"
                          : "Save medicine"
              }
              disabled={!canSaveMedicine}
              onPress={handleSaveMedicine}
            />
          ) : null}
          {step === "review" ? (
            <PrimaryButton
              label={
                isSavingPlan
                  ? locale === "ru"
                    ? "Сохраняем..."
                    : "Saving..."
                  : locale === "ru"
                    ? "Сохранить план"
                    : "Save plan"
              }
              disabled={isSavingPlan}
              onPress={handleCompletePlan}
            />
          ) : null}
        </View>

        {showDiscardAlert ? (
          <View style={styles.overlayScrim}>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>
                {locale === "ru" ? "Не сохранять план?" : "Discard plan?"}
              </Text>
              <Text style={styles.alertText}>
                {locale === "ru"
                  ? "Введённые данные будут потеряны."
                  : "Entered data will be lost."}
              </Text>
              <View style={styles.alertActions}>
                <Pressable
                  onPress={() => setShowDiscardAlert(false)}
                  style={({ pressed }) => [
                    styles.alertAction,
                    pressed ? styles.backLinkPressed : null,
                  ]}
                >
                  <Text style={styles.alertActionText}>
                    {locale === "ru" ? "Продолжить" : "Continue editing"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDiscardAlert(false);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.alertAction,
                    styles.alertActionDanger,
                    pressed ? styles.backLinkPressed : null,
                  ]}
                >
                  <Text style={[styles.alertActionText, styles.alertActionTextDanger]}>
                    {locale === "ru" ? "Не сохранять" : "Discard"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <BackdatedDateTimePickerSheet
          visible={activePickerField !== null}
          locale={locale}
          activePickerField={activePickerField ?? "time"}
          pickerDay={PICKER_DAY}
          pickerMonthIndex={PICKER_MONTH_INDEX}
          pickerYear={PICKER_YEAR}
          pickerHour={pickerHour}
          pickerMinute={pickerMinute}
          setPickerDay={() => {}}
          setPickerMonthIndex={() => {}}
          setPickerYear={() => {}}
          setPickerHour={setPickerHour}
          setPickerMinute={setPickerMinute}
          onClose={() => {
            setEditingTimeIndex(null);
            setActivePickerField(null);
          }}
          onConfirm={handleConfirmTime}
        />

        <ReminderNumberOptionsSheet
          visible={isCourseSheetOpen}
          title={locale === "ru" ? "Сколько дней курс" : "Course duration"}
          value={currentCourseDurationDays}
          options={COURSE_OPTIONS}
          columns={2}
          customActionActive={
            currentCourseDurationDays !== null &&
            !COURSE_OPTIONS.some((option) => option.value === currentCourseDurationDays)
          }
          customActionLabel={locale === "ru" ? "Свои дни" : "Custom days"}
          onClose={() => setIsCourseSheetOpen(false)}
          onSelect={handleSelectCourseOption}
          onCustomPress={() => {
            setIsCourseSheetOpen(false);
            setCustomCourseDays(
              currentCourseDurationDays ? String(currentCourseDurationDays) : "",
            );
            setIsCustomCourseSheetOpen(true);
          }}
        />

        <FormBottomSheet
          visible={isCustomCourseSheetOpen}
          onClose={() => setIsCustomCourseSheetOpen(false)}
          overlayStyle={styles.sheetOverlay}
          backdropStyle={styles.sheetBackdrop}
          sheetStyle={styles.customValueSheetCard}
          keyboardAvoiding
          keyboardBehavior="padding"
          keyboardVerticalOffset={0}
        >
          {({ panHandlers: sheetPanHandlers, requestClose }) => (
            <>
              <View style={styles.sheetDragZone} {...sheetPanHandlers}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>
                  {locale === "ru" ? "Свои дни" : "Custom days"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {locale === "ru"
                    ? "Сколько дней длится курс."
                    : "How many days the course lasts."}
                </Text>
              </View>

              <TextInput
                value={customCourseDays}
                onChangeText={setCustomCourseDays}
                style={styles.customValueInput}
                placeholder="21"
                placeholderTextColor="#98A2AD"
                keyboardType="number-pad"
                autoFocus
              />

              <View style={styles.customValueActions}>
                <Pressable
                  onPress={() => requestClose()}
                  style={({ pressed }) => [
                    styles.customValueCancelButton,
                    pressed ? styles.secondaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.customValueCancelText}>
                    {locale === "ru" ? "Отмена" : "Cancel"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const canClose = handleSaveCustomCourseDays();
                    if (!canClose) {
                      return;
                    }
                    requestClose();
                  }}
                  style={({ pressed }) => [
                    styles.customValueSaveButton,
                    pressed ? styles.primaryButtonPressed : null,
                  ]}
                >
                  <LinearGradient
                    colors={["#F56565", "#EF4F4F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.customValueSaveGradient}
                  />
                  <Text style={styles.customValueSaveText}>
                    {locale === "ru" ? "Сохранить" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </FormBottomSheet>

        <ReminderRecipientsSheet
          title={
            locale === "ru"
              ? "Кому придут уведомления"
              : "Who will get notifications"
          }
          subtitle={
            locale === "ru"
              ? "По умолчанию выбран участник плана."
              : "The plan participant is selected by default."
          }
          cancelLabel={locale === "ru" ? "Отмена" : "Cancel"}
          saveLabel={locale === "ru" ? "Сохранить" : "Save"}
          currentUserLabel={locale === "ru" ? "Вы" : "You"}
          visible={isRecipientSheetOpen}
          isSaving={isSavingPlan}
          members={recipientSheetMembers}
          currentAccountId={currentAccountId}
          selectedIds={draftRecipientIds}
          onToggleMember={handleToggleRecipient}
          onClose={() => setIsRecipientSheetOpen(false)}
          onSave={handleSaveRecipients}
        />

        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
      </View>
    </Animated.View>
  );
}
