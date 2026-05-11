import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type MobileBottomTabKey =
  | "children"
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
const tabIconSize = 38;

const tabImageSourceByKey: Partial<
  Record<MobileBottomTabKey, ImageSourcePropType>
> = {
  children: require("../assets/bottom-tabs/parent_child_transparent.png"),
  pillbox: require("../assets/bottom-tabs/pillpath_icon_transparent.png"),
  cabinet: require("../assets/bottom-tabs/medical_bag_icon_transparent_FIXED.png"),
  more: require("../assets/bottom-tabs/chat_bubble_icon_transparent.png"),
};

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
  const color = active ? "#F47667" : "#6C7C90";
  const imageSource = tabImageSourceByKey[tab];

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={[
          styles.iconImage,
          active ? styles.iconImageActive : styles.iconImageInactive,
        ]}
        resizeMode="contain"
      />
    );
  }

  if (tab === "children") {
    return (
      <MaterialCommunityIcons
        name="baby-face-outline"
        size={tabIconSize}
        color={color}
      />
    );
  }

  if (tab === "more") {
    return (
      <MaterialCommunityIcons
        name="dots-horizontal"
        size={tabIconSize}
        color={color}
      />
    );
  }

  if (tab === "pillbox") {
    return (
      <MaterialCommunityIcons
        name="pill"
        size={tabIconSize}
        color={color}
      />
    );
  }

  if (tab === "cabinet") {
    return (
      <MaterialCommunityIcons
        name="medical-bag"
        size={tabIconSize}
        color={color}
      />
    );
  }

  return (
    <MaterialCommunityIcons
      name="help-circle-outline"
      size={tabIconSize}
      color={color}
    />
  );
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
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8D8CF",
    backgroundColor: "#FFF9F4",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowColor: "#CFAE9F",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  itemActive: {
    backgroundColor: "#FCEBE4",
  },
  itemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.975 }],
  },
  iconWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: tabIconSize,
    height: tabIconSize,
  },
  iconImageActive: {
    opacity: 1,
  },
  iconImageInactive: {
    opacity: 0.72,
  },
  label: {
    color: "#6C7C90",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
  },
  labelActive: {
    color: "#F47667",
  },
});
