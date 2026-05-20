import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  extraItem?: {
    label: string;
    active?: boolean;
    onPress: () => void;
  } | null;
};

export function SegmentedPillTabs({
  items,
  activeId,
  onSelect,
  activeBackgroundColor,
  activeTextColor,
  extraItem = null,
}: SegmentedPillTabsProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
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
        {extraItem ? (
          <Pressable
            onPress={extraItem.onPress}
            style={({ pressed }) => [
              styles.button,
              extraItem.active ? styles.extraButtonActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                extraItem.active ? styles.extraButtonLabelActive : null,
              ]}
            >
              {extraItem.label}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F1D9CF",
    backgroundColor: "#FFFDFC",
    overflow: "hidden",
    paddingRight: 6,
  },
  container: {
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    minHeight: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    flexShrink: 0,
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
  extraButtonActive: {
    backgroundColor: "#FFF1EB",
  },
  extraButtonLabelActive: {
    color: "#F76961",
    fontWeight: "700",
  },
});
