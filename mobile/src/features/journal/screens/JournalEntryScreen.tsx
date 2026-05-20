import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { redesignBackgrounds } from "../../../redesign/shared/backgrounds";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import {
  formatBackdatedDate,
  formatBackdatedTime,
} from "../../../shared/lib/backdatedDateTime";
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

type JournalEntryScreenProps = {
  kind: JournalEntryKind;
  visible?: boolean;
  onBack?: () => void;
  onSwipeBack?: () => void;
  onStartTimer?: () => void;
};

const noop = () => {};

function createJournalDefaultBackdatedDate() {
  return new Date();
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
  const [formulaAmount, setFormulaAmount] = useState("");
  const [backdatedDuration, setBackdatedDuration] = useState("");
  const {
    selectedDate: backdatedAt,
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
    reset: resetBackdatedPicker,
    openPicker,
    closePicker,
    confirmPicker,
  } = useBackdatedDateTimePicker(createJournalDefaultBackdatedDate());

  useEffect(() => {
    if (kind !== "feeding") {
      return;
    }

    setFeedingType("breast");
    setFeedingTiming("now");
    setBreastSide("left");
    setFormulaAmount("");
    setBackdatedDuration("");
    resetBackdatedPicker(createJournalDefaultBackdatedDate());
  }, [kind, resetBackdatedPicker, visible]);

  const uiLocale = isRu ? "ru" : isDe ? "de" : isPl ? "pl" : "en";
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
                onOpenDatePicker={() => openPicker("date")}
                onOpenTimePicker={() => openPicker("time")}
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
        </View>
      </ImageBackground>
    </Animated.View>
  );
}
