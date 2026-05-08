import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { BottomTab } from "../model/childrenRedesign";
import { styles } from "../screens/childrenRedesignStyles";

const noop = () => {};

type ChildrenBottomTabBarProps = {
  tabs: BottomTab[];
};

export function ChildrenBottomTabBar({ tabs }: ChildrenBottomTabBarProps) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <Pressable
            onPress={noop}
            key={tab.nodeId}
            style={({ pressed }) => [
              styles.tabItem,
              tab.active ? styles.tabItemActive : null,
              pressed ? styles.tabItemPressed : null,
            ]}
          >
            <View style={styles.tabIconWrap}>
              <TabIcon label={tab.label} active={tab.active} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                tab.active ? styles.tabLabelActive : null,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const color = active ? "#F26F6C" : "#7A746F";
  const size = 20;

  if (label === "Дети") {
    return (
      <MaterialCommunityIcons
        name="baby-face-outline"
        size={size}
        color={color}
      />
    );
  }

  if (label === "Таблетница") {
    return <MaterialCommunityIcons name="pill" size={size} color={color} />;
  }

  if (label === "Аптечка") {
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
