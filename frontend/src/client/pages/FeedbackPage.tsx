import axios from "axios";
import { useState } from "react";
import { submitFeedback } from "@shared/api/feedback";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function FeedbackPage() {
  const { copy } = useI18n();
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
    <div className="min-w-0 space-y-6">
      <PageIntro title={copy.feedback.pageTitle} subtitle={copy.feedback.pageSubtitle} />

      <Surface className="app-section-surface space-y-4 rounded-[24px] p-5 sm:rounded-[26px] sm:p-8">
        <p className="text-[0.86rem] leading-6 text-muted sm:text-[0.9rem]">
          {copy.feedback.privacyHint}
        </p>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="block space-y-1.5">
            <span className="sr-only">{copy.feedback.placeholder}</span>
            <textarea
              className="soft-input min-h-[170px] w-full resize-y rounded-[20px] px-4 py-3 text-base leading-6 sm:min-h-[190px]"
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

          {error ? (
            <p className="soft-note-danger rounded-2xl px-4 py-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {copy.feedback.success}
            </p>
          ) : null}

          <button
            type="submit"
            className="app-btn-primary-md soft-button-primary inline-flex min-w-[12rem] items-center justify-center rounded-[20px] px-5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !message.trim()}
          >
            {pending ? copy.feedback.submitting : copy.feedback.submit}
          </button>
        </form>
      </Surface>
    </div>
  );
}
