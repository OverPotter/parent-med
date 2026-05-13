import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import type {
  FamilyCabinetAccess,
  FamilyChildrenAccess,
  FamilyPillboxAccess,
  FamilyUiAccessPolicy,
  FamilyScreenContent,
} from "../model/familyScreen";
import { buildInitials, type FamilyPalette } from "./FamilyScreenParts";
import { styles } from "./familyScreenStyles";

export type ChildChoice = {
  id: string;
  name: string;
};

export type FamilyProfileEditDraft = {
  memberId: string;
  name: string;
  relationship: string;
  phone: string;
};

function getFamilySheetOptionIcon(
  section: "childrenAccess" | "childrenScope" | "pillbox" | "cabinet",
  value: string,
) {
  if (section === "childrenAccess") {
    if (value === "none") {
      return "eye-off-outline";
    }
    if (value === "view") {
      return "eye-outline";
    }
    if (value === "act") {
      return "gesture-tap";
    }
    return "shield-check-outline";
  }

  if (section === "childrenScope") {
    return value === "all" ? "account-group-outline" : "account-multiple-outline";
  }

  if (section === "pillbox") {
    if (value === "none") {
      return "pill-off";
    }
    if (value === "view") {
      return "pill";
    }
    if (value === "act") {
      return "check-circle-outline";
    }
    return "pill-multiple";
  }

  if (value === "none") {
    return "medical-bag-off";
  }

  return "medical-bag";
}

export function FamilyProfileEditFields({
  content,
  draft,
  onChangeDraft,
  palette,
}: {
  content: FamilyScreenContent;
  draft: FamilyProfileEditDraft;
  onChangeDraft: (draft: FamilyProfileEditDraft) => void;
  palette: FamilyPalette;
}) {
  return (
    <View
      style={[
        styles.surfaceCard,
        {
          backgroundColor: "rgba(255,253,249,0.93)",
          borderColor: palette.cardBorder,
        },
      ]}
    >
      <View style={styles.profileEditField}>
        <Text style={[styles.factLabel, { color: palette.textMuted }]}>
          {content.displayNameLabel}
        </Text>
        <View style={styles.profileEditFieldRow}>
          <TextInput
            value={draft.name}
            onChangeText={(name) => onChangeDraft({ ...draft, name })}
            style={[
              styles.profileEditInput,
              styles.profileEditInputFlex,
              { color: palette.textPrimary },
            ]}
            placeholder={content.displayNameLabel}
            placeholderTextColor="#98A2AD"
          />
          <View
            style={[
              styles.profileEditAccentIcon,
              styles.profileEditAccentIconRose,
            ]}
          >
            <Feather name="edit-3" size={15} color="#F18169" />
          </View>
        </View>
      </View>

      <View style={[styles.factDivider, { backgroundColor: palette.divider }]} />

      <View style={styles.profileEditField}>
        <Text style={[styles.factLabel, { color: palette.textMuted }]}>
          {content.phoneLabel}
        </Text>
        <View style={styles.profileEditFieldRow}>
          <TextInput
            value={draft.phone}
            onChangeText={(phone) => onChangeDraft({ ...draft, phone })}
            style={[
              styles.profileEditInput,
              styles.profileEditInputFlex,
              { color: palette.textPrimary },
            ]}
            placeholder={content.phoneLabel}
            placeholderTextColor="#98A2AD"
            keyboardType="phone-pad"
          />
          <View
            style={[
              styles.profileEditAccentIcon,
              styles.profileEditAccentIconBlue,
            ]}
          >
            <Feather name="edit-3" size={15} color="#6D8FE8" />
          </View>
        </View>
      </View>

      <View style={[styles.factDivider, { backgroundColor: palette.divider }]} />

      <View style={styles.profileEditField}>
        <Text style={[styles.factLabel, { color: palette.textMuted }]}>
          {content.relationshipLabel}
        </Text>
        <View style={styles.profileEditFieldRow}>
          <TextInput
            value={draft.relationship}
            onChangeText={(relationship) =>
              onChangeDraft({ ...draft, relationship })
            }
            style={[
              styles.profileEditInput,
              styles.profileEditInputFlex,
              { color: palette.textPrimary },
            ]}
            placeholder={content.relationshipLabel}
            placeholderTextColor="#98A2AD"
          />
          <View
            style={[
              styles.profileEditAccentIcon,
              styles.profileEditAccentIconGold,
            ]}
          >
            <Feather name="edit-3" size={15} color="#D68A3D" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function FamilyAccessTargetHeader({
  content,
  localeIsRu,
  memberName,
  memberRelationship,
  palette,
}: {
  content: FamilyScreenContent;
  localeIsRu: boolean;
  memberName: string;
  memberRelationship: string;
  palette: FamilyPalette;
}) {
  return (
    <View style={styles.introBlock}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>
        {content.accessSettingsTitle}
      </Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        {localeIsRu
          ? "Выберите, что этот участник видит и может делать."
          : "Choose what this member can see and do."}
      </Text>
      <View
        style={[
          styles.accessTargetCard,
          {
            backgroundColor: "rgba(255,253,249,0.92)",
            borderColor: palette.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.accessTargetAvatar,
            {
              backgroundColor: palette.peachIconBg,
            },
          ]}
        >
          <Text
            style={[styles.accessTargetAvatarText, { color: palette.peachIcon }]}
          >
            {buildInitials(memberName)}
          </Text>
        </View>
        <View style={styles.accessTargetCopy}>
          <Text style={[styles.accessTargetName, { color: palette.textPrimary }]}>
            {memberName}
          </Text>
          <Text
            style={[
              styles.accessTargetRelationship,
              { color: palette.textSecondary },
            ]}
          >
            {memberRelationship}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function FamilyAccessCardBody({
  cabinetAccessLabels,
  children,
  childrenAccessLabels,
  content,
  inline,
  localeIsRu,
  onChangePolicy,
  onOpenSheet,
  onSave,
  palette,
  pillboxAccessLabels,
  policy,
}: {
  cabinetAccessLabels: Record<FamilyCabinetAccess, string>;
  children: ChildChoice[];
  childrenAccessLabels: Record<FamilyChildrenAccess, string>;
  content: FamilyScreenContent;
  inline: boolean;
  localeIsRu: boolean;
  onChangePolicy: (policy: FamilyUiAccessPolicy) => void;
  onOpenSheet: (
    sheet:
      | "childrenAccess"
      | "childrenScope"
      | "selectedChildren"
      | "pillbox"
      | "cabinet",
  ) => void;
  onSave: () => void;
  palette: FamilyPalette;
  pillboxAccessLabels: Record<FamilyPillboxAccess, string>;
  policy: FamilyUiAccessPolicy;
}) {
  const selectedChildrenNames = children
    .filter((child) => policy.childIds.includes(child.id))
    .map((child) => child.name)
    .join(", ");
  const childrenScopeValue = policy.allChildren
    ? content.allChildrenLabel
    : selectedChildrenNames || content.selectedChildrenLabel;

  return (
    <View
      style={[
        inline ? styles.surfaceCard : styles.accessCard,
        {
          backgroundColor: inline ? "rgba(255,253,249,0.93)" : palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      {inline ? (
        <View style={styles.inlineAccessHeader}>
          <Text style={[styles.inlineAccessTitle, { color: palette.textPrimary }]}>
            {content.accessSettingsTitle}
          </Text>
          <Text
            style={[styles.inlineAccessHint, { color: palette.textSecondary }]}
          >
            {localeIsRu
              ? "Выберите, что участник видит и может делать."
              : "Choose what this member can see and do."}
          </Text>
        </View>
      ) : null}
      <View style={styles.accessPickerList}>
        <AccessPickerRow
          icon={"shield-account-outline"}
          iconColor={palette.blueIcon}
          leadStyle={styles.accessPickerLeadBlue}
          palette={palette}
          title={content.childrenAccessTitle}
          value={childrenAccessLabels[policy.childrenAccess]}
          onPress={() => onOpenSheet("childrenAccess")}
        />
        <View
          style={[
            styles.accessPickerDivider,
            { backgroundColor: palette.divider },
          ]}
        />

        {policy.childrenAccess !== "none" ? (
          <>
            <AccessPickerRow
              icon={"account-group-outline"}
              iconColor={palette.blueIcon}
              leadStyle={styles.accessPickerLeadBlue}
              palette={palette}
              title={content.childrenScopeTitle}
              value={childrenScopeValue}
              onPress={() => onOpenSheet("childrenScope")}
            />
            <View
              style={[
                styles.accessPickerDivider,
                { backgroundColor: palette.divider },
              ]}
            />
          </>
        ) : null}

        {policy.childrenAccess !== "none" && !policy.allChildren ? (
          <>
            <AccessPickerRow
              icon={"account-multiple-check-outline"}
              iconColor={palette.blueIcon}
              leadStyle={styles.accessPickerLeadBlue}
              palette={palette}
              title={content.selectedChildrenLabel}
              value={selectedChildrenNames || content.selectedChildrenLabel}
              onPress={() => onOpenSheet("selectedChildren")}
            />
            <View
              style={[
                styles.accessPickerDivider,
                { backgroundColor: palette.divider },
              ]}
            />
          </>
        ) : null}

        <AccessPickerRow
          icon={"pill"}
          iconColor={palette.purpleIcon}
          leadStyle={styles.accessPickerLeadPurple}
          palette={palette}
          title={content.pillboxAccessTitle}
          value={pillboxAccessLabels[policy.pillboxAccess]}
          onPress={() => onOpenSheet("pillbox")}
        />
        <View
          style={[
            styles.accessPickerDivider,
            { backgroundColor: palette.divider },
          ]}
        />

        <AccessPickerRow
          icon={"medical-bag"}
          iconColor={palette.greenIcon}
          leadStyle={styles.accessPickerLeadMint}
          palette={palette}
          title={content.cabinetAccessTitle}
          value={cabinetAccessLabels[policy.cabinetAccess]}
          onPress={() => onOpenSheet("cabinet")}
        />
      </View>

      {policy.cabinetAccess !== "none" ? (
        <View style={styles.switchRow}>
          <View style={[styles.switchLead, { backgroundColor: palette.greenBg }]}>
            <Feather name="bell" size={16} color={palette.greenIcon} />
          </View>
          <View style={styles.switchCopy}>
            <Text style={[styles.accessSectionTitle, { color: palette.textPrimary }]}>
              {content.cabinetPushTitle}
            </Text>
            <Text style={[styles.switchHint, { color: palette.textSecondary }]}>
              {localeIsRu
                ? "Будут приходить только важные напоминания по аптечке."
                : "Only important cabinet reminders will be sent."}
            </Text>
          </View>
          <Switch
            value={policy.cabinetPushEnabled}
            onValueChange={(value) =>
              onChangePolicy({
                ...policy,
                cabinetPushEnabled: value,
              })
            }
            ios_backgroundColor="#E5E5EA"
            trackColor={{ false: "#E5E5EA", true: "#34C759" }}
            thumbColor="#FFFFFF"
          />
        </View>
      ) : null}

      <Pressable
        onPress={onSave}
        style={({ pressed }) => [
          styles.primaryFooterAction,
          pressed ? styles.actionButtonPressed : null,
        ]}
      >
        <Text style={styles.primaryFooterActionText}>{content.saveAccessLabel}</Text>
      </Pressable>
    </View>
  );
}

export function FamilyAccessOptionsSheet({
  activeSheet,
  cabinetAccessLabels,
  children,
  childrenAccessLabels,
  content,
  onChangePolicy,
  onClose,
  palette,
  pillboxAccessLabels,
  policy,
}: {
  activeSheet:
    | "childrenAccess"
    | "childrenScope"
    | "selectedChildren"
    | "pillbox"
    | "cabinet"
    | null;
  cabinetAccessLabels: Record<FamilyCabinetAccess, string>;
  children: ChildChoice[];
  childrenAccessLabels: Record<FamilyChildrenAccess, string>;
  content: FamilyScreenContent;
  onChangePolicy: (policy: FamilyUiAccessPolicy) => void;
  onClose: () => void;
  palette: FamilyPalette;
  pillboxAccessLabels: Record<FamilyPillboxAccess, string>;
  policy: FamilyUiAccessPolicy;
}) {
  const hasChildScope = policy.allChildren || policy.childIds.length > 0;
  const pillboxChoices: Array<{ value: FamilyPillboxAccess; label: string }> =
    policy.childrenAccess === "edit"
      ? [
          { value: "none", label: pillboxAccessLabels.none },
          { value: "view", label: pillboxAccessLabels.view },
          { value: "act", label: pillboxAccessLabels.act },
          { value: "edit", label: pillboxAccessLabels.edit },
        ]
      : [
          { value: "none", label: pillboxAccessLabels.none },
          { value: "view", label: pillboxAccessLabels.view },
          { value: "act", label: pillboxAccessLabels.act },
        ];

  return (
    <FormBottomSheet
      visible={activeSheet !== null}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.familySheetCard}
    >
      {({ panHandlers, requestClose }) => {
        const closeWith = (callback: () => void) => requestClose(callback);

        return (
          <>
            <View style={styles.sheetDragZone} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {activeSheet === "childrenAccess"
                  ? content.childrenAccessTitle
                  : activeSheet === "childrenScope"
                    ? content.childrenScopeTitle
                    : activeSheet === "selectedChildren"
                      ? content.selectedChildrenLabel
                      : activeSheet === "pillbox"
                        ? content.pillboxAccessTitle
                        : content.cabinetAccessTitle}
              </Text>
            </View>

            <View style={styles.familySheetOptions}>
              {activeSheet === "childrenAccess"
                ? ([
                    { value: "none", label: childrenAccessLabels.none },
                    { value: "view", label: childrenAccessLabels.view },
                    { value: "act", label: childrenAccessLabels.act },
                    { value: "edit", label: childrenAccessLabels.edit },
                  ] as const).map((choice) => (
                    <Pressable
                      key={choice.value}
                      onPress={() =>
                        closeWith(() => {
                          if (choice.value === "none") {
                            onChangePolicy({
                              ...policy,
                              allChildren: false,
                              childIds: [],
                              childrenAccess: choice.value,
                              pillboxAccess:
                                policy.pillboxAccess === "edit"
                                  ? "act"
                                  : policy.pillboxAccess,
                            });
                            return;
                          }

                          onChangePolicy({
                            ...policy,
                            childrenAccess: choice.value,
                            allChildren: hasChildScope ? policy.allChildren : true,
                            childIds:
                              hasChildScope || children.length === 0
                                ? policy.childIds
                                : [children[0].id],
                            pillboxAccess:
                              choice.value !== "edit" &&
                              policy.pillboxAccess === "edit"
                                ? "act"
                                : policy.pillboxAccess,
                          });
                        })
                      }
                      style={styles.familySheetOption}
                    >
                      <View
                        style={[
                          styles.familySheetOptionLead,
                          styles.familySheetOptionLeadBlue,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            getFamilySheetOptionIcon("childrenAccess", choice.value) as never
                          }
                          size={18}
                          color={palette.blueIcon}
                        />
                      </View>
                      <Text style={styles.familySheetOptionText}>{choice.label}</Text>
                      <MaterialCommunityIcons
                        name={"chevron-right" as never}
                        size={20}
                        color="#A38F87"
                      />
                    </Pressable>
                  ))
                : null}

              {activeSheet === "childrenScope"
                ? ([
                    { value: "all", label: content.allChildrenLabel },
                    { value: "selected", label: content.selectedChildrenLabel },
                  ] as const).map((choice) => (
                    <Pressable
                      key={choice.value}
                      onPress={() =>
                        closeWith(() =>
                          onChangePolicy({
                            ...policy,
                            allChildren: choice.value === "all",
                            childIds:
                              choice.value === "all"
                                ? []
                                : policy.childIds.length > 0
                                  ? policy.childIds
                                  : children[0]
                                    ? [children[0].id]
                                    : [],
                          })
                        )
                      }
                      style={styles.familySheetOption}
                    >
                      <View
                        style={[
                          styles.familySheetOptionLead,
                          styles.familySheetOptionLeadBlue,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            getFamilySheetOptionIcon("childrenScope", choice.value) as never
                          }
                          size={18}
                          color={palette.blueIcon}
                        />
                      </View>
                      <Text style={styles.familySheetOptionText}>{choice.label}</Text>
                      <MaterialCommunityIcons
                        name={"chevron-right" as never}
                        size={20}
                        color="#A38F87"
                      />
                    </Pressable>
                  ))
                : null}

              {activeSheet === "selectedChildren"
                ? children.map((child) => {
                    const active = policy.childIds.includes(child.id);

                    return (
                      <Pressable
                        key={child.id}
                        onPress={() => {
                          const nextChildIds = active
                            ? policy.childIds.filter((id) => id !== child.id)
                            : [...policy.childIds, child.id];

                          onChangePolicy({
                            ...policy,
                            childIds: nextChildIds,
                          });
                        }}
                        style={styles.familySheetOption}
                      >
                        <View
                          style={[
                            styles.familySheetOptionLead,
                            active
                              ? styles.familySheetOptionLeadBlueActive
                              : styles.familySheetOptionLeadBlue,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={active ? ("check" as never) : ("account-outline" as never)}
                            size={18}
                            color={active ? "#FFFFFF" : palette.blueIcon}
                          />
                        </View>
                        <Text style={styles.familySheetOptionText}>{child.name}</Text>
                        <MaterialCommunityIcons
                          name={active ? ("check-circle" as never) : ("circle-outline" as never)}
                          size={20}
                          color={active ? palette.blueIcon : "#A38F87"}
                        />
                      </Pressable>
                    );
                  })
                : null}

              {activeSheet === "pillbox"
                ? pillboxChoices.map((choice) => (
                    <Pressable
                      key={choice.value}
                      onPress={() =>
                        closeWith(() =>
                          onChangePolicy({
                            ...policy,
                            pillboxAccess: choice.value,
                          })
                        )
                      }
                      style={styles.familySheetOption}
                    >
                      <View
                        style={[
                          styles.familySheetOptionLead,
                          styles.familySheetOptionLeadPurple,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={getFamilySheetOptionIcon("pillbox", choice.value) as never}
                          size={18}
                          color="#9C6DD8"
                        />
                      </View>
                      <Text style={styles.familySheetOptionText}>{choice.label}</Text>
                      <MaterialCommunityIcons
                        name={"chevron-right" as never}
                        size={20}
                        color="#A38F87"
                      />
                    </Pressable>
                  ))
                : null}

              {activeSheet === "cabinet"
                ? ([
                    { value: "none", label: cabinetAccessLabels.none },
                    { value: "view", label: cabinetAccessLabels.view },
                    { value: "edit", label: cabinetAccessLabels.edit },
                  ] as const).map((choice) => (
                    <Pressable
                      key={choice.value}
                      onPress={() =>
                        closeWith(() =>
                          onChangePolicy({
                            ...policy,
                            cabinetAccess: choice.value,
                            cabinetPushEnabled:
                              choice.value === "none"
                                ? false
                                : policy.cabinetPushEnabled,
                          })
                        )
                      }
                      style={styles.familySheetOption}
                    >
                      <View
                        style={[
                          styles.familySheetOptionLead,
                          styles.familySheetOptionLeadMint,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={getFamilySheetOptionIcon("cabinet", choice.value) as never}
                          size={18}
                          color={palette.greenIcon}
                        />
                      </View>
                      <Text style={styles.familySheetOptionText}>{choice.label}</Text>
                      <MaterialCommunityIcons
                        name={"chevron-right" as never}
                        size={20}
                        color="#A38F87"
                      />
                    </Pressable>
                  ))
                : null}
            </View>
          </>
        );
      }}
    </FormBottomSheet>
  );
}

function AccessPickerRow({
  icon,
  iconColor,
  leadStyle,
  title,
  value,
  onPress,
  palette,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  leadStyle: object;
  title: string;
  value: string;
  onPress: () => void;
  palette: FamilyPalette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.accessPickerRow,
        pressed ? styles.actionButtonPressed : null,
      ]}
    >
      <View style={[styles.accessPickerLead, leadStyle]}>
        <MaterialCommunityIcons name={icon as never} size={18} color={iconColor} />
      </View>
      <View style={styles.accessPickerCopy}>
        <Text style={[styles.accessSectionTitle, { color: palette.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.accessPickerValue, { color: palette.textSecondary }]}>
          {value}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={"chevron-right" as never}
        size={20}
        color="#A38F87"
      />
    </Pressable>
  );
}
