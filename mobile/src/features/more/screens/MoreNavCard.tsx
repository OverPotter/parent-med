import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MoreScreenContent } from "../model/moreScreen";
import { styles } from "./moreScreenStyles";

type MoreNavKey = MoreScreenContent["navItems"][number]["key"];

function getNavItemIcon(key: MoreNavKey) {
  if (key === "family") {
    return {
      icon: "account-group-outline" as const,
      wrapStyle: styles.navItemLeadFamily,
      color: "#F18169",
    };
  }

  if (key === "settings") {
    return {
      icon: "cog-outline" as const,
      wrapStyle: styles.navItemLeadSettings,
      color: "#6D8FE8",
    };
  }

  if (key === "support") {
    return {
      icon: "lifebuoy" as const,
      wrapStyle: styles.navItemLeadSupport,
      color: "#5FA77A",
    };
  }

  if (key === "terms") {
    return {
      icon: "file-document-outline" as const,
      wrapStyle: styles.navItemLeadTerms,
      color: "#D68A3D",
    };
  }

  return {
    icon: "shield-lock-outline" as const,
    wrapStyle: styles.navItemLeadPrivacy,
    color: "#9C6DD8",
  };
}

export function MoreNavCard({
  items,
  onOpenFamily,
  onOpenSettings,
  onOpenSupport,
  onOpenTerms,
  onOpenPrivacy,
}: {
  items: MoreScreenContent["navItems"];
  onOpenFamily: () => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <View
      style={[
        styles.navCard,
        {
          backgroundColor: surfaceTheme.cardBackgroundColor,
          borderColor: surfaceTheme.cardBorderColor,
        },
      ]}
    >
      {items.map((item) => {
        const icon = getNavItemIcon(item.key);
        const handlePress =
          item.key === "family"
            ? onOpenFamily
            : item.key === "settings"
              ? onOpenSettings
              : item.key === "support"
                ? onOpenSupport
                : item.key === "terms"
                  ? onOpenTerms
                  : onOpenPrivacy;

        return (
          <Pressable
            key={item.key}
            onPress={handlePress}
            style={({ pressed }) => [
              styles.navItem,
              pressed ? styles.navItemPressed : null,
            ]}
          >
            <View style={[styles.navItemLead, icon.wrapStyle]}>
              <MaterialCommunityIcons name={icon.icon} size={20} color={icon.color} />
            </View>
            <View style={styles.navItemCopy}>
              <Text style={styles.navItemTitle}>{item.title}</Text>
              <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons
              name={"chevron-right" as never}
              size={22}
              color="#A38F87"
            />
          </Pressable>
        );
      })}
    </View>
  );
}
