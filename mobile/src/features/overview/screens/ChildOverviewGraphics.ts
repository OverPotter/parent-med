import type { ChildOverviewBarDatum } from "../model/childOverviewScreen";

export function formatGraphicsUnitValue(
  item: Pick<ChildOverviewBarDatum, "value" | "unit">,
  locale: "ru" | "en" | "pl" | "de",
) {
  if (locale === "ru") {
    if (item.unit === "episodes") {
      return `${item.value} ${item.value === 1 ? "эпизод" : item.value < 5 ? "эпизода" : "эпизодов"}`;
    }

    if (item.unit === "sleeps") {
      return `${item.value} ${item.value === 1 ? "сон" : item.value < 5 ? "сна" : "снов"}`;
    }

    if (item.unit === "measurements") {
      return `${item.value} ${item.value === 1 ? "замер" : item.value < 5 ? "замера" : "замеров"}`;
    }

    return `${item.value} ${item.value === 1 ? "запись" : item.value < 5 ? "записи" : "записей"}`;
  }

  if (locale === "pl") {
    if (item.unit === "episodes") {
      return `${item.value} ${item.value === 1 ? "epizod" : "epizody"}`;
    }

    if (item.unit === "sleeps") {
      return `${item.value} ${item.value === 1 ? "sen" : "sny"}`;
    }

    if (item.unit === "measurements") {
      return `${item.value} ${item.value === 1 ? "pomiar" : "pomiary"}`;
    }

    return `${item.value} ${item.value === 1 ? "wpis" : "wpisy"}`;
  }

  if (locale === "de") {
    if (item.unit === "episodes") {
      return `${item.value} ${item.value === 1 ? "Episode" : "Episoden"}`;
    }

    if (item.unit === "sleeps") {
      return `${item.value} ${item.value === 1 ? "Schlaf" : "Schlafphasen"}`;
    }

    if (item.unit === "measurements") {
      return `${item.value} ${item.value === 1 ? "Messung" : "Messungen"}`;
    }

    return `${item.value} ${item.value === 1 ? "Eintrag" : "Einträge"}`;
  }

  if (item.unit === "episodes") {
    return `${item.value} ${item.value === 1 ? "episode" : "episodes"}`;
  }

  if (item.unit === "sleeps") {
    return `${item.value} ${item.value === 1 ? "sleep" : "sleeps"}`;
  }

  if (item.unit === "measurements") {
    return `${item.value} ${item.value === 1 ? "measurement" : "measurements"}`;
  }

  return `${item.value} ${item.value === 1 ? "entry" : "entries"}`;
}

export function buildGraphicsCategoryHint(
  item: Pick<ChildOverviewBarDatum, "label" | "value" | "highlighted" | "unit">,
  locale: "ru" | "en" | "pl" | "de",
) {
  if (locale === "ru") {
    if (item.highlighted) {
      return "Чаще всего родители отмечали именно это.";
    }

    if (item.unit === "episodes") {
      return "Болезни встречались реже, чем повседневные записи.";
    }

    if (item.unit === "measurements") {
      return "Замеры пока редкие, поэтому динамика только намечается.";
    }

    return "По этой категории уже видно повторяющийся ритм.";
  }

  if (locale === "pl") {
    if (item.highlighted) {
      return "To była najczęściej zapisywana kategoria.";
    }

    if (item.unit === "episodes") {
      return "Choroby pojawiały się rzadziej niż codzienne wpisy.";
    }

    if (item.unit === "measurements") {
      return "Pomiarów jest jeszcze mało, więc trend dopiero się rysuje.";
    }

    return "W tej kategorii już widać powtarzalny rytm.";
  }

  if (locale === "de") {
    if (item.highlighted) {
      return "Diese Kategorie wurde am häufigsten erfasst.";
    }

    if (item.unit === "episodes") {
      return "Krankheiten traten seltener auf als tägliche Einträge.";
    }

    if (item.unit === "measurements") {
      return "Es gibt noch wenige Messungen, der Trend zeigt sich gerade erst.";
    }

    return "In dieser Kategorie ist bereits ein wiederkehrender Rhythmus zu sehen.";
  }

  if (item.highlighted) {
    return "This was the category parents logged most often.";
  }

  if (item.unit === "episodes") {
    return "Illness appeared less often than everyday tracking.";
  }

  if (item.unit === "measurements") {
    return "Measurements are still sparse, so the trend is only starting to form.";
  }

  return "This category already shows a recurring rhythm.";
}

export function buildGraphicsCategoryFootnote(
  item: Pick<ChildOverviewBarDatum, "label" | "unit" | "value">,
  locale: "ru" | "en" | "pl" | "de",
) {
  const label = item.label.toLowerCase();

  if (locale === "ru") {
    if (label.includes("корм")) {
      return "Пик пришёлся на середину периода.";
    }

    if (label.includes("сон")) {
      return "Сон отмечался не каждый день, но без длинных пауз.";
    }

    if (label.includes("бол")) {
      return "Последний эпизод попал ближе к концу периода.";
    }

    return "Для более уверенной тенденции нужно ещё несколько записей.";
  }

  if (locale === "pl") {
    if (label.includes("karm")) {
      return "Największa aktywność przypadła na środek okresu.";
    }

    if (label.includes("sen")) {
      return "Sen nie był zapisywany codziennie, ale bez długich przerw.";
    }

    if (label.includes("chor")) {
      return "Ostatni epizod przypadł bliżej końca okresu.";
    }

    return "Jeszcze kilka wpisów pozwoli lepiej zobaczyć trend.";
  }

  if (locale === "de") {
    if (label.includes("fütt") || label.includes("feed")) {
      return "Die höchste Aktivität lag ungefähr in der Mitte des Zeitraums.";
    }

    if (label.includes("schlaf") || label.includes("sleep")) {
      return "Schlaf wurde nicht täglich erfasst, aber ohne lange Lücken.";
    }

    if (label.includes("krank") || label.includes("ill")) {
      return "Die letzte Episode lag näher am Ende des Zeitraums.";
    }

    return "Ein paar weitere Einträge machen den Trend verlässlicher.";
  }

  if (label.includes("feed")) {
    return "The busiest point came around the middle of the period.";
  }

  if (label.includes("sleep")) {
    return "Sleep was not logged daily, but there were no long gaps.";
  }

  if (label.includes("ill")) {
    return "The latest episode landed closer to the end of the period.";
  }

  return "A few more records will make the trend more reliable.";
}

export function getGraphicsTrendSamples(
  label: string,
  locale: "ru" | "en" | "pl" | "de",
) {
  const normalized = label.toLowerCase();

  if (locale === "ru") {
    if (normalized.includes("корм")) {
      return [0.2, 0.6, 0.9, 0.5, 0.8, 0.35, 0.55];
    }

    if (normalized.includes("сон")) {
      return [0.15, 0.5, 0.25, 0.7, 0.2, 0.6, 0.3];
    }

    if (normalized.includes("бол")) {
      return [0, 0.2, 0, 0, 0.55, 0, 0.45];
    }

    return [0, 0, 0.18, 0, 0.22, 0, 0.16];
  }

  if (normalized.includes("feed") || normalized.includes("karm")) {
    return [0.2, 0.6, 0.9, 0.5, 0.8, 0.35, 0.55];
  }

  if (normalized.includes("sleep") || normalized.includes("sen")) {
    return [0.15, 0.5, 0.25, 0.7, 0.2, 0.6, 0.3];
  }

  if (normalized.includes("ill") || normalized.includes("chor")) {
    return [0, 0.2, 0, 0, 0.55, 0, 0.45];
  }

  return [0, 0, 0.18, 0, 0.22, 0, 0.16];
}

export function buildSelectedDayTitle(dayOrDate: number | string, locale: string) {
  if (typeof dayOrDate === "number") {
    return locale === "ru"
      ? `Записи за ${dayOrDate} мая`
      : locale === "pl"
        ? `Wpisy z ${dayOrDate} maja`
        : locale === "de"
          ? `Einträge vom ${dayOrDate}. Mai`
          : `Entries for May ${dayOrDate}`;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayOrDate);
  if (!match) {
    return locale === "ru"
      ? "Записи за день"
      : locale === "pl"
        ? "Wpisy z dnia"
        : locale === "de"
          ? "Einträge für den Tag"
          : "Entries for the day";
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  const formatted = new Intl.DateTimeFormat(
    locale === "ru"
      ? "ru-RU"
      : locale === "pl"
        ? "pl-PL"
        : locale === "de"
          ? "de-DE"
          : "en-US",
    {
      day: "numeric",
      month: "long",
    },
  ).format(date);

  return locale === "ru"
    ? `Записи за ${formatted}`
    : locale === "pl"
      ? `Wpisy z ${formatted}`
      : locale === "de"
        ? `Einträge vom ${formatted}`
        : `Entries for ${formatted}`;
}

export function getGraphicsIconToken(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return { ...baseIconToken("feeding") };
  }

  if (key === "illness") {
    return { ...baseIconToken("illness") };
  }

  if (key === "sleep") {
    return { ...baseIconToken("sleep") };
  }

  if (key === "growth") {
    return {
      key: "weightHeight" as const,
      label: "Рост",
      symbol: "growth",
      color: "#8CCB2E",
      background: "#EEF9DD",
    };
  }

  return {
    key: "weightHeight" as const,
    label: "Вес",
    symbol: "weight",
    color: "#39C0A6",
    background: "#E4FAF5",
  };
}

export function getGraphicsBadgeBackground(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return "#FFE7D4";
  }

  if (key === "illness") {
    return "#FFE0E5";
  }

  if (key === "sleep") {
    return "#E7DDFF";
  }

  if (key === "growth") {
    return "#EEF9DD";
  }

  return "#E4FAF5";
}

export function getGraphicsBadgeBorder(
  key: "feeding" | "illness" | "sleep" | "weight" | "growth",
) {
  if (key === "feeding") {
    return "#F5C89F";
  }

  if (key === "illness") {
    return "#F2B6C0";
  }

  if (key === "sleep") {
    return "#D1BFF5";
  }

  if (key === "growth") {
    return "#D5EBB1";
  }

  return "#BEE7DE";
}

function baseIconToken(key: "feeding" | "illness" | "sleep") {
  if (key === "feeding") {
    return {
      key: "feeding" as const,
      label: "Кормление",
      symbol: "feeding",
      color: "#F7A14C",
      background: "#FFF0DE",
    };
  }

  if (key === "illness") {
    return {
      key: "illness" as const,
      label: "Болезни",
      symbol: "illness",
      color: "#F58E97",
      background: "#FFE8EA",
    };
  }

  return {
    key: "sleep" as const,
    label: "Сон",
    symbol: "sleep",
    color: "#8B74D9",
    background: "#ECE6FF",
  };
}
