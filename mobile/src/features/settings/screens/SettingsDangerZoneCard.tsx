import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import { styles } from "./settingsScreenStyles";

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
