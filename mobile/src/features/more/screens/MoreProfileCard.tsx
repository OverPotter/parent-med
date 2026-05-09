import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MoreScreenContent } from "../model/moreScreen";
import { styles } from "./moreScreenStyles";

function buildInitials(displayName: string, email: string | null) {
  const source = displayName.trim() || email?.trim() || "P";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileEditRow({
  label,
  value,
  placeholder,
  iconName,
  iconColor,
  leadStyle,
  onChangeText,
  onCommit,
  ...inputProps
}: {
  label: string;
  value: string;
  placeholder: string;
  iconName: string;
  iconColor: string;
  leadStyle: object;
  onChangeText: (value: string) => void;
  onCommit: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?: "default" | "phone-pad";
  returnKeyType?: "done";
}) {
  return (
    <View style={styles.profileEditRow}>
      <View style={[styles.profileEditLead, leadStyle]}>
        <Feather name={iconName as never} size={18} color={iconColor} />
      </View>
      <Text style={styles.profileEditLabel}>{label}</Text>
      <View style={styles.profileEditValueWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onCommit}
          onSubmitEditing={onCommit}
          style={styles.profileEditInput}
          placeholder={placeholder}
          placeholderTextColor="#98A2AD"
          {...inputProps}
        />
        <View style={styles.profileEditAccessory}>
          <MaterialCommunityIcons
            name={"pencil-outline" as never}
            size={15}
            color="#E0846D"
          />
        </View>
      </View>
    </View>
  );
}

export function MoreProfileCard({
  session,
  content,
  onUpdateSession,
}: {
  session: MobileAuthSession;
  content: MoreScreenContent;
  onUpdateSession: (patch: {
    familyName?: string;
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => void | Promise<void>;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const isFamilyOwner =
    session.family.ownerAccountId != null &&
    session.family.ownerAccountId === session.account.id;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [draftFamilyName, setDraftFamilyName] = useState(session.family.name);
  const [draftDisplayName, setDraftDisplayName] = useState(
    session.account.displayName,
  );
  const [draftRelationshipLabel, setDraftRelationshipLabel] = useState(
    session.account.relationshipLabel ?? "",
  );
  const [draftPhone, setDraftPhone] = useState(session.account.phone ?? "");
  const initials = useMemo(
    () => buildInitials(session.account.displayName, session.account.email),
    [session.account.displayName, session.account.email],
  );

  useEffect(() => {
    setDraftFamilyName(session.family.name);
    setDraftDisplayName(session.account.displayName);
    setDraftRelationshipLabel(session.account.relationshipLabel ?? "");
    setDraftPhone(session.account.phone ?? "");
  }, [
    session.family.name,
    session.account.displayName,
    session.account.relationshipLabel,
    session.account.phone,
  ]);

  const handleSaveField = async (
    key: "familyName" | "displayName" | "relationshipLabel" | "phone",
  ) => {
    if (key === "familyName") {
      const nextFamilyName = draftFamilyName.trim();
      if (!isFamilyOwner || !nextFamilyName || nextFamilyName === session.family.name) {
        setDraftFamilyName(session.family.name);
        return;
      }

      await onUpdateSession({ familyName: nextFamilyName });
      return;
    }

    if (key === "displayName") {
      const nextDisplayName = draftDisplayName.trim() || session.account.displayName;
      if (nextDisplayName === session.account.displayName) {
        setDraftDisplayName(session.account.displayName);
        return;
      }

      await onUpdateSession({ displayName: nextDisplayName });
      return;
    }

    if (key === "relationshipLabel") {
      const nextRelationshipLabel = draftRelationshipLabel.trim() || null;
      if (nextRelationshipLabel === session.account.relationshipLabel) {
        setDraftRelationshipLabel(session.account.relationshipLabel ?? "");
        return;
      }

      await onUpdateSession({ relationshipLabel: nextRelationshipLabel });
      return;
    }

    const nextPhone = draftPhone.trim() || null;
    if (nextPhone === session.account.phone) {
      setDraftPhone(session.account.phone ?? "");
      return;
    }

    await onUpdateSession({ phone: nextPhone });
  };

  return (
    <View
      style={[
        styles.profileCard,
        {
          backgroundColor: surfaceTheme.cardBackgroundColor,
          borderColor: surfaceTheme.cardBorderColor,
        },
        isCollapsed ? styles.profileCardCollapsed : null,
      ]}
    >
      <Pressable
        onPress={() => setIsCollapsed((current) => !current)}
        style={({ pressed }) => [
          styles.accountTop,
          pressed ? styles.accountTopPressed : null,
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName}>{session.account.displayName || "—"}</Text>
          {session.account.relationshipLabel ? (
            <Text style={styles.accountRole}>{session.account.relationshipLabel}</Text>
          ) : null}
          <View style={styles.accountMetaRow}>
            <Text style={styles.accountFamily}>{content.accountDescription}</Text>
            <View style={styles.accountRolePill}>
              <Text style={styles.accountRolePillText}>{content.familyRoleLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.collapseChevron}>
          <Feather
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            size={16}
            color="#E0846D"
          />
        </View>
      </Pressable>

      {!isCollapsed ? (
        <View style={styles.profileDetails}>
          {isFamilyOwner ? (
            <>
              <ProfileEditRow
                label={content.familyNameLabel}
                value={draftFamilyName}
                placeholder={content.familyNameLabel}
                iconName="home"
                iconColor="#5FA77A"
                leadStyle={styles.profileEditLeadFamily}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onChangeText={setDraftFamilyName}
                onCommit={() => {
                  void handleSaveField("familyName");
                }}
              />
              <View style={styles.profileEditDivider} />
            </>
          ) : null}
          <ProfileEditRow
            label={content.displayNameLabel}
            value={draftDisplayName}
            placeholder={content.displayNameLabel}
            iconName="user"
            iconColor="#F47667"
            leadStyle={styles.profileEditLeadName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onChangeText={setDraftDisplayName}
            onCommit={() => {
              void handleSaveField("displayName");
            }}
          />
          <View style={styles.profileEditDivider} />
          <ProfileEditRow
            label={content.relationshipLabel}
            value={draftRelationshipLabel}
            placeholder={content.noRelationshipValue}
            iconName="heart"
            iconColor="#D68A3D"
            leadStyle={styles.profileEditLeadRelationship}
            autoCapitalize="sentences"
            autoCorrect={false}
            returnKeyType="done"
            onChangeText={setDraftRelationshipLabel}
            onCommit={() => {
              void handleSaveField("relationshipLabel");
            }}
          />
          <View style={styles.profileEditDivider} />
          <ProfileEditRow
            label={content.phoneLabel}
            value={draftPhone}
            placeholder={content.noPhoneValue}
            iconName="phone"
            iconColor="#6D8FE8"
            leadStyle={styles.profileEditLeadPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
            onChangeText={setDraftPhone}
            onCommit={() => {
              void handleSaveField("phone");
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
