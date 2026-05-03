import type { AppLanguage } from "@shared/i18n";
import { Link } from "react-router-dom";

type AuthLegalLinksProps = {
  aboutHref: string;
  aboutLabel: string;
  aboutExternal?: boolean;
  language: AppLanguage;
  onNavigate?: () => void;
  onboardingHref?: string;
  onOnboardingNavigate?: () => void;
  showSecondaryLegalLinks?: boolean;
};

export function AuthLegalLinks({
  aboutHref,
  aboutLabel,
  aboutExternal = false,
  language,
  onNavigate,
  onboardingHref,
  onOnboardingNavigate,
  showSecondaryLegalLinks = true,
}: AuthLegalLinksProps) {
  const legalLinkLabels = {
    onboarding: language === "ru" ? "Онбординг" : "Onboarding",
    support: language === "ru" ? "Поддержка" : "Support",
    privacy: language === "ru" ? "Политика" : "Privacy",
    terms: language === "ru" ? "Условия" : "Terms",
  };

  return (
    <div className="auth-v3-about-stack">
      {aboutExternal ? (
        <a
          href={aboutHref}
          target="_blank"
          rel="noopener noreferrer"
          className="app-header-utility-button auth-v3-mobile-home-link"
          onClick={onNavigate}
        >
          {aboutLabel}
        </a>
      ) : (
        <Link
          to={aboutHref}
          className="app-header-utility-button auth-v3-mobile-home-link"
          onClick={onNavigate}
        >
          {aboutLabel}
        </Link>
      )}
      <div className="auth-v3-legal-links">
        {onboardingHref ? (
          <Link
            to={onboardingHref}
            className="auth-v3-legal-link"
            onClick={onOnboardingNavigate ?? onNavigate}
          >
            {legalLinkLabels.onboarding}
          </Link>
        ) : null}
        <Link to="/legal/support" className="auth-v3-legal-link" onClick={onNavigate}>
          {legalLinkLabels.support}
        </Link>
        {showSecondaryLegalLinks ? (
          <>
            <Link to="/legal/privacy" className="auth-v3-legal-link" onClick={onNavigate}>
              {legalLinkLabels.privacy}
            </Link>
            <Link to="/legal/terms" className="auth-v3-legal-link" onClick={onNavigate}>
              {legalLinkLabels.terms}
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
