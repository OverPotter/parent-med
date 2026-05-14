import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReminderNumberSheetOption } from "./reminderNumberOptions";

type ReminderNumberOptionsSheetProps = {
  visible: boolean;
  title: string;
  value: number | null;
  options: ReminderNumberSheetOption[];
  showEmptyOption?: boolean;
  emptyOptionLabel?: string;
  customActionLabel?: string;
  onClose: () => void;
  onSelect: (value: number | null) => void;
  onCustomPress?: () => void;
};

export function ReminderNumberOptionsSheet({
  visible,
  title,
  value,
  options,
  showEmptyOption,
  emptyOptionLabel,
  customActionLabel,
  onClose,
  onSelect,
  onCustomPress,
}: ReminderNumberOptionsSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {showEmptyOption ? (
              <Pressable
                onPress={() => onSelect(null)}
                style={({ pressed }) => [
                  styles.cell,
                  value === null ? styles.cellActive : null,
                  pressed ? styles.cellPressed : null,
                ]}
              >
                <View style={styles.cellCopy}>
                  <Text
                    style={[
                      styles.cellText,
                      value === null ? styles.cellTextActive : null,
                    ]}
                  >
                    {emptyOptionLabel}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {options.map((option) => (
              <Pressable
                key={`${title}-${option.value}`}
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.cell,
                  value === option.value ? styles.cellActive : null,
                  pressed ? styles.cellPressed : null,
                ]}
              >
                <View style={styles.cellCopy}>
                  <Text
                    style={[
                      styles.cellText,
                      value === option.value ? styles.cellTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.hint ? (
                    <Text
                      style={[
                        styles.cellHint,
                        value === option.value ? styles.cellHintActive : null,
                      ]}
                    >
                      {option.hint}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
            {customActionLabel && onCustomPress ? (
              <Pressable
                onPress={onCustomPress}
                style={({ pressed }) => [
                  styles.cell,
                  styles.customCell,
                  pressed ? styles.cellPressed : null,
                ]}
              >
                <View style={styles.cellCopy}>
                  <Text style={styles.customText}>{customActionLabel}</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 32, 43, 0.24)",
  },
  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFCF8",
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#EED8CE",
  },
  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#DDC8BE",
    marginBottom: 14,
  },
  header: {
    paddingHorizontal: 16,
  },
  title: {
    color: "#1E2A3A",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  scroll: {
    maxHeight: 420,
    marginTop: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    width: "31%",
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EED8CE",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
  },
  cellActive: {
    borderColor: "#F56F68",
    backgroundColor: "#F56F68",
  },
  cellPressed: {
    opacity: 0.84,
  },
  cellCopy: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 46,
  },
  cellText: {
    color: "#1E2A3A",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  cellTextActive: {
    color: "#FFFFFF",
  },
  cellHint: {
    color: "#8A97A8",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  cellHintActive: {
    color: "rgba(255,255,255,0.82)",
  },
  customCell: {
    backgroundColor: "#FFFFFF",
    borderStyle: "dashed",
  },
  customText: {
    color: "#F56F68",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
