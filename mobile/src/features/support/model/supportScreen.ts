import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type SupportScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  contactLabel: string;
  contactPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  privacyHint: string;
  submitLabel: string;
  submittingLabel: string;
  successLabel: string;
  errors: {
    replyContact: string;
    message: string;
    rateLimited: string;
    generic: string;
  };
};

export function buildSupportScreenContent(
  locale: MobileLocale,
): SupportScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    title: isRu ? "Поддержка / Контакты" : isDe ? "Support / Kontakt" : isPl ? "Wsparcie / Kontakt" : "Support / Contact",
    subtitle: isRu
      ? "Оставьте контакт для ответа и отправьте сообщение команде прямо из приложения."
      : isDe
        ? "Hinterlassen Sie einen Kontakt für die Antwort und senden Sie dem Team direkt aus der App eine Nachricht."
      : isPl
        ? "Zostaw kontakt do odpowiedzi i wyślij wiadomość do zespołu bezpośrednio z aplikacji."
      : "Leave a reply contact and send a message to the team directly from the app.",
    contactLabel: isRu ? "Контакт для ответа" : isDe ? "Kontakt für die Antwort" : isPl ? "Kontakt do odpowiedzi" : "Reply contact",
    contactPlaceholder: isRu
      ? "Email, Telegram или другой контакт…"
      : isDe
        ? "E-Mail, Telegram oder ein anderer Kontakt…"
      : isPl
        ? "E-mail, Telegram lub inny kontakt…"
      : "Email, Telegram, or another contact…",
    messageLabel: isRu ? "Сообщение" : isDe ? "Nachricht" : isPl ? "Wiadomość" : "Message",
    messagePlaceholder: isRu
      ? "Коротко опишите вопрос, проблему или запрос…"
      : isDe
        ? "Beschreiben Sie kurz Ihre Frage, das Problem oder Ihr Anliegen…"
      : isPl
        ? "Krótko opisz pytanie, problem lub prośbę…"
      : "Briefly describe the question, problem, or request…",
    privacyHint: isRu
      ? "Не указывайте лишние медицинские подробности и персональные данные детей, если они не нужны для ответа."
      : isDe
        ? "Bitte geben Sie keine unnötigen medizinischen Details oder personenbezogenen Daten der Kinder an, wenn sie für die Antwort nicht erforderlich sind."
      : isPl
        ? "Nie podawaj zbędnych szczegółów medycznych ani danych osobowych dzieci, jeśli nie są potrzebne do odpowiedzi."
      : "Do not include unnecessary medical details or children’s personal data unless needed for the reply.",
    submitLabel: isRu ? "Отправить" : isDe ? "Senden" : isPl ? "Wyślij" : "Send",
    submittingLabel: isRu ? "Отправляем…" : isDe ? "Wird gesendet…" : isPl ? "Wysyłanie…" : "Sending…",
    successLabel: isRu
      ? "Спасибо! Обращение отправлено, команда сможет ответить по указанному контакту."
      : isDe
        ? "Danke. Ihre Anfrage wurde gesendet und das Team kann über den angegebenen Kontakt antworten."
      : isPl
        ? "Dziękujemy. Wiadomość została wysłana, a zespół może odpowiedzieć na podany kontakt."
      : "Thanks. Your request was sent and the team can reply using the contact you provided.",
    errors: {
      replyContact: isRu
        ? "Укажите контакт для ответа."
        : isDe
          ? "Bitte geben Sie einen Kontakt für die Antwort an."
        : isPl
          ? "Podaj kontakt do odpowiedzi."
        : "Please provide a reply contact.",
      message: isRu ? "Введите сообщение." : isDe ? "Bitte geben Sie eine Nachricht ein." : isPl ? "Wpisz wiadomość." : "Please enter a message.",
      rateLimited: isRu
        ? "Слишком много обращений за час. Попробуйте позже."
        : isDe
          ? "Zu viele Anfragen in einer Stunde. Bitte versuchen Sie es später erneut."
        : isPl
          ? "Zbyt wiele zgłoszeń w ciągu godziny. Spróbuj ponownie później."
        : "Too many requests per hour. Please try again later.",
      generic: isRu
        ? "Не удалось отправить обращение. Попробуйте ещё раз."
        : isDe
          ? "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut."
        : isPl
          ? "Nie udało się wysłać zgłoszenia. Spróbuj ponownie."
        : "Could not send the request. Please try again.",
    },
  };
}
