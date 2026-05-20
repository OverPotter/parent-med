import { Image, Text, View } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { ToggleRow } from "./SettingsSharedParts";
import { styles } from "./settingsScreenStyles";

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
  onPressUnavailable,
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
  onPressUnavailable?: () => void;
  onToggleSleep: (value: boolean) => void;
  onToggleFeeding: (value: boolean) => void;
  onToggleIllness: (value: boolean) => void;
}) {
  const surfaceTheme = useMobileSurfaceTheme();
  const paywallLocked = showUnavailableHint;
  const rowDisabled = disabled || paywallLocked;

  return (
    <>
      {showUnavailableHint ? (
        <View style={styles.lockedNoteWrap}>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>Plus</Text>
          </View>
          <Text
            style={[
              styles.inlineNote,
              styles.lockedNoteText,
              { color: surfaceTheme.textMutedColor },
            ]}
          >
            {unavailableHint}
          </Text>
        </View>
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
          disabled={rowDisabled}
          onPress={paywallLocked ? onPressUnavailable : undefined}
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
          disabled={rowDisabled}
          onPress={paywallLocked ? onPressUnavailable : undefined}
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
          disabled={rowDisabled}
          onPress={paywallLocked ? onPressUnavailable : undefined}
          onValueChange={onToggleIllness}
        />
      </View>
    </>
  );
}
