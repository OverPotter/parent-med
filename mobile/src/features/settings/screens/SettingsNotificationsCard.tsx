import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ChoiceRow, ToggleRow } from "./SettingsSharedParts";
import { styles } from "./settingsScreenStyles";

export function NotificationsSettingsCard({
  pushConfigEnabled,
  notificationsUnavailableHint,
  notificationsPermissionHint,
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
}: {
  pushConfigEnabled: boolean;
  notificationsUnavailableHint: string;
  notificationsPermissionHint?: string | null;
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
}) {
  const surfaceTheme = useMobileSurfaceTheme();

  return (
    <>
      {!pushConfigEnabled ? (
        <Text style={[styles.inlineNote, { color: surfaceTheme.textMutedColor }]}>
          {notificationsUnavailableHint}
        </Text>
      ) : null}
      {pushConfigEnabled && notificationsPermissionHint ? (
        <Text style={[styles.inlineNote, { color: surfaceTheme.textMutedColor }]}>
          {notificationsPermissionHint}
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
