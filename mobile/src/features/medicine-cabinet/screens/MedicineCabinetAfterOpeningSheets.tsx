import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { ReminderNumberOptionsSheet } from "../../illness/screens/ReminderNumberOptionsSheet";
import { afterOpeningShelfOptions, type AfterOpeningMode } from "../model/afterOpeningShelfLife";

type AfterOpeningSheetsStyles = {
  sheetOverlay: StyleProp<ViewStyle>;
  sheetBackdrop: StyleProp<ViewStyle>;
  customValueSheetCard: StyleProp<ViewStyle>;
  sheetDragZone: StyleProp<ViewStyle>;
  sheetHandle: StyleProp<ViewStyle>;
  sheetTitle: StyleProp<TextStyle>;
  sheetSubtitle: StyleProp<TextStyle>;
  customValueInput: StyleProp<TextStyle>;
  customValueActions: StyleProp<ViewStyle>;
  customValueCancelButton: StyleProp<ViewStyle>;
  secondaryButtonPressed: StyleProp<ViewStyle>;
  customValueCancelText: StyleProp<TextStyle>;
  customValueSaveButton: StyleProp<ViewStyle>;
  primaryButtonPressed: StyleProp<ViewStyle>;
  customValueSaveGradient: StyleProp<ViewStyle>;
  customValueSaveText: StyleProp<TextStyle>;
};

export function MedicineCabinetAfterOpeningSheets({
  locale,
  isOptionSheetOpen,
  isCustomSheetOpen,
  mode,
  customValue,
  onChangeCustomValue,
  onCloseOptionSheet,
  onCloseCustomSheet,
  onSelectOption,
  onPressCustom,
  onSaveCustom,
  styles,
}: {
  locale: MobileLocale;
  isOptionSheetOpen: boolean;
  isCustomSheetOpen: boolean;
  mode: AfterOpeningMode;
  customValue: string;
  onChangeCustomValue: (value: string) => void;
  onCloseOptionSheet: () => void;
  onCloseCustomSheet: () => void;
  onSelectOption: (value: number | null) => void;
  onPressCustom: () => void;
  onSaveCustom: () => void;
  styles: AfterOpeningSheetsStyles;
}) {
  const optionTitle =
    locale === "ru"
      ? "Срок после вскрытия"
      : locale === "de"
        ? "Haltbarkeit nach dem Öffnen"
        : locale === "pl"
          ? "Trwałość po otwarciu"
          : "After-opening shelf life";
  const customActionLabel =
    locale === "ru"
      ? "Свой срок"
      : locale === "de"
        ? "Eigene Frist"
        : locale === "pl"
          ? "Własny okres"
          : "Custom period";
  const customSheetTitle =
    locale === "ru"
      ? "Свой срок"
      : locale === "de"
        ? "Eigener Zeitraum"
        : locale === "pl"
          ? "Własny okres"
          : "Custom period";
  const customSheetSubtitle =
    locale === "ru"
      ? "Укажите, сколько дней препарат хранится после вскрытия."
      : locale === "de"
        ? "Geben Sie an, wie viele Tage das Medikament nach dem Öffnen haltbar ist."
        : locale === "pl"
          ? "Podaj, przez ile dni lek jest ważny po otwarciu."
          : "Enter how many days the medicine keeps after opening.";
  const customPlaceholder =
    locale === "ru"
      ? "Например: 45"
      : locale === "de"
        ? "Zum Beispiel: 45"
        : locale === "pl"
          ? "Na przykład: 45"
          : "For example: 45";
  const cancelLabel =
    locale === "ru"
      ? "Отмена"
      : locale === "de"
        ? "Abbrechen"
        : locale === "pl"
          ? "Anuluj"
          : "Cancel";
  const saveLabel =
    locale === "ru"
      ? "Сохранить"
      : locale === "de"
        ? "Speichern"
        : locale === "pl"
          ? "Zapisz"
          : "Save";
  const options = afterOpeningShelfOptions.map((option) => ({
    ...option,
    label:
      locale === "ru"
        ? `${option.value} дн.`
        : locale === "de"
          ? `${option.value} Tg.`
          : locale === "pl"
            ? `${option.value} dni`
            : `${option.value} days`,
  }));

  return (
    <>
      <ReminderNumberOptionsSheet
        visible={isOptionSheetOpen}
        title={optionTitle}
        value={
          mode === "14" || mode === "30" || mode === "60" ? Number(mode) : null
        }
        options={options}
        columns={2}
        customActionActive={mode === "custom"}
        customActionLabel={customActionLabel}
        onClose={onCloseOptionSheet}
        onSelect={onSelectOption}
        onCustomPress={onPressCustom}
      />

      <FormBottomSheet
        visible={isCustomSheetOpen}
        onClose={onCloseCustomSheet}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.customValueSheetCard}
        keyboardAvoiding
        keyboardBehavior="padding"
        keyboardVerticalOffset={0}
      >
        {({ panHandlers, requestClose }) => (
          <>
            <View style={styles.sheetDragZone} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{customSheetTitle}</Text>
              <Text style={styles.sheetSubtitle}>{customSheetSubtitle}</Text>
            </View>

            <TextInput
              value={customValue}
              onChangeText={onChangeCustomValue}
              style={styles.customValueInput}
              placeholder={customPlaceholder}
              placeholderTextColor="#98A2AD"
              keyboardType="number-pad"
              autoFocus
            />

            <View style={styles.customValueActions}>
              <Pressable
                onPress={() => requestClose()}
                style={({ pressed }) => [
                  styles.customValueCancelButton,
                  pressed ? styles.secondaryButtonPressed : null,
                ]}
              >
                <Text style={styles.customValueCancelText}>{cancelLabel}</Text>
              </Pressable>

              <Pressable
                onPress={() => requestClose(onSaveCustom)}
                style={({ pressed }) => [
                  styles.customValueSaveButton,
                  pressed ? styles.primaryButtonPressed : null,
                ]}
                >
                  <LinearGradient
                    colors={["#F56565", "#EF4F4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                    style={styles.customValueSaveGradient}
                  />
                <Text style={styles.customValueSaveText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>
    </>
  );
}
