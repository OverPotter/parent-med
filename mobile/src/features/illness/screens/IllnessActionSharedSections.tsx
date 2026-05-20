import { Feather } from "@expo/vector-icons";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
import { getLocalAssetDefaultSource } from "../../../shared/lib/assetSources";
import type { ChildCard } from "../../children/model/childrenRedesign";
import { illnessAssets, reminderFieldIcons } from "../assets";
import {
  formatIllnessEntryDate,
  formatIllnessEntryTime,
} from "../model/illnessJournalTimeline";
import type { MobileIllnessObservation } from "../model/illnessObservation";

export type BackdatedSectionCopy = {
  backdatedTitle: string;
  backdatedExpanded: string;
  timeLabel: string;
  dateLabel: string;
};

type StylesProp = {
  styles: any;
};

type EntryKind = "temperature" | "medicine" | "note";

type TemperatureCopy = BackdatedSectionCopy & {
  title: string;
  subtitle: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  fieldHint: string;
  save: string;
  cancel: string;
  recentTitle: string;
  recentEmpty: string;
};

type MedicineCopy = BackdatedSectionCopy & {
  title: string;
  subtitle: string;
  medicineLabel: string;
  medicinePlaceholder: string;
  amountLabel: string;
  amountPlaceholder: string;
  fieldHint: string;
  save: string;
  cancel: string;
  recentTitle: string;
  recentEmpty: string;
};

type NoteCopy = BackdatedSectionCopy & {
  title: string;
  subtitle: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  save: string;
  cancel: string;
  recentTitle: string;
  recentEmpty: string;
};

export function ActionScreenHeader({
  title,
  subtitle,
  child,
  styles,
}: {
  title: string;
  subtitle: string;
  child: ChildCard;
} & StylesProp) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerAvatarWrap}>
          {child.avatarSource ? (
            <Image
              source={child.avatarSource}
              defaultSource={getLocalAssetDefaultSource(child.avatarSource)}
              style={styles.headerAvatar}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : null}
        </View>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function FormFieldWithIcon({
  iconSource,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  styles,
}: {
  iconSource: number;
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  maxLength?: number;
} & StylesProp) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrap}>
          <Image
            source={iconSource}
            defaultSource={getLocalAssetDefaultSource(iconSource)}
            style={styles.fieldIconImage}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.sectionFieldLabel}>{label}</Text>
          <View style={styles.textFieldWrap}>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              style={styles.textFieldInput}
              placeholder={placeholder}
              placeholderTextColor="#98A7AB"
              keyboardType={keyboardType}
              maxLength={maxLength}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export function SoftHintCard({
  text,
  styles,
}: { text: string } & StylesProp) {
  return (
    <View style={styles.softHintCard}>
      <View style={styles.softHintIconWrap}>
        <Image
          source={reminderFieldIcons.hint}
          defaultSource={getLocalAssetDefaultSource(reminderFieldIcons.hint)}
          style={styles.softHintIconImage}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
      <Text style={styles.softHintText}>{text}</Text>
    </View>
  );
}

export function SmartNumberSelector({
  iconSource,
  iconStyle,
  label,
  value,
  displayValue,
  placeholder,
  onPress,
  styles,
}: {
  iconSource: number;
  iconStyle?: object;
  label: string;
  value: number | null;
  displayValue?: string | null;
  placeholder: string;
  onPress: () => void;
} & StylesProp) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrap}>
          <Image
            source={iconSource}
            defaultSource={getLocalAssetDefaultSource(iconSource)}
            style={[styles.fieldIconImage, iconStyle]}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.sectionFieldLabel}>{label}</Text>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.selectorField,
              pressed ? styles.rowPressablePressed : null,
            ]}
          >
            <Text
              style={value === null ? styles.selectorPlaceholder : styles.selectorValue}
            >
              {value === null ? placeholder : (displayValue ?? String(value))}
            </Text>
            <Feather name="chevron-down" size={18} color="#A28B82" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function BackdatedSection({
  copy,
  enabled,
  onToggle,
  onOpenTime,
  onOpenDate,
  measuredTimeValue,
  measuredDateValue,
  styles,
}: {
  copy: BackdatedSectionCopy;
  enabled: boolean;
  onToggle: () => void;
  onOpenTime: () => void;
  onOpenDate: () => void;
  measuredTimeValue: string;
  measuredDateValue: string;
} & StylesProp) {
  return (
    <View style={styles.backdatedSection}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.backdatedToggle,
          pressed ? styles.rowPressablePressed : null,
        ]}
      >
        <Text style={styles.backdatedToggleText}>{copy.backdatedTitle}</Text>
        <Feather name="chevron-down" size={18} color="#A28B82" />
      </Pressable>

      {enabled ? (
        <View style={styles.backdatedContent}>
          <Text style={styles.fieldHint}>{copy.backdatedExpanded}</Text>
          <View style={styles.rowsList}>
            <Pressable
              onPress={onOpenTime}
              style={({ pressed }) => [
                styles.rowPressable,
                pressed ? styles.rowPressablePressed : null,
              ]}
            >
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{copy.timeLabel}</Text>
                <View style={styles.rowValueWrap}>
                  <Text style={styles.rowValue}>{measuredTimeValue}</Text>
                  <Feather name="chevron-right" size={14} color="#A4AEB9" />
                </View>
              </View>
            </Pressable>
            <View style={styles.rowDivider} />
            <Pressable
              onPress={onOpenDate}
              style={({ pressed }) => [
                styles.rowPressable,
                pressed ? styles.rowPressablePressed : null,
              ]}
            >
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{copy.dateLabel}</Text>
                <View style={styles.rowValueWrap}>
                  <Text style={styles.rowValue}>{measuredDateValue}</Text>
                  <Feather name="chevron-right" size={14} color="#A4AEB9" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function RecentEntriesSection({
  title,
  entries,
  locale,
  emptyText,
  countStyle,
  dotStyle,
  lineStyle,
  badgeStyle,
  badgeSource,
  onDelete,
  deleteColor,
  deletePressedColor,
  styles,
}: {
  title: string;
  entries: MobileIllnessObservation["entries"];
  locale: "ru" | "en" | "de" | "pl";
  emptyText: string;
  countStyle?: object;
  dotStyle?: object;
  lineStyle?: object;
  badgeStyle?: object;
  badgeSource: number;
  onDelete: (entryId: string) => void;
  deleteColor: string;
  deletePressedColor: string;
} & StylesProp) {
  return (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={[styles.recentCount, countStyle]}>{entries.length}</Text>
      </View>

      {entries.length > 0 ? (
        <View style={styles.recentFeed}>
          {entries.map((entry, index) => (
            <View key={entry.id} style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeValue}>
                    {formatIllnessEntryTime(entry.createdAt, locale)}
                  </Text>
                  <Text style={styles.dayValue}>
                    {formatIllnessEntryDate(entry.createdAt, locale)}
                  </Text>
                </View>
              </View>
              <View style={styles.timelineCenterColumn}>
                <View style={[styles.timelineDot, dotStyle]} />
                {index !== entries.length - 1 ? (
                  <View style={[styles.timelineLine, lineStyle]} />
                ) : null}
              </View>
              <SwipeToDeleteRow
                onDelete={() => onDelete(entry.id)}
                deleteColor={deleteColor}
                deletePressedColor={deletePressedColor}
                actionWidth={104}
                borderRadius={22}
              >
                <View style={styles.timelineEntryCard}>
                  <View
                    style={[
                      styles.timelineEntryBadge,
                      styles.timelineEntryBadgeTransparent,
                      badgeStyle,
                    ]}
                  >
                    <Image
                      source={badgeSource}
                      defaultSource={getLocalAssetDefaultSource(badgeSource)}
                      style={styles.timelineEntryBadgeImage}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  </View>
                  <View style={styles.timelineEntryCopy}>
                    <Text style={styles.timelineEntryValue}>{entry.title}</Text>
                    <Text style={styles.timelineEntryMeta}>{entry.subtitle}</Text>
                  </View>
                </View>
              </SwipeToDeleteRow>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

function isSameLocalDay(iso: string, reference: Date) {
  const value = new Date(iso);
  return (
    value.getFullYear() === reference.getFullYear() &&
    value.getMonth() === reference.getMonth() &&
    value.getDate() === reference.getDate()
  );
}

export function ReminderAlreadyGivenSection({
  title,
  emptyText,
  lastLabel,
  todayLabel,
  ofLabel,
  entries,
  locale,
  maxDosesPerDay,
  styles,
}: {
  title: string;
  emptyText: string;
  lastLabel: string;
  todayLabel: string;
  ofLabel: string;
  entries: MobileIllnessObservation["entries"];
  locale: "ru" | "en" | "de" | "pl";
  maxDosesPerDay: number | null;
} & StylesProp) {
  if (entries.length < 1) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>{title}</Text>
        <Text style={styles.infoCardBody}>{emptyText}</Text>
      </View>
    );
  }

  const latestEntry = entries[0];
  const todayCount = entries.filter((entry) => isSameLocalDay(entry.createdAt, new Date())).length;
  const todayValue =
    maxDosesPerDay && maxDosesPerDay > 0
      ? `${todayCount} ${ofLabel} ${maxDosesPerDay}`
      : String(todayCount);

  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <View style={styles.infoRows}>
        <View style={styles.infoRow}>
          <Text style={styles.infoRowLabel}>{lastLabel}</Text>
          <Text style={styles.infoRowValue}>
            {formatIllnessEntryTime(latestEntry.createdAt, locale)} ·{" "}
            {formatIllnessEntryDate(latestEntry.createdAt, locale)}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoRowLabel}>{todayLabel}</Text>
          <Text style={styles.infoRowValue}>{todayValue}</Text>
        </View>
      </View>
    </View>
  );
}

export function IllnessEntryActionSection({
  kind,
  child,
  locale,
  styles,
  temperatureCopy,
  medicineCopy,
  noteCopy,
  temperatureValue,
  onTemperatureChange,
  temperatureError,
  onSaveTemperature,
  medicineValue,
  onMedicineChange,
  medicineAmountValue,
  onMedicineAmountChange,
  medicineError,
  onSaveMedicine,
  noteValue,
  onNoteChange,
  noteError,
  onSaveNote,
  backdatedEnabled,
  onToggleBackdated,
  onOpenBackdatedTime,
  onOpenBackdatedDate,
  measuredTimeValue,
  measuredDateValue,
  onBack,
  temperatureEntries,
  medicineEntries,
  noteEntries,
  onDeleteTemperature,
  onDeleteMedicine,
  onDeleteNote,
}: {
  kind: EntryKind;
  child: ChildCard;
  locale: "ru" | "en" | "de" | "pl";
  temperatureCopy: TemperatureCopy;
  medicineCopy: MedicineCopy;
  noteCopy: NoteCopy;
  temperatureValue: string;
  onTemperatureChange: (next: string) => void;
  temperatureError: string | null;
  onSaveTemperature: () => void;
  medicineValue: string;
  onMedicineChange: (next: string) => void;
  medicineAmountValue: string;
  onMedicineAmountChange: (next: string) => void;
  medicineError: string | null;
  onSaveMedicine: () => void;
  noteValue: string;
  onNoteChange: (next: string) => void;
  noteError: string | null;
  onSaveNote: () => void;
  backdatedEnabled: boolean;
  onToggleBackdated: () => void;
  onOpenBackdatedTime: () => void;
  onOpenBackdatedDate: () => void;
  measuredTimeValue: string;
  measuredDateValue: string;
  onBack: () => void;
  temperatureEntries: MobileIllnessObservation["entries"];
  medicineEntries: MobileIllnessObservation["entries"];
  noteEntries: MobileIllnessObservation["entries"];
  onDeleteTemperature: (entryId: string) => void;
  onDeleteMedicine: (entryId: string) => void;
  onDeleteNote: (entryId: string) => void;
} & StylesProp) {
  if (kind === "temperature") {
    return (
      <>
        <ActionScreenHeader
          title={`${temperatureCopy.title} · ${child.name}`}
          subtitle={temperatureCopy.subtitle}
          child={child}
          styles={styles}
        />

        <View style={[styles.formCard, styles.formCardTemperature]}>
          <Text style={styles.sectionTitle}>{temperatureCopy.fieldLabel}</Text>
          <View style={styles.inputWrap}>
            <Image
              source={illnessAssets.journal.quickTemperature}
              defaultSource={getLocalAssetDefaultSource(
                illnessAssets.journal.quickTemperature,
              )}
              style={styles.inputIcon}
              resizeMode="contain"
              fadeDuration={0}
            />
            <TextInput
              value={temperatureValue}
              onChangeText={onTemperatureChange}
              style={styles.input}
              placeholder={temperatureCopy.fieldPlaceholder}
              placeholderTextColor="#98A7AB"
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputSuffix}>°C</Text>
          </View>
          <Text style={styles.fieldHint}>{temperatureCopy.fieldHint}</Text>
          <BackdatedSection
            copy={temperatureCopy}
            enabled={backdatedEnabled}
            onToggle={onToggleBackdated}
            onOpenTime={onOpenBackdatedTime}
            onOpenDate={onOpenBackdatedDate}
            measuredTimeValue={measuredTimeValue}
            measuredDateValue={measuredDateValue}
            styles={styles}
          />

          {temperatureError ? (
            <Text style={styles.errorText}>{temperatureError}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{temperatureCopy.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={onSaveTemperature}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{temperatureCopy.save}</Text>
            </Pressable>
          </View>
        </View>

        <RecentEntriesSection
          title={temperatureCopy.recentTitle}
          entries={temperatureEntries}
          locale={locale}
          emptyText={temperatureCopy.recentEmpty}
          badgeSource={illnessAssets.journal.quickTemperature}
          onDelete={onDeleteTemperature}
          deleteColor="#F29C86"
          deletePressedColor="#E88973"
          styles={styles}
        />
      </>
    );
  }

  if (kind === "medicine") {
    return (
      <>
        <ActionScreenHeader
          title={`${medicineCopy.title} · ${child.name}`}
          subtitle={medicineCopy.subtitle}
          child={child}
          styles={styles}
        />

        <View style={[styles.formCard, styles.formCardMedicine]}>
          <Text style={styles.sectionTitle}>{medicineCopy.medicineLabel}</Text>
          <View style={styles.textFieldWrap}>
            <TextInput
              value={medicineValue}
              onChangeText={onMedicineChange}
              style={styles.textFieldInput}
              placeholder={medicineCopy.medicinePlaceholder}
              placeholderTextColor="#98A7AB"
            />
          </View>

          <Text style={styles.sectionFieldLabel}>{medicineCopy.amountLabel}</Text>
          <View style={styles.textFieldWrap}>
            <TextInput
              value={medicineAmountValue}
              onChangeText={onMedicineAmountChange}
              style={styles.textFieldInput}
              placeholder={medicineCopy.amountPlaceholder}
              placeholderTextColor="#98A7AB"
            />
          </View>

          <Text style={styles.fieldHint}>{medicineCopy.fieldHint}</Text>
          <BackdatedSection
            copy={medicineCopy}
            enabled={backdatedEnabled}
            onToggle={onToggleBackdated}
            onOpenTime={onOpenBackdatedTime}
            onOpenDate={onOpenBackdatedDate}
            measuredTimeValue={measuredTimeValue}
            measuredDateValue={measuredDateValue}
            styles={styles}
          />

          {medicineError ? <Text style={styles.errorText}>{medicineError}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{medicineCopy.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={onSaveMedicine}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.primaryButtonMedicine,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{medicineCopy.save}</Text>
            </Pressable>
          </View>
        </View>

        <RecentEntriesSection
          title={medicineCopy.recentTitle}
          entries={medicineEntries}
          locale={locale}
          emptyText={medicineCopy.recentEmpty}
          countStyle={styles.recentCountMedicine}
          dotStyle={styles.timelineDotMedicine}
          lineStyle={styles.timelineLineMedicine}
          badgeStyle={styles.timelineEntryBadgeMedicine}
          badgeSource={illnessAssets.journal.quickMedicine}
          onDelete={onDeleteMedicine}
          deleteColor="#F2B072"
          deletePressedColor="#E29D5D"
          styles={styles}
        />
      </>
    );
  }

  return (
    <>
      <ActionScreenHeader
        title={`${noteCopy.title} · ${child.name}`}
        subtitle={noteCopy.subtitle}
        child={child}
        styles={styles}
      />

      <View style={[styles.formCard, styles.formCardNote]}>
        <Text style={styles.sectionTitle}>{noteCopy.fieldLabel}</Text>
        <View style={styles.noteInputWrap}>
          <TextInput
            value={noteValue}
            onChangeText={onNoteChange}
            style={styles.noteInput}
            placeholder={noteCopy.fieldPlaceholder}
            placeholderTextColor="#98A7AB"
            multiline
            textAlignVertical="top"
          />
        </View>
        <BackdatedSection
          copy={noteCopy}
          enabled={backdatedEnabled}
          onToggle={onToggleBackdated}
          onOpenTime={onOpenBackdatedTime}
          onOpenDate={onOpenBackdatedDate}
          measuredTimeValue={measuredTimeValue}
          measuredDateValue={measuredDateValue}
          styles={styles}
        />

        {noteError ? <Text style={styles.errorText}>{noteError}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{noteCopy.cancel}</Text>
          </Pressable>
          <Pressable
            onPress={onSaveNote}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>{noteCopy.save}</Text>
          </Pressable>
        </View>
      </View>

      <RecentEntriesSection
        title={noteCopy.recentTitle}
        entries={noteEntries}
        locale={locale}
        emptyText={noteCopy.recentEmpty}
        countStyle={styles.recentCountNote}
        dotStyle={styles.timelineDotNote}
        lineStyle={styles.timelineLineNote}
        badgeStyle={styles.timelineEntryBadgeNote}
        badgeSource={illnessAssets.journal.quickNote}
        onDelete={onDeleteNote}
        deleteColor="#86C89B"
        deletePressedColor="#73B688"
        styles={styles}
      />
    </>
  );
}
