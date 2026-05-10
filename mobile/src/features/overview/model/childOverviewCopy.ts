import { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function getOverviewCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      tabs: { feed: "Лента", calendar: "Календарь", charts: "Графики" },
      filters: {
        week: "7 дней",
        all: "Все",
        sleep: "Сон",
        feeding: "Кормление",
        illness: "Болезни",
        weight: "Вес",
        height: "Рост",
      },
      dates: { today: "Сегодня", may3: "3 мая" },
      eventTypes: { feeding: "Кормление", sleep: "Сон", illness: "Болезнь" },
      details: {
        breast: "грудь",
        zeroMin: "0 мин",
        temperatureObservation: "температура и наблюдение",
        hourShort: "ч",
      },
      bottomNav: {
        children: "Дети",
        pills: "Таблетки",
        cabinet: "Аптечка",
        more: "Ещё",
      },
      month: "Май 2026 г.",
      selectedDayHeader: "Записи за 3 мая",
      selectedDayHint: "Нажмите на день, чтобы сменить выбор.",
      selectedDayToggleHint: "Повторный тап по дню вернёт месячную сводку.",
      selectedDayEmptyLabel: "На выбранный день записей пока нет.",
      insightTitles: {
        illness: "Болезни — 2 эпизода",
        feeding: "Кормление — 1 запись",
        sleep: "Сон — пока нет данных",
        growth: "Рост и вес — пока без новых записей",
      },
      insightSubtitles: {
        temperatureObservation: "температура и наблюдение",
        breast: "грудь",
        addRecords: "добавьте, чтобы следить",
        nothingNew: "ничего нового не добавляли",
      },
      backLabel: "К профилю ребёнка",
      titleSuffix: "обзор",
      subtitle:
        "Быстро посмотрите, что происходило с ребёнком за выбранный период.",
      periodLabels: {
        week: "7 дней",
        twoWeeks: "14 дней",
        month: "30 дней",
        customRange: "Свой период",
      },
      periodHelpers: {
        week: "Сводка за последние 7 дней.",
        twoWeeks: "Сводка за последние 14 дней.",
        month: "Сводка за последние 30 дней.",
        customRange: "Выберите диапазон дат вручную.",
      },
      summaryTitle: "Главное за 7 дней",
      eventsTitle: "События",
      calendarStats: {
        activeDays: "Активные дни",
        mostOften: "Чаще всего",
        latestEntry: "Последняя запись",
      },
      graphics: {
        title: "Что отмечали чаще",
        subtitle:
          "Чем длиннее полоса, тем чаще эта категория встречалась за период.",
        totalPrefix: "Всего событий",
        peakPrefix: "Лидер периода",
        categoryTitle: "По категориям",
        categorySubtitle: "Что видно по каждому модулю за выбранный период.",
      },
      calendarMonthSummaryTitle: "Итоги за месяц",
      calendarMonthSummaryHint:
        "Тапните день в календаре, чтобы увидеть записи за него.",
    };
  }

  if (locale === "pl") {
    return {
      tabs: { feed: "Kanał", calendar: "Kalendarz", charts: "Wykresy" },
      filters: {
        week: "7 dni",
        all: "Wszystko",
        sleep: "Sen",
        feeding: "Karmienie",
        illness: "Choroby",
        weight: "Waga",
        height: "Wzrost",
      },
      dates: { today: "Dzisiaj", may3: "3 maja" },
      eventTypes: { feeding: "Karmienie", sleep: "Sen", illness: "Choroba" },
      details: {
        breast: "pierś",
        zeroMin: "0 min",
        temperatureObservation: "temperatura i obserwacja",
        hourShort: "godz.",
      },
      bottomNav: {
        children: "Dzieci",
        pills: "Tabletki",
        cabinet: "Apteczka",
        more: "Więcej",
      },
      month: "Maj 2026",
      selectedDayHeader: "Wpisy z 3 maja",
      selectedDayHint: "Stuknij dzień, aby zmienić wybór.",
      selectedDayToggleHint:
        "Ponowne stuknięcie dnia przywróci miesięczne podsumowanie.",
      selectedDayEmptyLabel: "Na wybrany dzień nie ma jeszcze wpisów.",
      insightTitles: {
        illness: "Choroby — 2 epizody",
        feeding: "Karmienie — 1 wpis",
        sleep: "Sen — jeszcze brak danych",
        growth: "Wzrost i waga — brak nowych wpisów",
      },
      insightSubtitles: {
        temperatureObservation: "temperatura i obserwacja",
        breast: "pierś",
        addRecords: "dodaj wpisy, aby śledzić",
        nothingNew: "nie dodano nic nowego",
      },
      backLabel: "Powrót do profilu dziecka",
      titleSuffix: "przegląd",
      subtitle:
        "Szybko zobaczysz, co działo się z dzieckiem w wybranym okresie.",
      periodLabels: {
        week: "7 dni",
        twoWeeks: "14 dni",
        month: "30 dni",
        customRange: "Własny zakres",
      },
      periodHelpers: {
        week: "Podsumowanie z ostatnich 7 dni.",
        twoWeeks: "Podsumowanie z ostatnich 14 dni.",
        month: "Podsumowanie z ostatnich 30 dni.",
        customRange: "Wybierz własny zakres dat.",
      },
      summaryTitle: "Najważniejsze z 7 dni",
      eventsTitle: "Wydarzenia",
      calendarStats: {
        activeDays: "Aktywne dni",
        mostOften: "Najczęściej",
        latestEntry: "Ostatni wpis",
      },
      graphics: {
        title: "Co zaznaczano najczęściej",
        subtitle:
          "Im dłuższy pasek, tym częściej ta kategoria pojawiała się w wybranym okresie.",
        totalPrefix: "Łącznie wydarzeń",
        peakPrefix: "Najczęściej",
        categoryTitle: "Według kategorii",
        categorySubtitle: "Co pokazuje każdy moduł w wybranym okresie.",
      },
      calendarMonthSummaryTitle: "Podsumowanie miesiąca",
      calendarMonthSummaryHint:
        "Stuknij dzień w kalendarzu, aby zobaczyć wpisy z tego dnia.",
    };
  }

  if (locale === "de") {
    return {
      tabs: { feed: "Verlauf", calendar: "Kalender", charts: "Diagramme" },
      filters: {
        week: "7 Tage",
        all: "Alle",
        sleep: "Schlaf",
        feeding: "Füttern",
        illness: "Krankheiten",
        weight: "Gewicht",
        height: "Größe",
      },
      dates: { today: "Heute", may3: "3. Mai" },
      eventTypes: { feeding: "Füttern", sleep: "Schlaf", illness: "Krankheit" },
      details: {
        breast: "Brust",
        zeroMin: "0 Min.",
        temperatureObservation: "Temperatur und Beobachtung",
        hourShort: "Std.",
      },
      bottomNav: {
        children: "Kinder",
        pills: "Tabletten",
        cabinet: "Hausapotheke",
        more: "Mehr",
      },
      month: "Mai 2026",
      selectedDayHeader: "Einträge vom 3. Mai",
      selectedDayHint: "Tippen Sie auf einen Tag, um die Auswahl zu ändern.",
      selectedDayToggleHint:
        "Ein erneutes Tippen auf den Tag zeigt wieder die Monatsübersicht.",
      selectedDayEmptyLabel:
        "Für den ausgewählten Tag gibt es noch keine Einträge.",
      insightTitles: {
        illness: "Krankheiten — 2 Episoden",
        feeding: "Füttern — 1 Eintrag",
        sleep: "Schlaf — noch keine Daten",
        growth: "Größe und Gewicht — noch keine neuen Einträge",
      },
      insightSubtitles: {
        temperatureObservation: "Temperatur und Beobachtung",
        breast: "Brust",
        addRecords: "Einträge hinzufügen, um es zu verfolgen",
        nothingNew: "es wurde nichts Neues hinzugefügt",
      },
      backLabel: "Zurück zum Kinderprofil",
      titleSuffix: "Überblick",
      subtitle:
        "Hier sehen Sie schnell, was im gewählten Zeitraum mit Ihrem Kind passiert ist.",
      periodLabels: {
        week: "7 Tage",
        twoWeeks: "14 Tage",
        month: "30 Tage",
        customRange: "Eigener Zeitraum",
      },
      periodHelpers: {
        week: "Zusammenfassung der letzten 7 Tage.",
        twoWeeks: "Zusammenfassung der letzten 14 Tage.",
        month: "Zusammenfassung der letzten 30 Tage.",
        customRange: "Wählen Sie einen eigenen Datumsbereich.",
      },
      summaryTitle: "Highlights aus 7 Tagen",
      eventsTitle: "Ereignisse",
      calendarStats: {
        activeDays: "Aktive Tage",
        mostOften: "Am häufigsten",
        latestEntry: "Letzter Eintrag",
      },
      graphics: {
        title: "Was am häufigsten erfasst wurde",
        subtitle:
          "Je länger der Balken, desto häufiger kam diese Kategorie im gewählten Zeitraum vor.",
        totalPrefix: "Ereignisse gesamt",
        peakPrefix: "Spitzenreiter",
        categoryTitle: "Nach Kategorien",
        categorySubtitle: "Was jedes Modul im gewählten Zeitraum zeigt.",
      },
      calendarMonthSummaryTitle: "Monatsübersicht",
      calendarMonthSummaryHint:
        "Tippen Sie auf einen Tag im Kalender, um die Einträge dieses Tages zu sehen.",
    };
  }

  return {
    tabs: { feed: "Feed", calendar: "Calendar", charts: "Charts" },
    filters: {
      week: "7 days",
      all: "All",
      sleep: "Sleep",
      feeding: "Feeding",
      illness: "Illness",
      weight: "Weight",
      height: "Height",
    },
    dates: { today: "Today", may3: "May 3" },
    eventTypes: { feeding: "Feeding", sleep: "Sleep", illness: "Illness" },
    details: {
      breast: "breast",
      zeroMin: "0 min",
      temperatureObservation: "temperature and observation",
      hourShort: "h",
    },
    bottomNav: {
      children: "Children",
      pills: "Pills",
      cabinet: "Cabinet",
      more: "More",
    },
    month: "May 2026",
    selectedDayHeader: "Entries for May 3",
    selectedDayHint: "Tap a day to change the selection.",
    selectedDayToggleHint:
      "Tap the selected day again to return to month summary.",
    selectedDayEmptyLabel: "No entries for the selected day yet.",
    insightTitles: {
      illness: "Illnesses — 2 episodes",
      feeding: "Feeding — 1 record",
      sleep: "Sleep — no data yet",
      growth: "Height and weight — no new records",
    },
    insightSubtitles: {
      temperatureObservation: "temperature and observation",
      breast: "breast",
      addRecords: "add records to track it",
      nothingNew: "nothing new was added",
    },
    backLabel: "Back to child profile",
    titleSuffix: "overview",
    subtitle:
      "Quickly understand what happened with your child during the selected period.",
    periodLabels: {
      week: "7 days",
      twoWeeks: "14 days",
      month: "30 days",
      customRange: "Custom range",
    },
    periodHelpers: {
      week: "Summary for the last 7 days.",
      twoWeeks: "Summary for the last 14 days.",
      month: "Summary for the last 30 days.",
      customRange: "Choose a custom date range.",
    },
    summaryTitle: "Highlights for 7 days",
    eventsTitle: "Events",
    calendarStats: {
      activeDays: "Active days",
      mostOften: "Most often",
      latestEntry: "Latest entry",
    },
    graphics: {
      title: "What was logged most often",
      subtitle:
        "The longer the bar, the more often this category appeared in the selected period.",
      totalPrefix: "Total events",
      peakPrefix: "Top category",
      categoryTitle: "By category",
      categorySubtitle: "What each module shows during the selected period.",
    },
    calendarMonthSummaryTitle: "Month summary",
    calendarMonthSummaryHint:
      "Tap a day in the calendar to see entries for it.",
  };
}

export function translateOverviewTab(label: string, locale: MobileLocale) {
  const copy = getOverviewCopy(locale);

  if (label === "Лента") {
    return copy.tabs.feed;
  }

  if (label === "Календарь") {
    return copy.tabs.calendar;
  }

  return copy.tabs.charts;
}

export function translateOverviewFilter(label: string, locale: MobileLocale) {
  const copy = getOverviewCopy(locale);

  if (label === "7 дней") {
    return copy.filters.week;
  }

  if (label === "Все") {
    return copy.filters.all;
  }

  if (label === "Сон") {
    return copy.filters.sleep;
  }

  if (label === "Кормление") {
    return copy.filters.feeding;
  }

  if (label === "Болезни") {
    return copy.filters.illness;
  }

  if (label === "Вес") {
    return copy.filters.weight;
  }

  return copy.filters.height;
}

export function translateOverviewEventDate(label: string, locale: MobileLocale) {
  if (label === "Сегодня") {
    return getOverviewCopy(locale).dates.today;
  }

  return getOverviewCopy(locale).dates.may3;
}

export function translateOverviewEventType(label: string, locale: MobileLocale) {
  const copy = getOverviewCopy(locale);

  if (label === "Кормление") {
    return copy.eventTypes.feeding;
  }

  if (label === "Сон") {
    return copy.eventTypes.sleep;
  }

  return copy.eventTypes.illness;
}

export function translateOverviewDetail(label: string, locale: MobileLocale) {
  const copy = getOverviewCopy(locale);

  if (label === "грудь") {
    return copy.details.breast;
  }

  if (label === "0 мин") {
    return copy.details.zeroMin;
  }

  return copy.details.temperatureObservation;
}

export function translateOverviewBottomNavLabel(
  label: string,
  locale: MobileLocale,
) {
  const copy = getOverviewCopy(locale);

  if (label === "Дети") {
    return copy.bottomNav.children;
  }

  if (label === "Таблетки") {
    return copy.bottomNav.pills;
  }

  if (label === "Аптечка") {
    return copy.bottomNav.cabinet;
  }

  return copy.bottomNav.more;
}

export function translateOverviewMonth(label: string, locale: MobileLocale) {
  return label === "Май 2026 г." ? getOverviewCopy(locale).month : label;
}

export function translateOverviewSelectedDayHeader(
  label: string,
  locale: MobileLocale,
) {
  return label === "Записи за 3 мая"
    ? getOverviewCopy(locale).selectedDayHeader
    : label;
}

export function translateOverviewSelectedDayHint(
  label: string,
  locale: MobileLocale,
) {
  return label === "Нажмите на день, чтобы сменить выбор."
    ? getOverviewCopy(locale).selectedDayHint
    : label;
}

export function translateOverviewInsightTitle(
  label: string,
  locale: MobileLocale,
) {
  const copy = getOverviewCopy(locale);

  if (label === "Болезни — 2 эпизода") {
    return copy.insightTitles.illness;
  }

  if (label === "Кормление — 1 запись") {
    return copy.insightTitles.feeding;
  }

  if (label === "Сон — пока нет данных") {
    return copy.insightTitles.sleep;
  }

  return copy.insightTitles.growth;
}

export function translateOverviewInsightSubtitle(
  label: string,
  locale: MobileLocale,
) {
  const copy = getOverviewCopy(locale);

  if (label === "температура и наблюдение") {
    return copy.insightSubtitles.temperatureObservation;
  }

  if (label === "грудь") {
    return copy.insightSubtitles.breast;
  }

  if (label === "добавьте, чтобы следить") {
    return copy.insightSubtitles.addRecords;
  }

  return copy.insightSubtitles.nothingNew;
}
