import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  childAvatarPresets,
  getChildAvatarSourceByKey,
  isCompactAvatarPresetKey,
  type ChildAvatarGender,
  type ChildAvatarPresetKey,
} from "../../children/model/childrenRedesign";

export type { ChildAvatarPresetKey } from "../../children/model/childrenRedesign";
export type { ChildAvatarGender } from "../../children/model/childrenRedesign";
export { isCompactAvatarPresetKey } from "../../children/model/childrenRedesign";

export const avatarOptions = childAvatarPresets;

const ruMonths = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const plMonths = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
] as const;

const deMonths = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

const enMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function getEditProfileSheetCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      avatarTitle: "Сменить иконку",
      avatarSubtitle: "Выберите иконку для профиля.",
      boyLabel: "Мальчик",
      girlLabel: "Девочка",
      dateTitle: "Дата рождения",
      dateSubtitle: "Выберите день, месяц и год.",
      textEditorSubtitle: "Обновите текст для профиля.",
      apply: "Готово",
    };
  }

  if (locale === "pl") {
    return {
      avatarTitle: "Zmień ikonę",
      avatarSubtitle: "Wybierz ikonę profilu.",
      boyLabel: "Chłopiec",
      girlLabel: "Dziewczynka",
      dateTitle: "Data urodzenia",
      dateSubtitle: "Wybierz dzień, miesiąc i rok.",
      textEditorSubtitle: "Zaktualizuj tekst w profilu.",
      apply: "Gotowe",
    };
  }

  if (locale === "de") {
    return {
      avatarTitle: "Icon ändern",
      avatarSubtitle: "Wählen Sie ein Symbol für das Profil.",
      boyLabel: "Junge",
      girlLabel: "Mädchen",
      dateTitle: "Geburtsdatum",
      dateSubtitle: "Wählen Sie Tag, Monat und Jahr.",
      textEditorSubtitle: "Aktualisieren Sie den Profiltext.",
      apply: "Fertig",
    };
  }

  return {
    avatarTitle: "Change icon",
    avatarSubtitle: "Choose an icon for the profile.",
    boyLabel: "Boy",
    girlLabel: "Girl",
    dateTitle: "Birth date",
    dateSubtitle: "Choose day, month, and year.",
    textEditorSubtitle: "Update the profile text.",
    apply: "Done",
  };
}

export function getMonths(locale: MobileLocale) {
  if (locale === "ru") {
    return ruMonths;
  }

  if (locale === "pl") {
    return plMonths;
  }

  if (locale === "de") {
    return deMonths;
  }

  return enMonths;
}

export function parseBirthDate(value: string, locale: MobileLocale) {
  const months = getMonths(locale);
  const parts = value.trim().split(/\s+/);

  if (parts.length < 3) {
    return { day: 4, monthIndex: 1, year: 2022 };
  }

  return {
    day: Number(parts[0]) || 4,
    monthIndex: Math.max(0, months.indexOf(parts[1] as never)),
    year: Number(parts[2]) || 2022,
  };
}

export function formatBirthDate(
  day: number,
  monthIndex: number,
  year: number,
  locale: MobileLocale,
) {
  const months = getMonths(locale);
  return `${day} ${months[monthIndex] ?? months[0]} ${year}`;
}

export function formatBirthDateFromIso(
  value: string | null,
  locale: MobileLocale,
) {
  if (!value) {
    return "";
  }

  const next = new Date(`${value}T00:00:00`);

  if (Number.isNaN(next.getTime())) {
    return "";
  }

  return formatBirthDate(
    next.getDate(),
    next.getMonth(),
    next.getFullYear(),
    locale,
  );
}

export function birthDatePartsToIso(
  day: number,
  monthIndex: number,
  year: number,
) {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

export function getAvatarKeyBySource(
  avatarSource: ReturnType<typeof getChildAvatarSourceByKey>,
): ChildAvatarPresetKey | null {
  const matched = avatarOptions.find((item) => item.source === avatarSource);
  return matched?.key ?? null;
}
