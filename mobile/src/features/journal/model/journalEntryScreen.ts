import { ImageSourcePropType } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type JournalEntryKind = "feeding" | "sleep" | "weight" | "height";

export type JournalEntryRow = {
  id: string;
  label: string;
  value: string;
  helper?: string;
};

export type JournalEntryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  childName: string;
  dateLabel: string;
  iconSource?: ImageSourcePropType;
  summaryChip: string;
  sectionTitle: string;
  rows: JournalEntryRow[];
  notesTitle: string;
  notesBody: string;
  primaryActionLabel: string;
};

export function buildJournalEntryScreenContent(
  kind: JournalEntryKind,
  childName: string,
  locale: MobileLocale,
): JournalEntryScreenContent {
  const isRu = locale === "ru";

  const common = {
    backLabel: isRu ? "К профилю ребёнка" : "Back to child profile",
    childName,
    dateLabel: isRu ? "Сегодня, 9 мая" : "Today, May 9",
    notesTitle: isRu ? "Заметка" : "Note",
    primaryActionLabel: isRu ? "Сохранить запись" : "Save entry",
  };

  if (kind === "feeding") {
    return {
      ...common,
      title: isRu ? "Кормление" : "Feeding",
      subtitle: isRu
        ? "Быстрая запись кормления по знакомому шаблону."
        : "Quick feeding entry with a familiar layout.",
      iconSource: redesignSharedIcons.feeding,
      summaryChip: isRu ? "Запись кормления" : "Feeding entry",
      sectionTitle: isRu ? "Детали кормления" : "Feeding details",
      rows: [
        {
          id: "type",
          label: isRu ? "Тип" : "Type",
          value: isRu ? "Смесь" : "Formula",
        },
        {
          id: "amount",
          label: isRu ? "Количество" : "Amount",
          value: "180 мл",
        },
        {
          id: "time",
          label: isRu ? "Время" : "Time",
          value: "08:40",
        },
      ],
      notesTitle: isRu ? "Заметка к кормлению" : "Feeding note",
      notesBody: isRu
        ? "Спокойно поел, без срыгивания и без замечаний."
        : "Fed calmly, no spit-up, no issues noted.",
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  if (kind === "sleep") {
    return {
      ...common,
      title: isRu ? "Сон" : "Sleep",
      subtitle: isRu
        ? "Запись сна с теми же карточками и логикой."
        : "Sleep entry using the same card and layout logic.",
      iconSource: redesignSharedIcons.sleep,
      summaryChip: isRu ? "Запись сна" : "Sleep entry",
      sectionTitle: isRu ? "Детали сна" : "Sleep details",
      rows: [
        {
          id: "start",
          label: isRu ? "Начало" : "Start",
          value: "13:10",
        },
        {
          id: "end",
          label: isRu ? "Окончание" : "End",
          value: "14:25",
        },
        {
          id: "duration",
          label: isRu ? "Длительность" : "Duration",
          value: isRu ? "1 ч 15 мин" : "1 h 15 min",
        },
      ],
      notesTitle: isRu ? "Заметка ко сну" : "Sleep note",
      notesBody: isRu
        ? "Уснул быстро, проснулся спокойно."
        : "Fell asleep quickly and woke up calmly.",
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  if (kind === "weight") {
    return {
      ...common,
      title: isRu ? "Вес" : "Weight",
      subtitle: isRu
        ? "Тот же экран записи, но для измерений роста и веса."
        : "The same entry screen pattern for growth measurements.",
      iconSource: undefined,
      summaryChip: isRu ? "Измерение веса" : "Weight entry",
      sectionTitle: isRu ? "Детали измерения" : "Measurement details",
      rows: [
        {
          id: "value",
          label: isRu ? "Вес" : "Weight",
          value: "13.4 кг",
        },
        {
          id: "date",
          label: isRu ? "Дата" : "Date",
          value: isRu ? "9 мая" : "May 9",
        },
        {
          id: "delta",
          label: isRu ? "Изменение" : "Change",
          value: isRu ? "+0.2 кг" : "+0.2 kg",
          helper: isRu ? "с прошлого измерения" : "since previous measurement",
        },
      ],
      notesTitle: isRu ? "Заметка к весу" : "Weight note",
      notesBody: isRu
        ? "Измерение после завтрака, ребёнок спокоен."
        : "Measured after breakfast, child was calm.",
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  return {
    ...common,
    title: isRu ? "Рост" : "Height",
    subtitle: isRu
      ? "Тот же экран записи, но для измерений роста и веса."
      : "The same entry screen pattern for growth measurements.",
    iconSource: redesignSharedIcons.height,
    summaryChip: isRu ? "Измерение роста" : "Height entry",
    sectionTitle: isRu ? "Детали измерения" : "Measurement details",
    rows: [
      {
        id: "value",
        label: isRu ? "Рост" : "Height",
        value: "92 см",
      },
      {
        id: "date",
        label: isRu ? "Дата" : "Date",
        value: isRu ? "9 мая" : "May 9",
      },
      {
        id: "delta",
        label: isRu ? "Изменение" : "Change",
        value: isRu ? "+1 см" : "+1 cm",
        helper: isRu ? "с прошлого измерения" : "since previous measurement",
      },
    ],
    notesTitle: isRu ? "Заметка к росту" : "Height note",
    notesBody: isRu
      ? "Измерение днём, стоял ровно у стены."
      : "Measured during the day while standing straight.",
    primaryActionLabel: common.primaryActionLabel,
  };
}
