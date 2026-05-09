import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Pressable,
  Switch,
  Text,
  TextInput,
  type ImageSourcePropType,
  Image,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { styles } from "./settingsScreenStyles";

const APPLE_SWITCH_GREEN = "#34C759";

export function SettingsSection({
  title,
  hint,
  textPrimaryColor,
  textSecondaryColor,
  children,
}: {
  title: string;
  hint: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>{title}</Text>
        <Text style={[styles.sectionHint, { color: textSecondaryColor }]}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

export function ToggleRow({
  icon,
  iconStyle,
  title,
  hint,
  value,
  disabled,
  accentColor,
  onValueChange,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  accentColor: string;
  onValueChange: (value: boolean) => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <View style={styles.settingRow}>
      <View style={[styles.rowLead, iconStyle]}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#E9DED7", true: APPLE_SWITCH_GREEN }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

export function ChoiceRow({
  icon,
  iconStyle,
  title,
  hint,
  choices,
  selectedKey,
  accentColor = "#F18169",
  onSelect,
  disabled,
  compact = false,
}: {
  icon: ReactNode | null;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  choices: Array<{ key: string | number; label: string }>;
  selectedKey: string | number;
  accentColor?: string;
  onSelect: (key: string | number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <View style={[styles.settingRow, compact ? styles.settingRowCompact : null]}>
      {icon ? <View style={[styles.rowLead, iconStyle]}>{icon}</View> : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
        <View style={styles.chipRow}>
          {choices.map((choice) => {
            const isActive = selectedKey === choice.key;

            return (
              <Pressable
                key={String(choice.key)}
                onPress={() => onSelect(choice.key)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: `${accentColor}2E`,
                    backgroundColor: "#FFF8F2",
                  },
                  isActive
                    ? [
                        styles.chipActive,
                        {
                          borderColor: `${accentColor}99`,
                          backgroundColor: `${accentColor}26`,
                        },
                      ]
                    : null,
                  pressed ? styles.chipPressed : null,
                  disabled ? styles.chipDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: surfaceTheme.textMutedColor },
                    isActive ? [styles.chipTextActive, { color: accentColor }] : null,
                  ]}
                >
                  {choice.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function ExpandableChoiceRow({
  icon,
  iconStyle,
  title,
  hint,
  choices,
  selectedKey,
  expanded,
  onToggle,
  onSelect,
  disabled,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  choices: Array<{ key: string | number; label: string }>;
  selectedKey: string | number;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (key: string | number) => void;
  disabled?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const selectedChoice =
    choices.find((choice) => choice.key === selectedKey) ?? choices[0];

  return (
    <>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={({ pressed }) => [
          styles.settingRow,
          pressed ? styles.rowPressed : null,
          disabled ? styles.rowDisabled : null,
        ]}
      >
        <View style={[styles.rowLead, iconStyle]}>{icon}</View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
            {title}
          </Text>
          <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
            {hint}
          </Text>
        </View>
        <View style={styles.dropdownValueWrap}>
          <Text
            style={[styles.dropdownValueText, { color: surfaceTheme.textSecondaryColor }]}
          >
            {selectedChoice?.label ?? ""}
          </Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={surfaceTheme.textMutedColor}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View
          style={[
            styles.dropdownList,
            {
              borderColor: surfaceTheme.inputBorderColor,
              backgroundColor: surfaceTheme.inputBackgroundColor,
            },
          ]}
        >
          {choices.map((choice, index) => {
            const active = choice.key === selectedKey;

            return (
              <Pressable
                key={String(choice.key)}
                onPress={() => onSelect(choice.key)}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  active
                    ? [
                        styles.dropdownItemActive,
                        { backgroundColor: "#FDF0EA" },
                      ]
                    : null,
                  pressed ? styles.dropdownItemPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: surfaceTheme.textPrimaryColor },
                    active ? styles.dropdownItemTextActive : null,
                  ]}
                >
                  {choice.label}
                </Text>
                {active ? (
                  <Feather name="check" size={16} color={surfaceTheme.textPrimaryColor} />
                ) : null}
                {index < choices.length - 1 ? (
                  <View
                    style={[
                      styles.dropdownDivider,
                      { backgroundColor: surfaceTheme.dividerColor },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

export function SubscriptionManagementCard({
  title,
  statusHint,
  statusLabel,
  planLabel,
  planValue,
  membersLabel,
  membersValue,
  accessUntilLabel,
  accessUntilValue,
  expanded,
  onToggle,
  actionLabel,
  onManageSubscription,
}: {
  title: string;
  statusHint: string;
  statusLabel: string;
  planLabel: string;
  planValue: string;
  membersLabel: string;
  membersValue: string;
  accessUntilLabel: string;
  accessUntilValue: string;
  expanded: boolean;
  onToggle: () => void;
  actionLabel: string;
  onManageSubscription: () => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      <ExpandableHeaderRow
        icon={<Feather name="star" size={22} color="#E0846D" />}
        iconStyle={styles.rowLeadNeutral}
        title={title}
        hint={statusHint}
        expanded={expanded}
        onPress={onToggle}
      />
      {expanded ? (
        <>
          <View style={styles.subscriptionSummaryBlock}>
            <View style={styles.subscriptionSummaryGrid}>
              <View style={styles.subscriptionSummaryGridDividerVertical} />
              <View style={styles.subscriptionSummaryGridDividerHorizontal} />
              <View style={styles.subscriptionSummaryCell}>
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="activity" size={15} color="#E0846D" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{statusLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{statusHint}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellRight,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="star" size={15} color="#6D8FE8" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{planLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{planValue}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellBottom,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={16}
                      color="#5FA77A"
                    />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{membersLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{membersValue}</Text>
              </View>
              <View
                style={[
                  styles.subscriptionSummaryCell,
                  styles.subscriptionSummaryCellRight,
                  styles.subscriptionSummaryCellBottom,
                ]}
              >
                <View style={styles.subscriptionSummaryHead}>
                  <View style={styles.subscriptionSummaryIcon}>
                    <Feather name="calendar" size={15} color="#D68A3D" />
                  </View>
                  <Text style={styles.subscriptionSummaryLabel}>{accessUntilLabel}</Text>
                </View>
                <Text style={styles.subscriptionSummaryValue}>{accessUntilValue}</Text>
              </View>
            </View>
          </View>
          <View style={styles.subscriptionActionWrap}>
            <Pressable
              onPress={onManageSubscription}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed ? styles.primaryActionPressed : null,
              ]}
            >
              <Text style={styles.primaryActionText}>{actionLabel}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </>
  );
}

export function NotificationsSettingsCard({
  pushConfigEnabled,
  notificationsUnavailableHint,
  pushMasterIcon,
  pushMasterTitle,
  pushMasterHint,
  pushMasterEnabled,
  isSavingPush,
  onToggleMasterPush,
  childrenIcon,
  childrenTitle,
  childrenHint,
  childrenEnabled,
  onToggleChildren,
  leadTimeTitle,
  leadTimeHint,
  reminderChoices,
  beforeReminderMinutes,
  onSelectBeforeReminderMinutes,
  pillboxIcon,
  pillboxTitle,
  pillboxHint,
  pillboxEnabled,
  onTogglePillbox,
  pillboxLeadTimeTitle,
  pillboxLeadTimeHint,
  pillboxBeforeReminderMinutes,
  onSelectPillboxBeforeReminderMinutes,
  cabinetIcon,
  cabinetTitle,
  cabinetHint,
  cabinetEnabled,
  onToggleCabinet,
  cabinetLeadTimeTitle,
  cabinetLeadTimeHint,
  cabinetReminderChoices,
  selectedCabinetDays,
  onSelectCabinetReminderDays,
  childrenAccentColor,
  pillboxAccentColor,
  cabinetAccentColor,
  masterAccentColor,
}: {
  pushConfigEnabled: boolean;
  notificationsUnavailableHint: string;
  pushMasterIcon: ImageSourcePropType;
  pushMasterTitle: string;
  pushMasterHint: string;
  pushMasterEnabled: boolean;
  isSavingPush: boolean;
  onToggleMasterPush: (value: boolean) => void;
  childrenIcon: ImageSourcePropType;
  childrenTitle: string;
  childrenHint: string;
  childrenEnabled: boolean;
  onToggleChildren: (value: boolean) => void;
  leadTimeTitle: string;
  leadTimeHint: string;
  reminderChoices: Array<{ key: string | number; label: string }>;
  beforeReminderMinutes: number;
  onSelectBeforeReminderMinutes: (value: string | number) => void;
  pillboxIcon: ImageSourcePropType;
  pillboxTitle: string;
  pillboxHint: string;
  pillboxEnabled: boolean;
  onTogglePillbox: (value: boolean) => void;
  pillboxLeadTimeTitle: string;
  pillboxLeadTimeHint: string;
  pillboxBeforeReminderMinutes: number;
  onSelectPillboxBeforeReminderMinutes: (value: string | number) => void;
  cabinetIcon: ImageSourcePropType;
  cabinetTitle: string;
  cabinetHint: string;
  cabinetEnabled: boolean;
  onToggleCabinet: (value: boolean) => void;
  cabinetLeadTimeTitle: string;
  cabinetLeadTimeHint: string;
  cabinetReminderChoices: Array<{ key: string | number; label: string }>;
  selectedCabinetDays: 10 | 7 | 3;
  onSelectCabinetReminderDays: (value: string | number) => void;
  childrenAccentColor: string;
  pillboxAccentColor: string;
  cabinetAccentColor: string;
  masterAccentColor: string;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      {!pushConfigEnabled ? (
        <Text style={[styles.inlineNote, { color: surfaceTheme.textMutedColor }]}>
          {notificationsUnavailableHint}
        </Text>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: surfaceTheme.cardBackgroundColor,
            borderColor: surfaceTheme.cardBorderColor,
          },
        ]}
      >
        <ToggleRow
          icon={
            <Image
              source={pushMasterIcon}
              style={styles.moduleRowIconImage}
              resizeMode="contain"
            />
          }
          iconStyle={styles.rowLeadPlain}
          title={pushMasterTitle}
          hint={pushMasterHint}
          value={pushMasterEnabled}
          disabled={isSavingPush || !pushConfigEnabled}
          accentColor={masterAccentColor}
          onValueChange={onToggleMasterPush}
        />
        {pushMasterEnabled ? (
          <>
            <View style={styles.rowDivider} />
            <ToggleRow
              icon={
                <Image
                  source={childrenIcon}
                  style={styles.moduleRowIconImage}
                  resizeMode="contain"
                />
              }
              iconStyle={styles.rowLeadPlain}
              title={childrenTitle}
              hint={childrenHint}
              value={childrenEnabled}
              disabled={isSavingPush || !pushConfigEnabled}
              accentColor={childrenAccentColor}
              onValueChange={onToggleChildren}
            />
            <View style={styles.insetBlock}>
              <ChoiceRow
                icon={null}
                iconStyle={null}
                title={leadTimeTitle}
                hint={leadTimeHint}
                choices={reminderChoices}
                selectedKey={beforeReminderMinutes}
                accentColor={childrenAccentColor}
                onSelect={onSelectBeforeReminderMinutes}
                disabled={isSavingPush || !childrenEnabled}
                compact
              />
            </View>
            <View style={styles.rowDivider} />
            <ToggleRow
              icon={
                <Image
                  source={pillboxIcon}
                  style={styles.moduleRowIconImage}
                  resizeMode="contain"
                />
              }
              iconStyle={styles.rowLeadPlain}
              title={pillboxTitle}
              hint={pillboxHint}
              value={pillboxEnabled}
              disabled={isSavingPush || !pushConfigEnabled}
              accentColor={pillboxAccentColor}
              onValueChange={onTogglePillbox}
            />
            <View style={styles.insetBlock}>
              <ChoiceRow
                icon={null}
                iconStyle={null}
                title={pillboxLeadTimeTitle}
                hint={pillboxLeadTimeHint}
                choices={reminderChoices}
                selectedKey={pillboxBeforeReminderMinutes}
                accentColor={pillboxAccentColor}
                onSelect={onSelectPillboxBeforeReminderMinutes}
                disabled={isSavingPush || !pillboxEnabled}
                compact
              />
            </View>
            <View style={styles.rowDivider} />
            <ToggleRow
              icon={
                <Image
                  source={cabinetIcon}
                  style={styles.moduleRowIconImage}
                  resizeMode="contain"
                />
              }
              iconStyle={styles.rowLeadPlain}
              title={cabinetTitle}
              hint={cabinetHint}
              value={cabinetEnabled}
              disabled={isSavingPush || !pushConfigEnabled}
              accentColor={cabinetAccentColor}
              onValueChange={onToggleCabinet}
            />
            <View style={styles.insetBlock}>
              <ChoiceRow
                icon={null}
                iconStyle={null}
                title={cabinetLeadTimeTitle}
                hint={cabinetLeadTimeHint}
                choices={cabinetReminderChoices}
                selectedKey={selectedCabinetDays}
                accentColor={cabinetAccentColor}
                onSelect={onSelectCabinetReminderDays}
                disabled={isSavingPush || !cabinetEnabled}
                compact
              />
            </View>
          </>
        ) : null}
      </View>
    </>
  );
}

export function SecuritySettingsCard({
  passwordTitle,
  passwordHint,
  passwordExpanded,
  onTogglePassword,
  currentPasswordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  passwordForm,
  onChangePasswordField,
  onPasswordFieldFocus,
  onSavePassword,
  savePasswordLabel,
  recoveryCodeTitle,
  recoveryCodeHint,
  recoveryCodeConfiguredHint,
  hasRecoveryCode,
  recoveryCodeExpanded,
  onToggleRecoveryCode,
  recoveryCode,
  recoveryCodeLabel,
  onChangeRecoveryCode,
  onSaveRecoveryCode,
  saveRecoveryCodeLabel,
}: {
  passwordTitle: string;
  passwordHint: string;
  passwordExpanded: boolean;
  onTogglePassword: () => void;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onChangePasswordField: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => void;
  onPasswordFieldFocus: () => void;
  onSavePassword: () => void;
  savePasswordLabel: string;
  recoveryCodeTitle: string;
  recoveryCodeHint: string;
  recoveryCodeConfiguredHint: string;
  hasRecoveryCode: boolean;
  recoveryCodeExpanded: boolean;
  onToggleRecoveryCode: () => void;
  recoveryCode: string;
  recoveryCodeLabel: string;
  onChangeRecoveryCode: (value: string) => void;
  onSaveRecoveryCode: () => void;
  saveRecoveryCodeLabel: string;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      <ExpandableHeaderRow
        icon={<Feather name="lock" size={22} color="#7B6B65" />}
        iconStyle={styles.rowLeadNeutral}
        title={passwordTitle}
        hint={passwordHint}
        expanded={passwordExpanded}
        onPress={onTogglePassword}
      />
      {passwordExpanded ? (
        <View style={styles.passwordEditorBlock}>
          <View style={styles.passwordFieldsStack}>
            <TextInput
              value={passwordForm.currentPassword}
              onChangeText={(value) => onChangePasswordField("currentPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={currentPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
            <TextInput
              value={passwordForm.newPassword}
              onChangeText={(value) => onChangePasswordField("newPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={newPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
            <TextInput
              value={passwordForm.confirmPassword}
              onChangeText={(value) => onChangePasswordField("confirmPassword", value)}
              onFocus={onPasswordFieldFocus}
              placeholder={confirmPasswordLabel}
              placeholderTextColor={surfaceTheme.textMutedColor}
              secureTextEntry
              style={[
                styles.input,
                styles.inputStandalone,
                {
                  color: surfaceTheme.textPrimaryColor,
                  backgroundColor: surfaceTheme.inputBackgroundColor,
                  borderColor: surfaceTheme.inputBorderColor,
                },
              ]}
            />
          </View>
          <Pressable
            onPress={onSavePassword}
            style={({ pressed }) => [
              styles.primaryAction,
              styles.passwordAction,
              pressed ? styles.primaryActionPressed : null,
            ]}
          >
            <Text style={styles.primaryActionText}>{savePasswordLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.rowDivider} />

      <ExpandableHeaderRow
        icon={<Feather name="shield" size={22} color="#7B6B65" />}
        iconStyle={styles.rowLeadNeutral}
        title={recoveryCodeTitle}
        hint={hasRecoveryCode ? recoveryCodeConfiguredHint : recoveryCodeHint}
        expanded={!hasRecoveryCode && recoveryCodeExpanded}
        onPress={onToggleRecoveryCode}
        locked={hasRecoveryCode}
      />
      {!hasRecoveryCode && recoveryCodeExpanded ? (
        <View style={styles.editorBlock}>
          <TextInput
            value={recoveryCode}
            onChangeText={onChangeRecoveryCode}
            placeholder={recoveryCodeLabel}
            placeholderTextColor={surfaceTheme.textMutedColor}
            autoCapitalize="characters"
            style={[
              styles.input,
              {
                color: surfaceTheme.textPrimaryColor,
                backgroundColor: surfaceTheme.inputBackgroundColor,
                borderColor: surfaceTheme.inputBorderColor,
                borderWidth: 1.5,
                borderRadius: 20,
              },
            ]}
          />
          <Pressable
            onPress={onSaveRecoveryCode}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed ? styles.primaryActionPressed : null,
            ]}
          >
            <Text style={styles.primaryActionText}>{saveRecoveryCodeLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

export function LiveActivitiesSettingsCard({
  unavailableHint,
  showUnavailableHint,
  sleepTitle,
  sleepHint,
  sleepEnabled,
  feedingTitle,
  feedingHint,
  feedingEnabled,
  illnessTitle,
  illnessHint,
  illnessEnabled,
  disabled,
  onToggleSleep,
  onToggleFeeding,
  onToggleIllness,
}: {
  unavailableHint: string;
  showUnavailableHint: boolean;
  sleepTitle: string;
  sleepHint: string;
  sleepEnabled: boolean;
  feedingTitle: string;
  feedingHint: string;
  feedingEnabled: boolean;
  illnessTitle: string;
  illnessHint: string;
  illnessEnabled: boolean;
  disabled: boolean;
  onToggleSleep: (value: boolean) => void;
  onToggleFeeding: (value: boolean) => void;
  onToggleIllness: (value: boolean) => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      {showUnavailableHint ? (
        <Text style={[styles.inlineNote, { color: surfaceTheme.textMutedColor }]}>
          {unavailableHint}
        </Text>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: surfaceTheme.cardBackgroundColor,
            borderColor: surfaceTheme.cardBorderColor,
          },
        ]}
      >
        <ToggleRow
          icon={
            <Image
              source={redesignSharedIcons.sleep}
              style={styles.moduleRowIconImage}
              resizeMode="contain"
            />
          }
          iconStyle={styles.rowLeadPlain}
          title={sleepTitle}
          hint={sleepHint}
          value={sleepEnabled}
          disabled={disabled}
          accentColor="#6E67D9"
          onValueChange={onToggleSleep}
        />
        <View style={styles.rowDivider} />
        <ToggleRow
          icon={
            <Image
              source={redesignSharedIcons.feeding}
              style={styles.moduleRowIconImage}
              resizeMode="contain"
            />
          }
          iconStyle={styles.rowLeadPlain}
          title={feedingTitle}
          hint={feedingHint}
          value={feedingEnabled}
          disabled={disabled}
          accentColor="#E59A63"
          onValueChange={onToggleFeeding}
        />
        <View style={styles.rowDivider} />
        <ToggleRow
          icon={
            <Image
              source={redesignSharedIcons.observation}
              style={styles.moduleRowIconImage}
              resizeMode="contain"
            />
          }
          iconStyle={styles.rowLeadPlain}
          title={illnessTitle}
          hint={illnessHint}
          value={illnessEnabled}
          disabled={disabled}
          accentColor="#38A39A"
          onValueChange={onToggleIllness}
        />
      </View>
    </>
  );
}

export function DangerZoneCard({
  deleteLabel,
  deleteHint,
  isDeleting,
  onPressDelete,
}: {
  deleteLabel: string;
  deleteHint: string;
  isDeleting: boolean;
  onPressDelete: () => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <View
      style={[
        styles.card,
        styles.dangerCard,
        {
          backgroundColor: surfaceTheme.cardMutedBackgroundColor,
          borderColor: surfaceTheme.cardBorderColor,
        },
      ]}
    >
      <Pressable
        onPress={onPressDelete}
        disabled={isDeleting}
        style={({ pressed }) => [
          styles.dangerRow,
          pressed ? styles.dangerRowPressed : null,
        ]}
      >
        <View style={[styles.rowLead, styles.rowLeadDanger]}>
          <Feather name="trash-2" size={22} color="#D55C56" />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.dangerTitle}>{deleteLabel}</Text>
          <Text style={styles.dangerHint}>{deleteHint}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#D55C56" />
      </Pressable>
    </View>
  );
}

export function ExpandableHeaderRow({
  icon,
  iconStyle,
  title,
  hint,
  expanded,
  onPress,
  locked = false,
}: {
  icon: ReactNode;
  iconStyle: StyleProp<ViewStyle> | null;
  title: string;
  hint: string;
  expanded: boolean;
  onPress: () => void;
  locked?: boolean;
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed ? styles.rowPressed : null]}
    >
      <View style={[styles.rowLead, iconStyle]}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: surfaceTheme.textPrimaryColor }]}>
          {title}
        </Text>
        <Text style={[styles.rowHint, { color: surfaceTheme.textSecondaryColor }]}>
          {hint}
        </Text>
      </View>
      {locked ? (
        <View style={styles.lockedStatusWrap}>
          <Feather name="check" size={16} color="#4E8B60" />
        </View>
      ) : (
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={surfaceTheme.textMutedColor}
        />
      )}
    </Pressable>
  );
}
