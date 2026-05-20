import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MobileLocale } from "../i18n/mobileI18n";
import {
  formatBackdatedDate,
  formatBackdatedTime,
  getBackdatedPickerDoneLabel,
  getBackdatedPickerTitle,
  getDaysInMonth,
  getMonths,
  pad2,
  type BackdatedPickerField,
} from "../lib/backdatedDateTime";

type BackdatedDateTimePickerSheetProps = {
  visible: boolean;
  locale: MobileLocale;
  activePickerField: Exclude<BackdatedPickerField, null>;
  pickerDay: number;
  pickerMonthIndex: number;
  pickerYear: number;
  pickerHour: number;
  pickerMinute: number;
  setPickerDay: (value: number) => void;
  setPickerMonthIndex: (value: number) => void;
  setPickerYear: (value: number) => void;
  setPickerHour: (value: number) => void;
  setPickerMinute: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  pastYears?: number;
  futureYears?: number;
};

export function BackdatedDateTimePickerSheet({
  visible,
  locale,
  activePickerField,
  pickerDay,
  pickerMonthIndex,
  pickerYear,
  pickerHour,
  pickerMinute,
  setPickerDay,
  setPickerMonthIndex,
  setPickerYear,
  setPickerHour,
  setPickerMinute,
  onClose,
  onConfirm,
  pastYears = 5,
  futureYears = 0,
}: BackdatedDateTimePickerSheetProps) {
  if (!visible) {
    return null;
  }

  const months = getMonths(locale);
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(currentYear - pastYears, pickerYear);
  const maxYear = Math.max(currentYear + futureYears, pickerYear);
  const yearCount = maxYear - minYear + 1;
  const years =
    futureYears > 0
      ? Array.from({ length: yearCount }, (_, index) => minYear + index)
      : Array.from({ length: yearCount }, (_, index) => maxYear - index);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 12 }, (_, index) => index * 5);
  const availableDays = Array.from(
    { length: getDaysInMonth(pickerYear, pickerMonthIndex) },
    (_, index) => index + 1,
  );
  const title = getBackdatedPickerTitle(locale, activePickerField);
  const doneLabel = getBackdatedPickerDoneLabel(locale);

  return (
    <View style={styles.pickerOverlay}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerSheetHeader}>
          <Text style={styles.pickerSheetTitle}>{title}</Text>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.pickerCloseButton,
              pressed ? styles.pickerCloseButtonPressed : null,
            ]}
          >
            <Text style={styles.pickerCloseButtonText}>{doneLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.datePickerPreview}>
          <Text style={styles.datePickerPreviewText}>
            {activePickerField === "date"
              ? formatBackdatedDate(
                  new Date(pickerYear, pickerMonthIndex, pickerDay),
                  locale,
                )
              : formatBackdatedTime(
                  new Date(2026, 4, 9, pickerHour, pickerMinute),
                )}
          </Text>
        </View>

        <View style={styles.dateColumns}>
          {activePickerField === "date" ? (
            <>
              <ScrollView
                style={styles.dateColumn}
                contentContainerStyle={styles.dateColumnContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {availableDays.map((day) => (
                  <Pressable
                    key={`picker-day-${day}`}
                    onPress={() => setPickerDay(day)}
                    style={[
                      styles.datePill,
                      pickerDay === day ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        pickerDay === day ? styles.datePillTextSelected : null,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.dateColumn}
                contentContainerStyle={styles.dateColumnContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {months.map((month, index) => (
                  <Pressable
                    key={`picker-month-${month}`}
                    onPress={() => setPickerMonthIndex(index)}
                    style={[
                      styles.datePill,
                      pickerMonthIndex === index ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        pickerMonthIndex === index
                          ? styles.datePillTextSelected
                          : null,
                      ]}
                    >
                      {month}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.dateColumn}
                contentContainerStyle={styles.dateColumnContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {years.map((year) => (
                  <Pressable
                    key={`picker-year-${year}`}
                    onPress={() => setPickerYear(year)}
                    style={[
                      styles.datePill,
                      pickerYear === year ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        pickerYear === year ? styles.datePillTextSelected : null,
                      ]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <ScrollView
                style={styles.dateColumn}
                contentContainerStyle={styles.dateColumnContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {hours.map((hour) => (
                  <Pressable
                    key={`picker-hour-${hour}`}
                    onPress={() => setPickerHour(hour)}
                    style={[
                      styles.datePill,
                      pickerHour === hour ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        pickerHour === hour ? styles.datePillTextSelected : null,
                      ]}
                    >
                      {pad2(hour)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.dateColumn}
                contentContainerStyle={styles.dateColumnContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {minutes.map((minute) => (
                  <Pressable
                    key={`picker-minute-${minute}`}
                    onPress={() => setPickerMinute(minute)}
                    style={[
                      styles.datePill,
                      pickerMinute === minute ? styles.datePillSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        pickerMinute === minute
                          ? styles.datePillTextSelected
                          : null,
                      ]}
                    >
                      {pad2(minute)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 70,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30,42,56,0.18)",
  },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFDF9",
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#EBCFC4",
    gap: 12,
  },
  pickerSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pickerSheetTitle: {
    color: "#23364A",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
  },
  pickerCloseButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4EE",
  },
  pickerCloseButtonPressed: {
    opacity: 0.9,
  },
  pickerCloseButtonText: {
    color: "#F26F6C",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
  },
  datePickerPreview: {
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0DDD4",
    backgroundColor: "#FFF8F4",
    alignItems: "center",
  },
  datePickerPreviewText: {
    color: "#23364A",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
  },
  dateColumns: {
    flexDirection: "row",
    gap: 10,
  },
  dateColumn: {
    flex: 1,
    maxHeight: 220,
  },
  dateColumnContent: {
    paddingBottom: 12,
  },
  datePill: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#FFF8F4",
    borderWidth: 1,
    borderColor: "#F0DDD4",
  },
  datePillSelected: {
    backgroundColor: "#FFEDE7",
    borderColor: "#F38A7B",
  },
  datePillText: {
    color: "#6F7E8D",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  datePillTextSelected: {
    color: "#23364A",
  },
});
