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
import type { PillboxDraftMedicine } from "../model/pillboxPlanOnboarding";
import { PillboxMedicineEditorStepSection } from "./PillboxMedicineEditorStepSection";
import {
  PrimaryButton,
  TopNav,
} from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

const PICKER_DAY = 15;
const PICKER_MONTH_INDEX = 4;
const PICKER_YEAR = 2026;
const COURSE_OPTIONS: ReminderNumberSheetOption[] = [14, 30, 40].map((value) => ({
  value,
  label: `${value} дн.`,
}));

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
  onToggleWeekday: (day: string) => void;
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
          : medicineDraft.intakeMode === "course" && !medicineDraft.courseDurationDays
            ? locale === "ru"
              ? "Выберите срок курса"
              : "Choose course duration"
            : saving
              ? locale === "ru"
                ? "Сохраняем..."
                : "Saving..."
              : locale === "ru"
                ? "Сохранить изменения"
                : "Save changes";

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
            title={locale === "ru" ? "Изменить лекарство" : "Edit medicine"}
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
          pickerDay={PICKER_DAY}
          pickerMonthIndex={PICKER_MONTH_INDEX}
          pickerYear={PICKER_YEAR}
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
          title={locale === "ru" ? "Сколько дней курс" : "Course duration"}
          value={currentCourseDurationDays}
          options={COURSE_OPTIONS}
          columns={2}
          customActionActive={
            currentCourseDurationDays !== null &&
            !COURSE_OPTIONS.some((option) => option.value === currentCourseDurationDays)
          }
          customActionLabel={locale === "ru" ? "Свои дни" : "Custom days"}
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
                  <Text style={styles.customValueCancelText}>
                    {locale === "ru" ? "Отмена" : "Cancel"}
                  </Text>
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
                  <Text style={styles.customValueSaveText}>
                    {locale === "ru" ? "Сохранить" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </FormBottomSheet>
      </View>
    </Animated.View>
  );
}
