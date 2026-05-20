import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import {
  getDaysInMonth,
  type BackdatedPickerField,
} from "../lib/backdatedDateTime";

export function useBackdatedDateTimePicker(initialDate: Date) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activePickerField, setActivePickerField] =
    useState<BackdatedPickerField>(null);
  const [pickerDay, setPickerDay] = useState(initialDate.getDate());
  const [pickerMonthIndex, setPickerMonthIndex] = useState(initialDate.getMonth());
  const [pickerYear, setPickerYear] = useState(initialDate.getFullYear());
  const [pickerHour, setPickerHour] = useState(initialDate.getHours());
  const [pickerMinute, setPickerMinute] = useState(initialDate.getMinutes());

  const syncPickerFromDate = useCallback((date: Date) => {
    setPickerDay(date.getDate());
    setPickerMonthIndex(date.getMonth());
    setPickerYear(date.getFullYear());
    setPickerHour(date.getHours());
    setPickerMinute(date.getMinutes());
  }, []);

  const reset = useCallback(
    (nextDate: Date) => {
      setSelectedDate(nextDate);
      setActivePickerField(null);
      syncPickerFromDate(nextDate);
    },
    [syncPickerFromDate],
  );

  const openPicker = useCallback(
    (field: Exclude<BackdatedPickerField, null>) => {
      Keyboard.dismiss();
      setActivePickerField(field);
      syncPickerFromDate(selectedDate);
    },
    [selectedDate, syncPickerFromDate],
  );

  const closePicker = useCallback(() => {
    setActivePickerField(null);
  }, []);

  useEffect(() => {
    const maxDay = getDaysInMonth(pickerYear, pickerMonthIndex);

    if (pickerDay > maxDay) {
      setPickerDay(maxDay);
    }
  }, [pickerDay, pickerMonthIndex, pickerYear]);

  const confirmPicker = useCallback(() => {
    const next = new Date(selectedDate);

    if (activePickerField === "date") {
      next.setFullYear(
        pickerYear,
        pickerMonthIndex,
        Math.min(pickerDay, getDaysInMonth(pickerYear, pickerMonthIndex)),
      );
    } else if (activePickerField === "time") {
      next.setHours(pickerHour, pickerMinute, 0, 0);
    }

    setSelectedDate(next);
    setActivePickerField(null);
  }, [
    activePickerField,
    pickerDay,
    pickerHour,
    pickerMinute,
    pickerMonthIndex,
    pickerYear,
    selectedDate,
  ]);

  return {
    selectedDate,
    setSelectedDate,
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
    reset,
    openPicker,
    closePicker,
    confirmPicker,
  };
}
