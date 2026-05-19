export type SubscriptionPaywallCopy = {
  title: string;
  subtitle: string;
  freeTitle: string;
  plusTitle: string;
  freeBadge: string;
  plusBadge: string;
  freeForever: string;
  plusMore: string;
  freeItems: SubscriptionPaywallFeature[];
  plusItems: SubscriptionPaywallFeature[];
  comparisonLabel: string;
  plansLabel: string;
  annualTitle: string;
  monthlyTitle: string;
  annualDescription: string;
  monthlyDescription: string;
  annualBadge: string;
  ctaTrial: string;
  ctaSubscribe: string;
  continueFree: string;
  legalTrial: string;
  legalNoTrial: string;
  restore: string;
  terms: string;
  privacy: string;
  loading: string;
  restoreSuccess: string;
  restoreInactive: string;
  unavailable: string;
  purchaseUnavailable: string;
  purchaseNotActivated: string;
  purchaseFailed: string;
  restoreFailed: string;
};

export type SubscriptionPaywallFeature = {
  icon:
    | "user"
    | "users"
    | "heart"
    | "clipboard"
    | "shield"
    | "activity"
    | "calendar"
    | "download"
    | "zap";
  label: string;
};

export function formatIntroDuration(
  locale: string,
  periodUnit: string,
  periodNumberOfUnits: number,
) {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const count = Math.max(periodNumberOfUnits, 1);
  const unit = String(periodUnit).toUpperCase();

  if (isRu) {
    if (unit === "DAY") return `${count} ${count === 1 ? "день" : count < 5 ? "дня" : "дней"}`;
    if (unit === "WEEK") return `${count} ${count === 1 ? "неделю" : count < 5 ? "недели" : "недель"}`;
    if (unit === "MONTH") return `${count} ${count === 1 ? "месяц" : count < 5 ? "месяца" : "месяцев"}`;
    if (unit === "YEAR") return `${count} ${count === 1 ? "год" : count < 5 ? "года" : "лет"}`;
  }

  if (isDe) {
    if (unit === "DAY") return `${count} ${count === 1 ? "Tag" : "Tage"}`;
    if (unit === "WEEK") return `${count} ${count === 1 ? "Woche" : "Wochen"}`;
    if (unit === "MONTH") return `${count} ${count === 1 ? "Monat" : "Monate"}`;
    if (unit === "YEAR") return `${count} ${count === 1 ? "Jahr" : "Jahre"}`;
  }

  if (isPl) {
    if (unit === "DAY") return `${count} ${count === 1 ? "dzień" : "dni"}`;
    if (unit === "WEEK") return `${count} ${count === 1 ? "tydzień" : "tygodnie"}`;
    if (unit === "MONTH") return `${count} ${count === 1 ? "miesiąc" : "miesiące"}`;
    if (unit === "YEAR") return `${count} ${count === 1 ? "rok" : "lata"}`;
  }

  if (unit === "DAY") return `${count} ${count === 1 ? "day" : "days"}`;
  if (unit === "WEEK") return `${count} ${count === 1 ? "week" : "weeks"}`;
  if (unit === "MONTH") return `${count} ${count === 1 ? "month" : "months"}`;
  if (unit === "YEAR") return `${count} ${count === 1 ? "year" : "years"}`;
  return `${count}`;
}

export function buildSubscriptionPaywallCopy(
  locale: string,
): SubscriptionPaywallCopy {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    title: isRu ? "Все для семьи в одном месте" : isDe ? "Wählen Sie einen Plan für Ihre Familie" : isPl ? "Wybierz plan dla rodziny" : "Choose a plan for your family",
    subtitle: isRu
      ? "Дети, болезни, аптечка и таблетница. Начните бесплатно и подключите Plus, когда нужен семейный режим."
      : isDe
        ? "Kostenlos für den Start. Plus für Familie, gemeinsame Pflege und erweiterte Funktionen."
        : isPl
          ? "Darmowy na start. Plus dla rodziny, wspólnej opieki i rozszerzonych funkcji."
          : "Free to start. Plus for shared family care and advanced features.",
    freeTitle: isRu ? "Старт" : isDe ? "Start" : isPl ? "Start" : "Start",
    plusTitle: isRu ? "Семья" : isDe ? "Familie" : isPl ? "Rodzina" : "Family",
    freeBadge: isRu ? "Бесплатно" : isDe ? "Kostenlos" : isPl ? "Darmowy" : "Free",
    plusBadge: "Plus",
    freeForever: isRu ? "Навсегда бесплатно" : isDe ? "Dauerhaft kostenlos" : isPl ? "Darmowy na zawsze" : "Free forever",
    plusMore: isRu ? "И многое другое" : isDe ? "Und vieles mehr" : isPl ? "I wiele więcej" : "And much more",
    freeItems: isRu
      ? [
          { icon: "user", label: "1 взрослый" },
          { icon: "heart", label: "1 ребёнок" },
          { icon: "calendar", label: "1 план приёма" },
          { icon: "clipboard", label: "Журнал болезней" },
          { icon: "activity", label: "Сон, кормление, рост" },
          { icon: "shield", label: "Домашняя аптечка" },
        ]
      : isDe
        ? [
            { icon: "user", label: "1 Konto für Erwachsene" },
            { icon: "heart", label: "1 Kind" },
            { icon: "calendar", label: "1 Medikamentenplan" },
            { icon: "clipboard", label: "Journal und Krankheiten" },
            { icon: "activity", label: "Schlaf, Füttern und Wachstum" },
            { icon: "shield", label: "Hausapotheke" },
          ]
        : isPl
          ? [
              { icon: "user", label: "1 konto dorosłego" },
              { icon: "heart", label: "1 dziecko" },
              { icon: "calendar", label: "1 plan leków" },
              { icon: "clipboard", label: "Dziennik i choroby" },
              { icon: "activity", label: "Sen, karmienie i wzrost" },
              { icon: "shield", label: "Apteczka" },
            ]
          : [
              { icon: "user", label: "1 adult account" },
              { icon: "heart", label: "1 child" },
              { icon: "calendar", label: "1 medication plan" },
              { icon: "clipboard", label: "Journal and illness" },
              { icon: "activity", label: "Sleep, feeding and growth" },
              { icon: "shield", label: "Medicine cabinet" },
            ],
    plusItems: isRu
      ? [
          { icon: "users", label: "Приглашения для семьи" },
          { icon: "heart", label: "Дети без лимита" },
          { icon: "shield", label: "Гибкие доступы" },
          { icon: "calendar", label: "Несколько планов приёма" },
          { icon: "activity", label: "Live Activities" },
          { icon: "download", label: "Экспорт CSV" },
        ]
      : isDe
        ? [
            { icon: "users", label: "Die ganze Familie und Einladungen" },
            { icon: "heart", label: "Unbegrenzte Kinder" },
            { icon: "shield", label: "Zugriffe und Privatsphäre" },
            { icon: "calendar", label: "Mehrere Medikamentenpläne" },
            { icon: "activity", label: "Live Activities" },
            { icon: "download", label: "CSV-Export" },
          ]
        : isPl
          ? [
              { icon: "users", label: "Cała rodzina i zaproszenia" },
              { icon: "heart", label: "Nielimitowana liczba dzieci" },
              { icon: "shield", label: "Dostępy i prywatność" },
              { icon: "calendar", label: "Wiele planów leków" },
              { icon: "activity", label: "Live Activities" },
              { icon: "download", label: "Eksport CSV" },
            ]
          : [
              { icon: "users", label: "Whole family and invites" },
              { icon: "heart", label: "Unlimited children" },
              { icon: "shield", label: "Access and privacy controls" },
              { icon: "calendar", label: "Multiple medication plans" },
              { icon: "activity", label: "Live Activities" },
              { icon: "download", label: "CSV export" },
            ],
    comparisonLabel: isRu ? "Что входит" : isDe ? "Was enthalten ist" : isPl ? "Co zawiera plan" : "What you get",
    plansLabel: isRu ? "Выберите план Plus" : isDe ? "Wählen Sie einen Plus-Plan" : isPl ? "Wybierz plan Plus" : "Choose a Plus plan",
    annualTitle: isRu ? "Год" : isDe ? "Jahr" : isPl ? "Rok" : "Year",
    monthlyTitle: isRu ? "Месяц" : isDe ? "Monat" : isPl ? "Miesiąc" : "Month",
    annualDescription: isRu ? "Лучший вариант для семьи" : isDe ? "Am besten für Familien" : isPl ? "Najlepsza opcja dla rodziny" : "Best value for families",
    monthlyDescription: isRu ? "Гибкая подписка на месяц" : isDe ? "Flexible monatliche Option" : isPl ? "Elastyczna opcja miesięczna" : "Flexible monthly option",
    annualBadge: isRu ? "Выгоднее" : isDe ? "Besser" : isPl ? "Korzystniej" : "Best value",
    ctaTrial: isRu ? "Начать бесплатный период" : isDe ? "Kostenlosen Zeitraum starten" : isPl ? "Rozpocznij bezpłatny okres" : "Start free trial",
    ctaSubscribe: isRu ? "Подключить Plus" : isDe ? "Plus aktivieren" : isPl ? "Włącz Plus" : "Get Plus",
    continueFree: isRu ? "Остаться на бесплатном плане" : isDe ? "Beim kostenlosen Plan bleiben" : isPl ? "Zostań przy planie darmowym" : "Continue with Free",
    legalTrial: isRu
      ? "{duration} бесплатно, затем {price}. Автопродление. Отмена минимум за 24 часа до окончания периода."
      : isDe
        ? "{duration} kostenlos, danach {price}. Automatische Verlängerung. Kündigung spätestens 24 Stunden vor Periodenende."
        : isPl
          ? "{duration} za darmo, potem {price}. Automatyczne odnawianie. Anuluj co najmniej 24 godziny przed końcem okresu."
          : "{duration} free, then {price}. Auto-renews unless canceled at least 24 hours before the end of the current period.",
    legalNoTrial: isRu
      ? "Подписка за {price}. Автопродление. Отмена минимум за 24 часа до окончания периода."
      : isDe
        ? "Abo für {price}. Automatische Verlängerung. Kündigung spätestens 24 Stunden vor Periodenende."
        : isPl
          ? "Subskrypcja za {price}. Automatyczne odnawianie. Anuluj co najmniej 24 godziny przed końcem okresu."
          : "Subscription for {price}. Auto-renews unless canceled at least 24 hours before the end of the current period.",
    restore: isRu ? "Восстановить покупки" : isDe ? "Käufe wiederherstellen" : isPl ? "Przywróć zakupy" : "Restore purchases",
    terms: isRu ? "Условия" : isDe ? "Bedingungen" : isPl ? "Warunki" : "Terms",
    privacy: isRu ? "Конфиденциальность" : isDe ? "Datenschutz" : isPl ? "Prywatność" : "Privacy",
    loading: isRu ? "Загружаем цены…" : isDe ? "Preise werden geladen…" : isPl ? "Ładowanie cen…" : "Loading prices…",
    restoreSuccess: isRu ? "Покупки восстановлены." : isDe ? "Käufe wurden wiederhergestellt." : isPl ? "Zakupy zostały przywrócone." : "Purchases restored.",
    restoreInactive: isRu ? "Активных покупок для восстановления не найдено." : isDe ? "Es wurden keine aktiven Käufe zum Wiederherstellen gefunden." : isPl ? "Nie znaleziono aktywnych zakupów do przywrócenia." : "No active purchases were found to restore.",
    unavailable: isRu
      ? "Подписка сейчас недоступна. Попробуйте позже."
      : isDe
        ? "Das Abo ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut."
        : isPl
          ? "Subskrypcja jest teraz niedostępna. Spróbuj ponownie później."
          : "Subscription is unavailable right now. Please try again later.",
    purchaseUnavailable: isRu
      ? "Покупка сейчас недоступна. Попробуйте позже."
      : isDe
        ? "Der Kauf ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut."
        : isPl
          ? "Zakup jest teraz niedostępny. Spróbuj ponownie później."
          : "Purchase is unavailable right now. Please try again later.",
    purchaseNotActivated: isRu
      ? "Покупка завершена, но доступ Plus не активировался. Попробуйте восстановить покупки."
      : isDe
        ? "Der Kauf wurde abgeschlossen, aber Plus wurde nicht aktiviert. Bitte versuchen Sie, Käufe wiederherzustellen."
        : isPl
          ? "Zakup został zakończony, ale dostęp Plus nie został aktywowany. Spróbuj przywrócić zakupy."
          : "Purchase completed, but Plus access did not activate. Please try Restore purchases.",
    purchaseFailed: isRu
      ? "Не удалось оформить подписку. Попробуйте ещё раз."
      : isDe
        ? "Das Abo konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut."
        : isPl
          ? "Nie udało się włączyć subskrypcji. Spróbuj ponownie."
          : "Could not complete the subscription. Please try again.",
    restoreFailed: isRu
      ? "Не удалось восстановить покупки. Попробуйте ещё раз."
      : isDe
        ? "Käufe konnten nicht wiederhergestellt werden. Bitte versuchen Sie es erneut."
        : isPl
          ? "Nie udało się przywrócić zakupów. Spróbuj ponownie."
          : "Could not restore purchases. Please try again.",
  };
}
