import { Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

export function MedicineCabinetAddChoiceSheet({
  visible,
  onClose,
  onOpenReferenceCreate,
  onOpenManualCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenReferenceCreate: () => void;
  onOpenManualCreate: () => void;
}) {
  const { locale } = useMobileI18n();
  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      overlayStyle={styles.addChoiceOverlay}
      backdropStyle={styles.addChoiceBackdrop}
      sheetStyle={styles.addChoiceSheetCard}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.addChoiceDragZone} {...panHandlers}>
            <View style={styles.addChoiceHandle} />
            <Text style={styles.addChoiceTitle}>
              {locale === "ru"
                ? "Как добавить препарат"
                : locale === "de"
                  ? "Wie ein Medikament hinzufügen"
                  : locale === "pl"
                    ? "Jak dodać lek"
                    : "How to add a medicine"}
            </Text>
            <Text style={styles.addChoiceSubtitle}>
              {locale === "ru"
                ? "Выберите способ добавления в домашнюю аптечку."
                : locale === "de"
                  ? "Wählen Sie, wie das Medikament zur Hausapotheke hinzugefügt werden soll."
                  : locale === "pl"
                    ? "Wybierz sposób dodania leku do domowej apteczki."
                    : "Choose how to add the medicine to your home cabinet."}
            </Text>
          </View>

          <View style={styles.addChoicePanel}>
            <Pressable
              onPress={() => requestClose(onOpenReferenceCreate)}
              style={({ pressed }) => [
                styles.addChoiceOption,
                pressed ? styles.addChoiceOptionPressed : null,
              ]}
            >
              <View style={styles.addChoiceOptionCopy}>
                <Text style={styles.addChoiceOptionTitle}>
                  {locale === "ru"
                    ? "Из справочника"
                    : locale === "de"
                      ? "Aus dem Katalog"
                      : locale === "pl"
                        ? "Z katalogu"
                        : "From catalog"}
                </Text>
                <Text style={styles.addChoiceOptionHint}>
                  {locale === "ru"
                    ? "Форма, применение и срок после вскрытия подставятся автоматически."
                    : locale === "de"
                      ? "Form, Anwendung und Haltbarkeit nach dem Öffnen werden automatisch ausgefüllt."
                      : locale === "pl"
                        ? "Postać, zastosowanie i termin po otwarciu uzupełnią się automatycznie."
                        : "Form, usage, and after-opening shelf life will be filled in automatically."}
                </Text>
              </View>
              <Text style={styles.addChoiceOptionAction}>
                {locale === "ru"
                  ? "Выбрать"
                  : locale === "de"
                    ? "Wählen"
                    : locale === "pl"
                      ? "Wybierz"
                      : "Choose"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => requestClose(onOpenManualCreate)}
              style={({ pressed }) => [
                styles.addChoiceOption,
                styles.addChoiceOptionLast,
                pressed ? styles.addChoiceOptionPressed : null,
              ]}
            >
              <View style={styles.addChoiceOptionCopy}>
                <Text style={styles.addChoiceOptionTitle}>
                  {locale === "ru"
                    ? "Вручную"
                    : locale === "de"
                      ? "Manuell"
                      : locale === "pl"
                        ? "Ręcznie"
                        : "Manually"}
                </Text>
                <Text style={styles.addChoiceOptionHint}>
                  {locale === "ru"
                    ? "Добавить название, применение и сроки самостоятельно."
                    : locale === "de"
                      ? "Name, Anwendung und Fristen selbst eingeben."
                      : locale === "pl"
                        ? "Dodaj nazwę, zastosowanie i terminy samodzielnie."
                        : "Add the name, usage, and dates yourself."}
                </Text>
              </View>
              <Text style={styles.addChoiceOptionAction}>
                {locale === "ru"
                  ? "Выбрать"
                  : locale === "de"
                    ? "Wählen"
                    : locale === "pl"
                      ? "Wybierz"
                      : "Choose"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </FormBottomSheet>
  );
}
