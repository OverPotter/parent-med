import { Feather } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { JournalEntryOption } from "../model/journalEntryScreen";
import { styles } from "../screens/journalEntryScreenStyles";

export type FeedingType = "breast" | "formula";
export type FeedingTiming = "now" | "backdated";
export type BreastSide = "left" | "right" | "both";

type FeedingJournalEntryFormProps = {
  locale: "ru" | "de" | "pl" | "en";
  feedingOptions: JournalEntryOption[];
  feedingType: FeedingType;
  feedingTiming: FeedingTiming;
  breastSide: BreastSide;
  formulaAmount: string;
  backdatedDuration: string;
  backdatedDateValue: string;
  backdatedTimeValue: string;
  onChangeFeedingType: (value: FeedingType) => void;
  onChangeFeedingTiming: (value: FeedingTiming) => void;
  onChangeBreastSide: (value: BreastSide) => void;
  onChangeFormulaAmount: (value: string) => void;
  onChangeBackdatedDuration: (value: string) => void;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  onInputFocus: () => void;
};

const breastSideOptions: Array<{ id: BreastSide; labelRu: string; labelEn: string }> = [
  { id: "left", labelRu: "Левая", labelEn: "Left" },
  { id: "right", labelRu: "Правая", labelEn: "Right" },
  { id: "both", labelRu: "Обе", labelEn: "Both" },
];

const feedingTimingOptions: Array<{
  id: FeedingTiming;
  labelRu: string;
  labelEn: string;
}> = [
  { id: "now", labelRu: "Сейчас", labelEn: "Now" },
  { id: "backdated", labelRu: "Задним числом", labelEn: "Backdated" },
];

export function FeedingJournalEntryForm({
  locale,
  feedingOptions,
  feedingType,
  feedingTiming,
  breastSide,
  formulaAmount,
  backdatedDuration,
  backdatedDateValue,
  backdatedTimeValue,
  onChangeFeedingType,
  onChangeFeedingTiming,
  onChangeBreastSide,
  onChangeFormulaAmount,
  onChangeBackdatedDuration,
  onOpenDatePicker,
  onOpenTimePicker,
  onInputFocus,
}: FeedingJournalEntryFormProps) {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  const breastLabel = (option: (typeof breastSideOptions)[number]) =>
    isRu
      ? option.labelRu
      : isDe
        ? option.id === "left"
          ? "Links"
          : option.id === "right"
            ? "Rechts"
            : "Beide"
        : isPl
          ? option.id === "left"
            ? "Lewa"
            : option.id === "right"
              ? "Prawa"
              : "Obie"
          : option.labelEn;

  const timingLabel = (option: (typeof feedingTimingOptions)[number]) =>
    isRu
      ? option.labelRu
      : isDe
        ? option.id === "now"
          ? "Jetzt"
          : "Nachtragen"
        : isPl
          ? option.id === "now"
            ? "Teraz"
            : "Zaległy wpis"
          : option.labelEn;

  return (
    <>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {isRu ? "Что записать" : isDe ? "Was speichern" : isPl ? "Co zapisać" : "What to record"}
        </Text>
        <View style={styles.optionRow}>
          {feedingOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => onChangeFeedingType(option.id as FeedingType)}
              style={({ pressed }) => [
                styles.optionChip,
                feedingType === option.id ? styles.optionChipActive : null,
                pressed ? styles.optionChipPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  feedingType === option.id ? styles.optionChipTextActive : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {feedingType === "breast" ? (
        <>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {isRu ? "Какая грудь" : isDe ? "Welche Seite" : isPl ? "Która pierś" : "Which side"}
            </Text>
            <View style={styles.optionRow}>
              {breastSideOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => onChangeBreastSide(option.id)}
                  style={({ pressed }) => [
                    styles.optionChip,
                    styles.compactOptionChip,
                    breastSide === option.id ? styles.optionChipActive : null,
                    pressed ? styles.optionChipPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      breastSide === option.id ? styles.optionChipTextActive : null,
                    ]}
                  >
                    {breastLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {isRu ? "Когда записать" : isDe ? "Wann speichern" : isPl ? "Kiedy zapisać" : "When to save it"}
            </Text>
            <View style={styles.optionRow}>
              {feedingTimingOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => onChangeFeedingTiming(option.id)}
                  style={({ pressed }) => [
                    styles.optionChip,
                    feedingTiming === option.id ? styles.optionChipActive : null,
                    pressed ? styles.optionChipPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      feedingTiming === option.id
                        ? styles.optionChipTextActive
                        : null,
                    ]}
                  >
                    {timingLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {feedingTiming === "backdated" ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                {isRu ? "Когда было кормление" : isDe ? "Wann war die Fütterung" : isPl ? "Kiedy było karmienie" : "When it happened"}
              </Text>
              <View style={styles.rowsList}>
                <Pressable
                  onPress={onOpenTimePicker}
                  style={({ pressed }) => [
                    styles.rowPressable,
                    pressed ? styles.rowPressablePressed : null,
                  ]}
                >
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{isRu ? "Время" : isDe ? "Uhrzeit" : isPl ? "Godzina" : "Time"}</Text>
                    <View style={styles.rowValueWrap}>
                      <Text style={styles.rowValue}>{backdatedTimeValue}</Text>
                      <Feather name="chevron-right" size={14} color="#A4AEB9" />
                    </View>
                  </View>
                </Pressable>
                <View style={styles.rowDivider} />
                <View style={styles.inputRow}>
                  <Text style={styles.rowLabel}>
                    {isRu ? "Длительность" : isDe ? "Dauer" : isPl ? "Czas trwania" : "Duration"}
                  </Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      value={backdatedDuration}
                      onChangeText={(value) =>
                        onChangeBackdatedDuration(
                          value.replace(/[^0-9]/g, "").slice(0, 3),
                        )
                      }
                      onFocus={onInputFocus}
                      maxLength={3}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      style={styles.inputField}
                      placeholder="12"
                      placeholderTextColor="#B1A7A2"
                    />
                    <Text style={styles.inputSuffix}>{isRu ? "мин" : isDe ? "Min" : "min"}</Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={onOpenDatePicker}
                style={({ pressed }) => [
                  styles.secondaryPickerLink,
                  pressed ? styles.secondaryPickerLinkPressed : null,
                ]}
              >
                <Text style={styles.secondaryPickerLinkText}>
                  {isRu
                    ? `Другая дата: ${backdatedDateValue}`
                    : isDe
                      ? `Anderes Datum: ${backdatedDateValue}`
                      : isPl
                        ? `Inna data: ${backdatedDateValue}`
                    : `Other date: ${backdatedDateValue}`}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {isRu ? "Сколько смеси" : isDe ? "Menge der Nahrung" : isPl ? "Ile mieszanki" : "Formula amount"}
            </Text>
            <View style={styles.sectionDivider} />
            <View style={styles.inputRow}>
              <Text style={styles.rowLabel}>{isRu ? "Объём" : isDe ? "Menge" : isPl ? "Ilość" : "Amount"}</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={formulaAmount}
                  onChangeText={(value) =>
                    onChangeFormulaAmount(value.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  onFocus={onInputFocus}
                  maxLength={4}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  style={styles.inputField}
                  placeholder="180"
                  placeholderTextColor="#B1A7A2"
                />
                <Text style={styles.inputSuffix}>ml</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {isRu ? "Когда записать" : isDe ? "Wann speichern" : isPl ? "Kiedy zapisać" : "When to save it"}
            </Text>
            <View style={styles.optionRow}>
              {feedingTimingOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => onChangeFeedingTiming(option.id)}
                  style={({ pressed }) => [
                    styles.optionChip,
                    feedingTiming === option.id ? styles.optionChipActive : null,
                    pressed ? styles.optionChipPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      feedingTiming === option.id
                        ? styles.optionChipTextActive
                        : null,
                    ]}
                  >
                    {timingLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {feedingTiming === "backdated" ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                {isRu ? "Когда было кормление" : isDe ? "Wann war die Fütterung" : isPl ? "Kiedy było karmienie" : "When it happened"}
              </Text>
              <View style={styles.rowsList}>
                <Pressable
                  onPress={onOpenTimePicker}
                  style={({ pressed }) => [
                    styles.rowPressable,
                    pressed ? styles.rowPressablePressed : null,
                  ]}
                >
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{isRu ? "Время" : isDe ? "Uhrzeit" : isPl ? "Godzina" : "Time"}</Text>
                    <View style={styles.rowValueWrap}>
                      <Text style={styles.rowValue}>{backdatedTimeValue}</Text>
                      <Feather name="chevron-right" size={14} color="#A4AEB9" />
                    </View>
                  </View>
                </Pressable>
              </View>
              <Pressable
                onPress={onOpenDatePicker}
                style={({ pressed }) => [
                  styles.secondaryPickerLink,
                  pressed ? styles.secondaryPickerLinkPressed : null,
                ]}
              >
                <Text style={styles.secondaryPickerLinkText}>
                  {isRu
                    ? `Другая дата: ${backdatedDateValue}`
                    : isDe
                      ? `Anderes Datum: ${backdatedDateValue}`
                      : isPl
                        ? `Inna data: ${backdatedDateValue}`
                    : `Other date: ${backdatedDateValue}`}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </>
  );
}
