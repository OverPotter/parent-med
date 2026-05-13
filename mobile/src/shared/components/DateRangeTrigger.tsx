import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { journalTypography } from "../theme/journalTypography";

type DateRangeTriggerProps = {
  label: string;
  value?: string | null;
  active?: boolean;
  onPress: () => void;
};

export function DateRangeTrigger({
  label,
  value,
  active = false,
  onPress,
}: DateRangeTriggerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active ? styles.buttonActive : null,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      <Feather name="calendar" size={16} color={active ? "#F76961" : "#7E8B97"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F1D9CF",
    backgroundColor: "#FFFDFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  buttonActive: {
    borderColor: "#F6B1A0",
    backgroundColor: "#FFF4EF",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  copy: {
    flex: 1,
  },
  label: {
    color: "#415267",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: journalTypography.body,
  },
  value: {
    color: "#7B8794",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    fontFamily: journalTypography.body,
    marginTop: 2,
  },
});
