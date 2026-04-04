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
    setError(null);
    setSuccess(false);
    setPending(true);
    const clientRequestId = crypto.randomUUID();
    try {
      await submitFeedback({ message, client_request_id: clientRequestId });
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

      <Surface className="p-5 sm:p-8">
        <p className="text-sm leading-6 text-muted">{copy.feedback.privacyHint}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="block">
            <span className="sr-only">{copy.feedback.placeholder}</span>
            <textarea
              className="soft-input min-h-[160px] w-full resize-y rounded-2xl px-4 py-3 text-sm"
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
            <p className="text-sm text-destructive" role="alert">
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
            className="soft-primary-button rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-60"
            disabled={pending}
          >
            {pending ? copy.feedback.submitting : copy.feedback.submit}
          </button>
        </form>
      </Surface>
    </div>
  );
}
