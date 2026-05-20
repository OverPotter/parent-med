import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { styles } from "./medicineCabinetReferenceCreateScreenStyles";

export function ReferenceCatalogEmptyState({
  iconName,
  iconColor,
  title,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyArt}>
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>{title}</Text>
      </View>
    </View>
  );
}
