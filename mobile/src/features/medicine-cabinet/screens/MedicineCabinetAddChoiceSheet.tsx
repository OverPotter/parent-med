import { Pressable, Text, View } from "react-native";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
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
            <Text style={styles.addChoiceTitle}>Как добавить препарат</Text>
            <Text style={styles.addChoiceSubtitle}>
              Выберите способ добавления в домашнюю аптечку.
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
                <Text style={styles.addChoiceOptionTitle}>Из справочника</Text>
                <Text style={styles.addChoiceOptionHint}>
                  Форма, применение и срок после вскрытия подставятся автоматически.
                </Text>
              </View>
              <Text style={styles.addChoiceOptionAction}>Выбрать</Text>
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
                <Text style={styles.addChoiceOptionTitle}>Вручную</Text>
                <Text style={styles.addChoiceOptionHint}>
                  Добавить название, применение и сроки самостоятельно.
                </Text>
              </View>
              <Text style={styles.addChoiceOptionAction}>Выбрать</Text>
            </Pressable>
          </View>
        </>
      )}
    </FormBottomSheet>
  );
}
