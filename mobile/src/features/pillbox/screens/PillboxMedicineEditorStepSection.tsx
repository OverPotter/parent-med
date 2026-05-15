import { Image, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { pillboxCoreIcons } from "../assets/core";
import { pillboxMealIcons } from "../assets/meal";
import { pillboxTimeIcons } from "../assets/time";
import type { PillboxDraftMedicine } from "../model/pillboxPlanOnboarding";
import {
  Field,
  InputField,
} from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxMedicineEditorStepSection({
  locale,
  participantTitle,
  medicineDraft,
  onChangeName,
  onChangeDose,
  onOpenTimePicker,
  onRemoveTime,
  onSelectContinuousMode,
  onSelectCourseMode,
  onToggleWeekday,
  onSelectMealRelation,
}: {
  locale: MobileLocale;
  participantTitle: string;
  medicineDraft: PillboxDraftMedicine;
  onChangeName: (value: string) => void;
  onChangeDose: (value: string) => void;
  onOpenTimePicker: (time?: string, index?: number) => void;
  onRemoveTime: (time: string) => void;
  onSelectContinuousMode: () => void;
  onSelectCourseMode: () => void;
  onToggleWeekday: (day: string) => void;
  onSelectMealRelation: (mealRelation: PillboxDraftMedicine["mealRelation"]) => void;
}) {
  const weekdayLabels = locale === "ru"
    ? WEEKDAY_LABELS_RU
    : WEEKDAY_LABELS_EN;
  const mealOptions = buildMealOptions(locale);
  return (
    <>
      <View style={styles.editorHeader}>
        <Text style={styles.editorTitle}>
          {locale === "ru" ? "Добавить лекарство" : "Add medicine"}
        </Text>
        <Text style={styles.editorMeta}>{participantTitle}</Text>
      </View>
      <View style={styles.formCard}>
        <View style={styles.editorSurface}>
          <Field
            label={locale === "ru" ? "Препарат" : "Medicine"}
            iconSource={pillboxCoreIcons.medicineName}
          >
            <InputField
              value={medicineDraft.name}
              onChangeText={onChangeName}
              placeholder={locale === "ru" ? "Нурофен сироп" : "Nurofen syrup"}
            />
          </Field>
          <Field label={locale === "ru" ? "Доза" : "Dose"} iconSource={pillboxCoreIcons.medicineDose}>
            <InputField
              value={medicineDraft.dose}
              onChangeText={onChangeDose}
              placeholder={locale === "ru" ? "2 мл" : "2 ml"}
            />
          </Field>
          <View style={styles.editorDivider} />
          <Field label={locale === "ru" ? "Время" : "Time"} iconSource={pillboxTimeIcons.field} largeIcon>
            <View style={styles.timeChipsWrap}>
              {medicineDraft.times.map((time, index) => (
                <Pressable
                  key={time}
                  onPress={() => onOpenTimePicker(time, index)}
                  style={({ pressed }) => [
                    styles.timeChip,
                    pressed ? styles.backLinkPressed : null,
                  ]}
                >
                  <Text style={styles.timeChipText}>{time}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => onRemoveTime(time)}
                    style={({ pressed }) => [
                      styles.timeChipRemove,
                      pressed ? styles.backLinkPressed : null,
                    ]}
                  >
                    <Text style={styles.timeChipRemoveText}>×</Text>
                  </Pressable>
                </Pressable>
              ))}
              <Pressable
                onPress={() => onOpenTimePicker()}
                style={({ pressed }) => [
                  styles.timeChip,
                  styles.addTimeChip,
                  pressed ? styles.backLinkPressed : null,
                ]}
              >
                <View style={styles.timeChipIconWrap}>
                  <Image
                    source={pillboxTimeIcons.add}
                    style={styles.timeChipIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.timeChipText, styles.addTimeChipText]}>
                  {locale === "ru" ? "+ Добавить время" : "+ Add time"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.fieldMeta}>
              {medicineDraft.times.length > 0
                ? locale === "ru"
                  ? `${medicineDraft.times.length} ${
                      medicineDraft.times.length === 1 ? "время" : "времени"
                    }`
                  : `${medicineDraft.times.length} ${
                      medicineDraft.times.length === 1 ? "time" : "times"
                    }`
                : locale === "ru"
                  ? "Добавьте время"
                  : "Add time"}
            </Text>
          </Field>

          <Field label={locale === "ru" ? "Режим" : "Mode"}>
            <View style={styles.modeSegmentedRow}>
              <Pressable
                onPress={onSelectContinuousMode}
                style={[
                  styles.segmentedItem,
                  styles.segmentedItemWide,
                  styles.modeSegment,
                  medicineDraft.intakeMode === "continuous"
                    ? styles.segmentedItemActive
                    : null,
                ]}
              >
                <View style={styles.modeSegmentIconWrap}>
                  <Image
                    source={pillboxTimeIcons.modeContinuous}
                    style={styles.modeSegmentIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.modeSegmentCopy}>
                  <Text
                    style={[
                      styles.segmentedText,
                      styles.modeSegmentTitle,
                      medicineDraft.intakeMode === "continuous"
                        ? styles.segmentedTextActive
                        : null,
                    ]}
                  >
                    {locale === "ru" ? "Постоянно" : "Continuous"}
                  </Text>
                  <Text
                    style={[
                      styles.modeSegmentCaption,
                      medicineDraft.intakeMode === "continuous"
                        ? styles.modeSegmentCaptionActive
                        : null,
                    ]}
                  >
                    {locale === "ru" ? "Без срока" : "No end date"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onSelectCourseMode}
                style={[
                  styles.segmentedItem,
                  styles.segmentedItemWide,
                  styles.courseSegmentedItem,
                  medicineDraft.intakeMode === "course"
                    ? styles.courseSegmentedItemActive
                    : null,
                ]}
              >
                <View style={styles.modeSegmentIconWrap}>
                  <Image
                    source={pillboxTimeIcons.modeCourse}
                    style={styles.modeSegmentIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.courseSegmentContent}>
                  <Text
                    style={[
                      styles.segmentedText,
                      styles.courseSegmentTitle,
                      medicineDraft.intakeMode === "course"
                        ? styles.courseSegmentTitleActive
                        : null,
                    ]}
                  >
                    {locale === "ru" ? "Курсом" : "Course"}
                  </Text>
                  <Text
                    style={[
                      styles.courseSegmentValue,
                      medicineDraft.intakeMode === "course"
                        ? styles.courseSegmentValueActive
                        : null,
                    ]}
                  >
                    {medicineDraft.courseDurationDays
                      ? locale === "ru"
                        ? `${medicineDraft.courseDurationDays} дн.`
                        : `${medicineDraft.courseDurationDays} d`
                      : locale === "ru"
                        ? "Срок"
                        : "Duration"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.courseSegmentChevron,
                    medicineDraft.intakeMode === "course"
                      ? styles.courseSegmentChevronActive
                      : null,
                  ]}
                >
                  ›
                </Text>
              </Pressable>
            </View>
            {medicineDraft.intakeMode === "course" &&
            !medicineDraft.courseDurationDays ? (
              <Text style={styles.fieldHint}>
                {locale === "ru" ? "Выберите срок курса" : "Choose course duration"}
              </Text>
            ) : null}
          </Field>

          <Field label={locale === "ru" ? "Дни" : "Days"}>
            <View style={styles.weekdaysRow}>
              {WEEKDAY_OPTIONS.map((day, index) => {
                const active = medicineDraft.weekdays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => onToggleWeekday(day)}
                    style={({ pressed }) => [
                      styles.weekdayChip,
                      active ? styles.weekdayChipActive : styles.weekdayChipInactive,
                      pressed ? styles.backLinkPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        active ? styles.weekdayTextActive : styles.weekdayTextInactive,
                      ]}
                    >
                      {weekdayLabels[index]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fieldMeta}>
              {medicineDraft.weekdays.length === 7
                ? locale === "ru"
                  ? "Каждый день"
                  : "Every day"
                : locale === "ru"
                  ? `${medicineDraft.weekdays.length} дн.`
                  : `${medicineDraft.weekdays.length} d`}
            </Text>
          </Field>
          <View style={styles.editorDivider} />
          <Field label={locale === "ru" ? "Еда" : "Meals"} iconSource={pillboxMealIcons.field} largeIcon>
            <View style={styles.mealSegmentedGrid}>
              {mealOptions.map(({ id, label, iconSource }) => {
                const active = medicineDraft.mealRelation === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => onSelectMealRelation(id)}
                    style={[
                      styles.mealSegmentedItem,
                      resolveMealSegmentStyle(id),
                      active ? resolveMealSegmentActiveStyle(id) : null,
                    ]}
                  >
                    <View
                      style={
                        id === "not_matter"
                          ? styles.mealSegmentedIconWrapNeutral
                          : styles.mealSegmentedIconWrap
                      }
                    >
                      <Image
                        source={iconSource}
                        style={[
                          styles.mealSegmentedIcon,
                          id === "not_matter" ? styles.mealSegmentedIconNeutral : null,
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={[
                        styles.segmentedText,
                        styles.mealSegmentedText,
                        resolveMealSegmentTextStyle(id),
                        active ? styles.segmentedTextActive : null,
                        active ? resolveMealSegmentTextActiveStyle(id) : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </View>
      </View>
    </>
  );
}

const WEEKDAY_OPTIONS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;
const WEEKDAY_LABELS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;
const WEEKDAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function buildMealOptions(locale: MobileLocale): Array<{
  id: PillboxDraftMedicine["mealRelation"];
  label: string;
  iconSource: number;
}> {
  if (locale === "ru") {
    return [
      { id: "before_food", label: "До еды", iconSource: pillboxMealIcons.beforeFood },
      { id: "with_food", label: "Во время", iconSource: pillboxMealIcons.withFood },
      { id: "after_food", label: "После еды", iconSource: pillboxMealIcons.afterFood },
      { id: "not_matter", label: "Независимо", iconSource: pillboxMealIcons.notMatter },
    ];
  }
  return [
    { id: "before_food", label: "Before", iconSource: pillboxMealIcons.beforeFood },
    { id: "with_food", label: "With food", iconSource: pillboxMealIcons.withFood },
    { id: "after_food", label: "After", iconSource: pillboxMealIcons.afterFood },
    { id: "not_matter", label: "Any time", iconSource: pillboxMealIcons.notMatter },
  ];
}

function resolveMealSegmentStyle(id: PillboxDraftMedicine["mealRelation"]) {
  if (id === "before_food") {
    return styles.mealSegmentBefore;
  }
  if (id === "with_food") {
    return styles.mealSegmentWith;
  }
  if (id === "after_food") {
    return styles.mealSegmentAfter;
  }
  return styles.mealSegmentNeutral;
}

function resolveMealSegmentActiveStyle(id: PillboxDraftMedicine["mealRelation"]) {
  if (id === "before_food") {
    return styles.mealSegmentBeforeActive;
  }
  if (id === "with_food") {
    return styles.mealSegmentWithActive;
  }
  if (id === "after_food") {
    return styles.mealSegmentAfterActive;
  }
  return styles.mealSegmentNeutralActive;
}

function resolveMealSegmentTextStyle(id: PillboxDraftMedicine["mealRelation"]) {
  if (id === "before_food") {
    return styles.mealSegmentBeforeText;
  }
  if (id === "with_food") {
    return styles.mealSegmentWithText;
  }
  if (id === "after_food") {
    return styles.mealSegmentAfterText;
  }
  return styles.mealSegmentNeutralText;
}

function resolveMealSegmentTextActiveStyle(id: PillboxDraftMedicine["mealRelation"]) {
  if (id === "before_food") {
    return styles.mealSegmentBeforeTextActive;
  }
  if (id === "with_food") {
    return styles.mealSegmentWithTextActive;
  }
  if (id === "after_food") {
    return styles.mealSegmentAfterTextActive;
  }
  return styles.mealSegmentNeutralTextActive;
}
