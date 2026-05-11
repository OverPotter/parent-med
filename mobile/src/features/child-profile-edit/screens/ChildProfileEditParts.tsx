import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  type ImageSourcePropType,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { ChildProfileEditContent } from "../model/childProfileEdit";
import {
  avatarOptions,
  birthDatePartsToIso,
  formatBirthDate,
  getEditProfileSheetCopy,
  isCompactAvatarPresetKey,
  getMonths,
  parseBirthDate,
  type ChildAvatarPresetKey,
} from "../model/childProfileEditHelpers";
import { styles } from "./childProfileEditStyles";

function resolveAvatarOptionImageStyle(key: ChildAvatarPresetKey) {
  return isCompactAvatarPresetKey(key)
    ? [styles.avatarOptionImage, styles.avatarOptionImageCompact]
    : styles.avatarOptionImage;
}

export function ChildProfileEditHeroCard({
  avatarSource,
  childName,
  childMeta,
  changePhotoLabel,
  onPressChangePhoto,
}: {
  avatarSource: ImageSourcePropType;
  childName: string;
  childMeta: string;
  changePhotoLabel: string;
  onPressChangePhoto: () => void;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.avatarWrap}>
        <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
      </View>

      <View style={styles.heroInfo}>
        <Text style={styles.childName}>{childName}</Text>
        <Text style={styles.childMeta}>{childMeta}</Text>

        <Pressable
          onPress={onPressChangePhoto}
          style={({ pressed }) => [
            styles.photoButton,
            pressed ? styles.photoButtonPressed : null,
          ]}
        >
          <Feather name="camera" size={15} color="#F47667" />
          <Text style={styles.photoButtonText}>{changePhotoLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ChildProfileMainSection({
  content,
  editableName,
  editableBirthDate,
  editingField,
  onStartEditingName,
  onChangeName,
  onFinishEditingName,
  onOpenBirthDate,
}: {
  content: ChildProfileEditContent;
  editableName: string;
  editableBirthDate: string;
  editingField: "childName" | null;
  onStartEditingName: () => void;
  onChangeName: (value: string) => void;
  onFinishEditingName: () => void;
  onOpenBirthDate: () => void;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{content.sections.main.title}</Text>
      <View style={styles.cardList}>
        <Pressable
          onPress={onStartEditingName}
          style={({ pressed }) => [styles.listRow, pressed ? styles.rowPressed : null]}
        >
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>{content.sections.main.rows[0]?.label}</Text>
          </View>

          <View style={styles.rowValueWrap}>
            {editingField === "childName" ? (
              <TextInput
                value={editableName}
                onChangeText={onChangeName}
                style={styles.inlineInput}
                placeholder={content.sections.main.rows[0]?.label}
                placeholderTextColor="#98A2AD"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                onBlur={onFinishEditingName}
                returnKeyType="done"
                onSubmitEditing={onFinishEditingName}
              />
            ) : (
              <Text style={styles.rowValue}>{editableName}</Text>
            )}
            <Feather name="edit-2" size={14} color="#9AA7B3" />
          </View>
        </Pressable>

        <View style={styles.rowDivider} />

        <Pressable
          onPress={onOpenBirthDate}
          style={({ pressed }) => [styles.listRow, pressed ? styles.rowPressed : null]}
        >
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>{content.sections.main.rows[1]?.label}</Text>
          </View>

          <View style={styles.rowValueWrap}>
            <Text style={styles.rowValue}>{editableBirthDate}</Text>
            <Feather name="edit-2" size={14} color="#9AA7B3" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export function ChildProfileHealthSection({
  content,
  editableAllergies,
  editableNotes,
  onOpenTextEditor,
}: {
  content: ChildProfileEditContent;
  editableAllergies: string;
  editableNotes: string;
  onOpenTextEditor: (field: "allergies" | "notes") => void;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{content.sections.health.title}</Text>
      <View style={styles.cardList}>
        {content.sections.health.rows.map((row, index) => (
          <View key={row.id}>
            <Pressable
              onPress={() => onOpenTextEditor(row.id === "allergies" ? "allergies" : "notes")}
              style={({ pressed }) => [
                styles.listRow,
                styles.listRowMultiline,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowDescription}>
                  {row.id === "allergies" ? editableAllergies : editableNotes}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#9AA7B3" />
            </Pressable>
            {index < content.sections.health.rows.length - 1 ? (
              <View style={styles.rowDivider} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function ChildProfileTogglesSection({
  content,
  babyModeEnabled,
  onToggleBabyMode,
}: {
  content: ChildProfileEditContent;
  babyModeEnabled: boolean;
  onToggleBabyMode: (value: boolean) => void;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{content.sections.settings.title}</Text>
      <View style={styles.cardList}>
        <View style={[styles.listRow, styles.listRowMultiline]}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>{content.sections.settings.rows[0]?.label}</Text>
            <Text style={styles.rowDescription}>
              {content.sections.settings.rows[0]?.description}
            </Text>
          </View>

          <View style={styles.settingToggleWrap}>
            <Switch
              value={babyModeEnabled}
              onValueChange={onToggleBabyMode}
              trackColor={{ false: "#E7DDD7", true: "#46C06F" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E7DDD7"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export function ChildProfileEditActions({
  saveLabel,
  deleteLabel,
  onPressSave,
  onPressDelete,
}: {
  saveLabel: string;
  deleteLabel: string;
  onPressSave?: (() => void) | null;
  onPressDelete?: (() => void) | null;
}) {
  const canSave = typeof onPressSave === "function";
  const canDelete = typeof onPressDelete === "function";

  return (
    <View style={styles.actionsWrap}>
      <Pressable
        disabled={!canSave}
        onPress={onPressSave}
        style={({ pressed }) => [
          styles.saveButton,
          !canSave ? styles.buttonDisabled : null,
          canSave && pressed ? styles.saveButtonPressed : null,
        ]}
      >
        <LinearGradient
          colors={["#FF8D79", "#F76961"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveGradient}
        />
        <Text style={styles.saveLabel}>{saveLabel}</Text>
      </Pressable>

      <Pressable
        disabled={!canDelete}
        onPress={onPressDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          !canDelete ? styles.buttonDisabled : null,
          canDelete && pressed ? styles.deleteButtonPressed : null,
        ]}
      >
        <Text style={styles.deleteLabel}>{deleteLabel}</Text>
      </Pressable>
    </View>
  );
}

type AvatarPickerSheetProps = {
  visible: boolean;
  locale: MobileLocale;
  onClose: () => void;
  options: typeof avatarOptions;
  selectedAvatarKey: ChildAvatarPresetKey | null;
  onSelect: (avatarKey: ChildAvatarPresetKey) => void;
};

export function AvatarPickerSheet({
  visible,
  locale,
  onClose,
  options,
  selectedAvatarKey,
  onSelect,
}: AvatarPickerSheetProps) {
  const sheetCopy = getEditProfileSheetCopy(locale);

  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.sheetCard}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{sheetCopy.avatarTitle}</Text>
            <Text style={styles.sheetSubtitle}>{sheetCopy.avatarSubtitle}</Text>
          </View>

          <ScrollView
            style={styles.avatarGridScroll}
            contentContainerStyle={styles.avatarOptionsGrid}
            showsVerticalScrollIndicator={false}
          >
            {options.map((avatarOption) => {
              const isSelected = selectedAvatarKey === avatarOption.key;

              return (
                <Pressable
                  key={avatarOption.key}
                  onPress={() => requestClose(() => onSelect(avatarOption.key))}
                  style={({ pressed }) => [
                    styles.avatarOption,
                    isSelected ? styles.avatarOptionSelected : null,
                    pressed ? styles.avatarOptionPressed : null,
                  ]}
                >
                  <Image
                    source={avatarOption.source}
                    style={resolveAvatarOptionImageStyle(avatarOption.key)}
                    resizeMode="contain"
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </FormBottomSheet>
  );
}

type BirthDatePickerSheetProps = {
  visible: boolean;
  locale: MobileLocale;
  initialValue: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export function BirthDatePickerSheet({
  visible,
  locale,
  initialValue,
  onClose,
  onApply,
}: BirthDatePickerSheetProps) {
  const sheetCopy = getEditProfileSheetCopy(locale);
  const parsed = parseBirthDate(initialValue, locale);
  const [selectedDay, setSelectedDay] = useState(parsed.day);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(parsed.monthIndex);
  const [selectedYear, setSelectedYear] = useState(parsed.year);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next = parseBirthDate(initialValue, locale);
    setSelectedDay(next.day);
    setSelectedMonthIndex(next.monthIndex);
    setSelectedYear(next.year);
  }, [initialValue, locale, visible]);

  const months = getMonths(locale);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, index) => currentYear - index);

  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.dateSheetCard}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{sheetCopy.dateTitle}</Text>
            <Text style={styles.sheetSubtitle}>{sheetCopy.dateSubtitle}</Text>
          </View>

          <View style={styles.datePickerPreview}>
            <Text style={styles.datePickerPreviewText}>
              {formatBirthDate(selectedDay, selectedMonthIndex, selectedYear, locale)}
            </Text>
          </View>

          <View style={styles.dateColumns}>
            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => setSelectedDay(day)}
                  style={[styles.datePill, selectedDay === day ? styles.datePillSelected : null]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedDay === day ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {months.map((month, index) => (
                <Pressable
                  key={`month-${month}`}
                  onPress={() => setSelectedMonthIndex(index)}
                  style={[
                    styles.datePill,
                    selectedMonthIndex === index ? styles.datePillSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedMonthIndex === index ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {years.map((year) => (
                <Pressable
                  key={`year-${year}`}
                  onPress={() => setSelectedYear(year)}
                  style={[
                    styles.datePill,
                    selectedYear === year ? styles.datePillSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedYear === year ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {year}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable
            onPress={() =>
              requestClose(() =>
                onApply(
                  birthDatePartsToIso(
                    selectedDay,
                    selectedMonthIndex,
                    selectedYear,
                  ),
                ),
              )
            }
            style={({ pressed }) => [
              styles.sheetApplyButton,
              pressed ? styles.saveButtonPressed : null,
            ]}
            >
            <LinearGradient
              colors={["#FF8D79", "#F76961"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            />
            <Text style={styles.saveLabel}>{sheetCopy.apply}</Text>
          </Pressable>
        </>
      )}
    </FormBottomSheet>
  );
}

type TextEditorSheetProps = {
  visible: boolean;
  locale: MobileLocale;
  title: string;
  initialValue: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export function TextEditorSheet({
  visible,
  locale,
  title,
  initialValue,
  onClose,
  onApply,
}: TextEditorSheetProps) {
  const sheetCopy = getEditProfileSheetCopy(locale);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setValue(initialValue);
  }, [initialValue, visible]);

  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.textEditorSheetCard}
      keyboardAvoiding
      keyboardBehavior="padding"
      keyboardVerticalOffset={0}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetSubtitle}>{sheetCopy.textEditorSubtitle}</Text>
          </View>

          <TextInput
            value={value}
            onChangeText={setValue}
            style={styles.sheetTextarea}
            placeholder={title}
            placeholderTextColor="#98A2AD"
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <Pressable
            onPress={() => requestClose(() => onApply(value.trim()))}
            style={({ pressed }) => [
              styles.sheetApplyButton,
              pressed ? styles.saveButtonPressed : null,
            ]}
          >
            <LinearGradient
              colors={["#FF8D79", "#F76961"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            />
            <Text style={styles.saveLabel}>{sheetCopy.apply}</Text>
          </Pressable>
        </>
      )}
    </FormBottomSheet>
  );
}
