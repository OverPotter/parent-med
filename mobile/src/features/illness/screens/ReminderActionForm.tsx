import type { ReactElement } from "react";
import { Feather } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import type { ChildCard } from "../../children/model/childrenRedesign";
import type { MedicationIntervalUnit } from "../../settings/session/mobileSettingsPreferencesStorage";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  formatBackdatedDate,
  formatBackdatedTime,
} from "../../../shared/lib/backdatedDateTime";
import { reminderFieldIcons } from "../assets";
import type { MobileIllnessObservation } from "../model/illnessObservation";

type HelperComponents = {
  ActionScreenHeader: (props: {
    title: string;
    subtitle: string;
    child: ChildCard;
  }) => ReactElement;
  FormFieldWithIcon: (props: {
    iconSource: number;
    label: string;
    value: string;
    onChangeText: (next: string) => void;
    placeholder: string;
    keyboardType?: "default" | "number-pad";
    maxLength?: number;
  }) => ReactElement;
  SmartNumberSelector: (props: {
    iconSource: number;
    iconStyle?: object;
    label: string;
    value: number | null;
    displayValue?: string | null;
    placeholder: string;
    onPress: () => void;
  }) => ReactElement;
  SoftHintCard: (props: { text: string }) => ReactElement;
  ReminderAlreadyGivenSection: (props: {
    title: string;
    emptyText: string;
    lastLabel: string;
    todayLabel: string;
    ofLabel: string;
    entries: MobileIllnessObservation["entries"];
    locale: MobileLocale;
    maxDosesPerDay: number | null;
  }) => ReactElement;
};

type ReminderCopy = {
  title: string;
  subtitle: string;
  medicineLabel: string;
  medicinePlaceholder: string;
  doseLabel: string;
  dosePlaceholder: string;
  intervalLabel: string;
  intervalPlaceholder: string;
  intervalHelper: string;
  dailyLimitLabel: string;
  dailyLimitPlaceholder: string;
  dailyLimitHelper: string;
  alreadyGivenTitle: string;
  alreadyGivenYes: string;
  alreadyGivenNo: string;
  alreadyGivenExplainYes: string;
  alreadyGivenExplainNo: string;
  alreadyGivenEmpty: string;
  alreadyGivenToday: string;
  alreadyGivenOfLimit: string;
  lastGivenLabel: string;
  lastGivenDetected: string;
  save: string;
  cancel: string;
};

export function ReminderActionForm({
  child,
  reminderCopy,
  temperatureCopy,
  locale,
  uiLocale,
  medicationIntervalUnit,
  reminderMedicineValue,
  reminderDoseValue,
  reminderIntervalMinutesValue,
  reminderMaxDosesPerDay,
  reminderAlreadyGiven,
  reminderAlreadyGivenExpanded,
  reminderLastGivenAt,
  normalizedReminderMedicineName,
  matchingMedicineEntries,
  reminderError,
  styles,
  formatIntervalForUnit,
  onMedicineChange,
  onDoseChange,
  onOpenIntervalSheet,
  onOpenLimitSheet,
  onToggleAlreadyGivenExpanded,
  onSelectAlreadyGiven,
  onSelectNotYet,
  onOpenReminderDate,
  onOpenReminderTime,
  onBack,
  onSave,
  saveEnabled,
  setReminderError,
  parts,
}: {
  child: ChildCard;
  reminderCopy: ReminderCopy;
  temperatureCopy: { dateLabel: string; timeLabel: string };
  locale: MobileLocale;
  uiLocale: "ru" | "en" | "de" | "pl";
  medicationIntervalUnit: MedicationIntervalUnit;
  reminderMedicineValue: string;
  reminderDoseValue: string;
  reminderIntervalMinutesValue: string;
  reminderMaxDosesPerDay: number | null;
  reminderAlreadyGiven: boolean;
  reminderAlreadyGivenExpanded: boolean;
  reminderLastGivenAt: Date;
  normalizedReminderMedicineName: string;
  matchingMedicineEntries: MobileIllnessObservation["entries"];
  reminderError: string | null;
  styles: any;
  formatIntervalForUnit: (
    minutes: number,
    unit: MedicationIntervalUnit,
    locale: MobileLocale,
  ) => string;
  onMedicineChange: (next: string) => void;
  onDoseChange: (next: string) => void;
  onOpenIntervalSheet: () => void;
  onOpenLimitSheet: () => void;
  onToggleAlreadyGivenExpanded: () => void;
  onSelectAlreadyGiven: () => void;
  onSelectNotYet: () => void;
  onOpenReminderDate: () => void;
  onOpenReminderTime: () => void;
  onBack: () => void;
  onSave: () => void;
  saveEnabled: boolean;
  setReminderError: (value: string | null) => void;
  parts: HelperComponents;
}) {
  const {
    ActionScreenHeader,
    FormFieldWithIcon,
    SmartNumberSelector,
    SoftHintCard,
    ReminderAlreadyGivenSection,
  } = parts;

  return (
    <>
      <ActionScreenHeader
        title={`${reminderCopy.title} · ${child.name}`}
        subtitle={reminderCopy.subtitle}
        child={child}
      />

      <View style={[styles.formCard, styles.formCardReminder]}>
        <FormFieldWithIcon
          iconSource={reminderFieldIcons.medicine}
          label={reminderCopy.medicineLabel}
          value={reminderMedicineValue}
          onChangeText={(next) => {
            onMedicineChange(next);
            setReminderError(null);
          }}
          placeholder={reminderCopy.medicinePlaceholder}
          maxLength={80}
        />

        <FormFieldWithIcon
          iconSource={reminderFieldIcons.dose}
          label={reminderCopy.doseLabel}
          value={reminderDoseValue}
          onChangeText={(next) => {
            onDoseChange(next);
            setReminderError(null);
          }}
          placeholder={reminderCopy.dosePlaceholder}
          maxLength={40}
        />

        <SmartNumberSelector
          iconSource={reminderFieldIcons.interval}
          iconStyle={styles.reminderSelectorIconImage}
          label={reminderCopy.intervalLabel}
          value={Number.parseInt(reminderIntervalMinutesValue || "0", 10) || null}
          displayValue={
            reminderIntervalMinutesValue
              ? formatIntervalForUnit(
                  Number.parseInt(reminderIntervalMinutesValue, 10),
                  medicationIntervalUnit,
                  locale,
                )
              : null
          }
          placeholder={
            medicationIntervalUnit === "hours"
              ? uiLocale === "ru"
                ? "Например: 3 ч"
                : uiLocale === "de"
                  ? "Zum Beispiel: 3 Std."
                  : uiLocale === "pl"
                    ? "Na przykład: 3 godz."
                    : "For example: 3 h"
              : reminderCopy.intervalPlaceholder
          }
          onPress={() => {
            onOpenIntervalSheet();
            setReminderError(null);
          }}
        />

        <SmartNumberSelector
          iconSource={reminderFieldIcons.limit}
          iconStyle={styles.reminderSelectorIconImage}
          label={reminderCopy.dailyLimitLabel}
          value={reminderMaxDosesPerDay}
          placeholder={reminderCopy.dailyLimitPlaceholder}
          onPress={() => {
            onOpenLimitSheet();
            setReminderError(null);
          }}
        />
        <SoftHintCard text={reminderCopy.dailyLimitHelper} />
      </View>

      <View style={[styles.formCard, styles.reminderAlreadyCard]}>
        <Pressable
          onPress={onToggleAlreadyGivenExpanded}
          style={({ pressed }) => [
            styles.accordionHeader,
            pressed ? styles.rowPressablePressed : null,
          ]}
        >
          <Text style={styles.sectionTitle}>{reminderCopy.alreadyGivenTitle}</Text>
          <Feather
            name={reminderAlreadyGivenExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#A28B82"
          />
        </Pressable>

        {reminderAlreadyGivenExpanded ? (
          <>
            <View style={styles.segmentedRow}>
              <Pressable
                onPress={() => {
                  onSelectAlreadyGiven();
                  setReminderError(null);
                }}
                style={[
                  styles.segmentedChoice,
                  reminderAlreadyGiven ? styles.segmentedChoiceActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segmentedChoiceText,
                    reminderAlreadyGiven ? styles.segmentedChoiceTextActive : null,
                  ]}
                >
                  {reminderCopy.alreadyGivenYes}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onSelectNotYet();
                  setReminderError(null);
                }}
                style={[
                  styles.segmentedChoice,
                  !reminderAlreadyGiven ? styles.segmentedChoiceActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segmentedChoiceText,
                    !reminderAlreadyGiven ? styles.segmentedChoiceTextActive : null,
                  ]}
                >
                  {reminderCopy.alreadyGivenNo}
                </Text>
              </Pressable>
            </View>

            <View style={styles.explanationCard}>
              <View style={styles.explanationIconWrap}>
                <Image
                  source={reminderFieldIcons.hint}
                  defaultSource={getLocalAssetDefaultSource(reminderFieldIcons.hint)}
                  style={styles.explanationIconImage}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>
              <Text style={styles.explanationText}>
                {reminderAlreadyGiven
                  ? reminderCopy.alreadyGivenExplainYes
                  : reminderCopy.alreadyGivenExplainNo}
              </Text>
            </View>

            {reminderAlreadyGiven ? (
              <View style={styles.lastGivenGroup}>
                <Text style={styles.lastGivenFieldLabel}>
                  {reminderCopy.lastGivenLabel}
                </Text>
                <View style={styles.rowsList}>
                  <Pressable
                    onPress={onOpenReminderDate}
                    style={({ pressed }) => [
                      styles.rowPressable,
                      pressed ? styles.rowPressablePressed : null,
                    ]}
                  >
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>{temperatureCopy.dateLabel}</Text>
                      <View style={styles.rowValueWrap}>
                        <Text style={styles.rowValue}>
                          {formatBackdatedDate(reminderLastGivenAt, uiLocale)}
                        </Text>
                        <Feather name="chevron-right" size={14} color="#A4AEB9" />
                      </View>
                    </View>
                  </Pressable>
                  <View style={styles.rowDivider} />
                  <Pressable
                    onPress={onOpenReminderTime}
                    style={({ pressed }) => [
                      styles.rowPressable,
                      pressed ? styles.rowPressablePressed : null,
                    ]}
                  >
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>{temperatureCopy.timeLabel}</Text>
                      <View style={styles.rowValueWrap}>
                        <Text style={styles.rowValue}>
                          {formatBackdatedTime(reminderLastGivenAt)}
                        </Text>
                        <Feather name="chevron-right" size={14} color="#A4AEB9" />
                      </View>
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {normalizedReminderMedicineName ? (
              <ReminderAlreadyGivenSection
                title={reminderCopy.lastGivenDetected}
                emptyText={reminderCopy.alreadyGivenEmpty}
                lastLabel={reminderCopy.lastGivenDetected}
                todayLabel={reminderCopy.alreadyGivenToday}
                ofLabel={reminderCopy.alreadyGivenOfLimit}
                entries={matchingMedicineEntries}
                locale={locale}
                maxDosesPerDay={reminderMaxDosesPerDay}
              />
            ) : null}
          </>
        ) : null}

        {reminderError ? <Text style={styles.errorText}>{reminderError}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>{reminderCopy.cancel}</Text>
        </Pressable>
        <Pressable
          disabled={!saveEnabled}
          onPress={onSave}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.primaryButtonReminder,
            !saveEnabled ? styles.primaryButtonReminderDisabled : null,
            pressed && saveEnabled ? styles.buttonPressed : null,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              styles.primaryButtonTextReminder,
              !saveEnabled ? styles.primaryButtonTextReminderDisabled : null,
            ]}
          >
            {reminderCopy.save}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
