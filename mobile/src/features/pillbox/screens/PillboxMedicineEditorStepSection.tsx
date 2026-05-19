import { Image, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { pillboxCoreIcons } from "../assets/core";
import { pillboxMealIcons } from "../assets/meal";
import { pillboxTimeIcons } from "../assets/time";
import { getPillboxWeekdayLabels } from "../model/pillboxLocalization";
import {
  PILLBOX_WEEKDAY_IDS,
  type PillboxDraftMedicine,
  type PillboxWeekdayId,
} from "../model/pillboxPlanOnboarding";
import {
  Field,
  InputField,
} from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

function getEditorText(
  locale: MobileLocale,
  key:
    | "addMedicine"
    | "medicine"
    | "medicinePlaceholder"
    | "dose"
    | "dosePlaceholder"
    | "time"
    | "addTime"
    | "mode"
    | "continuous"
    | "noEndDate"
    | "course"
    | "duration"
    | "chooseCourseDuration"
    | "days"
    | "everyDay"
    | "meals",
) {
  if (locale === "ru") {
    return {
      addMedicine: "Добавить лекарство",
      medicine: "Препарат",
      medicinePlaceholder: "Нурофен сироп",
      dose: "Доза",
      dosePlaceholder: "2 мл",
      time: "Время",
      addTime: "+ Добавить время",
      mode: "Режим",
      continuous: "Постоянно",
      noEndDate: "Без срока",
      course: "Курсом",
      duration: "Срок",
      chooseCourseDuration: "Выберите срок курса",
      days: "Дни",
      everyDay: "Каждый день",
      meals: "Еда",
    }[key];
  }
  if (locale === "de") {
    return {
      addMedicine: "Medikament hinzufügen",
      medicine: "Medikament",
      medicinePlaceholder: "Nurofen-Sirup",
      dose: "Dosis",
      dosePlaceholder: "2 ml",
      time: "Uhrzeit",
      addTime: "+ Uhrzeit hinzufügen",
      mode: "Modus",
      continuous: "Dauerhaft",
      noEndDate: "Ohne Enddatum",
      course: "Als Kur",
      duration: "Dauer",
      chooseCourseDuration: "Wählen Sie die Kursdauer",
      days: "Tage",
      everyDay: "Jeden Tag",
      meals: "Essen",
    }[key];
  }
  if (locale === "pl") {
    return {
      addMedicine: "Dodaj lek",
      medicine: "Lek",
      medicinePlaceholder: "Syrop Nurofen",
      dose: "Dawka",
      dosePlaceholder: "2 ml",
      time: "Godzina",
      addTime: "+ Dodaj godzinę",
      mode: "Tryb",
      continuous: "Ciągle",
      noEndDate: "Bez końca",
      course: "Kuracyjnie",
      duration: "Czas trwania",
      chooseCourseDuration: "Wybierz czas kuracji",
      days: "Dni",
      everyDay: "Codziennie",
      meals: "Jedzenie",
    }[key];
  }
  return {
    addMedicine: "Add medicine",
    medicine: "Medicine",
    medicinePlaceholder: "Nurofen syrup",
    dose: "Dose",
    dosePlaceholder: "2 ml",
    time: "Time",
    addTime: "+ Add time",
    mode: "Mode",
    continuous: "Continuous",
    noEndDate: "No end date",
    course: "Course",
    duration: "Duration",
    chooseCourseDuration: "Choose course duration",
    days: "Days",
    everyDay: "Every day",
    meals: "Meals",
  }[key];
}

function formatTimeCount(locale: MobileLocale, count: number) {
  if (count <= 0) {
    if (locale === "ru") {
      return "Добавьте время";
    }
    if (locale === "de") {
      return "Fügen Sie eine Uhrzeit hinzu";
    }
    if (locale === "pl") {
      return "Dodaj godzinę";
    }
    return "Add time";
  }
  if (locale === "ru") {
    return `${count} ${count === 1 ? "время" : "времени"}`;
  }
  if (locale === "de") {
    return `${count} ${count === 1 ? "Zeit" : "Zeiten"}`;
  }
  if (locale === "pl") {
    return `${count} ${count === 1 ? "godzina" : "godz."}`;
  }
  return `${count} ${count === 1 ? "time" : "times"}`;
}

function formatCourseDurationShort(locale: MobileLocale, days: number) {
  if (locale === "de") {
    return `${days} Tg.`;
  }
  if (locale === "pl") {
    return `${days} dni`;
  }
  if (locale === "en") {
    return `${days} d`;
  }
  return `${days} дн.`;
}

function formatWeekdayCount(locale: MobileLocale, count: number) {
  if (count === 7) {
    return getEditorText(locale, "everyDay");
  }
  if (locale === "de") {
    return `${count} Tg.`;
  }
  if (locale === "pl") {
    return `${count} dni`;
  }
  if (locale === "en") {
    return `${count} d`;
  }
  return `${count} дн.`;
}

export function PillboxMedicineEditorStepSection({
  locale,
  participantTitle,
  title,
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
  title?: string;
  medicineDraft: PillboxDraftMedicine;
  onChangeName: (value: string) => void;
  onChangeDose: (value: string) => void;
  onOpenTimePicker: (time?: string, index?: number) => void;
  onRemoveTime: (time: string) => void;
  onSelectContinuousMode: () => void;
  onSelectCourseMode: () => void;
  onToggleWeekday: (day: PillboxWeekdayId) => void;
  onSelectMealRelation: (mealRelation: PillboxDraftMedicine["mealRelation"]) => void;
}) {
  const weekdayLabels = getPillboxWeekdayLabels(locale);
  const mealOptions = buildMealOptions(locale);
  return (
    <>
      <View style={styles.editorHeader}>
        <Text style={styles.editorTitle}>
          {title ?? getEditorText(locale, "addMedicine")}
        </Text>
        <Text style={styles.editorMeta}>{participantTitle}</Text>
      </View>
      <View style={styles.formCard}>
        <View style={styles.editorSurface}>
          <Field
            label={getEditorText(locale, "medicine")}
            iconSource={pillboxCoreIcons.medicineName}
          >
            <InputField
              value={medicineDraft.name}
              onChangeText={onChangeName}
              placeholder={getEditorText(locale, "medicinePlaceholder")}
            />
          </Field>
          <Field label={getEditorText(locale, "dose")} iconSource={pillboxCoreIcons.medicineDose}>
            <InputField
              value={medicineDraft.dose}
              onChangeText={onChangeDose}
              placeholder={getEditorText(locale, "dosePlaceholder")}
            />
          </Field>
          <View style={styles.editorDivider} />
          <Field label={getEditorText(locale, "time")} iconSource={pillboxTimeIcons.field} largeIcon>
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
                  {getEditorText(locale, "addTime")}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.fieldMeta}>{formatTimeCount(locale, medicineDraft.times.length)}</Text>
          </Field>

          <Field label={getEditorText(locale, "mode")}>
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
                    {getEditorText(locale, "continuous")}
                  </Text>
                  <Text
                    style={[
                      styles.modeSegmentCaption,
                      medicineDraft.intakeMode === "continuous"
                        ? styles.modeSegmentCaptionActive
                        : null,
                    ]}
                  >
                    {getEditorText(locale, "noEndDate")}
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
                    {getEditorText(locale, "course")}
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
                      ? formatCourseDurationShort(locale, medicineDraft.courseDurationDays)
                      : getEditorText(locale, "duration")}
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
                {getEditorText(locale, "chooseCourseDuration")}
              </Text>
            ) : null}
          </Field>

          <Field label={getEditorText(locale, "days")}>
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
            <Text style={styles.fieldMeta}>{formatWeekdayCount(locale, medicineDraft.weekdays.length)}</Text>
          </Field>
          <View style={styles.editorDivider} />
          <Field label={getEditorText(locale, "meals")} iconSource={pillboxMealIcons.field} largeIcon>
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

const WEEKDAY_OPTIONS = PILLBOX_WEEKDAY_IDS;
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
  if (locale === "de") {
    return [
      { id: "before_food", label: "Vor dem Essen", iconSource: pillboxMealIcons.beforeFood },
      { id: "with_food", label: "Mit dem Essen", iconSource: pillboxMealIcons.withFood },
      { id: "after_food", label: "Nach dem Essen", iconSource: pillboxMealIcons.afterFood },
      { id: "not_matter", label: "Beliebig", iconSource: pillboxMealIcons.notMatter },
    ];
  }
  if (locale === "pl") {
    return [
      { id: "before_food", label: "Przed jedzeniem", iconSource: pillboxMealIcons.beforeFood },
      { id: "with_food", label: "W trakcie", iconSource: pillboxMealIcons.withFood },
      { id: "after_food", label: "Po jedzeniu", iconSource: pillboxMealIcons.afterFood },
      { id: "not_matter", label: "Dowolnie", iconSource: pillboxMealIcons.notMatter },
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
