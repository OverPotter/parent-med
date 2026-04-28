import { Link, useLocation } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { buildNativeAppUrl, getAppStoreUrl } from "@shared/config/nativeAppLinks";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1rem] w-[1rem] fill-none stroke-current"
    >
      <path
        d="M14.5 3.5a7.9 7.9 0 1 0 6 13.05A8.7 8.7 0 0 1 14.5 3.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1rem] w-[1rem] fill-none stroke-current"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppOnlyRedirectPage() {
  const location = useLocation();
  const { language, copy } = useI18n();
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const appStoreUrl = getAppStoreUrl();
  const targetPath = `${location.pathname}${location.search}${location.hash}`;
  const nativeTargetUrl = buildNativeAppUrl(targetPath);
  const primaryTargetUrl = appStoreUrl || nativeTargetUrl;

  const title =
    language === "ru"
      ? "Этот экран доступен только в приложении для iPhone"
      : "This screen is available only in the iPhone app";
  const description =
    language === "ru"
      ? "Сайт остаётся для landing, ссылок-приглашений и юридической информации. Полноценная работа с семейным кабинетом открывается внутри PillPath для iPhone."
      : "The website remains for landing, invite links, and legal information. Full family workspace usage continues inside the PillPath iPhone app.";

  return (
    <div className="auth-v3-page min-h-screen text-foreground">
      <V3BackgroundDoodles className="auth-v3-doodle-layer" dense />
      <div className="auth-v3-orb auth-v3-orb-left" aria-hidden="true" />
      <div className="auth-v3-orb auth-v3-orb-right" aria-hidden="true" />
      <div className="auth-v3-noise" aria-hidden="true" />
      <div className="auth-v3-shell">
        <section className="auth-v3-stage">
          <div className="auth-v3-header">
            <Link to="/" className="auth-v3-header-logo" aria-label={copy.common.brandName}>
              <img
                src="/pwa-icon.png"
                alt=""
                className="h-10 w-10 rounded-[1.15rem] shadow-[0_16px_32px_rgba(138,123,191,0.18)]"
              />
            </Link>
            <Link to="/" className="auth-v3-header-brand" aria-label={copy.common.brandName}>
              <BrandWordmark className="auth-v3-header-brand-text" />
            </Link>
            <div className="auth-v3-header-actions">
              <LanguageSwitch
                className="auth-v3-language-switch app-header-language-switch"
                triggerClassName="app-header-utility-button"
              />
              <button
                type="button"
                className="soft-theme-toggle app-header-theme-toggle"
                onClick={toggleTheme}
                aria-label={
                  effectiveTheme === "light"
                    ? copy.common.themeDarkLabel
                    : copy.common.themeLightLabel
                }
                title={
                  effectiveTheme === "light"
                    ? copy.common.themeDarkLabel
                    : copy.common.themeLightLabel
                }
              >
                <span
                  aria-hidden="true"
                  className={[
                    "soft-theme-toggle__icon",
                    effectiveTheme === "light"
                      ? "soft-theme-toggle__icon--moon"
                      : "soft-theme-toggle__icon--sun",
                  ].join(" ")}
                >
                  {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </div>
          </div>

          <div className="auth-v3-hero">
            <p className="auth-v3-subtitle">{description}</p>
          </div>

          <section className="auth-v3-panel auth-v3-panel-compact soft-page-intro">
            <div className="auth-v3-card auth-v3-handoff-card space-y-4">
              <div>
                <p className="auth-v3-section-copy">{title}</p>
              </div>
              <p className="text-sm leading-7 text-muted">{description}</p>
              <div className="auth-v3-handoff-stack">
                <a
                  href={primaryTargetUrl}
                  className="auth-v3-submit auth-v3-handoff-primary text-center"
                  target={appStoreUrl ? "_blank" : undefined}
                  rel={appStoreUrl ? "noreferrer" : undefined}
                >
                  {appStoreUrl
                    ? language === "ru"
                      ? "Скачать в App Store"
                      : "Download on the App Store"
                    : language === "ru"
                      ? "Открыть приложение"
                      : "Open app"}
                </a>
                {appStoreUrl ? (
                  <a href={nativeTargetUrl} className="auth-v3-handoff-secondary text-center">
                    {language === "ru" ? "Открыть приложение" : "Open app"}
                  </a>
                ) : null}
                <Link to="/" className="auth-v3-linkish auth-v3-handoff-back text-center">
                  {language === "ru" ? "Вернуться на сайт" : "Back to website"}
                </Link>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
