import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  BreastSide,
  FeedingJournalEntryForm,
  FeedingTiming,
  FeedingType,
} from "../components/FeedingJournalEntryForm";
import {
  buildJournalEntryScreenContent,
  JournalEntryKind,
} from "../model/journalEntryScreen";
import { styles } from "./journalEntryScreenStyles";

type PickerField = "date" | "time" | null;
type JournalUiLocale = "ru" | "de" | "pl" | "en";

type JournalEntryScreenProps = {
  kind: JournalEntryKind;
  visible?: boolean;
  onBack?: () => void;
  onSwipeBack?: () => void;
  onStartTimer?: () => void;
};

const noop = () => {};

function getMonths(locale: JournalUiLocale) {
  return locale === "ru"
    ? [
        "янв",
        "фев",
        "мар",
        "апр",
        "май",
        "июн",
        "июл",
        "авг",
        "сен",
        "окт",
        "ноя",
        "дек",
      ]
    : locale === "de"
      ? [
          "Jan",
          "Feb",
          "Mär",
          "Apr",
          "Mai",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dez",
        ]
      : locale === "pl"
        ? [
            "sty",
            "lut",
            "mar",
            "kwi",
            "maj",
            "cze",
            "lip",
            "sie",
            "wrz",
            "paź",
            "lis",
            "gru",
          ]
        : [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
}

function formatBackdatedDate(date: Date, locale: JournalUiLocale) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (locale === "ru" || locale === "de" || locale === "pl") {
    return `${day}.${month}.${year}`;
  }

  return `${month}/${day}/${year}`;
}

function formatBackdatedTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function JournalEntryScreen({
  kind,
  visible = true,
  onBack = noop,
  onSwipeBack,
  onStartTimer = noop,
}: JournalEntryScreenProps) {
  const { locale } = useMobileI18n();
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const content = buildJournalEntryScreenContent(kind, locale);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack: onSwipeBack ?? onBack,
  });
  const scrollRef = useRef<ScrollView | null>(null);
  const [feedingType, setFeedingType] = useState<FeedingType>("breast");
  const [feedingTiming, setFeedingTiming] = useState<FeedingTiming>("now");
  const [breastSide, setBreastSide] = useState<BreastSide>("left");
  const [formulaAmount, setFormulaAmount] = useState("180");
  const [backdatedDuration, setBackdatedDuration] = useState("12");
  const [backdatedAt, setBackdatedAt] = useState(
    new Date(2026, 4, 9, 8, 40),
  );
  const [activePickerField, setActivePickerField] = useState<PickerField>(null);
  const [pickerDay, setPickerDay] = useState(9);
  const [pickerMonthIndex, setPickerMonthIndex] = useState(4);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(40);

  useEffect(() => {
    if (kind !== "feeding") {
      return;
    }

    setFeedingType("breast");
    setFeedingTiming("now");
    setBreastSide("left");
    setFormulaAmount("180");
    setBackdatedDuration("12");
    setBackdatedAt(new Date(2026, 4, 9, 8, 40));
    setActivePickerField(null);
  }, [visible, kind]);

  const uiLocale: JournalUiLocale = isRu ? "ru" : isDe ? "de" : isPl ? "pl" : "en";
  const months = getMonths(uiLocale);
  const years = Array.from({ length: 6 }, (_, index) => 2026 - index);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 12 }, (_, index) => index * 5);
  const backdatedDateValue = formatBackdatedDate(backdatedAt, uiLocale);
  const backdatedTimeValue = formatBackdatedTime(backdatedAt);

  const feedingPrimaryActionLabel = useMemo(() => {
    if (kind !== "feeding") {
      return content.primaryActionLabel;
    }

    if (feedingTiming === "now") {
      return isRu ? "Запустить таймер" : isDe ? "Timer starten" : isPl ? "Uruchom timer" : "Start timer";
    }

    return content.primaryActionLabel;
  }, [content.primaryActionLabel, feedingTiming, isRu, kind]);

  const handlePrimaryActionPress = () => {
    if (kind !== "feeding") {
      onBack();
      return;
    }

    if (feedingTiming === "now") {
      onStartTimer();
      onBack();
    }
  };

  const scrollToFocusedInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 180);
  };

  const pickerTitle =
    activePickerField === "date"
      ? isRu
        ? "Выберите дату"
        : isDe
          ? "Datum wählen"
          : isPl
            ? "Wybierz datę"
        : "Choose date"
      : activePickerField === "time"
        ? isRu
          ? "Выберите время"
          : isDe
            ? "Uhrzeit wählen"
            : isPl
              ? "Wybierz godzinę"
          : "Choose time"
        : "";

  const handleOpenPicker = (field: PickerField) => {
    Keyboard.dismiss();
    setActivePickerField(field);
    setPickerDay(backdatedAt.getDate());
    setPickerMonthIndex(backdatedAt.getMonth());
    setPickerYear(backdatedAt.getFullYear());
    setPickerHour(backdatedAt.getHours());
    setPickerMinute(backdatedAt.getMinutes());
  };

  const handleConfirmPicker = () => {
    const next = new Date(backdatedAt);

    if (activePickerField === "date") {
      next.setFullYear(pickerYear, pickerMonthIndex, pickerDay);
    } else if (activePickerField === "time") {
      next.setHours(pickerHour, pickerMinute, 0, 0);
    }

    setBackdatedAt(next);
    setActivePickerField(null);
  };

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
        <View style={styles.overlay} />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={16}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.topBar}>
                <Pressable onPress={onBack} style={styles.backLink}>
                  <Text style={styles.backLinkText}>{"← "}{content.backLabel}</Text>
                </Pressable>
              </View>

              <View style={styles.headerBlock}>
                <Text style={styles.title}>{content.title}</Text>
                <Text style={styles.subtitle}>{content.subtitle}</Text>
              </View>

              {kind === "feeding" && content.feedingOptions ? (
              <FeedingJournalEntryForm
                locale={uiLocale}
                feedingOptions={content.feedingOptions}
                feedingType={feedingType}
                feedingTiming={feedingTiming}
                breastSide={breastSide}
                formulaAmount={formulaAmount}
                backdatedDuration={backdatedDuration}
                backdatedDateValue={backdatedDateValue}
                backdatedTimeValue={backdatedTimeValue}
                onChangeFeedingType={setFeedingType}
                onChangeFeedingTiming={setFeedingTiming}
                onChangeBreastSide={setBreastSide}
                onChangeFormulaAmount={setFormulaAmount}
                onChangeBackdatedDuration={setBackdatedDuration}
                onOpenDatePicker={() => handleOpenPicker("date")}
                onOpenTimePicker={() => handleOpenPicker("time")}
                onInputFocus={scrollToFocusedInput}
              />
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>{content.sectionTitle}</Text>
                <View style={styles.rowsList}>
                  {content.rows.map((row, index) => (
                    <View key={row.id}>
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        <View style={styles.rowValueWrap}>
                          <Text style={styles.rowValue}>{row.value}</Text>
                          <Feather name="chevron-right" size={14} color="#A4AEB9" />
                        </View>
                      </View>
                      {row.helper ? (
                        <Text style={styles.rowHelper}>{row.helper}</Text>
                      ) : null}
                      {index < content.rows.length - 1 ? (
                        <View style={styles.rowDivider} />
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {kind === "feeding" ? null : (
              <View style={styles.notesCard}>
                <Text style={styles.notesTitle}>{content.notesTitle}</Text>
                <Text style={styles.notesBody}>{content.notesBody}</Text>
              </View>
            )}

            <Pressable
              onPress={handlePrimaryActionPress}
              style={({ pressed }) => [
                styles.saveButton,
                pressed ? styles.saveButtonPressed : null,
              ]}
            >
              <Text style={styles.saveButtonText}>
                {kind === "feeding"
                  ? feedingPrimaryActionLabel
                  : content.primaryActionLabel}
              </Text>
            </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>

          {activePickerField ? (
            <View style={styles.pickerOverlay}>
              <Pressable
                style={styles.pickerBackdrop}
                onPress={() => setActivePickerField(null)}
              />
              <View style={styles.pickerSheet}>
                <View style={styles.pickerSheetHeader}>
                  <Text style={styles.pickerSheetTitle}>{pickerTitle}</Text>
                  <Pressable
                    onPress={handleConfirmPicker}
                    style={({ pressed }) => [
                      styles.pickerCloseButton,
                      pressed ? styles.pickerCloseButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.pickerCloseButtonText}>
                      {isRu ? "Готово" : isDe ? "Fertig" : isPl ? "Gotowe" : "Done"}
                    </Text>
                  </Pressable>
                </View>
                {activePickerField === "date" ? (
                  <>
                    <View style={styles.datePickerPreview}>
                      <Text style={styles.datePickerPreviewText}>
                        {formatBackdatedDate(
                          new Date(pickerYear, pickerMonthIndex, pickerDay),
                          uiLocale,
                        )}
                      </Text>
                    </View>

                    <View style={styles.dateColumns}>
                      <ScrollView
                        style={styles.dateColumn}
                        contentContainerStyle={styles.dateColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {Array.from({ length: 31 }, (_, index) => index + 1).map(
                          (day) => (
                            <Pressable
                              key={`picker-day-${day}`}
                              onPress={() => setPickerDay(day)}
                              style={[
                                styles.datePill,
                                pickerDay === day ? styles.datePillSelected : null,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.datePillText,
                                  pickerDay === day
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
                        contentContainerStyle={styles.dateColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {months.map((month, index) => (
                          <Pressable
                            key={`picker-month-${month}`}
                            onPress={() => setPickerMonthIndex(index)}
                            style={[
                              styles.datePill,
                              pickerMonthIndex === index
                                ? styles.datePillSelected
                                : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePillText,
                                pickerMonthIndex === index
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
                        contentContainerStyle={styles.dateColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {years.map((year) => (
                          <Pressable
                            key={`picker-year-${year}`}
                            onPress={() => setPickerYear(year)}
                            style={[
                              styles.datePill,
                              pickerYear === year ? styles.datePillSelected : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePillText,
                                pickerYear === year
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
                  </>
                ) : (
                  <>
                    <View style={styles.datePickerPreview}>
                      <Text style={styles.datePickerPreviewText}>
                        {formatBackdatedTime(
                          new Date(2026, 4, 9, pickerHour, pickerMinute),
                        )}
                      </Text>
                    </View>

                    <View style={styles.dateColumns}>
                      <ScrollView
                        style={styles.dateColumn}
                        contentContainerStyle={styles.dateColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {hours.map((hour) => (
                          <Pressable
                            key={`picker-hour-${hour}`}
                            onPress={() => setPickerHour(hour)}
                            style={[
                              styles.datePill,
                              pickerHour === hour ? styles.datePillSelected : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePillText,
                                pickerHour === hour
                                  ? styles.datePillTextSelected
                                  : null,
                              ]}
                            >
                              {String(hour).padStart(2, "0")}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      <ScrollView
                        style={styles.dateColumn}
                        contentContainerStyle={styles.dateColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {minutes.map((minute) => (
                          <Pressable
                            key={`picker-minute-${minute}`}
                            onPress={() => setPickerMinute(minute)}
                            style={[
                              styles.datePill,
                              pickerMinute === minute
                                ? styles.datePillSelected
                                : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePillText,
                                pickerMinute === minute
                                  ? styles.datePillTextSelected
                                  : null,
                              ]}
                            >
                              {String(minute).padStart(2, "0")}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </Animated.View>
  );
}
