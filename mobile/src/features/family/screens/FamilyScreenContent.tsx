import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import type {
  FamilyCabinetAccess,
  FamilyChildrenAccess,
  FamilyPillboxAccess,
  FamilyUiAccessPolicy,
  FamilyScreenContent,
} from "../model/familyScreen";
import type {
  FamilyPalette,
  RoleTone,
  StatTone,
} from "./FamilyScreenParts";
import {
  type ChildChoice,
  FamilyAccessCardBody,
  FamilyAccessOptionsSheet,
  FamilyAccessTargetHeader,
  type FamilyProfileEditDraft,
  FamilyProfileEditFields,
} from "./FamilyScreenSections";
import { styles } from "./familyScreenStyles";

type RoleRule = {
  key: string;
  title: string;
  description: string;
  icon: "crown-outline" | "shield-account-outline" | "account-group-outline";
  bg: string;
  color: string;
};

function getInviteLockedDescription(locale: string) {
  if (locale === "ru") {
    return "Приглашения в семью доступны в Plus.";
  }
  if (locale === "de") {
    return "Familieneinladungen sind in Plus verfügbar.";
  }
  if (locale === "pl") {
    return "Zaproszenia do rodziny są dostępne w Plus.";
  }
  return "Family invites are available in Plus.";
}


function FamilyStatsCards({
  compact,
  onPressFamilyStat,
  palette,
  stats,
}: {
  compact: boolean;
  onPressFamilyStat: (key: "adults" | "children" | "routines") => void;
  palette: FamilyPalette;
  stats: Array<{
    key: "adults" | "children" | "routines";
    value: number;
    label: string;
    tone: StatTone;
  }>;
}) {
  const { locale } = useMobileI18n();
  return (
    <View style={[styles.statsRow, compact ? styles.statsRowCompact : null]}>
      {stats.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onPressFamilyStat(item.key)}
          style={({ pressed }) => [
            styles.statCard,
            compact ? styles.statCardCompact : null,
            {
              backgroundColor: "rgba(255,249,244,0.94)",
              borderColor: palette.cardBorder,
            },
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <View style={styles.statCopy}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIconTile, { backgroundColor: item.tone.bg }]}>
                {item.tone.useAsset ? (
                  <Image
                    source={item.tone.icon}
                    style={styles.statAssetIcon}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.tone.icon as never}
                    size={16}
                    color={item.tone.color}
                  />
                )}
              </View>
              <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                {item.value}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function FamilyInviteCard({
  content,
  inviteCode,
  inviteCopied,
  inviteExpanded,
  inviteLocked,
  onCopyInvite,
  onRefreshInviteCode,
  onShareInvite,
  onToggleInviteExpanded,
  palette,
  stackInviteButtons,
}: {
  content: FamilyScreenContent;
  inviteCode: string | null;
  inviteCopied: boolean;
  inviteExpanded: boolean;
  inviteLocked: boolean;
  onCopyInvite: () => void;
  onRefreshInviteCode: () => void;
  onShareInvite: () => void;
  onToggleInviteExpanded: () => void;
  palette: FamilyPalette;
  stackInviteButtons: boolean;
}) {
  const { locale } = useMobileI18n();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      <View style={styles.inviteHeaderRow}>
        <Pressable
          onPress={() => {
            if (inviteLocked) {
              onRefreshInviteCode();
              return;
            }
            if (inviteCode) {
              onToggleInviteExpanded();
            }
          }}
          style={({ pressed }) => [
            styles.inviteTopRow,
            styles.inviteHeaderPressable,
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          {({ pressed }) => (
            <>
              <LinearGradient
                colors={[palette.peachIconBg, palette.cardBgSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.inviteIconTile,
                  { borderWidth: 1, borderColor: palette.cardBorderLight },
                ]}
              >
                <MaterialCommunityIcons
                  name={"email-fast-outline" as never}
                  size={24}
                  color={palette.peachIcon}
                />
              </LinearGradient>
              <View style={styles.inviteTopCopy}>
                <View style={styles.inviteTitleRow}>
                  <Text style={[styles.inviteTitle, { color: palette.textPrimary }]}>
                    {content.inviteCodeTitle}
                  </Text>
                  {inviteLocked ? (
                    <View
                      style={[
                        styles.smallBadge,
                        {
                          backgroundColor: "#FFE9F1",
                          borderColor: "#F7BDD2",
                        },
                      ]}
                    >
                      <Text style={[styles.smallBadgeText, { color: "#D94D8E" }]}>
                        Plus
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.inviteDescription, { color: palette.textSecondary }]}>
                  {inviteLocked
                    ? getInviteLockedDescription(locale)
                    : inviteCode
                      ? content.inviteReadyDescription
                      : content.inviteEmptyDescription}
                </Text>
              </View>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={onRefreshInviteCode}
          style={({ pressed }) => [
            styles.inviteRefreshButton,
            inviteLocked ? styles.inviteRefreshButtonLocked : null,
            {
              backgroundColor: "rgba(255,248,243,0.96)",
              borderColor: palette.cardBorder,
            },
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <Feather name="refresh-cw" size={16} color={palette.textPrimary} />
        </Pressable>
      </View>

      {inviteCode && inviteExpanded ? (
        <>
          <View
            style={[
              styles.inviteCodeBox,
              {
                backgroundColor: palette.cardBgSoft,
                borderColor: palette.cardBorder,
              },
            ]}
          >
            <Text style={[styles.inviteCode, { color: palette.textPrimary }]}>
              {inviteCode}
            </Text>
            <View style={styles.inviteStatusRow}>
              <MaterialCommunityIcons
                name={"check-circle" as never}
                size={16}
                color={palette.greenText}
              />
              <Text style={[styles.inviteStatusText, { color: palette.greenText }]}>
                {content.inviteReadyStatus}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.inviteButtonsRow,
              stackInviteButtons ? styles.inviteButtonsStack : null,
            ]}
          >
            <Pressable
              onPress={onShareInvite}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonPrimary,
                { backgroundColor: palette.primaryCoral },
                pressed ? styles.actionButtonPressed : null,
              ]}
            >
              <Feather name="share" size={17} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                {content.shareInviteLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCopyInvite}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonSecondary,
                {
                  backgroundColor: "rgba(255,253,249,0.93)",
                  borderColor: "#EBCFC4",
                },
                pressed ? styles.actionButtonPressed : null,
              ]}
            >
              <Feather
                name={inviteCopied ? "check" : "copy"}
                size={17}
                color={inviteCopied ? "#4E8B60" : palette.textPrimary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: inviteCopied ? "#4E8B60" : palette.textPrimary },
                ]}
              >
                {inviteCopied ? content.copiedInviteLabel : content.copyInviteLabel}
              </Text>
            </Pressable>
          </View>

          {inviteCopied ? (
            <View
              style={[
                styles.inviteFeedback,
                {
                  backgroundColor: palette.greenBg,
                  borderColor: "#D8EFE1",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={"check-circle" as never}
                size={15}
                color={palette.greenText}
              />
              <Text style={[styles.inviteFeedbackText, { color: palette.greenText }]}>
                {content.copiedInviteLabel}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function FamilyRoleRulesCard({
  content,
  palette,
  roleRules,
}: {
  content: FamilyScreenContent;
  palette: FamilyPalette;
  roleRules: ReadonlyArray<RoleRule>;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {content.accessTitle}
      </Text>
      <View
        style={[
          styles.rulesCard,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.cardBorder,
          },
        ]}
      >
        {roleRules.map((rule, index) => (
          <View key={rule.key}>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleIconTile, { backgroundColor: rule.bg }]}>
                <MaterialCommunityIcons
                  name={rule.icon as never}
                  size={18}
                  color={rule.color}
                />
              </View>
              <View style={styles.ruleCopy}>
                <Text style={[styles.ruleTitle, { color: palette.textPrimary }]}>
                  {rule.title}
                </Text>
                <Text style={[styles.ruleDescription, { color: palette.textSecondary }]}>
                  {rule.description}
                </Text>
              </View>
            </View>
            {index < roleRules.length - 1 ? (
              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: palette.divider, marginLeft: 14 },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function FamilyOverviewContent({
  compact,
  content,
  currentMemberRoleLabel,
  familyName,
  inviteCode,
  inviteCopied,
  inviteExpanded,
  inviteLocked,
  showInviteCard,
  memberRows,
  onCopyInvite,
  onPressFamilyStat,
  onRefreshInviteCode,
  onShareInvite,
  onToggleInviteExpanded,
  ownerTone,
  palette,
  renderFamilyTitleIcon,
  roleRules,
  stackInviteButtons,
  stats,
  subtitleColor,
  titleColor,
}: {
  compact: boolean;
  content: FamilyScreenContent;
  currentMemberRoleLabel: string;
  familyName: string;
  inviteCode: string | null;
  inviteCopied: boolean;
  inviteExpanded: boolean;
  inviteLocked: boolean;
  showInviteCard: boolean;
  memberRows: React.ReactNode;
  onCopyInvite: () => void;
  onPressFamilyStat: (key: "adults" | "children" | "routines") => void;
  onRefreshInviteCode: () => void;
  onShareInvite: () => void;
  onToggleInviteExpanded: () => void;
  ownerTone: RoleTone;
  palette: FamilyPalette;
  renderFamilyTitleIcon: React.ReactNode;
  roleRules: ReadonlyArray<{
    key: string;
    title: string;
    description: string;
    icon: "crown-outline" | "shield-account-outline" | "account-group-outline";
    bg: string;
    color: string;
  }>;
  stackInviteButtons: boolean;
  stats: Array<{
    key: "adults" | "children" | "routines";
    value: number;
    label: string;
    tone: StatTone;
  }>;
  subtitleColor: string;
  titleColor: string;
}) {
  return (
    <>
      <View style={styles.introBlock}>
        <View style={styles.introHeaderRow}>
          <View style={styles.introTitleWrap}>
            <Text style={[styles.title, { color: titleColor }]}>{content.title}</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {content.subtitle}
            </Text>
          </View>
          {renderFamilyTitleIcon}
        </View>
      </View>

      <View style={styles.screenBlock}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <View style={styles.familyHeader}>
            <View style={styles.familyHeaderLeft}>
              <View style={styles.familyHeaderCopy}>
                <Text style={[styles.familyName, { color: palette.textPrimary }]}>
                  {familyName}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: ownerTone.background,
                  borderColor: ownerTone.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={ownerTone.iconName as never}
                size={15}
                color={ownerTone.icon}
              />
              <Text style={[styles.badgeText, { color: ownerTone.color }]}>
                {currentMemberRoleLabel}
              </Text>
            </View>
          </View>

          <FamilyStatsCards
            compact={compact}
            onPressFamilyStat={onPressFamilyStat}
            palette={palette}
            stats={stats}
          />
        </View>
      </View>

      <View style={[styles.sectionWrap, styles.screenBlock]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          {content.membersTitle}
        </Text>
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: "rgba(255,253,249,0.93)",
              borderColor: palette.cardBorder,
            },
          ]}
        >
          {memberRows}
        </View>
      </View>

      {showInviteCard ? (
        <View style={styles.screenBlock}>
          <FamilyInviteCard
            content={content}
            inviteCode={inviteCode}
            inviteCopied={inviteCopied}
            inviteExpanded={inviteExpanded}
            inviteLocked={inviteLocked}
            onCopyInvite={onCopyInvite}
            onRefreshInviteCode={onRefreshInviteCode}
            onShareInvite={onShareInvite}
            onToggleInviteExpanded={onToggleInviteExpanded}
            palette={palette}
            stackInviteButtons={stackInviteButtons}
          />
        </View>
      ) : null}

      <View style={styles.screenBlock}>
        <FamilyRoleRulesCard
          content={content}
          palette={palette}
          roleRules={roleRules}
        />
      </View>
    </>
  );
}

export function FamilyMemberActionSheet({
  canEditProfile,
  canManageAccess,
  content,
  memberName,
  onClose,
  onEditProfile,
  onManageAccess,
  visible,
}: {
  canEditProfile: boolean;
  canManageAccess: boolean;
  content: FamilyScreenContent;
  memberName: string;
  onClose: () => void;
  onEditProfile: () => void;
  onManageAccess: () => void;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
      sheetStyle={styles.floatingSheetCard}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
          </View>
          <Text style={styles.floatingSheetTitle}>{memberName}</Text>
          <Text style={styles.floatingSheetDescription}>
            {content.memberActionHint}
          </Text>
          <View style={styles.floatingSheetActions}>
            {canManageAccess ? (
              <Pressable
                hitSlop={6}
                pressRetentionOffset={14}
                onPress={() => requestClose(onManageAccess)}
                style={({ pressed }) => [
                  styles.floatingSheetAction,
                  pressed ? styles.actionButtonPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.floatingSheetActionLead,
                    styles.floatingSheetActionLeadAccess,
                  ]}
                >
                  <Feather name="sliders" size={16} color="#F18169" />
                </View>
                <Text style={styles.floatingSheetActionText}>
                  {content.manageAccessLabel}
                </Text>
              </Pressable>
            ) : null}
            {canEditProfile ? (
              <Pressable
                hitSlop={6}
                pressRetentionOffset={14}
                onPress={() => requestClose(onEditProfile)}
                style={({ pressed }) => [
                  styles.floatingSheetAction,
                  pressed ? styles.actionButtonPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.floatingSheetActionLead,
                    styles.floatingSheetActionLeadEdit,
                  ]}
                >
                  <Feather name="edit-2" size={16} color="#6D8FE8" />
                </View>
                <Text style={styles.floatingSheetActionText}>
                  {content.editProfileLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </FormBottomSheet>
  );
}

export function FamilyProfileEditContent({
  content,
  draft,
  onChangeDraft,
  onSave,
  palette,
}: {
  content: FamilyScreenContent;
  draft: FamilyProfileEditDraft;
  onChangeDraft: (draft: FamilyProfileEditDraft) => void;
  onSave: () => void;
  palette: FamilyPalette;
}) {
  return (
    <>
      <View style={styles.introBlock}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>
          {content.editProfileLabel}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {content.editProfileHint}
        </Text>
      </View>

      <View style={styles.screenBlock}>
        <FamilyProfileEditFields
          content={content}
          draft={draft}
          onChangeDraft={onChangeDraft}
          palette={palette}
        />
      </View>

      <View style={styles.screenBlock}>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.primaryFooterAction,
            pressed ? styles.actionButtonPressed : null,
          ]}
          >
            <Text style={styles.primaryFooterActionText}>
              {content.saveProfileLabel}
            </Text>
          </Pressable>
      </View>
    </>
  );
}

export function FamilyAccessContent({
  cabinetAccessLabels,
  children,
  childrenAccessLabels,
  content,
  memberName,
  memberRelationship,
  onChangePolicy,
  onSave,
  palette,
  pillboxAccessLabels,
  policy,
  inline = false,
}: {
  cabinetAccessLabels: Record<FamilyCabinetAccess, string>;
  children: ChildChoice[];
  childrenAccessLabels: Record<FamilyChildrenAccess, string>;
  content: FamilyScreenContent;
  memberName: string;
  memberRelationship: string;
  onChangePolicy: (policy: FamilyUiAccessPolicy) => void;
  onSave: () => void;
  palette: FamilyPalette;
  pillboxAccessLabels: Record<FamilyPillboxAccess, string>;
  policy: FamilyUiAccessPolicy;
  inline?: boolean;
}) {
  const [activeSheet, setActiveSheet] = useState<
    "childrenAccess" | "childrenScope" | "selectedChildren" | "pillbox" | "cabinet" | null
  >(null);

  return (
    <>
      {!inline ? (
        <FamilyAccessTargetHeader
          content={content}
          memberName={memberName}
          memberRelationship={memberRelationship}
          palette={palette}
        />
      ) : null}

      <View style={inline ? undefined : styles.screenBlock}>
        <FamilyAccessCardBody
          cabinetAccessLabels={cabinetAccessLabels}
          children={children}
          childrenAccessLabels={childrenAccessLabels}
          content={content}
          inline={inline}
          onChangePolicy={onChangePolicy}
          onOpenSheet={setActiveSheet}
          onSave={onSave}
          palette={palette}
          pillboxAccessLabels={pillboxAccessLabels}
          policy={policy}
        />
      </View>

      <FamilyAccessOptionsSheet
        activeSheet={activeSheet}
        cabinetAccessLabels={cabinetAccessLabels}
        children={children}
        childrenAccessLabels={childrenAccessLabels}
        content={content}
        onChangePolicy={onChangePolicy}
        onClose={() => setActiveSheet(null)}
        palette={palette}
        pillboxAccessLabels={pillboxAccessLabels}
        policy={policy}
      />
    </>
  );
}
