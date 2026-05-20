import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import type { ReminderNumberSheetOption } from "../../illness/screens/reminderNumberOptions";
import { ReminderNumberOptionsSheet } from "../../illness/screens/ReminderNumberOptionsSheet";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import type {
  PillboxDraftMedicine,
  PillboxWeekdayId,
} from "../model/pillboxPlanOnboarding";
import { PillboxMedicineEditorStepSection } from "./PillboxMedicineEditorStepSection";
import {
  PrimaryButton,
  TopNav,
} from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

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

function getCourseOptionLabel(locale: MobileLocale, value: number) {
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

function getPillboxEditorTitle(locale: MobileLocale) {
  if (locale === "ru") {
    return "Изменить лекарство";
  }
  if (locale === "de") {
    return "Medikament bearbeiten";
  }
  if (locale === "pl") {
    return "Edytuj lek";
  }
  return "Edit medicine";
}

function getPillboxCourseDurationTitle(locale: MobileLocale) {
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

function getPillboxCustomDaysLabel(locale: MobileLocale) {
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

function getPillboxCustomDaysSubtitle(locale: MobileLocale) {
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

function getPillboxCancelLabel(locale: MobileLocale) {
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

function getPillboxSaveLabel(locale: MobileLocale) {
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

function getPillboxOverlaySaveStateLabel(
  locale: MobileLocale,
  key:
    | "enterMedicine"
    | "enterDose"
    | "addAtLeastOneTime"
    | "chooseCourseDuration"
    | "saving"
    | "saveChanges",
) {
  if (locale === "ru") {
    return {
      enterMedicine: "Укажите препарат",
      enterDose: "Укажите дозу",
      addAtLeastOneTime: "Добавьте хотя бы одно время приёма",
      chooseCourseDuration: "Выберите срок курса",
      saving: "Сохраняем...",
      saveChanges: "Сохранить изменения",
    }[key];
  }
  if (locale === "de") {
    return {
      enterMedicine: "Medikament eingeben",
      enterDose: "Dosis eingeben",
      addAtLeastOneTime: "Fügen Sie mindestens eine Uhrzeit hinzu",
      chooseCourseDuration: "Wählen Sie die Kursdauer",
      saving: "Wird gespeichert...",
      saveChanges: "Änderungen speichern",
    }[key];
  }
  if (locale === "pl") {
    return {
      enterMedicine: "Wpisz lek",
      enterDose: "Wpisz dawkę",
      addAtLeastOneTime: "Dodaj co najmniej jedną godzinę",
      chooseCourseDuration: "Wybierz czas kuracji",
      saving: "Zapisywanie...",
      saveChanges: "Zapisz zmiany",
    }[key];
  }
  return {
    enterMedicine: "Enter medicine",
    enterDose: "Enter dose",
    addAtLeastOneTime: "Add at least one intake time",
    chooseCourseDuration: "Choose course duration",
    saving: "Saving...",
    saveChanges: "Save changes",
  }[key];
}

export function PillboxPlanMedicineEditorOverlay({
  visible,
  locale,
  planTitle,
  medicineDraft,
  pickerHour,
  pickerMinute,
  activePickerVisible,
  currentCourseDurationDays,
  isCourseSheetOpen,
  isCustomCourseSheetOpen,
  customCourseDays,
  saving,
  canSaveMedicine,
  onClose,
  onChangeName,
  onChangeDose,
  onOpenTimePicker,
  onRemoveTime,
  onSelectContinuousMode,
  onSelectCourseMode,
  onToggleWeekday,
  onSelectMealRelation,
  onConfirmTime,
  onCloseTimePicker,
  onSetPickerHour,
  onSetPickerMinute,
  onSetCourseSheetOpen,
  onSetCustomCourseSheetOpen,
  onSelectCourseOption,
  onSetCustomCourseDays,
  onSaveCustomCourseDays,
  onSave,
}: {
  visible: boolean;
  locale: MobileLocale;
  planTitle: string;
  medicineDraft: PillboxDraftMedicine | null;
  pickerHour: number;
  pickerMinute: number;
  activePickerVisible: boolean;
  currentCourseDurationDays: number | null;
  isCourseSheetOpen: boolean;
  isCustomCourseSheetOpen: boolean;
  customCourseDays: string;
  saving: boolean;
  canSaveMedicine: boolean;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onChangeDose: (value: string) => void;
  onOpenTimePicker: (time?: string, index?: number) => void;
  onRemoveTime: (time: string) => void;
  onSelectContinuousMode: () => void;
  onSelectCourseMode: () => void;
  onToggleWeekday: (day: PillboxWeekdayId) => void;
  onSelectMealRelation: (mealRelation: PillboxDraftMedicine["mealRelation"]) => void;
  onConfirmTime: () => void;
  onCloseTimePicker: () => void;
  onSetPickerHour: (value: number) => void;
  onSetPickerMinute: (value: number) => void;
  onSetCourseSheetOpen: (value: boolean) => void;
  onSetCustomCourseSheetOpen: (value: boolean) => void;
  onSelectCourseOption: (value: number | null) => void;
  onSetCustomCourseDays: (value: string) => void;
  onSaveCustomCourseDays: () => boolean;
  onSave: () => void;
}) {
  if (!visible || !medicineDraft) {
    return null;
  }

  const pickerDateParts = getCurrentPickerDateParts();
  const courseOptions = COURSE_OPTIONS.map((option) => ({
    ...option,
    label: getCourseOptionLabel(locale, option.value),
  }));
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack: onClose,
    shouldCloseOnBack: false,
    shouldTranslateOnSwipe: true,
  });

  const saveLabel =
    !medicineDraft.name.trim()
      ? getPillboxOverlaySaveStateLabel(locale, "enterMedicine")
      : !medicineDraft.dose.trim()
        ? getPillboxOverlaySaveStateLabel(locale, "enterDose")
        : medicineDraft.times.length === 0
          ? getPillboxOverlaySaveStateLabel(locale, "addAtLeastOneTime")
          : medicineDraft.intakeMode === "course" && !medicineDraft.courseDurationDays
            ? getPillboxOverlaySaveStateLabel(locale, "chooseCourseDuration")
            : saving
              ? getPillboxOverlaySaveStateLabel(locale, "saving")
              : getPillboxOverlaySaveStateLabel(locale, "saveChanges");

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <View style={styles.modalRoot}>
        <ImageBackground
          source={redesignBackgrounds.childrenModule}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View style={[styles.overlay, { backgroundColor: "rgba(255,248,243,0.82)" }]} />
        </ImageBackground>

        <View
          style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
          {...panHandlers}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TopNav step="medicine" onBack={onClose} />
          <PillboxMedicineEditorStepSection
            locale={locale}
            participantTitle={planTitle}
            title={getPillboxEditorTitle(locale)}
            medicineDraft={medicineDraft}
            onChangeName={onChangeName}
            onChangeDose={onChangeDose}
            onOpenTimePicker={onOpenTimePicker}
            onRemoveTime={onRemoveTime}
            onSelectContinuousMode={onSelectContinuousMode}
            onSelectCourseMode={onSelectCourseMode}
            onToggleWeekday={onToggleWeekday}
            onSelectMealRelation={onSelectMealRelation}
          />
        </ScrollView>

        <View style={styles.bottomActionDock}>
          <PrimaryButton label={saveLabel} disabled={!canSaveMedicine || saving} onPress={onSave} />
        </View>

        <BackdatedDateTimePickerSheet
          visible={activePickerVisible}
          locale={locale}
          activePickerField="time"
          pickerDay={pickerDateParts.day}
          pickerMonthIndex={pickerDateParts.monthIndex}
          pickerYear={pickerDateParts.year}
          pickerHour={pickerHour}
          pickerMinute={pickerMinute}
          setPickerDay={() => {}}
          setPickerMonthIndex={() => {}}
          setPickerYear={() => {}}
          setPickerHour={onSetPickerHour}
          setPickerMinute={onSetPickerMinute}
          onClose={onCloseTimePicker}
          onConfirm={onConfirmTime}
        />

        <ReminderNumberOptionsSheet
          visible={isCourseSheetOpen}
          title={getPillboxCourseDurationTitle(locale)}
          value={currentCourseDurationDays}
          options={courseOptions}
          columns={2}
          customActionActive={
            currentCourseDurationDays !== null &&
            !courseOptions.some((option) => option.value === currentCourseDurationDays)
          }
          customActionLabel={getPillboxCustomDaysLabel(locale)}
          onClose={() => onSetCourseSheetOpen(false)}
          onSelect={onSelectCourseOption}
          onCustomPress={() => {
            onSetCourseSheetOpen(false);
            onSetCustomCourseSheetOpen(true);
          }}
        />

        <FormBottomSheet
          visible={isCustomCourseSheetOpen}
          onClose={() => onSetCustomCourseSheetOpen(false)}
          overlayStyle={styles.sheetOverlay}
          backdropStyle={styles.sheetBackdrop}
          sheetStyle={styles.customValueSheetCard}
          keyboardAvoiding
          keyboardBehavior="padding"
          keyboardVerticalOffset={0}
        >
          {({ panHandlers, requestClose }) => (
            <>
              <View style={styles.sheetDragZone} {...panHandlers}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>{getPillboxCustomDaysLabel(locale)}</Text>
                <Text style={styles.sheetSubtitle}>{getPillboxCustomDaysSubtitle(locale)}</Text>
              </View>

              <TextInput
                value={customCourseDays}
                onChangeText={onSetCustomCourseDays}
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
                  <Text style={styles.customValueCancelText}>{getPillboxCancelLabel(locale)}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const canClose = onSaveCustomCourseDays();
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
                  <Text style={styles.customValueSaveText}>{getPillboxSaveLabel(locale)}</Text>
                </Pressable>
              </View>
            </>
          )}
        </FormBottomSheet>
      </View>
    </Animated.View>
  );
}
