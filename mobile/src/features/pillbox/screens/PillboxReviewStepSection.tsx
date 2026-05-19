import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { PillboxDraftMedicine } from "../model/pillboxPlanOnboarding";
import { Hero } from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxReviewStepSection({
  locale,
  recipientTitle,
  medicines,
  onOpenRecipients,
  buildMedicineLines,
}: {
  locale: MobileLocale;
  recipientTitle: string;
  medicines: PillboxDraftMedicine[];
  onOpenRecipients: () => void;
  buildMedicineLines: (medicine: PillboxDraftMedicine) => string[];
}) {
  const title =
    locale === "ru"
      ? "Проверьте план"
      : locale === "de"
        ? "Plan prüfen"
        : locale === "pl"
          ? "Sprawdź plan"
          : "Review the plan";
  const subtitle =
    locale === "ru"
      ? "Убедитесь, что всё верно. Вы сможете изменить план в любое время."
      : locale === "de"
        ? "Prüfen Sie, ob alles stimmt. Sie können den Plan später jederzeit ändern."
        : locale === "pl"
          ? "Upewnij się, że wszystko się zgadza. Plan można później zmienić."
          : "Make sure everything looks right. You can edit the plan later.";
  const notificationsTitle =
    locale === "ru"
      ? "Кому придут уведомления"
      : locale === "de"
        ? "Wer Benachrichtigungen erhält"
        : locale === "pl"
          ? "Kto dostanie powiadomienia"
          : "Who will get notifications";
  const medicinesTitle =
    locale === "ru"
      ? "Лекарства в плане"
      : locale === "de"
        ? "Medikamente im Plan"
        : locale === "pl"
          ? "Leki w planie"
          : "Medicines in plan";
  const privacyText =
    locale === "ru"
      ? "План сохраняется только у вас и не передаётся третьим лицам."
      : locale === "de"
        ? "Der Plan wird nur in Ihrem Konto gespeichert und nicht an Dritte weitergegeben."
        : locale === "pl"
          ? "Plan jest zapisany tylko na Twoim koncie i nie jest udostępniany osobom trzecim."
          : "The plan is stored only in your account and is not shared with third parties.";
  return (
    <>
      <Hero title={title} subtitle={subtitle} />
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
          <Text style={styles.summaryTitle}>{notificationsTitle}</Text>
          <Text style={[styles.summaryHint, { marginTop: 4 }]}>
            {recipientTitle}
          </Text>
        </View>
        <Text style={styles.chevronText}>›</Text>
      </Pressable>
      <View style={styles.reviewMedicineSection}>
        <View style={styles.reviewMedicineHeader}>
          <Text style={styles.sectionTitle}>{medicinesTitle}</Text>
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
          {privacyText}
        </Text>
      </View>
    </>
  );
}
