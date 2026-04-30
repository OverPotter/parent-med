import { Link } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import type { AppLanguage } from "@shared/i18n";
import { useAppStore } from "@shared/store/useAppStore";
import { blurActiveField } from "@shared/utils/focus";

function MoonIcon() {
    return (<svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1rem] w-[1rem] fill-none stroke-current">
      <path d="M14.5 3.5a7.9 7.9 0 1 0 6 13.05A8.7 8.7 0 0 1 14.5 3.5Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}

function SunIcon() {
    return (<svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1rem] w-[1rem] fill-none stroke-current">
      <circle cx="12" cy="12" r="4" strokeWidth="1.8"/>
      <path d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>);
}

type PublicSiteHeaderLinkAction = {
    label: string;
    to: string;
    onClick?: never;
};

type PublicSiteHeaderButtonAction = {
    label: string;
    onClick: () => void;
    to?: never;
};

type PublicSiteHeaderAction = PublicSiteHeaderLinkAction | PublicSiteHeaderButtonAction;

type PublicSiteHeaderProps = {
    accountHref?: string | null;
    accountLabel?: string | null;
    actions?: readonly PublicSiteHeaderAction[];
};

type PublicSiteHeaderCopy = {
    support: string;
    privacy: string;
    terms: string;
};

export function getPublicSiteHeaderCopy(language: AppLanguage): PublicSiteHeaderCopy {
    if (language === "ru") {
        return {
            support: "Поддержка",
            privacy: "Политика",
            terms: "Условия",
        };
    }
    return {
        support: "Support",
        privacy: "Privacy",
        terms: "Terms",
    };
}

function resolvePublicSiteHeaderActions(params: {
    actions?: readonly PublicSiteHeaderAction[];
    accountHref?: string | null;
    accountLabel?: string | null;
}) {
    if (params.actions && params.actions.length > 0) {
        return params.actions;
    }

    if (params.accountHref && params.accountLabel) {
        return [{ label: params.accountLabel, to: params.accountHref }] as const;
    }

    return [] as const;
}

export function PublicSiteHeader({ accountHref, accountLabel, actions }: PublicSiteHeaderProps) {
    const { language, copy } = useI18n();
    const localCopy = getPublicSiteHeaderCopy(language);
    const effectiveTheme = useAppStore((s) => s.effectiveTheme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    const isIosShell = useIsIosShell();
    const showLegalLinks = !isIosShell;
    const resolvedActions = resolvePublicSiteHeaderActions({ actions, accountHref, accountLabel });
    if (isIosShell) {
        return (<header className="public-site-header public-site-header--ios">
        <div className="auth-v3-shell">
          <section className="auth-v3-stage">
            <div className="auth-v3-header">
              <Link to="/" className="auth-v3-header-logo auth-v3-header-logo--ios" aria-label={copy.common.brandName} onClick={blurActiveField}>
                <img src="/pwa-icon.png" alt="" className="h-10 w-10 rounded-[1.15rem] shadow-[0_16px_32px_rgba(138,123,191,0.18)]"/>
              </Link>
              <Link to="/" className="auth-v3-header-brand auth-v3-header-brand--ios" aria-label={copy.common.brandName} onClick={blurActiveField}>
                <BrandWordmark className="auth-v3-header-brand-text"/>
              </Link>
              <div className="auth-v3-header-actions">
                <LanguageSwitch className="auth-v3-language-switch app-header-language-switch" triggerClassName="app-header-utility-button"/>
                <button type="button" className="soft-theme-toggle app-header-theme-toggle" onClick={toggleTheme} aria-label={effectiveTheme === "light"
                ? copy.common.themeDarkLabel
                : copy.common.themeLightLabel} title={effectiveTheme === "light"
                ? copy.common.themeDarkLabel
                : copy.common.themeLightLabel}>
                  <span aria-hidden="true" className={[
                "soft-theme-toggle__icon",
                effectiveTheme === "light"
                    ? "soft-theme-toggle__icon--moon"
                    : "soft-theme-toggle__icon--sun",
            ].join(" ")}>
                    {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </header>);
    }
    return (<header className="landing-app-header public-site-header">
      <div className="landing-hero-reset-topline">
        <Link to="/" className="landing-hero-reset-brandlink" aria-label={copy.common.brandName} onClick={blurActiveField}>
          <img src="/pwa-icon.png" alt="" className="landing-hero-reset-logo"/>
          <BrandWordmark className="landing-hero-reset-brand" ariaLabel={copy.common.brandName}/>
        </Link>
        <div className="landing-hero-reset-actions-shell">
          <div className="landing-hero-reset-actions-inline">
            {showLegalLinks ? (<>
                <Link to="/legal/support" className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" onClick={blurActiveField}>
                  {localCopy.support}
                </Link>
                <Link to="/legal/privacy" className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" onClick={blurActiveField}>
                  {localCopy.privacy}
                </Link>
                <Link to="/legal/terms" className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" onClick={blurActiveField}>
                  {localCopy.terms}
                </Link>
              </>) : null}
            {resolvedActions.map((action) => "onClick" in action ? (<button key={action.label} type="button" className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" onClick={action.onClick}>
                  {action.label}
                </button>) : (<Link key={action.label} to={action.to} className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" onClick={blurActiveField}>
                  {action.label}
                </Link>))}
            <LanguageSwitch className="landing-language-switch" triggerClassName="landing-topline-button"/>
            <button type="button" onClick={toggleTheme} className="landing-topline-button landing-theme-toggle rounded-full" aria-label={effectiveTheme === "light"
            ? copy.common.themeDarkLabel
            : copy.common.themeLightLabel} title={effectiveTheme === "light"
            ? copy.common.themeDarkLabel
            : copy.common.themeLightLabel}>
              <span aria-hidden="true" className="inline-flex">
                {effectiveTheme === "light" ? <MoonIcon /> : <SunIcon />}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="public-site-header-mobile-links">
        <Link to="/legal/support" className="public-site-header-mobile-link" onClick={blurActiveField}>
          {localCopy.support}
        </Link>
        <Link to="/legal/privacy" className="public-site-header-mobile-link" onClick={blurActiveField}>
          {localCopy.privacy}
        </Link>
        <Link to="/legal/terms" className="public-site-header-mobile-link" onClick={blurActiveField}>
          {localCopy.terms}
        </Link>
      </div>
    </header>);
}
