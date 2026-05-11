import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export const avatarOptions = [
  childrenScreenAssets.avatars.boyBlackHair,
  childrenScreenAssets.avatars.boyRedHair,
  childrenScreenAssets.avatars.girlBlonde,
  childrenScreenAssets.avatars.boy,
  childrenScreenAssets.avatars.girl,
  childrenScreenAssets.avatars.child1,
  childrenScreenAssets.avatars.child2,
  childrenScreenAssets.avatars.child3,
] as const;

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
      dateTitle: "Geburtsdatum",
      dateSubtitle: "Wählen Sie Tag, Monat und Jahr.",
      textEditorSubtitle: "Aktualisieren Sie den Profiltext.",
      apply: "Fertig",
    };
  }

  return {
    avatarTitle: "Change icon",
    avatarSubtitle: "Choose an icon for the profile.",
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
