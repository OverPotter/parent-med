import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type NotificationDisabledBannerProps = {
  title?: string;
  body?: string;
  actionLabel?: string;
  onPress: () => void;
  palette: {
    borderColor: string;
    backgroundColor: string;
    iconBackgroundColor: string;
    titleColor: string;
    bodyColor: string;
    actionColor: string;
    shadowColor: string;
    chevronColor: string;
  };
  typography?: {
    titleFontFamily?: string;
    bodyFontFamily?: string;
    actionFontFamily?: string;
  };
  marginTop?: number;
};

export function NotificationDisabledBanner({
  title,
  body,
  actionLabel,
  onPress,
  palette,
  typography,
  marginTop = 0,
}: NotificationDisabledBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        {
          marginTop,
          borderColor: palette.borderColor,
          backgroundColor: palette.backgroundColor,
          shadowColor: palette.shadowColor,
        },
        pressed ? styles.rootPressed : null,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: palette.iconBackgroundColor },
        ]}
      >
        <Ionicons name="notifications-off-outline" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.bodyWrap}>
        <Text
          style={[
            styles.title,
            typography?.titleFontFamily ? { fontFamily: typography.titleFontFamily } : null,
            { color: palette.titleColor },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.body,
            typography?.bodyFontFamily ? { fontFamily: typography.bodyFontFamily } : null,
            { color: palette.bodyColor },
          ]}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
      <View style={styles.actionWrap}>
        <Text
          style={[
            styles.action,
            typography?.actionFontFamily
              ? { fontFamily: typography.actionFontFamily }
              : null,
            { color: palette.actionColor },
          ]}
        >
          {actionLabel}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={palette.chevronColor}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  rootPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bodyWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
  },
  body: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
  },
  actionWrap: {
    alignItems: "center",
    gap: 1,
    flexShrink: 0,
  },
  action: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
  },
});
