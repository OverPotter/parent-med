import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MobileBottomTabKey =
  | "children"
  | "analytics"
  | "cabinet"
  | "more"
  | "pillbox";

export type MobileBottomTabItem = {
  key: MobileBottomTabKey;
  label: string;
  active: boolean;
};

type MobileBottomTabBarProps = {
  items: MobileBottomTabItem[];
  onSelectTab?: (key: MobileBottomTabKey) => void;
};

const noop = () => {};

export function MobileBottomTabBar({
  items,
  onSelectTab = noop,
}: MobileBottomTabBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onSelectTab(item.key)}
            style={({ pressed }) => [
              styles.item,
              item.active ? styles.itemActive : null,
              pressed ? styles.itemPressed : null,
            ]}
          >
            <View style={styles.iconWrap}>
              <TabIcon tab={item.key} active={item.active} />
            </View>
            <Text
              style={[styles.label, item.active ? styles.labelActive : null]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TabIcon({
  tab,
  active,
}: {
  tab: MobileBottomTabKey;
  active: boolean;
}) {
  const color = active ? "#F47667" : "#5F7388";
  const size = 22;

  if (tab === "children") {
    return (
      <MaterialCommunityIcons
        name="baby-face-outline"
        size={size}
        color={color}
      />
    );
  }

  if (tab === "analytics") {
    return <Ionicons name="bar-chart-outline" size={size} color={color} />;
  }

  if (tab === "pillbox") {
    return <MaterialCommunityIcons name="pill" size={size} color={color} />;
  }

  if (tab === "cabinet") {
    return (
      <MaterialCommunityIcons
        name="briefcase-outline"
        size={size}
        color={color}
      />
    );
  }

  return <Ionicons name="menu" size={size} color={color} />;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#EBCFC4",
    backgroundColor: "#FFFDF9",
    padding: 8,
    gap: 8,
  },
  item: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  itemActive: {
    backgroundColor: "#FBE7E0",
  },
  itemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#5F7388",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
  labelActive: {
    color: "#F47667",
  },
});
