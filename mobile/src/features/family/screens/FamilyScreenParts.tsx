import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";
import { Image, Pressable, Text, View } from "react-native";
import { mobileTabAssets } from "../../../shared/assets/mobileTabAssets";
import type {
  FamilyCabinetAccess,
  FamilyChildrenAccess,
  FamilyPillboxAccess,
  FamilyUiMember,
  FamilyScreenContent,
} from "../model/familyScreen";
import { styles } from "./familyScreenStyles";

export type MemberBadge = {
  text: string;
  background: string;
  color: string;
};

export type FamilyPalette = {
  cardBg: string;
  cardBgSoft: string;
  cardBorder: string;
  cardBorderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryCoral: string;
  primaryCoralLight: string;
  peachIconBg: string;
  peachIcon: string;
  greenBg: string;
  greenText: string;
  greenIcon: string;
  purpleBg: string;
  purpleText: string;
  purpleIcon: string;
  blueBg: string;
  blueText: string;
  blueIcon: string;
  goldBg: string;
  goldText: string;
  goldIcon: string;
  divider: string;
  dangerBg: string;
  dangerText: string;
};

export type RoleTone = {
  background: string;
  border: string;
  color: string;
  icon: string;
  iconName: "crown-outline" | "shield-account-outline" | "account-group-outline";
};

export type StatTone =
  | {
      bg: string;
      color: string;
      icon: "account-group-outline";
      useAsset: false;
    }
  | {
      bg: string;
      color: string;
      icon: ImageSourcePropType;
      useAsset: true;
    };

export const palette: FamilyPalette = {
  cardBg: "#FFFCF8",
  cardBgSoft: "#FFF8F3",
  cardBorder: "#EED8CE",
  cardBorderLight: "#F3E3DB",
  textPrimary: "#1E2A3A",
  textSecondary: "#667386",
  textMuted: "#9AA3AF",
  primaryCoral: "#F56F68",
  primaryCoralLight: "#FFE4DD",
  peachIconBg: "#FFF1E9",
  peachIcon: "#F56F68",
  greenBg: "#EAF8EF",
  greenText: "#3A8F62",
  greenIcon: "#57B97C",
  purpleBg: "#F2ECFF",
  purpleText: "#7C5CE6",
  purpleIcon: "#8B5CF6",
  blueBg: "#EAF4FF",
  blueText: "#4F7EDB",
  blueIcon: "#5B8DEF",
  goldBg: "#FFF4D8",
  goldText: "#9A6A18",
  goldIcon: "#D99A24",
  divider: "#F0DDD4",
  dangerBg: "#FCE6E4",
  dangerText: "#C95D51",
};

export function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getRoleLabel(
  content: FamilyScreenContent,
  role: FamilyUiMember["role"],
) {
  if (role === "owner") {
    return content.ownerRoleLabel;
  }

  if (role === "admin") {
    return content.adminRoleLabel;
  }

  return content.memberRoleLabel;
}

export function getRoleBadgeTone(role: FamilyUiMember["role"]): RoleTone {
  if (role === "owner") {
    return {
      background: palette.goldBg,
      border: "#EAC77D",
      color: palette.goldText,
      icon: palette.goldIcon,
      iconName: "crown-outline",
    };
  }

  if (role === "admin") {
    return {
      background: palette.blueBg,
      border: "#D7E6FF",
      color: palette.blueText,
      icon: palette.blueIcon,
      iconName: "shield-account-outline",
    };
  }

  return {
    background: palette.greenBg,
    border: "#D8EFE1",
    color: palette.greenText,
    icon: palette.greenIcon,
    iconName: "account-group-outline",
  };
}

export function getStatTone(
  key: "adults" | "children" | "routines",
): StatTone {
  if (key === "adults") {
    return {
      bg: palette.primaryCoralLight,
      color: palette.peachIcon,
      icon: "account-group-outline",
      useAsset: false,
    };
  }

  if (key === "children") {
    return {
      bg: palette.greenBg,
      color: palette.greenIcon,
      icon: mobileTabAssets.children,
      useAsset: true,
    };
  }

  return {
    bg: palette.purpleBg,
    color: palette.purpleIcon,
    icon: mobileTabAssets.pillbox,
    useAsset: true,
  };
}

export function getMemberPresentation(
  member: FamilyUiMember,
  content: FamilyScreenContent,
) {
  if (member.isCurrentUser) {
    return {
      avatarBackground: palette.peachIconBg,
      avatarColor: palette.peachIcon,
      badges: [
        {
          text: content.currentYouLabel,
          background: palette.primaryCoralLight,
          color: palette.primaryCoral,
        },
        {
          text: getRoleLabel(content, member.role),
          background:
            member.role === "owner"
              ? palette.goldBg
              : member.role === "admin"
                ? palette.blueBg
                : palette.greenBg,
          color:
            member.role === "owner"
              ? palette.goldText
              : member.role === "admin"
                ? palette.blueText
                : palette.greenText,
        },
      ] satisfies MemberBadge[],
    };
  }

  if (member.role === "admin") {
    return {
      avatarBackground: palette.blueBg,
      avatarColor: palette.blueIcon,
      badges: [
        {
          text: getRoleLabel(content, member.role),
          background: palette.blueBg,
          color: palette.blueText,
        },
      ] satisfies MemberBadge[],
    };
  }

  if (member.name === "Нина" || member.name === "Nina") {
    return {
      avatarBackground: palette.purpleBg,
      avatarColor: palette.purpleIcon,
      badges: [
        {
          text: getRoleLabel(content, member.role),
          background: palette.greenBg,
          color: palette.greenText,
        },
      ] satisfies MemberBadge[],
    };
  }

  return {
    avatarBackground: palette.greenBg,
    avatarColor: palette.greenIcon,
    badges: [
      {
        text: getRoleLabel(content, member.role),
        background: palette.greenBg,
        color: palette.greenText,
      },
    ] satisfies MemberBadge[],
  };
}

export function toneStyle(tone: "danger" | "warning" | "success" | "info") {
  if (tone === "danger") {
    return {
      backgroundColor: "#FCE4E1",
      borderColor: "#F1C3BE",
      color: palette.dangerText,
    };
  }

  if (tone === "success") {
    return {
      backgroundColor: "#E4F6EA",
      borderColor: "#BFE4CC",
      color: palette.greenText,
    };
  }

  if (tone === "info") {
    return {
      backgroundColor: "#E6F0FF",
      borderColor: "#C8DBFF",
      color: palette.blueText,
    };
  }

  return {
    backgroundColor: "#FFF1D1",
    borderColor: "#F0D391",
    color: palette.goldText,
  };
}

export function childrenAccessOptionLabel(
  locale: string,
  value: FamilyChildrenAccess,
) {
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    case "act":
      return isRu ? "Может отмечать уход" : "Can log care";
    default:
      return isRu ? "Полный доступ" : "Full access";
  }
}

export function cabinetAccessOptionLabel(
  locale: string,
  value: FamilyCabinetAccess,
) {
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    default:
      return isRu ? "Полный доступ" : "Full access";
  }
}

export function pillboxAccessOptionLabel(
  locale: string,
  value: FamilyPillboxAccess,
) {
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    case "act":
      return isRu ? "Может отмечать приём" : "Can mark doses";
    default:
      return isRu ? "Полный доступ" : "Full access";
  }
}

export function FamilyTitleIcon() {
  return (
    <View style={styles.titleIconAssetWrap}>
      <Image
        source={require("../assets/family-title-house-icon.png")}
        style={styles.titleIconAsset}
        resizeMode="contain"
      />
    </View>
  );
}

export function MemberRow({
  member,
  content,
  isLast,
  onPressAction,
}: {
  member: FamilyUiMember;
  content: FamilyScreenContent;
  isLast: boolean;
  onPressAction: () => void;
}) {
  const presentation = getMemberPresentation(member, content);

  return (
    <View>
      <Pressable
        hitSlop={4}
        pressRetentionOffset={12}
        onPress={onPressAction}
        style={({ pressed }) => [
          styles.memberRow,
          pressed ? styles.actionButtonPressed : null,
        ]}
      >
        <View
          style={[
            styles.memberAvatar,
            { backgroundColor: presentation.avatarBackground },
          ]}
        >
          <Text
            style={[
              styles.memberAvatarText,
              { color: presentation.avatarColor },
            ]}
          >
            {buildInitials(member.name)}
          </Text>
        </View>

        <View style={styles.memberContent}>
          <View style={styles.memberHeader}>
            <View style={styles.memberNameRow}>
              <Text style={[styles.memberName, { color: palette.textPrimary }]}>
                {member.name}
              </Text>
              {presentation.badges.map((badge) => (
                <View
                  key={`${member.id}-${badge.text}`}
                  style={[
                    styles.smallBadge,
                    {
                      backgroundColor: badge.background,
                      borderColor: "#E9D6CD",
                    },
                  ]}
                >
                  <Text style={[styles.smallBadgeText, { color: badge.color }]}>
                    {badge.text}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.memberRole, { color: palette.textSecondary }]}>
              {member.relationship}
            </Text>
          </View>

          {member.phone ? (
            <Text style={[styles.memberPhone, { color: palette.textSecondary }]}>
              {member.phone}
            </Text>
          ) : null}

          <Text
            style={[styles.memberDescription, { color: palette.textSecondary }]}
          >
            {member.isCurrentUser ? content.currentUserNote : member.note}
          </Text>
        </View>

        <Pressable
          hitSlop={6}
          onPress={onPressAction}
          style={({ pressed }) => [
            styles.memberEditButton,
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <Feather name="edit-2" size={15} color="#8A6F63" />
        </Pressable>
      </Pressable>

      {!isLast ? (
        <View style={[styles.rowDivider, { backgroundColor: palette.divider }]} />
      ) : null}
    </View>
  );
}
