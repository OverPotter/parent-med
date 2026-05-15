import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { PillboxDraftMedicine } from "../model/pillboxPlanOnboarding";
import { Hero } from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxReviewStepSection({
  recipientTitle,
  medicines,
  onOpenRecipients,
  buildMedicineLines,
}: {
  recipientTitle: string;
  medicines: PillboxDraftMedicine[];
  onOpenRecipients: () => void;
  buildMedicineLines: (medicine: PillboxDraftMedicine) => string[];
}) {
  return (
    <>
      <Hero
        title="Проверьте план"
        subtitle="Убедитесь, что всё верно. Вы сможете изменить план в любое время."
      />
      <Pressable
        onPress={onOpenRecipients}
        style={({ pressed }) => [
          styles.summaryCard,
          styles.summaryActionCard,
          { marginTop: 24 },
          pressed ? styles.backLinkPressed : null,
        ]}
      >
        <View style={styles.summaryActionCopy}>
          <Text style={styles.summaryTitle}>Кому придут уведомления</Text>
          <Text style={[styles.summaryHint, { marginTop: 4 }]}>
            {recipientTitle}
          </Text>
        </View>
        <Text style={styles.chevronText}>›</Text>
      </Pressable>
      <View style={styles.reviewMedicineSection}>
        <View style={styles.reviewMedicineHeader}>
          <Text style={styles.sectionTitle}>Лекарства в плане</Text>
          <View style={styles.reviewMedicineCountChip}>
            <Text style={styles.reviewMedicineCountChipText}>{medicines.length}</Text>
          </View>
        </View>
        <View style={styles.reviewMedicineNameList}>
          {medicines.map((medicine, index) => (
            <View
              key={medicine.id}
              style={[
                styles.reviewMedicineSummaryCard,
                index % 3 === 0
                  ? styles.reviewMedicineSummaryCardBlue
                  : index % 3 === 1
                    ? styles.reviewMedicineSummaryCardPeach
                    : styles.reviewMedicineSummaryCardMint,
              ]}
            >
              <View style={styles.reviewMedicineNameCopy}>
                <Text style={styles.medicineTitle}>{medicine.name}</Text>
                <Text style={styles.reviewMedicineNameHint}>
                  {buildMedicineLines(medicine)[0]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.privacyNote}>
        <MaterialCommunityIcons name="lock-outline" size={16} color="#8A94A6" />
        <Text style={styles.privacyText}>
          План сохраняется только у вас и не передаётся третьим лицам.
        </Text>
      </View>
    </>
  );
}
