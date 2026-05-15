import { Image, Pressable, Text, View } from "react-native";
import { resolveMedicineFormIcon } from "../../medicine-cabinet/model/medicineCabinetOverviewModel";
import {
  formatMedicineSummary,
  type PillboxDraftMedicine,
} from "../model/pillboxPlanOnboarding";
import { Hero } from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxMedicineListStepSection({
  medicines,
  onAddMedicine,
  onOpenMedicine,
}: {
  medicines: PillboxDraftMedicine[];
  onAddMedicine: () => void;
  onOpenMedicine: (medicine: PillboxDraftMedicine) => void;
}) {
  return (
    <>
      <Hero
        title="Что будем принимать?"
        subtitle="Добавьте все лекарства и витамины, которые нужно принимать."
      />
      <View style={styles.sectionWrap}>
        {medicines.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              В плане ({medicines.length})
            </Text>

            <View style={styles.medicineListBlock}>
              <Pressable
                onPress={onAddMedicine}
                style={({ pressed }) => [
                  styles.addMedicineInlineRow,
                  pressed ? styles.backLinkPressed : null,
                ]}
              >
                <Text style={styles.addMedicineLabel}>Добавить лекарство</Text>
                <View style={styles.addMedicinePlusWrap}>
                  <Text style={styles.addMedicinePlusText}>+</Text>
                </View>
              </Pressable>
              {medicines.map((medicine, index) => (
                <View
                  key={medicine.id}
                  style={[
                    styles.medicineRow,
                    index === medicines.length - 1 ? styles.medicineRowLast : null,
                  ]}
                >
                  <Pressable
                    onPress={() => onOpenMedicine(medicine)}
                    style={({ pressed }) => [
                      styles.medicineRowPressable,
                      pressed ? styles.backLinkPressed : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.medicineIconWrap,
                        { backgroundColor: index % 2 === 0 ? "#FFF0E8" : "#FFF0D9" },
                      ]}
                    >
                      <Image
                        source={resolveMedicineFormIcon()}
                        style={styles.medicineIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.medicineCopy}>
                      <Text style={styles.medicineTitle}>{medicine.name}</Text>
                      <Text style={styles.medicineSubtitle}>
                        {formatMedicineSummary(medicine)}
                      </Text>
                    </View>
                    <Text style={styles.chevronText}>›</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.medicineListBlock}>
            <Pressable
              onPress={onAddMedicine}
              style={({ pressed }) => [
                styles.addMedicineInlineRow,
                pressed ? styles.backLinkPressed : null,
              ]}
            >
              <Text style={styles.addMedicineLabel}>Добавить лекарство</Text>
              <View style={styles.addMedicinePlusWrap}>
                <Text style={styles.addMedicinePlusText}>+</Text>
              </View>
            </Pressable>
            <View style={styles.medicineEmptyState}>
              <Text style={styles.summaryTitle}>Пока пусто</Text>
              <Text style={[styles.privacyText, { marginTop: 4 }]}>
                Сначала добавьте первое лекарство, и оно появится в этом списке.
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
