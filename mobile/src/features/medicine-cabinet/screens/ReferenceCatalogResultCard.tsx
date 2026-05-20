import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
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
  const { locale } = useMobileI18n();
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
                  {locale === "ru"
                    ? `После вскрытия ${item.defaultOpenedShelfDays} дн.`
                    : locale === "de"
                      ? `Nach dem Öffnen ${item.defaultOpenedShelfDays} Tg.`
                      : locale === "pl"
                        ? `Po otwarciu ${item.defaultOpenedShelfDays} dni`
                        : `After opening ${item.defaultOpenedShelfDays} days`}
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
              <Text style={styles.resultExpandedLabel}>
                {locale === "ru"
                  ? "Как применять"
                  : locale === "de"
                    ? "Anwendung"
                    : locale === "pl"
                      ? "Jak stosować"
                      : "How to use"}
              </Text>
              <Text style={styles.resultExpandedText}>{item.dosage}</Text>
            </View>
          ) : null}

          <Text style={styles.resultExpandedHint}>
            {locale === "ru"
              ? "Нажмите «Далее», чтобы проверить сроки и добавить упаковку в аптечку."
              : locale === "de"
                ? "Tippen Sie auf „Weiter“, um Daten zu prüfen und die Packung hinzuzufügen."
                : locale === "pl"
                  ? "Naciśnij „Dalej”, aby sprawdzić terminy i dodać opakowanie do apteczki."
                  : 'Tap "Next" to review dates and add the pack to your cabinet.'}
          </Text>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.resultExpandedAction,
              pressed ? styles.resultExpandedActionPressed : null,
            ]}
          >
            <Text style={styles.resultExpandedActionText}>
              {locale === "ru"
                ? "Далее"
                : locale === "de"
                  ? "Weiter"
                  : locale === "pl"
                    ? "Dalej"
                    : "Next"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}
