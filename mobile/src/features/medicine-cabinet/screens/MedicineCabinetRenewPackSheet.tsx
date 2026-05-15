import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import { formatBackdatedDate } from "../../../shared/lib/backdatedDateTime";
import type { MedicineCardItem } from "../model/medicineCabinetOverviewModel";
import { formatIsoDate, parseIsoDate } from "../model/manualMedicineCreateFlow";
import { medicineCabinetOverviewStyles as styles } from "./medicineCabinetOverviewScreenStyles";

export function MedicineCabinetRenewPackSheet({
  item,
  visible,
  onClose,
  onSave,
}: {
  item: MedicineCardItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (payload: { expiryDate: string; openedDate: string | null }) => void;
}) {
  const expiryPicker = useBackdatedDateTimePicker(new Date());
  const openedPicker = useBackdatedDateTimePicker(new Date());
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewOpenedDate, setRenewOpenedDate] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const reopenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReopenTimeout = () => {
    if (reopenTimeoutRef.current) {
      clearTimeout(reopenTimeoutRef.current);
      reopenTimeoutRef.current = null;
    }
  };

  const reopenSheetAfterPicker = () => {
    clearReopenTimeout();
    reopenTimeoutRef.current = setTimeout(() => {
      setIsSheetOpen(true);
      reopenTimeoutRef.current = null;
    }, 220);
  };

  useEffect(() => {
    clearReopenTimeout();

    if (!visible || !item) {
      setIsSheetOpen(false);
      expiryPicker.closePicker();
      openedPicker.closePicker();
      return;
    }

    setIsSheetOpen(true);
    setRenewExpiryDate(item.raw.expiryDate ?? "");
    setRenewOpenedDate(item.raw.openedAt ? item.raw.openedAt.slice(0, 10) : "");
  }, [item, visible]);

  useEffect(() => () => clearReopenTimeout(), []);

  const expiryDateLabel = renewExpiryDate
    ? formatBackdatedDate(parseIsoDate(renewExpiryDate, new Date()), "ru")
    : "";
  const openedDateLabel = renewOpenedDate
    ? formatBackdatedDate(parseIsoDate(renewOpenedDate, new Date()), "ru")
    : "";

  const handleOpenRenewExpiryDatePicker = () => {
    clearReopenTimeout();
    expiryPicker.reset(parseIsoDate(renewExpiryDate, new Date()));
    setIsSheetOpen(false);
    reopenTimeoutRef.current = setTimeout(() => {
      expiryPicker.openPicker("date");
      reopenTimeoutRef.current = null;
    }, 220);
  };

  const handleOpenRenewOpenedDatePicker = () => {
    clearReopenTimeout();
    openedPicker.reset(parseIsoDate(renewOpenedDate, new Date()));
    setIsSheetOpen(false);
    reopenTimeoutRef.current = setTimeout(() => {
      openedPicker.openPicker("date");
      reopenTimeoutRef.current = null;
    }, 220);
  };

  const handleConfirmRenewExpiryDatePicker = () => {
    const next = new Date(expiryPicker.selectedDate);
    next.setFullYear(
      expiryPicker.pickerYear,
      expiryPicker.pickerMonthIndex,
      expiryPicker.pickerDay,
    );
    expiryPicker.setSelectedDate(next);
    setRenewExpiryDate(formatIsoDate(next));
    expiryPicker.confirmPicker();
    reopenSheetAfterPicker();
  };

  const handleConfirmRenewOpenedDatePicker = () => {
    const next = new Date(openedPicker.selectedDate);
    next.setFullYear(
      openedPicker.pickerYear,
      openedPicker.pickerMonthIndex,
      openedPicker.pickerDay,
    );
    openedPicker.setSelectedDate(next);
    setRenewOpenedDate(formatIsoDate(next));
    openedPicker.confirmPicker();
    reopenSheetAfterPicker();
  };

  const handleSaveRenewPack = () => {
    if (!renewExpiryDate) {
      return;
    }

    onSave({
      expiryDate: renewExpiryDate,
      openedDate: renewOpenedDate || null,
    });
  };

  return (
    <>
      <FormBottomSheet
        visible={visible && isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          onClose();
        }}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.customValueSheetCard}
      >
        {({ panHandlers: sheetPanHandlers, requestClose }) => (
          <>
            <View style={styles.sheetDragZone} {...sheetPanHandlers}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Новая упаковка</Text>
              <Text style={styles.sheetSubtitle}>
                Укажите новые даты для этой упаковки.
              </Text>
            </View>

            <View style={styles.detailsSheetFields}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Срок годности</Text>
                <Pressable onPress={handleOpenRenewExpiryDatePicker} style={styles.dateRow}>
                  <Text
                    style={[
                      styles.dateText,
                      !expiryDateLabel ? styles.datePlaceholderText : null,
                    ]}
                  >
                    {expiryDateLabel || "Выберите дату"}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                </Pressable>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Дата вскрытия</Text>
                <Pressable onPress={handleOpenRenewOpenedDatePicker} style={styles.dateRow}>
                  <Text
                    style={[
                      styles.dateText,
                      !openedDateLabel ? styles.datePlaceholderText : null,
                    ]}
                  >
                    {openedDateLabel || "Выберите дату"}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                </Pressable>
              </View>
            </View>

            <View style={styles.customValueActions}>
              <Pressable
                onPress={() => requestClose()}
                style={({ pressed }) => [
                  styles.customValueCancelButton,
                  pressed ? styles.secondaryButtonPressed : null,
                ]}
              >
                <Text style={styles.customValueCancelText}>Отмена</Text>
              </Pressable>

              <Pressable
                onPress={() => requestClose(handleSaveRenewPack)}
                style={({ pressed }) => [
                  styles.customValueSaveButton,
                  pressed ? styles.primaryButtonPressed : null,
                ]}
              >
                <LinearGradient
                  colors={["#F56565", "#EF4F4F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.customValueSaveGradient}
                />
                <Text style={styles.customValueSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>

      {expiryPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale="ru"
          pastYears={3}
          futureYears={12}
          activePickerField={expiryPicker.activePickerField}
          pickerDay={expiryPicker.pickerDay}
          pickerMonthIndex={expiryPicker.pickerMonthIndex}
          pickerYear={expiryPicker.pickerYear}
          pickerHour={expiryPicker.pickerHour}
          pickerMinute={expiryPicker.pickerMinute}
          setPickerDay={expiryPicker.setPickerDay}
          setPickerMonthIndex={expiryPicker.setPickerMonthIndex}
          setPickerYear={expiryPicker.setPickerYear}
          setPickerHour={expiryPicker.setPickerHour}
          setPickerMinute={expiryPicker.setPickerMinute}
          onClose={() => {
            expiryPicker.closePicker();
            reopenSheetAfterPicker();
          }}
          onConfirm={handleConfirmRenewExpiryDatePicker}
        />
      ) : null}

      {openedPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale="ru"
          activePickerField={openedPicker.activePickerField}
          pickerDay={openedPicker.pickerDay}
          pickerMonthIndex={openedPicker.pickerMonthIndex}
          pickerYear={openedPicker.pickerYear}
          pickerHour={openedPicker.pickerHour}
          pickerMinute={openedPicker.pickerMinute}
          setPickerDay={openedPicker.setPickerDay}
          setPickerMonthIndex={openedPicker.setPickerMonthIndex}
          setPickerYear={openedPicker.setPickerYear}
          setPickerHour={openedPicker.setPickerHour}
          setPickerMinute={openedPicker.setPickerMinute}
          onClose={() => {
            openedPicker.closePicker();
            reopenSheetAfterPicker();
          }}
          onConfirm={handleConfirmRenewOpenedDatePicker}
        />
      ) : null}
    </>
  );
}
