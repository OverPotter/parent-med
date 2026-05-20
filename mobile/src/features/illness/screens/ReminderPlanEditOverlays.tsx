import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import { ReminderNumberOptionsSheet } from "./ReminderNumberOptionsSheet";
import type { ReminderNumberSheetOption } from "./reminderNumberOptions";

type ReminderPlanEditOverlaysProps = {
  locale: "ru" | "en" | "de" | "pl";
  editingPlan: MobileEpisodeMedicationPlan | null;
  editingField: "dose" | "interval" | "limit" | "notes" | null;
  fieldValue: string;
  activeNumberSheet: "interval" | "limit" | null;
  customValueVisible: boolean;
  customValue: string;
  doseLabel: string;
  intervalLabel: string;
  limitLabel: string;
  notesLabel: string;
  cancelLabel: string;
  saveLabel: string;
  intervalOptions: ReminderNumberSheetOption[];
  limitOptions: ReminderNumberSheetOption[];
  intervalCustomLabel: string;
  limitCustomLabel: string;
  intervalPlaceholder: string;
  onChangeFieldValue: (next: string) => void;
  onCloseTextEdit: () => void;
  onSaveTextEdit: () => void;
  onCloseNumberSheet: () => void;
  onSelectNumberValue: (value: number | null) => void;
  onOpenCustomValue: () => void;
  onChangeCustomValue: (next: string) => void;
  onCloseCustomValue: () => void;
  onSaveCustomValue: () => void;
  isSaving: boolean;
};

export function ReminderPlanEditOverlays({
  locale,
  editingPlan,
  editingField,
  fieldValue,
  activeNumberSheet,
  customValueVisible,
  customValue,
  doseLabel,
  intervalLabel,
  limitLabel,
  notesLabel,
  cancelLabel,
  saveLabel,
  intervalOptions,
  limitOptions,
  intervalCustomLabel,
  limitCustomLabel,
  intervalPlaceholder,
  onChangeFieldValue,
  onCloseTextEdit,
  onSaveTextEdit,
  onCloseNumberSheet,
  onSelectNumberValue,
  onOpenCustomValue,
  onChangeCustomValue,
  onCloseCustomValue,
  onSaveCustomValue,
  isSaving,
}: ReminderPlanEditOverlaysProps) {
  return (
    <>
      {editingPlan && editingField && (editingField === "dose" || editingField === "notes") ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onCloseTextEdit} />
          <View style={styles.card}>
            <Text style={styles.title}>
              {editingField === "dose" ? doseLabel : notesLabel}
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={fieldValue}
                onChangeText={onChangeFieldValue}
                style={styles.input}
                placeholder={editingField === "dose" ? doseLabel : notesLabel}
                placeholderTextColor="#98A7AB"
                maxLength={editingField === "dose" ? 40 : 120}
                multiline={editingField === "notes"}
              />
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={onCloseTextEdit}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : null]}
                onPress={onSaveTextEdit}
                disabled={isSaving}
              >
                <Text style={styles.primaryButtonText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <ReminderNumberOptionsSheet
        visible={!!editingPlan && activeNumberSheet !== null}
        title={activeNumberSheet === "interval" ? intervalLabel : limitLabel}
        value={
          activeNumberSheet === "interval"
            ? editingPlan?.minIntervalMinutes ?? null
            : editingPlan?.maxDosesPerDay ?? null
        }
        options={activeNumberSheet === "interval" ? intervalOptions : limitOptions}
        showEmptyOption={activeNumberSheet === "limit"}
        emptyOptionLabel={
          locale === "ru"
            ? "Без лимита"
            : locale === "de"
              ? "Ohne Limit"
              : locale === "pl"
                ? "Bez limitu"
                : "No limit"
        }
        customActionLabel={
          activeNumberSheet === "interval" ? intervalCustomLabel : limitCustomLabel
        }
        onClose={onCloseNumberSheet}
        onSelect={onSelectNumberValue}
        onCustomPress={onOpenCustomValue}
      />

      {editingPlan && editingField && customValueVisible ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onCloseCustomValue} />
          <View style={styles.card}>
            <Text style={styles.title}>
              {editingField === "interval" ? intervalLabel : limitLabel}
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={customValue}
                onChangeText={onChangeCustomValue}
                style={styles.input}
                placeholder={editingField === "interval" ? intervalPlaceholder : "4"}
                placeholderTextColor="#98A7AB"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={onCloseCustomValue}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : null]}
                onPress={onSaveCustomValue}
                disabled={isSaving}
              >
                <Text style={styles.primaryButtonText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 32, 43, 0.24)",
  },
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "#FFFCF8",
    padding: 22,
    borderWidth: 1,
    borderColor: "#EED8CE",
  },
  title: {
    color: "#1E2A3A",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  inputWrap: {
    marginTop: 14,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFBF8",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  input: {
    color: "#1E2A3A",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
    paddingVertical: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFCF8",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#1E2A3A",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#F56F68",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});
