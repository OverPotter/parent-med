import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mobileTabAssets } from "../assets/mobileTabAssets";
import type {
  MobileBottomTabItem,
  MobileBottomTabKey,
} from "./mobileBottomTabModel";

type MobileBottomTabBarProps = {
  items: MobileBottomTabItem[];
  onSelectTab?: (key: MobileBottomTabKey) => void;
};

const noop = () => {};
const tabIconSize = 38;
const tabBarHorizontalPadding = 8;
const tabBarItemGap = 4;

export function MobileBottomTabBar({
  items,
  onSelectTab = noop,
}: MobileBottomTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const shouldScroll = items.length > 4;
  const scrollItemWidth =
    shouldScroll && barWidth > 0
      ? Math.floor(
          (barWidth - tabBarHorizontalPadding * 2 - tabBarItemGap * 3) / 4,
        )
      : undefined;

  const handleBarLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  const renderedItems = items.map((item, index) => (
    <Pressable
      key={item.key}
      onPress={() => onSelectTab(item.key)}
      style={({ pressed }) => [
        styles.item,
        shouldScroll ? styles.itemScrollable : null,
        shouldScroll && scrollItemWidth ? { width: scrollItemWidth } : null,
        shouldScroll && index < items.length - 1
          ? styles.itemScrollableSpacing
          : null,
        item.active ? styles.itemActive : null,
        pressed ? styles.itemPressed : null,
      ]}
    >
      <View
        style={styles.iconWrap}
      >
        <TabIcon tab={item.key} active={item.active} />
      </View>
      <Text
        style={[
          styles.label,
          shouldScroll ? styles.labelScrollable : null,
          item.key === "more" ? styles.labelMore : null,
          item.active ? styles.labelActive : null,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  ));

  return (
    <View style={styles.wrap}>
      <View style={styles.bar} onLayout={handleBarLayout}>
        {shouldScroll ? (
          <ScrollView
            horizontal
            style={styles.barScroll}
            showsHorizontalScrollIndicator={false}
          >
            {renderedItems}
          </ScrollView>
        ) : (
          renderedItems
        )}
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
  const imageSource = mobileTabAssets[tab];

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

  if (tab === "journal") {
    return (
      <MaterialCommunityIcons
        name="book-open-page-variant-outline"
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
      <MaterialCommunityIcons name="pill" size={tabIconSize} color={color} />
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
    zIndex: 80,
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
    paddingHorizontal: tabBarHorizontalPadding,
    paddingVertical: 8,
    gap: tabBarItemGap,
    shadowColor: "#CFAE9F",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  barScroll: {
    width: "100%",
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
  itemScrollable: {
    flex: 0,
  },
  itemScrollableSpacing: {
    marginRight: tabBarItemGap,
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
  labelScrollable: {
    fontSize: 11,
    lineHeight: 13,
  },
  labelMore: {
    color: "#8B938D",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
  },
  labelActive: {
    color: "#F47667",
  },
});
