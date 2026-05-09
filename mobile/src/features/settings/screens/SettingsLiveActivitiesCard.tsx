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
          onValueChange={onToggleIllness}
        />
      </View>
    </>
  );
}
