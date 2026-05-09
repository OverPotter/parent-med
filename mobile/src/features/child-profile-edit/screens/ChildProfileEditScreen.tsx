import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChildCard } from "../../children/model/childrenRedesign";
import { buildChildProfileEditContent } from "../model/childProfileEdit";
import { styles } from "./childProfileEditStyles";

type ChildProfileEditScreenProps = {
  child: ChildCard;
  visible: boolean;
  onBack: () => void;
};

const noop = () => {};

const avatarOptions = [
  childrenScreenAssets.avatars.boyBlackHair,
  childrenScreenAssets.avatars.boyRedHair,
  childrenScreenAssets.avatars.girlBlonde,
  childrenScreenAssets.avatars.boy,
  childrenScreenAssets.avatars.girl,
  childrenScreenAssets.avatars.child1,
  childrenScreenAssets.avatars.child2,
  childrenScreenAssets.avatars.child3,
] as const;

const ruMonths = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const enMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function getMonths(locale: "ru" | "en" | "pl" | "de") {
  return locale === "ru" ? ruMonths : enMonths;
}

function parseBirthDate(value: string, locale: "ru" | "en" | "pl" | "de") {
  const months = getMonths(locale);
  const parts = value.trim().split(/\s+/);

  if (parts.length < 3) {
    return { day: 4, monthIndex: 1, year: 2022 };
  }

  return {
    day: Number(parts[0]) || 4,
    monthIndex: Math.max(0, months.indexOf(parts[1] as never)),
    year: Number(parts[2]) || 2022,
  };
}

function formatBirthDate(
  day: number,
  monthIndex: number,
  year: number,
  locale: "ru" | "en" | "pl" | "de",
) {
  const months = getMonths(locale);
  return `${day} ${months[monthIndex] ?? months[0]} ${year}`;
}

export function ChildProfileEditScreen({
  child,
  visible,
  onBack,
}: ChildProfileEditScreenProps) {
  const { locale, copy } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildChildProfileEditContent(child, locale, copy);
  const defaultBirthDate = content.sections.main.rows[1]?.value ?? "";
  const defaultAllergies = content.sections.health.rows[0]?.description ?? "";
  const defaultNotes = content.sections.health.rows[1]?.description ?? "";
  const [selectedAvatarSource, setSelectedAvatarSource] = useState(
    content.avatarSource,
  );
  const [editableName, setEditableName] = useState(content.childName);
  const [editableBirthDate, setEditableBirthDate] = useState(defaultBirthDate);
  const [editableAllergies, setEditableAllergies] = useState(defaultAllergies);
  const [editableNotes, setEditableNotes] = useState(defaultNotes);
  const [editingField, setEditingField] = useState<"childName" | null>(null);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [textEditorField, setTextEditorField] = useState<
    "allergies" | "notes" | null
  >(null);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled:
      visible &&
      !isAvatarSheetOpen &&
      !isDateSheetOpen &&
      textEditorField === null,
    width,
    onBack,
  });
  const [babyModeEnabled, setBabyModeEnabled] = useState(
    content.sections.settings.rows[0]?.enabled ?? true,
  );
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(
    content.sections.settings.rows[1]?.enabled ?? true,
  );

  useEffect(() => {
    setSelectedAvatarSource(content.avatarSource);
    setEditableName(content.childName);
    setEditableBirthDate(defaultBirthDate);
    setEditableAllergies(defaultAllergies);
    setEditableNotes(defaultNotes);
    setEditingField(null);
    setTextEditorField(null);
  }, [
    content.avatarSource,
    content.childName,
    defaultAllergies,
    defaultNotes,
    defaultBirthDate,
    visible,
  ]);

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
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlaySoftColor },
          ]}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={onBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>
                {"← "}
                {content.backLabel}
              </Text>
            </Pressable>

            <View style={styles.titleWrap}>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.avatarWrap}>
                <Image
                  source={selectedAvatarSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.childName}>{editableName}</Text>
                <Text style={styles.childMeta}>
                  {content.childMeta.replace(
                    defaultBirthDate,
                    editableBirthDate,
                  )}
                </Text>

                <Pressable
                  onPress={() => setIsAvatarSheetOpen(true)}
                  style={({ pressed }) => [
                    styles.photoButton,
                    pressed ? styles.photoButtonPressed : null,
                  ]}
                >
                  <Feather name="camera" size={15} color="#F47667" />
                  <Text style={styles.photoButtonText}>
                    {content.changePhotoLabel}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>
                {content.sections.main.title}
              </Text>
              <View style={styles.cardList}>
                <Pressable
                  onPress={() => setEditingField("childName")}
                  style={({ pressed }) => [
                    styles.listRow,
                    pressed ? styles.rowPressed : null,
                  ]}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowLabel}>
                      {content.sections.main.rows[0]?.label}
                    </Text>
                  </View>

                  <View style={styles.rowValueWrap}>
                    {editingField === "childName" ? (
                      <TextInput
                        value={editableName}
                        onChangeText={setEditableName}
                        style={styles.inlineInput}
                        placeholder={content.sections.main.rows[0]?.label}
                        placeholderTextColor="#98A2AD"
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoFocus
                        onBlur={() => setEditingField(null)}
                        returnKeyType="done"
                        onSubmitEditing={() => setEditingField(null)}
                      />
                    ) : (
                      <Text style={styles.rowValue}>{editableName}</Text>
                    )}
                    <Feather name="edit-2" size={14} color="#9AA7B3" />
                  </View>
                </Pressable>

                <View style={styles.rowDivider} />

                <Pressable
                  onPress={() => setIsDateSheetOpen(true)}
                  style={({ pressed }) => [
                    styles.listRow,
                    pressed ? styles.rowPressed : null,
                  ]}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowLabel}>
                      {content.sections.main.rows[1]?.label}
                    </Text>
                  </View>

                  <View style={styles.rowValueWrap}>
                    <Text style={styles.rowValue}>{editableBirthDate}</Text>
                    <Feather name="edit-2" size={14} color="#9AA7B3" />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>
                {content.sections.health.title}
              </Text>
              <View style={styles.cardList}>
                {content.sections.health.rows.map((row, index) => (
                  <View key={row.id}>
                    <Pressable
                      onPress={() =>
                        setTextEditorField(
                          row.id === "allergies" ? "allergies" : "notes",
                        )
                      }
                      style={({ pressed }) => [
                        styles.listRow,
                        styles.listRowMultiline,
                        pressed ? styles.rowPressed : null,
                      ]}
                    >
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        <Text style={styles.rowDescription}>
                          {row.id === "allergies"
                            ? editableAllergies
                            : editableNotes}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9AA7B3"
                      />
                    </Pressable>
                    {index < content.sections.health.rows.length - 1 ? (
                      <View style={styles.rowDivider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>
                {content.sections.settings.title}
              </Text>
              <View style={styles.cardList}>
                <View>
                  <View style={[styles.listRow, styles.listRowMultiline]}>
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowLabel}>
                        {content.sections.settings.rows[0]?.label}
                      </Text>
                      <Text style={styles.rowDescription}>
                        {content.sections.settings.rows[0]?.description}
                      </Text>
                    </View>

                    <View style={styles.settingToggleWrap}>
                      <Switch
                        value={babyModeEnabled}
                        onValueChange={setBabyModeEnabled}
                        trackColor={{ false: "#E7DDD7", true: "#46C06F" }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E7DDD7"
                      />
                    </View>
                  </View>
                  <View style={styles.rowDivider} />
                </View>

                <View style={[styles.listRow, styles.listRowMultiline]}>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowLabel}>
                      {content.sections.settings.rows[1]?.label}
                    </Text>
                    <Text style={styles.rowDescription}>
                      {content.sections.settings.rows[1]?.description}
                    </Text>
                  </View>

                  <View style={styles.settingToggleWrap}>
                    <Switch
                      value={liveActivityEnabled}
                      onValueChange={setLiveActivityEnabled}
                      trackColor={{ false: "#E7DDD7", true: "#46C06F" }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E7DDD7"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionsWrap}>
              <Pressable
                onPress={noop}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed ? styles.saveButtonPressed : null,
                ]}
              >
                <LinearGradient
                  colors={["#FF8D79", "#F76961"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveGradient}
                />
                <Text style={styles.saveLabel}>{content.actions.save}</Text>
              </Pressable>

              <Pressable
                onPress={noop}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed ? styles.deleteButtonPressed : null,
                ]}
              >
                <Text style={styles.deleteLabel}>{content.actions.delete}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
      <AvatarPickerSheet
        visible={isAvatarSheetOpen}
        onClose={() => setIsAvatarSheetOpen(false)}
        selectedAvatarSource={selectedAvatarSource}
        onSelect={(avatarSource) => {
          setSelectedAvatarSource(avatarSource);
          setIsAvatarSheetOpen(false);
        }}
      />
      <BirthDatePickerSheet
        visible={isDateSheetOpen}
        locale={locale}
        initialValue={editableBirthDate}
        onClose={() => setIsDateSheetOpen(false)}
        onApply={(value) => {
          setEditableBirthDate(value);
          setIsDateSheetOpen(false);
        }}
      />
      <TextEditorSheet
        visible={textEditorField !== null}
        title={
          textEditorField === "allergies"
            ? (content.sections.health.rows[0]?.label ?? "")
            : (content.sections.health.rows[1]?.label ?? "")
        }
        initialValue={
          textEditorField === "allergies" ? editableAllergies : editableNotes
        }
        onClose={() => setTextEditorField(null)}
        onApply={(value) => {
          if (textEditorField === "allergies") {
            setEditableAllergies(value);
          } else if (textEditorField === "notes") {
            setEditableNotes(value);
          }
          setTextEditorField(null);
        }}
      />
    </Animated.View>
  );
}

type AvatarPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedAvatarSource: (typeof avatarOptions)[number];
  onSelect: (avatarSource: (typeof avatarOptions)[number]) => void;
};

function AvatarPickerSheet({
  visible,
  onClose,
  selectedAvatarSource,
  onSelect,
}: AvatarPickerSheetProps) {
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
            <Text style={styles.sheetTitle}>Сменить фото</Text>
            <Text style={styles.sheetSubtitle}>
              Выберите аватар для профиля.
            </Text>
          </View>

          <View style={styles.avatarOptionsGrid}>
            {avatarOptions.map((avatarSource, index) => {
              const isSelected = selectedAvatarSource === avatarSource;

              return (
                <Pressable
                  key={`avatar-${index}`}
                  onPress={() => requestClose(() => onSelect(avatarSource))}
                  style={({ pressed }) => [
                    styles.avatarOption,
                    isSelected ? styles.avatarOptionSelected : null,
                    pressed ? styles.avatarOptionPressed : null,
                  ]}
                >
                  <Image
                    source={avatarSource}
                    style={styles.avatarOptionImage}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </FormBottomSheet>
  );
}

type BirthDatePickerSheetProps = {
  visible: boolean;
  locale: "ru" | "en" | "pl" | "de";
  initialValue: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

function BirthDatePickerSheet({
  visible,
  locale,
  initialValue,
  onClose,
  onApply,
}: BirthDatePickerSheetProps) {
  const parsed = parseBirthDate(initialValue, locale);
  const [selectedDay, setSelectedDay] = useState(parsed.day);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    parsed.monthIndex,
  );
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
            <Text style={styles.sheetTitle}>Дата рождения</Text>
            <Text style={styles.sheetSubtitle}>
              Выберите день, месяц и год.
            </Text>
          </View>

          <View style={styles.datePickerPreview}>
            <Text style={styles.datePickerPreviewText}>
              {formatBirthDate(
                selectedDay,
                selectedMonthIndex,
                selectedYear,
                locale,
              )}
            </Text>
          </View>

          <View style={styles.dateColumns}>
            <ScrollView
              style={styles.dateColumn}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map(
                (day) => (
                  <Pressable
                    key={`day-${day}`}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.datePill,
                      selectedDay === day ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        selectedDay === day
                          ? styles.datePillTextSelected
                          : null,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>

            <ScrollView
              style={styles.dateColumn}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {months.map((month, index) => (
                <Pressable
                  key={`month-${month}`}
                  onPress={() => setSelectedMonthIndex(index)}
                  style={[
                    styles.datePill,
                    selectedMonthIndex === index
                      ? styles.datePillSelected
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedMonthIndex === index
                        ? styles.datePillTextSelected
                        : null,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView
              style={styles.dateColumn}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
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
                      selectedYear === year
                        ? styles.datePillTextSelected
                        : null,
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
                  formatBirthDate(
                    selectedDay,
                    selectedMonthIndex,
                    selectedYear,
                    locale,
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
            <Text style={styles.saveLabel}>Готово</Text>
          </Pressable>
        </>
      )}
    </FormBottomSheet>
  );
}

type TextEditorSheetProps = {
  visible: boolean;
  title: string;
  initialValue: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

function TextEditorSheet({
  visible,
  title,
  initialValue,
  onClose,
  onApply,
}: TextEditorSheetProps) {
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
            <Text style={styles.sheetSubtitle}>
              Обновите текст для профиля.
            </Text>
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
            <Text style={styles.saveLabel}>Готово</Text>
          </Pressable>
        </>
      )}
    </FormBottomSheet>
  );
}
