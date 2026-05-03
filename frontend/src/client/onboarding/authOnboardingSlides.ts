import type { AppLanguage } from "@shared/i18n";
import babyCareImage from "../../../design/preview/app/baby_care_iphone_fullscreen.png";
import familyOverviewImage from "../../../design/preview/app/family_overview_iphone_fullscreen.png";
import familyMedicationPlanImage from "../../../design/preview/app/family_medication_plan_iphone_fullscreen.png";

export type AuthOnboardingVariant = "family-overview" | "baby-care" | "family-medication-plan";
export type AuthOnboardingCardSlot =
  | "top"
  | "topLeft"
  | "topRight"
  | "leftMiddle"
  | "rightMiddle"
  | "leftBottom"
  | "rightBottom";

export type AuthOnboardingCardCopy = {
  title: string;
  subtitle: string;
  slot: AuthOnboardingCardSlot;
};

export type AuthOnboardingSlide = {
  id: string;
  variant: AuthOnboardingVariant;
  imageSrc: string;
  title: string;
  subtitle: string;
  cards: AuthOnboardingCardCopy[];
};

const slidesByLanguage: Record<AppLanguage, AuthOnboardingSlide[]> = {
  ru: [
    {
      id: "family-overview",
      variant: "family-overview",
      imageSrc: familyOverviewImage,
      title: "Забота о семье —\nв одном месте",
      subtitle:
        "Напоминания, планы приёма, домашняя аптечка и единый актуальный план для всех близких.",
      cards: [
        { slot: "top", title: "Напоминания", subtitle: "что делать дальше" },
        { slot: "leftMiddle", title: "Планы приёма", subtitle: "лекарства и витамины" },
        { slot: "rightMiddle", title: "Кто отметил", subtitle: "видно всей семье" },
        { slot: "leftBottom", title: "Права доступа", subtitle: "роли и видимость" },
        { slot: "rightBottom", title: "Домашняя аптечка", subtitle: "остатки и сроки" },
      ],
    },
    {
      id: "baby-care",
      variant: "baby-care",
      imageSrc: babyCareImage,
      title: "Всё о малыше —\nв одном месте",
      subtitle:
        "Режим малыша, кормления, сон, температура, заметки и напоминания — всё собрано в одном приложении.",
      cards: [
        { slot: "topLeft", title: "Кормления", subtitle: "сегодня 5 раз" },
        { slot: "topRight", title: "Сон", subtitle: "ночь 8 ч 20 мин" },
        { slot: "leftMiddle", title: "Заметки", subtitle: "симптомы и наблюдения" },
        { slot: "rightMiddle", title: "Температура", subtitle: "37.2 °C" },
        { slot: "leftBottom", title: "Напоминания", subtitle: "что сделать дальше" },
        { slot: "rightBottom", title: "Live Activity", subtitle: "важное\nна экране\nблокировки" },
      ],
    },
    {
      id: "family-medication-plan",
      variant: "family-medication-plan",
      imageSrc: familyMedicationPlanImage,
      title: "План приёма\nдля близких",
      subtitle:
        "Создавайте напоминания о таблетках и витаминах для близких — а доступ, видимость и действия можно настроить под каждого.",
      cards: [
        { slot: "top", title: "Напоминания", subtitle: "пора принять лекарство" },
        { slot: "leftMiddle", title: "План приёма", subtitle: "витамины и\nлекарства" },
        { slot: "rightMiddle", title: "Кто отметил", subtitle: "видно\nвсей семье" },
        { slot: "leftBottom", title: "Настройка доступа", subtitle: "кто что видит" },
        { slot: "rightBottom", title: "Только отмечать", subtitle: "без редактирования" },
      ],
    },
  ],
  en: [
    {
      id: "family-overview",
      variant: "family-overview",
      imageSrc: familyOverviewImage,
      title: "Family care,\nall in one place",
      subtitle:
        "Reminders, medication plans, a home medicine cabinet, and one up-to-date care view for the whole family.",
      cards: [
        { slot: "top", title: "Reminders", subtitle: "what to do next" },
        { slot: "leftMiddle", title: "Care plans", subtitle: "medicine and vitamins" },
        { slot: "rightMiddle", title: "Check-ins", subtitle: "seen by the family" },
        { slot: "leftBottom", title: "Access roles", subtitle: "roles and visibility" },
        { slot: "rightBottom", title: "Home medicine\ncabinet", subtitle: "supplies and expiry" },
      ],
    },
    {
      id: "baby-care",
      variant: "baby-care",
      imageSrc: babyCareImage,
      title: "Everything for baby,\nin one place",
      subtitle: "Baby routine, feedings, sleep, temperature, notes, and reminders — all in one app.",
      cards: [
        { slot: "topLeft", title: "Feedings", subtitle: "5 times today" },
        { slot: "topRight", title: "Sleep", subtitle: "8 h 20 min tonight" },
        { slot: "leftMiddle", title: "Notes", subtitle: "symptoms and\nobservations" },
        { slot: "rightMiddle", title: "Temperature", subtitle: "37.2 °C" },
        { slot: "leftBottom", title: "Reminders", subtitle: "what to do next" },
        { slot: "rightBottom", title: "Live Activity", subtitle: "key updates\non\nlock screen" },
      ],
    },
    {
      id: "family-medication-plan",
      variant: "family-medication-plan",
      imageSrc: familyMedicationPlanImage,
      title: "Medication plan\nfor loved ones",
      subtitle:
        "Create tablet and vitamin reminders for loved ones, with access and visibility tailored for each person.",
      cards: [
        { slot: "top", title: "Reminders", subtitle: "time to take meds" },
        { slot: "leftMiddle", title: "Care plan", subtitle: "vitamin and\nmeds" },
        { slot: "rightMiddle", title: "Check-ins", subtitle: "seen by\nthe family" },
        { slot: "leftBottom", title: "Access setup", subtitle: "who sees what" },
        { slot: "rightBottom", title: "View only", subtitle: "no editing needed" },
      ],
    },
  ],
};

export function getAuthOnboardingSlides(language: AppLanguage): AuthOnboardingSlide[] {
  return slidesByLanguage[language];
}
