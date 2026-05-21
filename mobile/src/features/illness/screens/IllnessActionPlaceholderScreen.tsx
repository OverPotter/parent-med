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
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import {
  formatBackdatedDate,
  formatBackdatedTime,
} from "../../../shared/lib/backdatedDateTime";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { ChildCard } from "../../children/model/childrenRedesign";
import type {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../model/illnessObservation";
import { CustomNumberPrompt } from "./CustomNumberPrompt";
import {
  IllnessEntryActionSection,
} from "./IllnessActionSharedSections";
import { ReminderActionForm } from "./ReminderActionForm";
import { ReminderNumberOptionsSheet } from "./ReminderNumberOptionsSheet";
import {
  useIllnessActionPlaceholderController,
} from "./useIllnessActionPlaceholderController";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import {
  getReminderCustomIntervalPlaceholder,
  toReminderIntervalCustomValue,
} from "./reminderNumberOptions";
import {
  buildIllnessActionDeleteCopy,
  getIllnessActionPlaceholderBundle,
  toIllnessActionUiLocale,
} from "./illnessActionPlaceholderCopy";

type IllnessActionPlaceholderScreenProps = {
  child: ChildCard;
  kind: IllnessQuickActionKind;
  observation: MobileIllnessObservation | null;
  visible: boolean;
  onBack: () => void;
  onSaveAdministration: (payload: {
    childId: string;
    customMedicineName: string;
    amount: string;
    administeredAt: string;
  }) => void | Promise<void>;
  onSaveNote: (payload: {
    childId: string;
    text: string;
    createdAt: string;
  }) => void | Promise<void>;
  onSaveReminder: (payload: {
    childId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onUpdateReminder: (payload: {
    childId: string;
    planId: string;
    customMedicineName: string;
    doseAmount: string;
    minIntervalMinutes: number;
    maxDosesPerDay?: number | null;
    alreadyGiven?: boolean;
    lastGivenAt?: string | null;
    notes?: string | null;
  }) => void | Promise<void>;
  onSaveTemperature: (payload: {
    childId: string;
    valueCelsius: number;
    measuredAt: string;
  }) => void | Promise<void>;
  onDeleteEntry: (payload: {
    childId: string;
    entryId: string;
    kind: "temperature" | "note" | "medicine" | "reminder";
  }) => void | Promise<void>;
  editingReminderPlan?: MobileEpisodeMedicationPlan | null;
};

export function IllnessActionPlaceholderScreen({
  child,
  kind,
  observation,
  visible,
  onBack,
  onSaveAdministration,
  onSaveNote,
  onSaveReminder,
  onUpdateReminder,
  onSaveTemperature,
  onDeleteEntry,
  editingReminderPlan,
}: IllnessActionPlaceholderScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
  });
  const uiLocale = toIllnessActionUiLocale(locale);
  const { copy, temperatureCopy, noteCopy, medicineCopy, reminderCopy } =
    getIllnessActionPlaceholderBundle(uiLocale, kind);
  const controller = useIllnessActionPlaceholderController({
    childId: child.nodeId,
    kind,
    visible,
    observation,
    locale,
    editingReminderPlan,
    temperatureCopy,
    medicineCopy,
    noteCopy,
    reminderCopy,
    onSaveAdministration,
    onSaveNote,
    onSaveReminder,
    onUpdateReminder,
    onSaveTemperature,
  });
  const {
    temperatureValue,
    setTemperatureValue,
    medicineValue,
    setMedicineValue,
    medicineAmountValue,
    setMedicineAmountValue,
    noteValue,
    setNoteValue,
    backdatedEnabled,
    setBackdatedEnabled,
    measuredAt,
    activePickerField,
    pickerDay,
    pickerMonthIndex,
    pickerYear,
    pickerHour,
    pickerMinute,
    setPickerDay,
    setPickerMonthIndex,
    setPickerYear,
    setPickerHour,
    setPickerMinute,
    openPicker,
    closePicker,
    confirmPicker,
    temperatureError,
    setTemperatureError,
    medicineError,
    setMedicineError,
    noteError,
    setNoteError,
    pendingDeleteEntryId,
    setPendingDeleteEntryId,
    pendingDeleteEntryKind,
    setPendingDeleteEntryKind,
    clearPendingDelete,
    temperatureEntries,
    noteEntries,
    medicineEntries,
    handleSaveTemperature,
    handleSaveNote,
    handleSaveMedicine,
    reminderState,
    handleSaveReminder,
    reminderSaveEnabled,
    formatReminderIntervalForUnit,
  } = controller;

  const measuredDateValue = formatBackdatedDate(measuredAt, uiLocale);
  const measuredTimeValue = formatBackdatedTime(measuredAt);
  const customSheetDoneLabel =
    uiLocale === "ru"
      ? "Готово"
      : uiLocale === "de"
        ? "Fertig"
        : uiLocale === "pl"
          ? "Gotowe"
          : "Done";

  const deleteCopy = buildIllnessActionDeleteCopy(uiLocale, pendingDeleteEntryKind);
  const backLinkText =
    kind === "reminder" && editingReminderPlan
      ? uiLocale === "ru"
        ? "← Назад к плану"
        : uiLocale === "de"
          ? "← Zurück zum Plan"
          : uiLocale === "pl"
            ? "← Wróć do planu"
            : "← Back to plan"
      : uiLocale === "ru"
        ? "← Назад к журналу"
        : uiLocale === "de"
          ? "← Zurück zum Journal"
          : uiLocale === "pl"
            ? "← Powrót do dziennika"
            : "← Back to journal";

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>{backLinkText}</Text>
          </Pressable>

          {kind === "temperature" || kind === "medicine" || kind === "note" ? (
            <IllnessEntryActionSection
              kind={kind}
              child={child}
              locale={locale}
              styles={styles}
              temperatureCopy={temperatureCopy}
              medicineCopy={medicineCopy}
              noteCopy={noteCopy}
              temperatureValue={temperatureValue}
              onTemperatureChange={(next) => {
                setTemperatureValue(next);
                setTemperatureError(null);
              }}
              temperatureError={temperatureError}
              onSaveTemperature={handleSaveTemperature}
              medicineValue={medicineValue}
              onMedicineChange={(next) => {
                setMedicineValue(next);
                setMedicineError(null);
              }}
              medicineAmountValue={medicineAmountValue}
              onMedicineAmountChange={(next) => {
                setMedicineAmountValue(next);
                setMedicineError(null);
              }}
              medicineError={medicineError}
              onSaveMedicine={handleSaveMedicine}
              noteValue={noteValue}
              onNoteChange={(next) => {
                setNoteValue(next);
                setNoteError(null);
              }}
              noteError={noteError}
              onSaveNote={handleSaveNote}
              backdatedEnabled={backdatedEnabled}
              onToggleBackdated={() => setBackdatedEnabled((current) => !current)}
              onOpenBackdatedTime={() => openPicker("time")}
              onOpenBackdatedDate={() => openPicker("date")}
              measuredTimeValue={measuredTimeValue}
              measuredDateValue={measuredDateValue}
              onBack={onBack}
              temperatureEntries={temperatureEntries}
              medicineEntries={medicineEntries}
              noteEntries={noteEntries}
              onDeleteTemperature={(entryId) => {
                setPendingDeleteEntryId(entryId);
                setPendingDeleteEntryKind("temperature");
              }}
              onDeleteMedicine={(entryId) => {
                setPendingDeleteEntryId(entryId);
                setPendingDeleteEntryKind("medicine");
              }}
              onDeleteNote={(entryId) => {
                setPendingDeleteEntryId(entryId);
                setPendingDeleteEntryKind("note");
              }}
            />
          ) : kind === "reminder" ? (
            <ReminderActionForm
              child={child}
              reminderCopy={reminderCopy}
              temperatureCopy={temperatureCopy}
              locale={locale}
              uiLocale={uiLocale}
              medicationIntervalUnit={reminderState.medicationIntervalUnit}
              reminderMedicineValue={reminderState.reminderMedicineValue}
              reminderDoseValue={reminderState.reminderDoseValue}
              reminderIntervalMinutesValue={reminderState.reminderIntervalMinutesValue}
              reminderMaxDosesPerDay={reminderState.reminderMaxDosesPerDay}
              reminderAlreadyGiven={reminderState.reminderAlreadyGiven}
              reminderAlreadyGivenExpanded={reminderState.reminderAlreadyGivenExpanded}
              reminderLastGivenAt={reminderState.reminderLastGivenAt}
              normalizedReminderMedicineName={reminderState.normalizedReminderMedicineName}
              matchingMedicineEntries={reminderState.matchingMedicineEntries}
              reminderError={reminderState.reminderError}
              styles={styles}
              formatIntervalForUnit={formatReminderIntervalForUnit}
              onMedicineChange={reminderState.setReminderMedicineValue}
              onDoseChange={reminderState.setReminderDoseValue}
              onOpenIntervalSheet={() =>
                reminderState.setActiveReminderNumberSheet("interval")
              }
              onOpenLimitSheet={() =>
                reminderState.setActiveReminderNumberSheet("limit")
              }
              onToggleAlreadyGivenExpanded={() =>
                reminderState.setReminderAlreadyGivenExpanded((current) => !current)
              }
              onSelectAlreadyGiven={() => reminderState.setReminderAlreadyGiven(true)}
              onSelectNotYet={() => reminderState.setReminderAlreadyGiven(false)}
              onOpenReminderDate={() => reminderState.openReminderPicker("date")}
              onOpenReminderTime={() => reminderState.openReminderPicker("time")}
              onBack={onBack}
              onSave={handleSaveReminder}
              saveEnabled={reminderSaveEnabled}
              setReminderError={reminderState.setReminderError}
            />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {copy.title} · {child.name}
                </Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
              </View>

              <View style={styles.placeholderCard}>
                <View style={styles.copy}>
                  <Text style={styles.cardTitle}>{copy.title}</Text>
                  <Text style={styles.cardBody}>{copy.body}</Text>
                </View>
                <View style={styles.avatarWrap}>
                  {child.avatarSource ? (
                    <Image
                      source={child.avatarSource}
                      defaultSource={getLocalAssetDefaultSource(child.avatarSource)}
                      style={styles.avatar}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  ) : null}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {visible && pendingDeleteEntryId ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={clearPendingDelete}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{deleteCopy.title}</Text>
            <Text style={styles.confirmDescription}>
              {deleteCopy.description}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={clearPendingDelete}
                style={({ pressed }) => [
                  styles.confirmButtonSecondary,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonSecondaryText}>
                  {deleteCopy.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onDeleteEntry({
                    childId: child.nodeId,
                    entryId: pendingDeleteEntryId,
                    kind: pendingDeleteEntryKind ?? "temperature",
                  });
                  clearPendingDelete();
                }}
                style={({ pressed }) => [
                  styles.confirmButtonPrimary,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.confirmButtonPrimaryText}>
                  {deleteCopy.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {visible && activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale={uiLocale}
          activePickerField={activePickerField}
          pickerDay={pickerDay}
          pickerMonthIndex={pickerMonthIndex}
          pickerYear={pickerYear}
          pickerHour={pickerHour}
          pickerMinute={pickerMinute}
          setPickerDay={setPickerDay}
          setPickerMonthIndex={setPickerMonthIndex}
          setPickerYear={setPickerYear}
          setPickerHour={setPickerHour}
          setPickerMinute={setPickerMinute}
          onClose={closePicker}
          onConfirm={confirmPicker}
        />
      ) : null}

      {visible && reminderState.activeReminderPickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale={uiLocale}
          activePickerField={reminderState.activeReminderPickerField}
          pickerDay={reminderState.reminderPickerDay}
          pickerMonthIndex={reminderState.reminderPickerMonthIndex}
          pickerYear={reminderState.reminderPickerYear}
          pickerHour={reminderState.reminderPickerHour}
          pickerMinute={reminderState.reminderPickerMinute}
          setPickerDay={reminderState.setReminderPickerDay}
          setPickerMonthIndex={reminderState.setReminderPickerMonthIndex}
          setPickerYear={reminderState.setReminderPickerYear}
          setPickerHour={reminderState.setReminderPickerHour}
          setPickerMinute={reminderState.setReminderPickerMinute}
          onClose={reminderState.closeReminderPicker}
          onConfirm={reminderState.confirmReminderPicker}
        />
      ) : null}

      <ReminderNumberOptionsSheet
        visible={visible && reminderState.activeReminderNumberSheet !== null}
        title={
          reminderState.activeReminderNumberSheet === "interval"
            ? reminderCopy.intervalLabel
            : reminderCopy.dailyLimitLabel
        }
        value={
          reminderState.activeReminderNumberSheet === "interval"
            ? Number.parseInt(reminderState.reminderIntervalMinutesValue || "0", 10) ||
              null
            : reminderState.reminderMaxDosesPerDay
        }
        options={
          reminderState.activeReminderNumberSheet === "interval"
            ? reminderState.intervalSheetOptions
            : reminderState.limitSheetOptions
        }
        showEmptyOption={reminderState.activeReminderNumberSheet === "limit"}
        emptyOptionLabel={
          uiLocale === "ru"
            ? "Без лимита"
            : uiLocale === "de"
              ? "Ohne Limit"
              : uiLocale === "pl"
                ? "Bez limitu"
                : "No limit"
        }
        customActionLabel={
          reminderState.activeReminderNumberSheet === "interval"
            ? reminderState.reminderNumberSheetCustomLabel
            : reminderState.reminderLimitSheetCustomLabel
        }
        onClose={() => reminderState.setActiveReminderNumberSheet(null)}
        onSelect={(nextValue) => {
          if (reminderState.activeReminderNumberSheet === "interval") {
            reminderState.setReminderIntervalMinutesValue(
              nextValue ? String(nextValue) : "180",
            );
          } else {
            reminderState.setReminderMaxDosesPerDay(nextValue);
          }
          reminderState.setActiveReminderNumberSheet(null);
          reminderState.setReminderError(null);
        }}
        onCustomPress={
          reminderState.activeReminderNumberSheet === "interval"
            ? () => {
                reminderState.setCustomIntervalValue(
                  toReminderIntervalCustomValue(
                    Number.parseInt(
                      reminderState.reminderIntervalMinutesValue || "0",
                      10,
                    ),
                    reminderState.medicationIntervalUnit,
                  ),
                );
                reminderState.setActiveReminderNumberSheet(null);
                reminderState.setCustomIntervalModalVisible(true);
              }
            : () => {
                reminderState.setCustomLimitValue(
                  reminderState.reminderMaxDosesPerDay
                    ? String(reminderState.reminderMaxDosesPerDay)
                    : "",
                );
                reminderState.setActiveReminderNumberSheet(null);
                reminderState.setCustomLimitModalVisible(true);
              }
        }
      />

      <CustomNumberPrompt
        visible={visible && reminderState.customIntervalModalVisible}
        title={reminderCopy.intervalLabel}
        description={reminderCopy.intervalHelper}
        value={reminderState.customIntervalValue}
        onChangeText={(next) =>
          reminderState.setCustomIntervalValue(
            reminderState.medicationIntervalUnit === "hours"
              ? next.replace(/[^0-9.,]/g, "").replace(",", ".")
              : next.replace(/[^0-9]/g, ""),
          )
        }
        placeholder={
          reminderState.medicationIntervalUnit === "hours"
            ? getReminderCustomIntervalPlaceholder(
                reminderState.medicationIntervalUnit,
                locale,
              )
            : reminderCopy.intervalPlaceholder
        }
        suffix={
          reminderState.medicationIntervalUnit === "hours"
            ? uiLocale === "ru"
              ? "ч"
              : uiLocale === "de"
                ? "Std."
                : uiLocale === "pl"
                  ? "godz."
                  : "h"
            : uiLocale === "ru"
              ? "мин"
              : uiLocale === "de"
                ? "Min."
                : uiLocale === "pl"
                  ? "min"
                  : "min"
        }
        maxLength={4}
        cancelLabel={reminderCopy.cancel}
        confirmLabel={customSheetDoneLabel}
        onClose={() => {
          reminderState.setCustomIntervalModalVisible(false);
        }}
        onConfirm={() => {
          const normalizedValue = reminderState.customIntervalValue
            .trim()
            .replace(",", ".");
          if (!normalizedValue) {
            return;
          }
          if (reminderState.medicationIntervalUnit === "hours") {
            const parsedHours = Number.parseFloat(normalizedValue);
            if (Number.isNaN(parsedHours)) {
              return;
            }
            reminderState.setReminderIntervalMinutesValue(
              String(Math.round(parsedHours * 60)),
            );
          } else {
            const digitsOnly = normalizedValue.replace(/[^0-9]/g, "");
            if (!digitsOnly) {
              return;
            }
            reminderState.setReminderIntervalMinutesValue(digitsOnly);
          }
          reminderState.setCustomIntervalModalVisible(false);
          reminderState.setReminderError(null);
        }}
        styles={styles}
      />

      <CustomNumberPrompt
        visible={visible && reminderState.customLimitModalVisible}
        title={reminderCopy.dailyLimitLabel}
        description={reminderCopy.dailyLimitHelper}
        value={reminderState.customLimitValue}
        onChangeText={(next) =>
          reminderState.setCustomLimitValue(next.replace(/[^0-9]/g, ""))
        }
        placeholder={reminderCopy.dailyLimitPlaceholder}
        suffix={null}
        maxLength={2}
        cancelLabel={reminderCopy.cancel}
        confirmLabel={customSheetDoneLabel}
        onClose={() => {
          reminderState.setCustomLimitModalVisible(false);
        }}
        onConfirm={() => {
          const digitsOnly = reminderState.customLimitValue.replace(/[^0-9]/g, "");
          if (!digitsOnly) {
            return;
          }
          reminderState.setReminderMaxDosesPerDay(Number.parseInt(digitsOnly, 10));
          reminderState.setCustomLimitModalVisible(false);
          reminderState.setReminderError(null);
        }}
        styles={styles}
      />
    </Animated.View>
  );
}

const styles = {
  overlayLayer: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 32,
    backgroundColor: "#FBF3EC",
  },
  overlayLayerHidden: { opacity: 0 },
  overlayLayerVisible: { opacity: 1 },
  swipeBackEdge: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
  },
  background: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FBF3EC",
  },
  backgroundImage: {
    width: "100%" as const,
    height: "100%" as const,
  },
  backgroundOverlay: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(251,243,236,0.94)",
  },
  screen: { flex: 1, backgroundColor: "#FBF3EC" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 18,
  },
  backLink: { alignSelf: "flex-start" as const, paddingVertical: 4 },
  backLinkText: {
    color: "#3E4B5C",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  header: { gap: 8, paddingHorizontal: 2 },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  title: {
    color: "#252B35",
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600" as const,
    letterSpacing: -0.4,
  },
  headerAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F7E6DB",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    flexShrink: 0,
  },
  headerAvatar: {
    width: 46,
    height: 46,
  },
  subtitle: {
    maxWidth: 320,
    color: "#6F7178",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400" as const,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EFDDD2",
    backgroundColor: "#FFFCF8",
    padding: 20,
    gap: 12,
  },
  formCardTemperature: {
    borderColor: "#F0D7D2",
    backgroundColor: "#FFF4F3",
  },
  formCardNote: {
    borderColor: "#D3E7D8",
    backgroundColor: "#F3FCF5",
  },
  formCardMedicine: {
    borderColor: "#F0DEC8",
    backgroundColor: "#FFF8EF",
  },
  formCardReminder: {
    borderColor: "#D9E4F3",
    backgroundColor: "#F7FBFF",
  },
  reminderAlreadyCard: {
    marginTop: 2,
  },
  sectionTitle: {
    color: "#252B35",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600" as const,
  },
  sectionBody: {
    color: "#6F7178",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  sectionFieldLabel: {
    color: "#252B35",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500" as const,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  fieldIconWrap: {
    width: 34,
    height: 34,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  fieldIconImage: {
    width: 28,
    height: 28,
    transform: [{ scale: 1.08 }],
  },
  reminderSelectorIconImage: {
    width: 32,
    height: 32,
    transform: [{ scale: 1.12 }],
  },
  fieldContent: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  inputWrap: {
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputIcon: {
    width: 28,
    height: 28,
    transform: [{ scale: 1.95 }],
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: "#252B35",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500" as const,
    paddingVertical: 0,
  },
  inputSuffix: {
    color: "#6F7C91",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600" as const,
  },
  noteInputWrap: {
    minHeight: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteInput: {
    minHeight: 118,
    color: "#252B35",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400" as const,
    paddingVertical: 0,
  },
  textFieldWrap: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    justifyContent: "center" as const,
  },
  textFieldInput: {
    color: "#252B35",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
    paddingVertical: 12,
  },
  selectorField: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  selectorValue: {
    flex: 1,
    minWidth: 0,
    color: "#252B35",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  selectorPlaceholder: {
    flex: 1,
    minWidth: 0,
    color: "#98A7AB",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  fieldHint: {
    color: "#7A8698",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  softHintCard: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#EEF7FF",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  softHintIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#D9EEFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  softHintIconImage: {
    width: 22,
    height: 22,
    transform: [{ scale: 1.12 }],
  },
  softHintText: {
    flex: 1,
    color: "#5F7288",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  infoCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6DAF8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoCardTitle: {
    color: "#252B35",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
  infoCardBody: {
    color: "#6F7178",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500" as const,
  },
  infoRows: {
    gap: 0,
  },
  infoRow: {
    minHeight: 36,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  infoRowLabel: {
    color: "#6F7178",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500" as const,
  },
  infoRowValue: {
    color: "#252B35",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500" as const,
    textAlign: "right" as const,
    flexShrink: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F0E7FB",
  },
  accordionHeader: {
    minHeight: 30,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  segmentedRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
  },
  segmentedChoice: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1D8CD",
    backgroundColor: "#FFFCF8",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 14,
  },
  segmentedChoiceActive: {
    backgroundColor: "#F56F68",
    borderColor: "#F56F68",
  },
  segmentedChoiceText: {
    color: "#667386",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  segmentedChoiceTextActive: {
    color: "#FFFFFF",
  },
  explanationCard: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#EEF7FF",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  explanationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#D9EEFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  explanationIconImage: {
    width: 22,
    height: 22,
    transform: [{ scale: 1.08 }],
  },
  explanationText: {
    flex: 1,
    color: "#5F7288",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  lastGivenGroup: {
    gap: 8,
  },
  lastGivenFieldLabel: {
    color: "#252B35",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
  backdatedSection: {
    gap: 10,
  },
  backdatedToggle: {
    minHeight: 28,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  backdatedToggleText: {
    color: "#252B35",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "500" as const,
  },
  backdatedContent: {
    gap: 10,
    paddingTop: 2,
  },
  rowsList: {
    gap: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },
  row: {
    minHeight: 56,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  rowPressable: {
    borderRadius: 16,
  },
  rowPressablePressed: {
    opacity: 0.92,
  },
  rowLabel: {
    color: "#23364A",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500" as const,
  },
  rowValueWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    maxWidth: "52%" as const,
  },
  rowValue: {
    color: "#6F7E8D",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500" as const,
    textAlign: "right" as const,
    flexShrink: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0DED6",
  },
  errorText: {
    color: "#D85E58",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500" as const,
  },
  actions: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: "#F56F68",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600" as const,
  },
  primaryButtonMedicine: {
    backgroundColor: "#F2A355",
  },
  primaryButtonReminder: {
    backgroundColor: "#F56F68",
  },
  primaryButtonReminderDisabled: {
    backgroundColor: "#F3C7C2",
  },
  primaryButtonTextReminder: {
    color: "#FFFFFF",
  },
  primaryButtonTextReminderDisabled: {
    color: "#FFF8F6",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F56F68",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FFF8F6",
  },
  secondaryButtonText: {
    color: "#F56F68",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600" as const,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  recentSection: {
    gap: 10,
  },
  recentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 2,
  },
  recentCount: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    textAlign: "center" as const,
    textAlignVertical: "center" as const,
    backgroundColor: "#FFF0F0",
    color: "#D85E58",
    fontSize: 13,
    lineHeight: 30,
    fontWeight: "800" as const,
    overflow: "hidden" as const,
  },
  recentCountNote: {
    backgroundColor: "#EFFAF3",
    color: "#4B9B68",
  },
  recentCountMedicine: {
    backgroundColor: "#FFF1DF",
    color: "#C9781E",
  },
  recentCountReminder: {
    backgroundColor: "#F3EBFF",
    color: "#7A55D2",
  },
  recentFeed: { gap: 10 },
  timelineRow: {
    flexDirection: "row" as const,
    alignItems: "stretch" as const,
  },
  timelineLeftColumn: {
    width: 86,
    alignItems: "flex-start" as const,
  },
  timeCard: {
    width: "100%" as const,
    minHeight: 96,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F6E7E0",
    backgroundColor: "#FFFDFC",
    padding: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  timeValue: {
    color: "#1E2A38",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
  dayValue: {
    color: "#66758A",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  timelineCenterColumn: {
    width: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF9C92",
  },
  timelineDotNote: {
    backgroundColor: "#7EDFA3",
  },
  timelineDotMedicine: {
    backgroundColor: "#F2A355",
  },
  timelineDotReminder: {
    backgroundColor: "#9C76F0",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    marginBottom: 14,
    backgroundColor: "#F3D5CA",
  },
  timelineLineNote: {
    backgroundColor: "#D7EEDC",
  },
  timelineLineMedicine: {
    backgroundColor: "#F4DEC4",
  },
  timelineLineReminder: {
    backgroundColor: "#E4D8FA",
  },
  timelineEntryCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F6E7E0",
    backgroundColor: "#FFFDFC",
    padding: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  timelineEntryBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "transparent",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  timelineEntryBadgeTransparent: {
    backgroundColor: "transparent",
  },
  timelineEntryBadgeNote: {
    backgroundColor: "#EFFAF3",
  },
  timelineEntryBadgeMedicine: {
    backgroundColor: "#FFF1DF",
  },
  timelineEntryBadgeReminder: {
    backgroundColor: "#F3EBFF",
  },
  timelineEntryBadgeImage: {
    width: 24,
    height: 24,
    transform: [{ scale: 1.72 }],
  },
  timelineEntryCopy: {
    flex: 1,
    minWidth: 0,
  },
  timelineEntryValue: {
    color: "#1E2A38",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
  timelineEntryMeta: {
    marginTop: 2,
    color: "#66758A",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EFDDD2",
    backgroundColor: "#FFFCF8",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyCardText: {
    color: "#6F7178",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  placeholderCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#EFDDD2",
    backgroundColor: "#FFF8F1",
    padding: 20,
    flexDirection: "row" as const,
    gap: 14,
    alignItems: "center" as const,
  },
  copy: { flex: 1, gap: 10 },
  cardTitle: {
    color: "#252B35",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700" as const,
  },
  cardBody: {
    color: "#5F636B",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#F7E6DB",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    flexShrink: 0,
  },
  avatar: {
    width: 78,
    height: 78,
  },
  confirmOverlay: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 24,
    zIndex: 60,
  },
  confirmBackdrop: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(22, 32, 43, 0.24)",
  },
  confirmCard: {
    width: "100%" as const,
    borderRadius: 28,
    backgroundColor: "#FFFCF8",
    padding: 22,
    borderWidth: 1,
    borderColor: "#EED8CE",
  },
  confirmTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800" as const,
    color: "#1E2A3A",
  },
  confirmDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
    color: "#6B7585",
  },
  confirmActions: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 18,
  },
  confirmButtonSecondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D7CE",
    backgroundColor: "#FFFDFC",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  confirmButtonSecondaryText: {
    color: "#6B7585",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
  confirmButtonPrimary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#F29C86",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  confirmButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800" as const,
  },
  customIntervalInputWrap: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D4CB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginTop: 16,
  },
  customIntervalInput: {
    flex: 1,
    color: "#252B35",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "500" as const,
    paddingVertical: 0,
  },
  customIntervalSuffix: {
    color: "#6F7C91",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600" as const,
  },
};
