import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { SwipeToDeleteRow } from "../../../shared/components/SwipeToDeleteRow";
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
  onRemoveMedicine,
}: {
  locale: MobileLocale;
  medicines: PillboxDraftMedicine[];
  onAddMedicine: () => void;
  onOpenMedicine: (medicine: PillboxDraftMedicine) => void;
  onRemoveMedicine: (medicineId: string) => void;
}) {
  const [openMedicineId, setOpenMedicineId] = useState<string | null>(null);
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
  const deleteDialogTitle =
    locale === "ru" ? "Удалить лекарство?" : "Delete medicine?";
  const deleteDialogMessage = (medicineName: string) =>
    locale === "ru"
      ? `Карточка «${medicineName}» исчезнет из этого плана.`
      : `"${medicineName}" will be removed from this plan.`;
  const cancelLabel = locale === "ru" ? "Отмена" : "Cancel";
  const deleteLabel = locale === "ru" ? "Удалить" : "Delete";

  const handleRequestDeleteMedicine = (medicine: PillboxDraftMedicine) => {
    Alert.alert(deleteDialogTitle, deleteDialogMessage(medicine.name), [
      {
        text: cancelLabel,
        style: "cancel",
        onPress: () => setOpenMedicineId(null),
      },
      {
        text: deleteLabel,
        style: "destructive",
        onPress: () => {
          setOpenMedicineId(null);
          onRemoveMedicine(medicine.id);
        },
      },
    ]);
  };
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
                  <Feather
                    name="plus"
                    size={18}
                    color={styles.addMedicinePlusText.color}
                  />
                </View>
              </Pressable>
              {medicines.map((medicine, index) => (
                <SwipeToDeleteRow
                  key={medicine.id}
                  onDelete={() => handleRequestDeleteMedicine(medicine)}
                  onPress={() => onOpenMedicine(medicine)}
                  isOpen={openMedicineId === medicine.id}
                  onOpenChange={(isOpen) =>
                    setOpenMedicineId(isOpen ? medicine.id : null)
                  }
                  deleteLabel={deleteLabel}
                  actionWidth={94}
                  borderRadius={0}
                >
                  <View
                    style={[
                      styles.medicineRow,
                      index === medicines.length - 1 ? styles.medicineRowLast : null,
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
                  </View>
                </SwipeToDeleteRow>
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
                <Feather
                  name="plus"
                  size={18}
                  color={styles.addMedicinePlusText.color}
                />
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
