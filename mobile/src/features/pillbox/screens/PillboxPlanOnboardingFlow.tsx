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
import { InstantReminderRecipientsSheet } from "../../illness/screens/ReminderRecipientsSheet";
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

const COURSE_OPTIONS: ReminderNumberSheetOption[] = [14, 30, 40].map((value) => ({
  value,
  label: `${value} дн.`,
}));

function getCurrentPickerDateParts() {
  const now = new Date();
  return {
    day: now.getDate(),
    monthIndex: now.getMonth(),
    year: now.getFullYear(),
  };
}

function getCourseOptionLabel(locale: "ru" | "en" | "de" | "pl", value: number) {
  if (locale === "de") {
    return `${value} Tg.`;
  }
  if (locale === "pl") {
    return `${value} dni`;
  }
  if (locale === "en") {
    return `${value} d`;
  }
  return `${value} дн.`;
}

function getOnboardingActionLabel(
  locale: "ru" | "en" | "de" | "pl",
  key:
    | "next"
    | "chooseParticipant"
    | "addAtLeastOneMedicine"
    | "enterMedicine"
    | "enterDose"
    | "addAtLeastOneTime"
    | "chooseCourseDuration"
    | "saveMedicine"
    | "saving"
    | "savePlan",
) {
  if (locale === "ru") {
    return {
      next: "Далее",
      chooseParticipant: "Выберите участника",
      addAtLeastOneMedicine: "Добавьте хотя бы одно лекарство",
      enterMedicine: "Укажите препарат",
      enterDose: "Укажите дозу",
      addAtLeastOneTime: "Добавьте хотя бы одно время приёма",
      chooseCourseDuration: "Выберите срок курса",
      saveMedicine: "Сохранить лекарство",
      saving: "Сохраняем...",
      savePlan: "Сохранить план",
    }[key];
  }
  if (locale === "de") {
    return {
      next: "Weiter",
      chooseParticipant: "Teilnehmer auswählen",
      addAtLeastOneMedicine: "Fügen Sie mindestens ein Medikament hinzu",
      enterMedicine: "Medikament eingeben",
      enterDose: "Dosis eingeben",
      addAtLeastOneTime: "Fügen Sie mindestens eine Uhrzeit hinzu",
      chooseCourseDuration: "Wählen Sie die Kursdauer",
      saveMedicine: "Medikament speichern",
      saving: "Wird gespeichert...",
      savePlan: "Plan speichern",
    }[key];
  }
  if (locale === "pl") {
    return {
      next: "Dalej",
      chooseParticipant: "Wybierz uczestnika",
      addAtLeastOneMedicine: "Dodaj co najmniej jeden lek",
      enterMedicine: "Wpisz lek",
      enterDose: "Wpisz dawkę",
      addAtLeastOneTime: "Dodaj co najmniej jedną godzinę",
      chooseCourseDuration: "Wybierz czas kuracji",
      saveMedicine: "Zapisz lek",
      saving: "Zapisywanie...",
      savePlan: "Zapisz plan",
    }[key];
  }
  return {
    next: "Next",
    chooseParticipant: "Choose a participant",
    addAtLeastOneMedicine: "Add at least one medicine",
    enterMedicine: "Enter medicine",
    enterDose: "Enter dose",
    addAtLeastOneTime: "Add at least one intake time",
    chooseCourseDuration: "Choose course duration",
    saveMedicine: "Save medicine",
    saving: "Saving...",
    savePlan: "Save plan",
  }[key];
}

function getCourseDurationTitle(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Сколько дней курс";
  }
  if (locale === "de") {
    return "Wie viele Tage dauert die Kur";
  }
  if (locale === "pl") {
    return "Ile dni trwa kuracja";
  }
  return "Course duration";
}

function getCustomDaysLabel(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Свои дни";
  }
  if (locale === "de") {
    return "Eigene Tage";
  }
  if (locale === "pl") {
    return "Własna liczba dni";
  }
  return "Custom days";
}

function getCustomDaysSubtitle(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Сколько дней длится курс.";
  }
  if (locale === "de") {
    return "Wie viele Tage die Kur dauert.";
  }
  if (locale === "pl") {
    return "Ile dni trwa kuracja.";
  }
  return "How many days the course lasts.";
}

function getCancelLabel(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Отмена";
  }
  if (locale === "de") {
    return "Abbrechen";
  }
  if (locale === "pl") {
    return "Anuluj";
  }
  return "Cancel";
}

function getSaveLabel(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Сохранить";
  }
  if (locale === "de") {
    return "Speichern";
  }
  if (locale === "pl") {
    return "Zapisz";
  }
  return "Save";
}

function getDiscardPlanTitle(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Не сохранять план?";
  }
  if (locale === "de") {
    return "Plan nicht speichern?";
  }
  if (locale === "pl") {
    return "Nie zapisywać planu?";
  }
  return "Discard plan?";
}

function getDiscardPlanText(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Введённые данные будут потеряны.";
  }
  if (locale === "de") {
    return "Die eingegebenen Daten gehen verloren.";
  }
  if (locale === "pl") {
    return "Wprowadzone dane zostaną utracone.";
  }
  return "Entered data will be lost.";
}

function getContinueEditingLabel(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Продолжить";
  }
  if (locale === "de") {
    return "Weiter bearbeiten";
  }
  if (locale === "pl") {
    return "Kontynuuj edycję";
  }
  return "Continue editing";
}

function getDiscardLabel(locale: "ru" | "en" | "de" | "pl") {
  if (locale === "ru") {
    return "Не сохранять";
  }
  if (locale === "de") {
    return "Nicht speichern";
  }
  if (locale === "pl") {
    return "Nie zapisuj";
  }
  return "Discard";
}

export function PillboxPlanOnboardingFlow({
  visible,
  accessToken,
  currentAccountId,
  currentAccountDisplayName,
  currentAccountRelationshipLabel,
  currentAccountFamilyRole,
  familyMembers,
  onClose,
  onPlanSaved,
}: {
  visible: boolean;
  accessToken: string | null;
  currentAccountId: string;
  currentAccountDisplayName?: string | null;
  currentAccountRelationshipLabel?: string | null;
  currentAccountFamilyRole?: string | null;
  familyMembers: MobileFamilyMember[];
  onClose: () => void;
  onPlanSaved: (payload: { plan: MobilePillboxPlan; participantId: string }) => void;
}) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const { width } = useWindowDimensions();
  const pickerDateParts = getCurrentPickerDateParts();
  const courseOptions = COURSE_OPTIONS.map((option) => ({
    ...option,
    label: getCourseOptionLabel(locale, option.value),
  }));
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
    resolvedRecipientIds,
    currentUserLabel,
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
    notificationRecipientTitle,
  } = usePillboxPlanOnboardingController({
    visible,
    accessToken,
    currentAccountId,
    currentAccountDisplayName,
    currentAccountRelationshipLabel,
    currentAccountFamilyRole,
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
              buildMedicineLines={(medicine) => buildReviewMedicineLines(medicine, locale)}
            />
          ) : null}
        </ScrollView>

        <View style={styles.bottomActionDock}>
          {step === "participant" ? (
            <PrimaryButton
              label={
                canGoNextFromParticipant
                  ? getOnboardingActionLabel(locale, "next")
                  : getOnboardingActionLabel(locale, "chooseParticipant")
              }
              disabled={!canGoNextFromParticipant}
              onPress={() => setStep("list")}
            />
          ) : null}
          {step === "list" ? (
            <PrimaryButton
              label={
                canGoNextFromList
                  ? getOnboardingActionLabel(locale, "next")
                  : getOnboardingActionLabel(locale, "addAtLeastOneMedicine")
              }
              disabled={!canGoNextFromList}
              onPress={() => setStep("review")}
            />
          ) : null}
          {step === "medicine" ? (
            <PrimaryButton
              label={
                !medicineDraft?.name.trim()
                  ? getOnboardingActionLabel(locale, "enterMedicine")
                  : !medicineDraft.dose.trim()
                    ? getOnboardingActionLabel(locale, "enterDose")
                    : medicineDraft.times.length === 0
                      ? getOnboardingActionLabel(locale, "addAtLeastOneTime")
                      : medicineDraft.intakeMode === "course" &&
                          !medicineDraft.courseDurationDays
                        ? getOnboardingActionLabel(locale, "chooseCourseDuration")
                        : getOnboardingActionLabel(locale, "saveMedicine")
              }
              disabled={!canSaveMedicine}
              onPress={handleSaveMedicine}
            />
          ) : null}
          {step === "review" ? (
            <PrimaryButton
              label={
                isSavingPlan
                  ? getOnboardingActionLabel(locale, "saving")
                  : getOnboardingActionLabel(locale, "savePlan")
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
                {getDiscardPlanTitle(locale)}
              </Text>
              <Text style={styles.alertText}>{getDiscardPlanText(locale)}</Text>
              <View style={styles.alertActions}>
                <Pressable
                  onPress={() => setShowDiscardAlert(false)}
                  style={({ pressed }) => [
                    styles.alertAction,
                    pressed ? styles.backLinkPressed : null,
                  ]}
                >
                  <Text style={styles.alertActionText}>{getContinueEditingLabel(locale)}</Text>
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
                    {getDiscardLabel(locale)}
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
          pickerDay={pickerDateParts.day}
          pickerMonthIndex={pickerDateParts.monthIndex}
          pickerYear={pickerDateParts.year}
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
          title={getCourseDurationTitle(locale)}
          value={currentCourseDurationDays}
          options={courseOptions}
          columns={2}
          customActionActive={
            currentCourseDurationDays !== null &&
            !courseOptions.some((option) => option.value === currentCourseDurationDays)
          }
          customActionLabel={getCustomDaysLabel(locale)}
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
                <Text style={styles.sheetTitle}>{getCustomDaysLabel(locale)}</Text>
                <Text style={styles.sheetSubtitle}>{getCustomDaysSubtitle(locale)}</Text>
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
                  <Text style={styles.customValueCancelText}>{getCancelLabel(locale)}</Text>
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
                  <Text style={styles.customValueSaveText}>{getSaveLabel(locale)}</Text>
                </Pressable>
              </View>
            </>
          )}
        </FormBottomSheet>

        <InstantReminderRecipientsSheet
          title={
            locale === "ru"
              ? "Кому придут уведомления"
              : locale === "de"
                ? "Wer Benachrichtigungen erhält"
                : locale === "pl"
                  ? "Kto dostanie powiadomienia"
              : "Who will get notifications"
          }
          subtitle={
            locale === "ru"
              ? "По умолчанию выбран участник плана."
              : locale === "de"
                ? "Die Person aus dem Plan ist standardmäßig ausgewählt."
                : locale === "pl"
                  ? "Domyślnie wybrana jest osoba z planu."
              : "The plan participant is selected by default."
          }
          currentUserLabel={currentUserLabel ?? ""}
          visible={isRecipientSheetOpen}
          isSaving={isSavingPlan}
          members={recipientSheetMembers}
          currentAccountId={currentAccountId}
          selectedIds={resolvedRecipientIds}
          onToggleMember={handleToggleRecipient}
          onClose={() => setIsRecipientSheetOpen(false)}
        />

        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />
      </View>
    </Animated.View>
  );
}
