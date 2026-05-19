import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type HelpScreenSection = {
  id:
    | "first-step"
    | "children"
    | "observations"
    | "pillbox"
    | "cabinet"
    | "family"
    | "live-activities"
    | "analytics";
  title: string;
  description: string;
  items: Array<{
    title: string;
    description: string;
  }>;
  actionLabel?: string;
  actionTarget?:
    | "children"
    | "journal"
    | "pillbox"
    | "cabinet"
    | "family"
    | "settings";
};

export type HelpScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  sections: HelpScreenSection[];
};

export function buildHelpScreenContent(locale: MobileLocale): HelpScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  if (isRu) {
    return {
      backLabel: "Ещё",
      title: "Помощь",
      subtitle: "Короткий гид по основным разделам и полезным действиям.",
      sections: [
        {
          id: "first-step",
          title: "Первый шаг",
          description: "С чего начать и куда перейти дальше.",
          actionLabel: "К разделу «Дети»",
          actionTarget: "children",
          items: [
            {
              title: "С чего начать",
              description:
                "Если открываете приложение впервые, начните с раздела «Дети».",
            },
            {
              title: "Можно вернуться позже",
              description:
                "Это справка. Закройте экран в любой момент и продолжайте работу.",
            },
          ],
        },
        {
          id: "children",
          title: "Дети",
          description: "Профили детей, история и вход в наблюдение.",
          actionLabel: "Открыть детей",
          actionTarget: "children",
          items: [
            {
              title: "Добавить ребёнка",
              description: "Если профиля ещё нет, начните здесь.",
            },
            {
              title: "Открыть историю",
              description: "Зайдите в ребёнка и откройте его завершённые эпизоды.",
            },
          ],
        },
        {
          id: "observations",
          title: "Наблюдения",
          description: "Температура, приёмы и заметки по текущему состоянию.",
          actionLabel: "Открыть наблюдения",
          actionTarget: "journal",
          items: [
            {
              title: "Начать наблюдение",
              description:
                "Откройте карточку ребёнка и запустите новое наблюдение.",
            },
            {
              title: "Добавлять записи",
              description:
                "Внутри наблюдения можно фиксировать температуру, приёмы и заметки.",
            },
            {
              title: "Проверить напоминания",
              description: "Ближайшие действия и планы видны сразу.",
            },
          ],
        },
        {
          id: "pillbox",
          title: "Таблетница",
          description: "Планы приёма: кто, что и когда принимает.",
          actionLabel: "Открыть таблетницу",
          actionTarget: "pillbox",
          items: [
            {
              title: "Создать план",
              description: "Добавьте лекарство, время приёма и сохраните план.",
            },
            {
              title: "Отмечать приём",
              description: "Когда время наступило, нажмите «Записать приём».",
            },
            {
              title: "Пауза и возобновление",
              description:
                "План можно поставить на паузу и вернуть без потери истории.",
            },
          ],
        },
        {
          id: "cabinet",
          title: "Аптечка",
          description: "Домашние препараты, сроки и остатки.",
          actionLabel: "Открыть аптечку",
          actionTarget: "cabinet",
          items: [
            {
              title: "Добавить упаковку",
              description: "Найдите в каталоге или добавьте вручную.",
            },
            {
              title: "Следить за сроками",
              description: "Сразу видно, что скоро истекает.",
            },
            {
              title: "Использовать в наблюдении",
              description: "Препарат можно выбрать прямо в эпизоде.",
            },
          ],
        },
        {
          id: "family",
          title: "Семья и доступы",
          description: "Кому что видно: дети, журнал, приёмы и аптечка.",
          actionLabel: "Открыть семью",
          actionTarget: "family",
          items: [
            {
              title: "Настроить доступ",
              description:
                "В «Семье» каждому участнику можно отдельно открыть детей, приёмы и аптечку.",
            },
            {
              title: "Выбрать детей",
              description:
                "Если доступ к детям открыт, выберите всех детей или только нужных.",
            },
            {
              title: "Не всем нужен полный доступ",
              description:
                "Для приёмов можно оставить только просмотр или отметку приёма.",
            },
          ],
        },
        {
          id: "live-activities",
          title: "Live Activity и уведомления",
          description: "Быстрый статус на iPhone и push по важным действиям.",
          actionLabel: "Открыть настройки",
          actionTarget: "settings",
          items: [
            {
              title: "Что включается",
              description:
                "В настройках отдельно включаются сон, кормление и наблюдение за болезнью.",
            },
            {
              title: "Где это видно",
              description:
                "На iPhone это видно как большая карточка на экране блокировки и как компактная бровь в Dynamic Island.",
            },
            {
              title: "Кому идут сигналы",
              description:
                "Push получают только участники с нужным доступом и включёнными уведомлениями.",
            },
          ],
        },
        {
          id: "analytics",
          title: "Аналитика истории ребёнка",
          description:
            "Где искать аналитику в истории ребёнка и что она показывает.",
          items: [
            {
              title: "Где искать аналитику",
              description:
                "Откройте ребёнка, затем его историю. Там есть общая сводка и разбор каждого эпизода.",
            },
            {
              title: "Что показывает сводка",
              description:
                "Она помогает понять, как часто ребёнок болел, как менялась частота и насколько длинными были эпизоды.",
            },
            {
              title: "Что показывает разбор",
              description:
                "Внутри эпизода видны температура, ключевые события, лекарства и краткая картина по записи.",
            },
          ],
        },
      ],
    };
  }

  if (isDe) {
    return {
      backLabel: "Mehr",
      title: "Hilfe",
      subtitle:
        "Ein kurzer Leitfaden zu den wichtigsten Bereichen und nützlichen Aktionen.",
      sections: [
        {
          id: "first-step",
          title: "Erster Schritt",
          description: "Wo Sie beginnen und wohin Sie als Nächstes gehen.",
          actionLabel: "Zu Kinder",
          actionTarget: "children",
          items: [
            {
              title: "Womit anfangen",
              description:
                "Wenn Sie die App zum ersten Mal öffnen, beginnen Sie mit dem Bereich Kinder.",
            },
            {
              title: "Später zurückkommen",
              description:
                "Das ist nur eine Hilfe. Sie können den Bildschirm jederzeit schließen und weiterarbeiten.",
            },
          ],
        },
        {
          id: "children",
          title: "Kinder",
          description: "Kinderprofile, Verlauf und Einstieg in Beobachtungen.",
          actionLabel: "Kinder öffnen",
          actionTarget: "children",
          items: [
            {
              title: "Kind hinzufügen",
              description:
                "Wenn noch kein Profil vorhanden ist, beginnen Sie hier.",
            },
            {
              title: "Verlauf öffnen",
              description:
                "Öffnen Sie ein Kind und sehen Sie sich abgeschlossene Episoden an.",
            },
          ],
        },
        {
          id: "observations",
          title: "Beobachtungen",
          description:
            "Temperatur, Gaben und Notizen zum aktuellen Zustand.",
          actionLabel: "Beobachtungen öffnen",
          actionTarget: "journal",
          items: [
            {
              title: "Beobachtung starten",
              description:
                "Öffnen Sie die Karte eines Kindes und starten Sie eine neue Beobachtung.",
            },
            {
              title: "Einträge hinzufügen",
              description:
                "Innerhalb der Beobachtung können Sie Temperatur, Gaben und Notizen festhalten.",
            },
            {
              title: "Erinnerungen prüfen",
              description:
                "Die nächsten Schritte und Pläne bleiben sofort sichtbar.",
            },
          ],
        },
        {
          id: "pillbox",
          title: "Medikamentenplan",
          description: "Wer was wann nimmt.",
          actionLabel: "Medikamentenplan öffnen",
          actionTarget: "pillbox",
          items: [
            {
              title: "Plan erstellen",
              description:
                "Fügen Sie ein Medikament und Zeiten hinzu und speichern Sie den Plan.",
            },
            {
              title: "Einnahme markieren",
              description:
                "Wenn die Zeit gekommen ist, tippen Sie auf die Einnahmebestätigung.",
            },
            {
              title: "Pausieren und fortsetzen",
              description:
                "Ein Plan kann pausiert und später ohne Verlust des Verlaufs fortgesetzt werden.",
            },
          ],
        },
        {
          id: "cabinet",
          title: "Hausapotheke",
          description: "Medikamente zu Hause, Haltbarkeit und Bestand.",
          actionLabel: "Hausapotheke öffnen",
          actionTarget: "cabinet",
          items: [
            {
              title: "Packung hinzufügen",
              description: "Im Katalog suchen oder manuell hinzufügen.",
            },
            {
              title: "Ablaufdaten prüfen",
              description: "Sie sehen sofort, was bald abläuft.",
            },
            {
              title: "In Beobachtungen verwenden",
              description:
                "Ein Medikament kann direkt in einer Episode ausgewählt werden.",
            },
          ],
        },
        {
          id: "family",
          title: "Familie und Zugriffe",
          description:
            "Wer Kinder, Journal, Einnahmen und Hausapotheke sehen darf.",
          actionLabel: "Familie öffnen",
          actionTarget: "family",
          items: [
            {
              title: "Zugriff einrichten",
              description:
                "Im Bereich Familie können Sie Kindern, Medikamentenplan und Hausapotheke getrennte Rechte geben.",
            },
            {
              title: "Kinder auswählen",
              description:
                "Wenn Kinderzugriff offen ist, wählen Sie alle oder nur einzelne Kinder.",
            },
            {
              title: "Nicht jeder braucht Vollzugriff",
              description:
                "Für Medikamentenpläne können Sie Lesen oder Einnahme-Bestätigung getrennt lassen.",
            },
          ],
        },
        {
          id: "live-activities",
          title: "Live Activity und Benachrichtigungen",
          description:
            "Schneller iPhone-Status und Push für wichtige Aktionen.",
          actionLabel: "Einstellungen öffnen",
          actionTarget: "settings",
          items: [
            {
              title: "Was aktiviert werden kann",
              description:
                "In den Einstellungen lassen sich Schlaf, Füttern und Krankheitsbeobachtung getrennt aktivieren.",
            },
            {
              title: "Wo es erscheint",
              description:
                "Auf dem iPhone sehen Sie es als große Karte auf dem Sperrbildschirm und kompakt in der Dynamic Island.",
            },
            {
              title: "Wer Signale erhält",
              description:
                "Push geht nur an Mitglieder mit passendem Zugriff und aktivierten Benachrichtigungen.",
            },
          ],
        },
        {
          id: "analytics",
          title: "Analyse der Verlaufshistorie",
          description:
            "Wo Sie die Analyse in der Historie des Kindes finden und was sie zeigt.",
          items: [
            {
              title: "Wo die Analyse ist",
              description:
                "Öffnen Sie ein Kind und dann seinen Verlauf. Dort gibt es eine Zusammenfassung und eine Detailansicht jeder Episode.",
            },
            {
              title: "Was die Zusammenfassung zeigt",
              description:
                "Sie hilft zu verstehen, wie oft das Kind krank war, wie sich die Häufigkeit verändert hat und wie lang die Episoden waren.",
            },
            {
              title: "Was die Detailansicht zeigt",
              description:
                "Innerhalb einer Episode sehen Sie Temperatur, wichtige Ereignisse, Medikamente und ein kurzes Bild der Einträge.",
            },
          ],
        },
      ],
    };
  }

  if (isPl) {
    return {
      backLabel: "Więcej",
      title: "Pomoc",
      subtitle:
        "Krótki przewodnik po najważniejszych modułach i przydatnych działaniach.",
      sections: [
        {
          id: "first-step",
          title: "Pierwszy krok",
          description: "Od czego zacząć i gdzie przejść dalej.",
          actionLabel: "Do dzieci",
          actionTarget: "children",
          items: [
            {
              title: "Od czego zacząć",
              description:
                "Jeśli otwierasz aplikację po raz pierwszy, zacznij od sekcji Dzieci.",
            },
            {
              title: "Możesz wrócić później",
              description:
                "To tylko pomoc. Zamknij ekran w dowolnym momencie i korzystaj dalej.",
            },
          ],
        },
        {
          id: "children",
          title: "Dzieci",
          description: "Profile dzieci, historia i wejście do obserwacji.",
          actionLabel: "Otwórz dzieci",
          actionTarget: "children",
          items: [
            {
              title: "Dodaj dziecko",
              description:
                "Jeśli profil jeszcze nie istnieje, zacznij tutaj.",
            },
            {
              title: "Otwórz historię",
              description: "Wejdź w dziecko i otwórz zakończone epizody.",
            },
          ],
        },
        {
          id: "observations",
          title: "Obserwacje",
          description:
            "Temperatura, podania i notatki o bieżącym stanie.",
          actionLabel: "Otwórz obserwacje",
          actionTarget: "journal",
          items: [
            {
              title: "Rozpocznij obserwację",
              description:
                "Otwórz kartę dziecka i uruchom nową obserwację.",
            },
            {
              title: "Dodawaj wpisy",
              description:
                "W środku obserwacji możesz zapisywać temperaturę, podania i notatki.",
            },
            {
              title: "Sprawdź przypomnienia",
              description:
                "Najbliższe działania i plany są od razu widoczne.",
            },
          ],
        },
        {
          id: "pillbox",
          title: "Tabletki",
          description: "Plany leków: kto, co i kiedy przyjmuje.",
          actionLabel: "Otwórz plany leków",
          actionTarget: "pillbox",
          items: [
            {
              title: "Utwórz plan",
              description: "Dodaj lek, godziny przyjęcia i zapisz plan.",
            },
            {
              title: "Zaznacz przyjęcie",
              description:
                "Gdy nadejdzie czas, stuknij zapis przyjęcia.",
            },
            {
              title: "Pauza i wznowienie",
              description:
                "Plan można wstrzymać i wznowić później bez utraty historii.",
            },
          ],
        },
        {
          id: "cabinet",
          title: "Apteczka",
          description: "Domowe leki, terminy i zapasy.",
          actionLabel: "Otwórz apteczkę",
          actionTarget: "cabinet",
          items: [
            {
              title: "Dodaj opakowanie",
              description: "Znajdź w katalogu albo dodaj ręcznie.",
            },
            {
              title: "Pilnuj terminów",
              description:
                "Od razu widać, co wkrótce się przeterminuje.",
            },
            {
              title: "Użyj w obserwacji",
              description: "Lek można wybrać bezpośrednio w epizodzie.",
            },
          ],
        },
        {
          id: "family",
          title: "Rodzina i dostępy",
          description:
            "Kto widzi dzieci, dziennik, podania i apteczkę.",
          actionLabel: "Otwórz rodzinę",
          actionTarget: "family",
          items: [
            {
              title: "Ustaw dostęp",
              description:
                "W sekcji Rodzina można osobno otworzyć dzieci, plany leków i apteczkę dla każdego członka.",
            },
            {
              title: "Wybierz dzieci",
              description:
                "Jeśli dostęp do dzieci jest włączony, wybierz wszystkie albo tylko potrzebne.",
            },
            {
              title: "Nie każdy potrzebuje pełnego dostępu",
              description:
                "Dla planów leków można zostawić tylko podgląd albo potwierdzanie podań.",
            },
          ],
        },
        {
          id: "live-activities",
          title: "Live Activity i powiadomienia",
          description:
            "Szybki status na iPhonie i push dla ważnych działań.",
          actionLabel: "Otwórz ustawienia",
          actionTarget: "settings",
          items: [
            {
              title: "Co można włączyć",
              description:
                "W ustawieniach osobno włączysz sen, karmienie i obserwację choroby.",
            },
            {
              title: "Gdzie to widać",
              description:
                "Na iPhonie pojawia się jako duża karta na ekranie blokady i mały pasek w Dynamic Island.",
            },
            {
              title: "Kto dostaje sygnały",
              description:
                "Push trafia tylko do osób z odpowiednim dostępem i włączonymi powiadomieniami.",
            },
          ],
        },
        {
          id: "analytics",
          title: "Analityka historii dziecka",
          description:
            "Gdzie szukać analityki w historii dziecka i co pokazuje.",
          items: [
            {
              title: "Gdzie szukać analityki",
              description:
                "Otwórz dziecko, a potem jego historię. Znajdziesz tam podsumowanie i rozbicie każdego epizodu.",
            },
            {
              title: "Co pokazuje podsumowanie",
              description:
                "Pomaga zrozumieć, jak często dziecko chorowało, jak zmieniała się częstotliwość i jak długie były epizody.",
            },
            {
              title: "Co pokazuje rozbicie",
              description:
                "W środku epizodu widać temperaturę, ważne wydarzenia, leki i krótki obraz zapisów.",
            },
          ],
        },
      ],
    };
  }

  return {
    backLabel: "More",
    title: "Help",
    subtitle: "A quick guide to the main sections and useful actions.",
    sections: [
      {
        id: "first-step",
        title: "First step",
        description: "Where to begin and where to go next.",
        actionLabel: "Go to Children",
        actionTarget: "children",
        items: [
          {
            title: "Where to start",
            description:
              "If this is your first time here, start with the Children section.",
          },
          {
            title: "You can return later",
            description:
              "This is just a guide. Close it anytime and continue using the app.",
          },
        ],
      },
      {
        id: "children",
        title: "Children",
        description: "Child profiles, history and tracking entry.",
        actionLabel: "Open children",
        actionTarget: "children",
        items: [
          {
            title: "Add a child",
            description: "Start here if the profile does not exist yet.",
          },
          {
            title: "Open history",
            description: "Go into a child and open completed episodes.",
          },
        ],
      },
      {
        id: "observations",
        title: "Tracking",
        description: "Temperature, doses and notes for the current state.",
        actionLabel: "Open tracking",
        actionTarget: "journal",
        items: [
          {
            title: "Start tracking",
            description:
              "Open a child card and launch a new tracking session.",
          },
          {
            title: "Add entries",
            description:
              "Inside a session you can log temperatures, doses and notes.",
          },
          {
            title: "Check reminders",
            description: "Nearest actions and plans stay visible.",
          },
        ],
      },
      {
        id: "pillbox",
        title: "Pillbox",
        description: "Medication plans: who takes what and when.",
        actionLabel: "Open pillbox",
        actionTarget: "pillbox",
        items: [
          {
            title: "Create a plan",
            description: "Add medicine, dose times and save the plan.",
          },
          {
            title: "Log a dose",
            description: "When it is time, tap the dose confirmation.",
          },
          {
            title: "Pause and resume",
            description:
              "Pause a plan and resume it later without losing history.",
          },
        ],
      },
      {
        id: "cabinet",
        title: "Cabinet",
        description: "Home medicines, expiry and stock.",
        actionLabel: "Open cabinet",
        actionTarget: "cabinet",
        items: [
          {
            title: "Add a pack",
            description: "Find in catalog or add manually.",
          },
          {
            title: "Watch expiry dates",
            description: "See what expires soon at a glance.",
          },
          {
            title: "Use during tracking",
            description: "Pick a medicine directly in an episode.",
          },
        ],
      },
      {
        id: "family",
        title: "Family and access",
        description: "Who can see children, tracking, pillbox, and cabinet.",
        actionLabel: "Open family",
        actionTarget: "family",
        items: [
          {
            title: "Set access",
            description:
              "In Family, each member can get separate access to children, pillbox, and cabinet.",
          },
          {
            title: "Choose children",
            description:
              "Once child access is open, choose all children or only selected ones.",
          },
          {
            title: "Not everyone needs full access",
            description:
              "For pillbox you can keep view-only or dose logging.",
          },
        ],
      },
      {
        id: "live-activities",
        title: "Live Activity and reminders",
        description: "Fast status on iPhone and push for important actions.",
        actionLabel: "Open settings",
        actionTarget: "settings",
        items: [
          {
            title: "What can be enabled",
            description:
              "Settings lets you enable sleep, feeding, and illness tracking separately.",
          },
          {
            title: "Where it appears",
            description:
              "On iPhone it appears as a large card on the lock screen and as a compact eyebrow in Dynamic Island.",
          },
          {
            title: "Who receives signals",
            description:
              "Push reminders only go to members with the required access and notifications enabled.",
          },
        ],
      },
      {
        id: "analytics",
        title: "Child history analytics",
        description:
          "Where to find analytics in a child's history and what it shows.",
        items: [
          {
            title: "Where to find analytics",
            description:
              "Open a child, then their history. There you get both a summary and a breakdown of each episode.",
          },
          {
            title: "What the summary shows",
            description:
              "It helps you understand how often the child was sick, how the frequency changed and how long the episodes were.",
          },
          {
            title: "What the breakdown shows",
            description:
              "Inside an episode you can see temperature, key events, medicines and a short picture of the record.",
          },
        ],
      },
    ],
  };
}
