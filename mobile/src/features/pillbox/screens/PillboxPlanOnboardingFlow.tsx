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
              participants={participants}
              participantId={draft.participantId}
              onSelectParticipant={handleSelectParticipant}
            />
          ) : null}

          {step === "list" ? (
            <PillboxMedicineListStepSection
              medicines={draft.medicines}
              onAddMedicine={() => handleOpenMedicineEditor()}
              onOpenMedicine={handleOpenMedicineEditor}
            />
          ) : null}

          {step === "medicine" && medicineDraft ? (
            <PillboxMedicineEditorStepSection
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
              label={canGoNextFromParticipant ? "Далее" : "Выберите участника"}
              disabled={!canGoNextFromParticipant}
              onPress={() => setStep("list")}
            />
          ) : null}
          {step === "list" ? (
            <PrimaryButton
              label={
                canGoNextFromList ? "Далее" : "Добавьте хотя бы одно лекарство"
              }
              disabled={!canGoNextFromList}
              onPress={() => setStep("review")}
            />
          ) : null}
          {step === "medicine" ? (
            <PrimaryButton
              label="Сохранить лекарство"
              disabled={!canSaveMedicine}
              onPress={handleSaveMedicine}
            />
          ) : null}
          {step === "review" ? (
            <PrimaryButton
              label={isSavingPlan ? "Сохраняем..." : "Сохранить план"}
              disabled={isSavingPlan}
              onPress={handleCompletePlan}
            />
          ) : null}
        </View>

        {showDiscardAlert ? (
          <View style={styles.overlayScrim}>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>Не сохранять план?</Text>
              <Text style={styles.alertText}>
                Введённые данные будут потеряны.
              </Text>
              <View style={styles.alertActions}>
                <Pressable
                  onPress={() => setShowDiscardAlert(false)}
                  style={({ pressed }) => [
                    styles.alertAction,
                    pressed ? styles.backLinkPressed : null,
                  ]}
                >
                  <Text style={styles.alertActionText}>Продолжить</Text>
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
                    Не сохранять
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <BackdatedDateTimePickerSheet
          visible={activePickerField !== null}
          locale="ru"
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
          title="Сколько дней курс"
          value={currentCourseDurationDays}
          options={COURSE_OPTIONS}
          columns={2}
          customActionActive={
            currentCourseDurationDays !== null &&
            !COURSE_OPTIONS.some((option) => option.value === currentCourseDurationDays)
          }
          customActionLabel="Свои дни"
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
                <Text style={styles.sheetTitle}>Свои дни</Text>
                <Text style={styles.sheetSubtitle}>
                  Сколько дней длится курс.
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
                  <Text style={styles.customValueCancelText}>Отмена</Text>
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
                  <Text style={styles.customValueSaveText}>Сохранить</Text>
                </Pressable>
              </View>
            </>
          )}
        </FormBottomSheet>

        <ReminderRecipientsSheet
          title="Кому придут уведомления"
          subtitle="По умолчанию выбран участник плана."
          cancelLabel="Отмена"
          saveLabel="Сохранить"
          currentUserLabel="Вы"
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
