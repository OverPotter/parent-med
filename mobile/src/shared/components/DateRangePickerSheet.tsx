import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MobileLocale } from "../i18n/mobileI18n";
import {
  formatDateRangeLabel,
  normalizeDateRange,
  parseDateOnlyIso,
  type DateRangeValue,
} from "../lib/dateRange";
import { FormBottomSheet } from "./FormBottomSheet";
import { journalTypography } from "../theme/journalTypography";

type DateRangePickerSheetProps = {
  visible: boolean;
  locale: MobileLocale;
  title: string;
  subtitle: string;
  initialRange: DateRangeValue;
  onClose: () => void;
  onApply: (range: DateRangeValue) => void;
};

type ActiveField = "start" | "end";

export function DateRangePickerSheet({
  visible,
  locale,
  title,
  subtitle,
  initialRange,
  onClose,
  onApply,
}: DateRangePickerSheetProps) {
  const [activeField, setActiveField] = useState<ActiveField>("start");
  const [selectedStartDate, setSelectedStartDate] = useState(initialRange.startDate);
  const [selectedEndDate, setSelectedEndDate] = useState(initialRange.endDate);
  const activeDate = activeField === "start" ? selectedStartDate : selectedEndDate;
  const parsedActiveDate = parseDateOnlyIso(activeDate);
  const [selectedDay, setSelectedDay] = useState(parsedActiveDate.getDate());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    parsedActiveDate.getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState(parsedActiveDate.getFullYear());

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedStartDate(initialRange.startDate);
    setSelectedEndDate(initialRange.endDate);
    setActiveField("start");
  }, [initialRange.endDate, initialRange.startDate, visible]);

  useEffect(() => {
    const nextDate = parseDateOnlyIso(activeDate);
    setSelectedDay(nextDate.getDate());
    setSelectedMonthIndex(nextDate.getMonth());
    setSelectedYear(nextDate.getFullYear());
  }, [activeDate]);

  const months = useMemo(() => getMonths(locale), [locale]);
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 8 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const previewRange = normalizeDateRange({
    startDate: selectedStartDate,
    endDate: selectedEndDate,
  });

  const commitFieldDate = (nextDay: number, nextMonthIndex: number, nextYear: number) => {
    const clampedDay = Math.min(nextDay, getDaysInMonth(nextYear, nextMonthIndex));
    const nextDate = new Date(nextYear, nextMonthIndex, clampedDay, 12, 0, 0, 0);
    const nextIso = [
      nextDate.getFullYear(),
      String(nextDate.getMonth() + 1).padStart(2, "0"),
      String(nextDate.getDate()).padStart(2, "0"),
    ].join("-");

    if (activeField === "start") {
      setSelectedStartDate(nextIso);
      return;
    }

    setSelectedEndDate(nextIso);
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    commitFieldDate(day, selectedMonthIndex, selectedYear);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonthIndex(monthIndex);
    commitFieldDate(selectedDay, monthIndex, selectedYear);
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    commitFieldDate(selectedDay, selectedMonthIndex, year);
  };

  return (
    <FormBottomSheet
      visible={visible}
      onClose={onClose}
      sheetStyle={styles.sheetCard}
      overlayStyle={styles.sheetOverlay}
      backdropStyle={styles.sheetBackdrop}
    >
      {({ panHandlers, requestClose }) => (
        <>
          <View style={styles.sheetDragZone} {...panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetSubtitle}>{subtitle}</Text>
          </View>

          <View style={styles.rangeFieldsRow}>
            <RangeFieldCard
              active={activeField === "start"}
              label={localizeStartLabel(locale)}
              value={formatSingleDate(selectedStartDate, locale)}
              onPress={() => setActiveField("start")}
            />
            <RangeFieldCard
              active={activeField === "end"}
              label={localizeEndLabel(locale)}
              value={formatSingleDate(selectedEndDate, locale)}
              onPress={() => setActiveField("end")}
            />
          </View>

          <View style={styles.rangePreview}>
            <Text style={styles.rangePreviewText}>
              {formatDateRangeLabel(previewRange, locale)}
            </Text>
          </View>

          <View style={styles.dateColumns}>
            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => handleSelectDay(day)}
                  style={[styles.datePill, selectedDay === day ? styles.datePillSelected : null]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedDay === day ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {months.map((month, index) => (
                <Pressable
                  key={`month-${month}`}
                  onPress={() => handleSelectMonth(index)}
                  style={[
                    styles.datePill,
                    selectedMonthIndex === index ? styles.datePillSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedMonthIndex === index ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false} bounces={false}>
              {years.map((year) => (
                <Pressable
                  key={`year-${year}`}
                  onPress={() => handleSelectYear(year)}
                  style={[
                    styles.datePill,
                    selectedYear === year ? styles.datePillSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      selectedYear === year ? styles.datePillTextSelected : null,
                    ]}
                  >
                    {year}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable
            onPress={() =>
              requestClose(() => onApply(normalizeDateRange(previewRange)))
            }
            style={({ pressed }) => [
              styles.applyButton,
              pressed ? styles.applyButtonPressed : null,
            ]}
          >
            <LinearGradient
              colors={["#FF8D79", "#F76961"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.applyGradient}
            />
            <Text style={styles.applyLabel}>{localizeApplyLabel(locale)}</Text>
          </Pressable>
        </>
      )}
    </FormBottomSheet>
  );
}

function RangeFieldCard({
  active,
  label,
  value,
  onPress,
}: {
  active: boolean;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fieldCard, active ? styles.fieldCardActive : null]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </Pressable>
  );
}

function formatSingleDate(value: string, locale: MobileLocale) {
  const date = parseDateOnlyIso(value);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getMonths(locale: MobileLocale) {
  if (locale === "ru") {
    return ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  }
  if (locale === "de") {
    return ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  }
  if (locale === "pl") {
    return ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  }
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

function localizeStartLabel(locale: MobileLocale) {
  if (locale === "ru") return "С";
  if (locale === "de") return "Von";
  if (locale === "pl") return "Od";
  return "From";
}

function localizeEndLabel(locale: MobileLocale) {
  if (locale === "ru") return "По";
  if (locale === "de") return "Bis";
  if (locale === "pl") return "Do";
  return "To";
}

function localizeApplyLabel(locale: MobileLocale) {
  if (locale === "ru") return "Применить";
  if (locale === "de") return "Anwenden";
  if (locale === "pl") return "Zastosuj";
  return "Apply";
}

function resolveLocale(locale: MobileLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}

const styles = StyleSheet.create({
  sheetOverlay: {
    backgroundColor: "rgba(28, 24, 20, 0.08)",
  },
  sheetBackdrop: {
    backgroundColor: "transparent",
  },
  sheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#F0D8CD",
  },
  sheetDragZone: {
    alignItems: "center",
    paddingBottom: 10,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E6CFC4",
    marginBottom: 12,
  },
  sheetTitle: {
    color: "#1E2A38",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: journalTypography.display,
  },
  sheetSubtitle: {
    color: "#768494",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    fontFamily: journalTypography.body,
    marginTop: 4,
  },
  rangeFieldsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  fieldCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECD8D0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldCardActive: {
    borderColor: "#F3A08D",
    backgroundColor: "#FFF0EA",
  },
  fieldLabel: {
    color: "#7E8A96",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontFamily: journalTypography.body,
    marginBottom: 4,
  },
  fieldValue: {
    color: "#243243",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  rangePreview: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DED4",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  rangePreviewText: {
    color: "#203041",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    fontFamily: journalTypography.display,
  },
  dateColumns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    maxHeight: 240,
  },
  dateColumn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEDCD4",
    backgroundColor: "#FFFFFF",
    padding: 8,
  },
  datePill: {
    minHeight: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  datePillSelected: {
    backgroundColor: "#FFE8E0",
  },
  datePillText: {
    color: "#4A5B6E",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: journalTypography.body,
  },
  datePillTextSelected: {
    color: "#F76961",
    fontWeight: "700",
  },
  applyButton: {
    minHeight: 54,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  applyGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  applyLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    fontFamily: journalTypography.body,
  },
});
