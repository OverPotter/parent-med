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

  return {
    backLabel: isRu ? "Назад" : "Back",
    title: isRu ? "Поддержка / Контакты" : "Support / Contact",
    subtitle: isRu
      ? "Оставьте контакт для ответа и отправьте сообщение команде прямо из приложения."
      : "Leave a reply contact and send a message to the team directly from the app.",
    contactLabel: isRu ? "Контакт для ответа" : "Reply contact",
    contactPlaceholder: isRu
      ? "Email, Telegram или другой контакт…"
      : "Email, Telegram, or another contact…",
    messageLabel: isRu ? "Сообщение" : "Message",
    messagePlaceholder: isRu
      ? "Коротко опишите вопрос, проблему или запрос…"
      : "Briefly describe the question, problem, or request…",
    privacyHint: isRu
      ? "Не указывайте лишние медицинские подробности и персональные данные детей, если они не нужны для ответа."
      : "Do not include unnecessary medical details or children’s personal data unless needed for the reply.",
    submitLabel: isRu ? "Отправить" : "Send",
    submittingLabel: isRu ? "Отправляем…" : "Sending…",
    successLabel: isRu
      ? "Спасибо! Обращение отправлено, команда сможет ответить по указанному контакту."
      : "Thanks. Your request was sent and the team can reply using the contact you provided.",
    errors: {
      replyContact: isRu
        ? "Укажите контакт для ответа."
        : "Please provide a reply contact.",
      message: isRu ? "Введите сообщение." : "Please enter a message.",
      rateLimited: isRu
        ? "Слишком много обращений за час. Попробуйте позже."
        : "Too many requests per hour. Please try again later.",
      generic: isRu
        ? "Не удалось отправить обращение. Попробуйте ещё раз."
        : "Could not send the request. Please try again.",
    },
  };
}
