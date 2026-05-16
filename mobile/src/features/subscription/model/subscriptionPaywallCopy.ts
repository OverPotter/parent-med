export type SubscriptionPaywallCopy = {
  title: string;
  subtitle: string;
  freeTitle: string;
  plusTitle: string;
  freeForever: string;
  freeItems: string[];
  plusItems: string[];
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
    title: isRu ? "Начните бесплатно или выберите Plus" : isDe ? "Mit Kostenlos oder Plus starten" : isPl ? "Zacznij za darmo lub wybierz Plus" : "Start with Free or Plus",
    subtitle: isRu
      ? "Выберите вариант, который подходит вашей семье."
      : isDe
        ? "Wählen Sie die Option, die zu Ihrer Familie passt."
        : isPl
          ? "Wybierz opcję, która pasuje Twojej rodzinie."
          : "Choose the setup that fits your family care flow.",
    freeTitle: isRu ? "Бесплатно" : isDe ? "Kostenlos" : isPl ? "Darmowy" : "Free",
    plusTitle: "Plus",
    freeForever: isRu ? "Навсегда бесплатно" : isDe ? "Dauerhaft kostenlos" : isPl ? "Darmowy na zawsze" : "Free forever",
    freeItems: isRu
      ? ["1 взрослый аккаунт", "1 ребёнок", "1 план лекарств", "Домашняя аптечка", "Уведомления", "Аналитика"]
      : isDe
        ? ["1 Konto für Erwachsene", "1 Kind", "1 Medikamentenplan", "Hausapotheke", "Benachrichtigungen", "Analysen"]
        : isPl
          ? ["1 konto dorosłego", "1 dziecko", "1 plan leków", "Apteczka", "Powiadomienia", "Analityka"]
          : ["1 adult account", "1 child", "1 medication plan", "Medicine cabinet", "Notifications", "Analytics"],
    plusItems: isRu
      ? ["Всё из бесплатного плана, плюс:", "Вся семья и приглашения", "Безлимит детей", "Справочник лекарств", "Доступы и приватность", "Live Activities", "Экспорт CSV / Excel"]
      : isDe
        ? ["Alles aus Kostenlos, plus:", "Die ganze Familie und Einladungen", "Unbegrenzte Kinder", "Medikamentenratgeber", "Zugriffe und Privatsphäre", "Live Activities", "CSV-/Excel-Export"]
        : isPl
          ? ["Wszystko z planu darmowego, plus:", "Cała rodzina i zaproszenia", "Nielimitowana liczba dzieci", "Przewodnik po lekach", "Dostępy i prywatność", "Live Activities", "Eksport CSV / Excel"]
          : ["Everything in Free, plus:", "Whole family and invites", "Unlimited children", "Medicine guide", "Access and privacy controls", "Live Activities", "CSV / Excel export"],
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
  };
}
