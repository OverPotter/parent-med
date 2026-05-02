import axios from "axios";
import { useRef, useState } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { Link, useLocation } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { PublicSiteHeader } from "@shared/components/PublicSiteHeader";
import { useI18n } from "@shared/hooks/useI18n";
import { getSupportEmail, getSupportMailtoUrl } from "@shared/config/legal";
import { useAppStore } from "@shared/store/useAppStore";
import { submitPublicSupportRequest } from "@shared/api/feedback";
import {
  illnessCompactInputClass,
  illnessCompactPrimaryButtonClass,
  illnessPanelSoftClass,
} from "./child-illness/shared";
import { isPaywallLegalRouteState } from "./legal/legalRouteState";

const backLinkClass = "inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary";

export function SupportPage() {
  const { language, copy: appCopy } = useI18n();
  const hasSession = useAppStore((s) => Boolean(s.authToken || s.accountId));
  const handleBack = useHistoryBackFallback("/legal");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const fromPaywall = isPaywallLegalRouteState(location.state);
  const showPublicHeader = !hasSession || fromPaywall;
  const [replyContact, setReplyContact] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const supportEmail = getSupportEmail();
  const supportMailtoUrl = getSupportMailtoUrl();
  const isRussian = language === "ru";
  const accountHref = hasSession ? "/more" : null;
  const accountLabel = hasSession ? (isRussian ? "Ещё" : "More") : null;
  const copy = isRussian
    ? {
        title: "Поддержка / Контакты",
        subtitle:
          "Публичный канал связи доступен без входа. Оставьте контакт для ответа и отправьте сообщение команде.",
        back: "← Правовая информация",
        formTitle: "Отправить сообщение",
        formHint:
          "Эту страницу можно использовать как Support URL для App Store Review, privacy-запросов и общих вопросов.",
        contactLabel: "Контакт для ответа",
        contactPlaceholder: "Email, Telegram или другой контакт…",
        messageLabel: "Сообщение",
        messagePlaceholder: "Коротко опишите вопрос, проблему или запрос…",
        privacyHint:
          "Не указывайте лишние медицинские подробности и персональные данные детей, если они не нужны для ответа.",
        emailHint: "Контактный email:",
        inAppHint:
          "Если вы уже вошли в приложение, внутреннюю форму Feedback можно использовать дополнительно.",
        submit: "Отправить",
        submitting: "Отправляем…",
        success: "Спасибо! Обращение отправлено, команда сможет ответить по указанному контакту.",
        errors: {
          replyContact: "Укажите контакт для ответа.",
          message: "Введите сообщение.",
          rateLimited: "Слишком много обращений за час. Попробуйте позже.",
          generic: "Не удалось отправить обращение. Попробуйте ещё раз.",
        },
      }
    : {
        title: "Support / Contact",
        subtitle:
          "A public contact channel is available without signing in. Leave a reply contact and send your message to the team.",
        back: "← Legal information",
        formTitle: "Send a message",
        formHint:
          "This page can be used as the App Store Support URL for App Review, privacy requests, and general questions.",
        contactLabel: "Reply contact",
        contactPlaceholder: "Email, Telegram, or another contact…",
        messageLabel: "Message",
        messagePlaceholder: "Briefly describe the question, problem, or request…",
        privacyHint:
          "Do not include unnecessary medical details or children’s personal data unless they are needed for the reply.",
        emailHint: "Contact email:",
        inAppHint:
          "If you are already signed in, the in-app Feedback form can still be used as an additional channel.",
        submit: "Send",
        submitting: "Sending…",
        success:
          "Thanks. Your request was sent and the team can reply using the contact you provided.",
        errors: {
          replyContact: "Please provide a reply contact.",
          message: "Please enter a message.",
          rateLimited: "Too many requests per hour. Please try again later.",
          generic: "Could not send the request. Please try again.",
        },
      };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedReplyContact = replyContact.trim();
    const normalizedMessage = message.trim();
    if (!normalizedReplyContact) {
      setError(copy.errors.replyContact);
      setSuccess(false);
      return;
    }
    if (!normalizedMessage) {
      setError(copy.errors.message);
      setSuccess(false);
      return;
    }
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      await submitPublicSupportRequest({
        reply_contact: normalizedReplyContact,
        message: normalizedMessage,
        client_request_id: crypto.randomUUID(),
      });
      setSuccess(true);
      setReplyContact("");
      setMessage("");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { detail?: string; code?: string } | undefined;
        if (data?.code === "PUBLIC_SUPPORT_RATE_LIMITED") {
          setError(copy.errors.rateLimited);
        } else if (typeof data?.detail === "string") {
          setError(data.detail);
        } else {
          setError(copy.errors.generic);
        }
      } else {
        setError(copy.errors.generic);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={[
        "legal-doc-page mx-auto w-full max-w-3xl min-w-0 space-y-6 px-3 pb-6 sm:space-y-8 sm:px-0",
        fromPaywall ? "legal-doc-page--paywall" : "",
        showPublicHeader ? "" : "app-safe-top-standalone",
      ].join(" ")}
    >
      {showPublicHeader ? (
        <PublicSiteHeader accountHref={accountHref} accountLabel={accountLabel} />
      ) : null}
      <IosEdgeBackGesture isEnabled onBack={handleBack} targetRef={rootRef} />
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <button type="button" onClick={handleBack} className={backLinkClass}>
            {copy.back}
          </button>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <button
            type="button"
            onClick={handleBack}
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {copy.back}
          </button>
          <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
          <p className="app-mobile-section-intro__hint">{copy.subtitle}</p>
        </div>
      </div>

      <section className={`${illnessPanelSoftClass} legal-doc-surface overflow-hidden p-5 sm:p-6`}>
        <div className="space-y-1">
          <h2 className="app-card-title">{copy.formTitle}</h2>
          <p className="text-sm leading-6 text-muted">{copy.formHint}</p>
        </div>

        {supportMailtoUrl ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            {copy.emailHint}{" "}
            <a
              href={supportMailtoUrl}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {supportEmail}
            </a>
          </p>
        ) : null}

        {hasSession ? (
          <p className="mt-2 text-sm leading-6 text-muted">
            {copy.inAppHint}{" "}
            <Link
              to="/feedback"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {appCopy.feedback.navShort}
            </Link>
          </p>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">{copy.contactLabel}</span>
            <input
              className={illnessCompactInputClass}
              name="reply_contact"
              maxLength={320}
              required
              value={replyContact}
              placeholder={copy.contactPlaceholder}
              onChange={(event) => setReplyContact(event.target.value)}
              disabled={pending}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">{copy.messageLabel}</span>
            <textarea
              className={`${illnessCompactInputClass} min-h-[10rem] resize-y py-3 leading-6`}
              name="message"
              rows={6}
              maxLength={8000}
              required
              value={message}
              placeholder={copy.messagePlaceholder}
              onChange={(event) => setMessage(event.target.value)}
              disabled={pending}
            />
          </label>

          <p className="text-sm leading-6 text-muted">{copy.privacyHint}</p>

          {error ? (
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="soft-note-success rounded-2xl px-4 py-3 text-sm" role="status">
              {copy.success}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={`${illnessCompactPrimaryButtonClass} min-w-[12rem] justify-center`}
              disabled={pending || !replyContact.trim() || !message.trim()}
            >
              {pending ? copy.submitting : copy.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
