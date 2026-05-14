import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
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
  return (
    <>
      <ReminderNumberOptionsSheet
        visible={isOptionSheetOpen}
        title="Срок после вскрытия"
        value={
          mode === "14" || mode === "30" || mode === "60" ? Number(mode) : null
        }
        options={afterOpeningShelfOptions}
        columns={2}
        customActionActive={mode === "custom"}
        customActionLabel="Свой срок"
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
              <Text style={styles.sheetTitle}>Свой срок</Text>
              <Text style={styles.sheetSubtitle}>
                Укажите, сколько дней препарат хранится после вскрытия.
              </Text>
            </View>

            <TextInput
              value={customValue}
              onChangeText={onChangeCustomValue}
              style={styles.customValueInput}
              placeholder="Например: 45"
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
                <Text style={styles.customValueCancelText}>Отмена</Text>
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
                <Text style={styles.customValueSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>
    </>
  );
}

