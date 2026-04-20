import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { submitFeedback } from "@shared/api/feedback";
import { PageIntro } from "@shared/components/PageIntro";
import { useI18n } from "@shared/hooks/useI18n";
import {
  illnessCompactInputClass,
  illnessCompactPrimaryButtonClass,
  illnessPanelSoftClass,
} from "./child-illness/shared";

export function FeedbackPage() {
  const { copy, language } = useI18n();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      setError(copy.feedback.errors.empty);
      setSuccess(false);
      return;
    }
    setError(null);
    setSuccess(false);
    setPending(true);
    const clientRequestId = crypto.randomUUID();
    try {
      await submitFeedback({ message: normalizedMessage, client_request_id: clientRequestId });
      setSuccess(true);
      setMessage("");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { detail?: string; code?: string } | undefined;
        if (data?.code === "FEEDBACK_RATE_LIMITED") {
          setError(copy.feedback.errors.rateLimited);
        } else if (typeof data?.detail === "string") {
          setError(data.detail);
        } else {
          setError(copy.feedback.errors.generic);
        }
      } else {
        setError(copy.feedback.errors.generic);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.feedback.pageTitle}
        subtitle={copy.feedback.pageSubtitle}
        action={
          <Link
            to="/more"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />
      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/more"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
          <h1 className="app-mobile-section-intro__title">{copy.feedback.pageTitle}</h1>
          <p className="app-mobile-section-intro__hint">{copy.feedback.pageSubtitle}</p>
        </div>
      </div>

      <section className={`${illnessPanelSoftClass} overflow-hidden p-5 sm:p-6`}>
        <div className="space-y-1">
          <h2 className="app-card-title">{copy.feedback.formTitle}</h2>
          <p className="text-sm leading-6 text-muted">{copy.feedback.formHint}</p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="block">
            <textarea
              className={`${illnessCompactInputClass} min-h-[10rem] resize-y py-3 leading-6`}
              name="message"
              rows={6}
              maxLength={8000}
              required
              value={message}
              placeholder={copy.feedback.placeholder}
              onChange={(e) => setMessage(e.target.value)}
              disabled={pending}
            />
          </label>

          <p className="text-sm leading-6 text-muted">{copy.feedback.privacyHint}</p>

          {error ? (
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="soft-note-success rounded-2xl px-4 py-3 text-sm" role="status">
              {copy.feedback.success}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={`${illnessCompactPrimaryButtonClass} min-w-[12rem] justify-center`}
              disabled={pending || !message.trim()}
            >
              {pending ? copy.feedback.submitting : copy.feedback.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
