import { Image, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { resolveMedicineFormIcon } from "../../medicine-cabinet/model/medicineCabinetOverviewModel";
import {
  formatMedicineSummary,
  type PillboxDraftMedicine,
} from "../model/pillboxPlanOnboarding";
import { Hero } from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxMedicineListStepSection({
  locale,
  medicines,
  onAddMedicine,
  onOpenMedicine,
}: {
  locale: MobileLocale;
  medicines: PillboxDraftMedicine[];
  onAddMedicine: () => void;
  onOpenMedicine: (medicine: PillboxDraftMedicine) => void;
}) {
  const title = locale === "ru" ? "Что будем принимать?" : "What will we take?";
  const subtitle =
    locale === "ru"
      ? "Добавьте все лекарства и витамины, которые нужно принимать."
      : "Add all medicines and vitamins that should be taken.";
  const inPlanLabel =
    locale === "ru" ? `В плане (${medicines.length})` : `In plan (${medicines.length})`;
  const addLabel = locale === "ru" ? "Добавить лекарство" : "Add medicine";
  const emptyTitle = locale === "ru" ? "Пока пусто" : "Nothing here yet";
  const emptyHint =
    locale === "ru"
      ? "Сначала добавьте первое лекарство, и оно появится в этом списке."
      : "Add the first medicine and it will appear in this list.";
  return (
    <>
      <Hero title={title} subtitle={subtitle} />
      <View style={styles.sectionWrap}>
        {medicines.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              {inPlanLabel}
            </Text>

            <View style={styles.medicineListBlock}>
              <Pressable
                onPress={onAddMedicine}
                style={({ pressed }) => [
                  styles.addMedicineInlineRow,
                  pressed ? styles.backLinkPressed : null,
                ]}
              >
                <Text style={styles.addMedicineLabel}>{addLabel}</Text>
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
              <Text style={styles.addMedicineLabel}>{addLabel}</Text>
              <View style={styles.addMedicinePlusWrap}>
                <Text style={styles.addMedicinePlusText}>+</Text>
              </View>
            </Pressable>
            <View style={styles.medicineEmptyState}>
              <Text style={styles.summaryTitle}>{emptyTitle}</Text>
              <Text style={[styles.privacyText, { marginTop: 4 }]}>
                {emptyHint}
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
