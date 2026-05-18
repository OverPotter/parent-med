import type { MobileLocale } from "../i18n/mobileI18n";

export type BackdatedPickerField = "date" | "time" | null;

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function getMonths(locale: MobileLocale) {
  return locale === "ru"
    ? ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
    : locale === "de"
      ? ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
      : locale === "pl"
        ? ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function formatBackdatedDate(date: Date, locale: MobileLocale) {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  if (locale === "ru" || locale === "de" || locale === "pl") {
    return `${day}.${month}.${year}`;
  }

  return `${month}/${day}/${year}`;
}

export function formatBackdatedTime(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function getBackdatedPickerTitle(
  locale: MobileLocale,
  field: Exclude<BackdatedPickerField, null>,
) {
  if (field === "date") {
    return locale === "ru"
      ? "Выберите дату"
      : locale === "de"
        ? "Datum wählen"
        : locale === "pl"
          ? "Wybierz datę"
          : "Choose date";
  }

  return locale === "ru"
    ? "Выберите время"
    : locale === "de"
      ? "Uhrzeit wählen"
      : locale === "pl"
        ? "Wybierz godzinę"
        : "Choose time";
}

export function getBackdatedPickerDoneLabel(locale: MobileLocale) {
  return locale === "ru"
    ? "Готово"
    : locale === "de"
      ? "Fertig"
      : locale === "pl"
        ? "Gotowe"
        : "Done";
}
