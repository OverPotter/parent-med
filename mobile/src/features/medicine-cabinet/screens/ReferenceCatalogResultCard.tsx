import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import type { MobileMedicineCatalogItem } from "../api/mobileMedicineCatalogApi";
import { resolveMedicineFormIcon } from "../model/medicineCabinetOverviewModel";
import { styles } from "./medicineCabinetReferenceCreateScreenStyles";

export function ReferenceCatalogResultCard({
  item,
  isSelected,
  onToggle,
  onContinue,
}: {
  item: MobileMedicineCatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  onContinue: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.resultCard,
        isSelected ? styles.resultCardSelected : null,
      ]}
    >
      <View style={styles.resultRow}>
        <View
          style={[
            styles.resultArt,
            {
              backgroundColor: isSelected ? "#F1EBFF" : "#F6FBFF",
            },
          ]}
        >
          <Image
            source={resolveMedicineFormIcon(item.form)}
            style={styles.resultArtImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.resultCopy}>
          <Text style={styles.resultTitle}>{item.name}</Text>
          <Text style={styles.resultSubtitle}>
            {[item.form, item.concentration].filter(Boolean).join(" · ")}
          </Text>
          <View style={styles.resultMetaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{item.form}</Text>
            </View>
            {item.defaultOpenedShelfDays ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  После вскрытия {item.defaultOpenedShelfDays} дн.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons
          name={isSelected ? "chevron-up" : "chevron-down"}
          size={18}
          color="#B79A91"
        />
      </View>

      {isSelected ? (
        <View style={styles.resultExpandedBlock}>
          {item.description ? (
            <Text style={styles.resultExpandedText}>{item.description}</Text>
          ) : null}

          {item.dosage ? (
            <View style={styles.resultExpandedInline}>
              <Text style={styles.resultExpandedLabel}>Как применять</Text>
              <Text style={styles.resultExpandedText}>{item.dosage}</Text>
            </View>
          ) : null}

          <Text style={styles.resultExpandedHint}>
            Нажмите «Далее», чтобы проверить сроки и добавить упаковку в аптечку.
          </Text>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.resultExpandedAction,
              pressed ? styles.resultExpandedActionPressed : null,
            ]}
          >
            <Text style={styles.resultExpandedActionText}>Далее</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}
