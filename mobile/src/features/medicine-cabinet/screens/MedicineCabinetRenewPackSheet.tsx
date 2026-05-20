import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BackdatedDateTimePickerSheet } from "../../../shared/components/BackdatedDateTimePickerSheet";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import { useBackdatedDateTimePicker } from "../../../shared/hooks/useBackdatedDateTimePicker";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
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
  const { locale } = useMobileI18n();
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
    ? formatBackdatedDate(parseIsoDate(renewExpiryDate, new Date()), locale)
    : "";
  const openedDateLabel = renewOpenedDate
    ? formatBackdatedDate(parseIsoDate(renewOpenedDate, new Date()), locale)
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
              <Text style={styles.sheetTitle}>
                {locale === "ru"
                  ? "Новая упаковка"
                  : locale === "de"
                    ? "Neue Packung"
                    : locale === "pl"
                      ? "Nowe opakowanie"
                      : "New pack"}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {locale === "ru"
                  ? "Укажите новые даты для этой упаковки."
                  : locale === "de"
                    ? "Geben Sie neue Daten für diese Packung an."
                    : locale === "pl"
                      ? "Podaj nowe daty dla tego opakowania."
                      : "Set the new dates for this pack."}
              </Text>
            </View>

            <View style={styles.detailsSheetFields}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {locale === "ru"
                    ? "Срок годности"
                    : locale === "de"
                      ? "Ablaufdatum"
                      : locale === "pl"
                        ? "Termin ważności"
                        : "Expiry date"}
                </Text>
                <Pressable onPress={handleOpenRenewExpiryDatePicker} style={styles.dateRow}>
                  <Text
                    style={[
                      styles.dateText,
                      !expiryDateLabel ? styles.datePlaceholderText : null,
                    ]}
                  >
                    {expiryDateLabel ||
                      (locale === "ru"
                        ? "Выберите дату"
                        : locale === "de"
                          ? "Datum wählen"
                          : locale === "pl"
                            ? "Wybierz datę"
                            : "Choose a date")}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#8A94A6" />
                </Pressable>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {locale === "ru"
                    ? "Дата вскрытия"
                    : locale === "de"
                      ? "Öffnungsdatum"
                      : locale === "pl"
                        ? "Data otwarcia"
                        : "Opened on"}
                </Text>
                <Pressable onPress={handleOpenRenewOpenedDatePicker} style={styles.dateRow}>
                  <Text
                    style={[
                      styles.dateText,
                      !openedDateLabel ? styles.datePlaceholderText : null,
                    ]}
                  >
                    {openedDateLabel ||
                      (locale === "ru"
                        ? "Выберите дату"
                        : locale === "de"
                          ? "Datum wählen"
                          : locale === "pl"
                            ? "Wybierz datę"
                            : "Choose a date")}
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
                <Text style={styles.customValueCancelText}>
                  {locale === "ru"
                    ? "Отмена"
                    : locale === "de"
                      ? "Abbrechen"
                      : locale === "pl"
                        ? "Anuluj"
                        : "Cancel"}
                </Text>
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
                <Text style={styles.customValueSaveText}>
                  {locale === "ru"
                    ? "Сохранить"
                    : locale === "de"
                      ? "Speichern"
                      : locale === "pl"
                        ? "Zapisz"
                        : "Save"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </FormBottomSheet>

      {expiryPicker.activePickerField ? (
        <BackdatedDateTimePickerSheet
          visible
          locale={locale}
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
          locale={locale}
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
