import { Pressable, StyleSheet, Text, View } from "react-native";

export type SegmentedPillTabItem = {
  id: string;
  label: string;
};

type SegmentedPillTabsProps = {
  items: SegmentedPillTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  activeBackgroundColor: string;
  activeTextColor: string;
};

export function SegmentedPillTabs({
  items,
  activeId,
  onSelect,
  activeBackgroundColor,
  activeTextColor,
}: SegmentedPillTabsProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              styles.button,
              isActive ? { backgroundColor: activeBackgroundColor } : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                isActive
                  ? { color: activeTextColor, fontWeight: "700" }
                  : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#F1D9CF",
    backgroundColor: "#FFFDFC",
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: "#55677B",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
