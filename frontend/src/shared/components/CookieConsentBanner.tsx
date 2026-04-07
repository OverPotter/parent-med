import { Link } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";
import { setCookieConsentDecision } from "@shared/privacy/cookieConsent";

export function CookieConsentBanner() {
  const { language } = useI18n();

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="soft-panel mx-auto w-full max-w-5xl rounded-[24px] p-4 sm:p-5">
        <p className="text-sm leading-6 text-muted">
          {language === "ru"
            ? "Мы используем только необходимые cookie для входа и, с вашего согласия, аналитические cookie для улучшения сервиса."
            : "We use essential cookies for sign-in and, with your consent, analytics cookies to improve the service."}
        </p>
        <p className="mt-1 text-xs text-muted">
          <Link to="/legal/privacy" className="underline">
            {language === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
          </Link>{" "}
          ·{" "}
          <Link to="/legal/terms" className="underline">
            {language === "ru" ? "Условия использования" : "Terms of Use"}
          </Link>
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="app-btn-primary-md soft-button-primary inline-flex items-center justify-center"
            onClick={() => setCookieConsentDecision("accepted")}
          >
            {language === "ru" ? "Принять все" : "Accept all"}
          </button>
          <button
            type="button"
            className="app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center"
            onClick={() => setCookieConsentDecision("rejected")}
          >
            {language === "ru" ? "Только необходимые" : "Essential only"}
          </button>
        </div>
      </div>
    </div>
  );
}
