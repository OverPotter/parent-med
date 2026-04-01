import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { RowSurface, Surface } from "@shared/components/Surface";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

export function LandingPage() {
  const { copy } = useI18n();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [activePreview, setActivePreview] = useState<{ src: string; alt: string } | null>(null);
  const [primaryScreenshotAlt, secondaryScreenshotAlt, tertiaryScreenshotAlt] =
    copy.landing.product.screenshots;

  useEffect(() => {
    if (activePreview) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [activePreview]);

  useEffect(() => {
    if (!activePreview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePreview(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePreview]);

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="landing-page-glow pointer-events-none absolute inset-0 -z-10" />
      <V3BackgroundDoodles className="landing-doodle-layer" />
      <div className="landing-v3-decor landing-v3-decor-a" aria-hidden="true" />
      <div className="landing-v3-decor landing-v3-decor-b" aria-hidden="true" />

      <main className="px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-6">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="landing-hero-reset">
            <div className="landing-hero-reset-inner">
              <div className="landing-hero-reset-topline">
                <Link to="/" className="landing-hero-reset-brandicon" aria-label={copy.common.brandName}>
                  <img src="/pwa-icon.png" alt="" className="landing-hero-reset-logo" />
                </Link>
                <Link to="/" className="landing-hero-reset-brandmark" aria-label={copy.common.brandName}>
                  <BrandWordmark
                    className="landing-hero-reset-brand"
                    ariaLabel={copy.common.brandName}
                  />
                </Link>
                <div className="landing-hero-reset-actions-inline">
                  <LanguageSwitch />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="landing-secondary-button landing-theme-toggle rounded-full px-4 py-2 text-sm"
                    aria-label={
                      theme === "light"
                        ? copy.landing.hero.themeToggleAriaDark
                        : copy.landing.hero.themeToggleAriaLight
                    }
                  >
                    {theme === "light" ? copy.common.themeDarkText : copy.common.themeLightText}
                  </button>
                </div>
              </div>
              <p className="landing-section-label mt-4 justify-center sm:mt-5">
                {copy.landing.hero.eyebrow}
              </p>
              <h1 className="landing-hero-reset-title">{copy.landing.hero.title}</h1>
              <p className="landing-hero-reset-lead">{copy.landing.hero.lead}</p>

              <div className="landing-hero-reset-actions">
                <Link
                  to="/auth?mode=register"
                  className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                >
                  {copy.landing.hero.createAccount}
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="landing-secondary-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  {copy.landing.hero.login}
                </Link>
              </div>

              <div className="landing-hero-reset-grid">
                {copy.landing.cards.map((item) => (
                  <div key={item.title} className="landing-hero-reset-card">
                    <p className="landing-hero-reset-card-title">{item.title}</p>
                    <p className="landing-hero-reset-card-text">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="grid gap-6 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="min-w-0">
                <p className="landing-section-label">{copy.landing.product.eyebrow}</p>
                <h2 className="landing-section-title mt-2">{copy.landing.product.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
                  {copy.landing.product.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {copy.landing.product.bullets.map((point) => (
                    <li key={point} className="landing-comparison-item">
                      <span className="landing-comparison-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="landing-phone-gallery" aria-label={copy.landing.product.screenshotsLabel}>
                <ScreenshotCard
                  src="/landing/IMG_7138.PNG"
                  alt={primaryScreenshotAlt}
                  className="landing-screenshot-card landing-phone-gallery-item landing-phone-gallery-item-primary"
                  onPreview={setActivePreview}
                />
                <ScreenshotCard
                  src="/landing/IMG_7140.PNG"
                  alt={secondaryScreenshotAlt}
                  className="landing-screenshot-card landing-phone-gallery-item"
                  onPreview={setActivePreview}
                />
                <ScreenshotCard
                  src="/landing/IMG_7141.PNG"
                  alt={tertiaryScreenshotAlt}
                  className="landing-screenshot-card landing-phone-gallery-item"
                  onPreview={setActivePreview}
                />
              </div>
            </div>
          </section>

          <section className="landing-comparison grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Surface className="landing-section-shell p-5 sm:p-6 lg:p-7">
              <p className="landing-section-label">{copy.landing.comparison.eyebrow}</p>
              <h2 className="landing-section-title mt-2">{copy.landing.comparison.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                {copy.landing.comparison.description}
              </p>
            </Surface>

            <div className="grid gap-4 sm:grid-cols-2">
              <Surface className="landing-comparison-card p-5 sm:p-6">
                <p className="landing-comparison-title">{copy.landing.comparison.oldTitle}</p>
                <ul className="mt-4 space-y-3">
                  {copy.landing.comparison.oldWay.map((point) => (
                    <li key={point} className="landing-comparison-item">
                      <span className="landing-comparison-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Surface>

              <Surface className="landing-comparison-card landing-comparison-card-primary p-5 sm:p-6">
                <p className="landing-comparison-title">{copy.landing.comparison.newTitle}</p>
                <ul className="mt-4 space-y-3">
                  {copy.landing.comparison.newWay.map((point) => (
                    <li key={point} className="landing-comparison-item">
                      <span className="landing-comparison-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>
          </section>

          <section id="how-it-works">
            <Surface className="landing-section-shell overflow-hidden">
              <div className="landing-section-header px-5 py-5 sm:px-8 sm:py-7">
                <p className="landing-section-label">{copy.landing.workflow.eyebrow}</p>
                <h2 className="landing-section-title mt-2">{copy.landing.workflow.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                  {copy.landing.workflow.description}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  {copy.landing.workflow.descriptionSecondary}
                </p>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
                {copy.landing.workflow.steps.map((item) => (
                  <RowSurface
                    key={item.step}
                    className="soft-landing-step landing-flow-card h-full"
                  >
                    <div className="soft-landing-step-number">{item.step}</div>
                    <h3 className="app-card-title mt-3 text-lg">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                  </RowSurface>
                ))}
              </div>
            </Surface>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="landing-section-header px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">{copy.landing.install.eyebrow}</p>
              <h2 className="landing-section-title mt-2">{copy.landing.install.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                {copy.landing.install.description}
              </p>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-2">
              <InstallStepsCard
                title={copy.landing.install.iphoneTitle}
                steps={copy.landing.install.iphoneSteps}
              />
              <InstallStepsCard
                title={copy.landing.install.androidTitle}
                steps={copy.landing.install.androidSteps}
              />
            </div>

            <div className="landing-install-cta border-t border-border/60 px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{copy.landing.install.ctaTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {copy.landing.install.ctaDescription}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <Link
                    to="/auth?mode=register"
                    className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                  >
                    {copy.landing.install.createAccount}
                  </Link>
                  <Link
                    to="/auth?mode=login"
                    className="landing-secondary-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    {copy.landing.install.login}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {activePreview ? (
        <div
          className="landing-preview fixed inset-0 z-[180] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePreview(null)}
        >
          <button
            type="button"
            aria-label={copy.landing.install.previewCloseLabel}
            className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-background)_58%,transparent)] backdrop-blur-sm"
            onClick={() => setActivePreview(null)}
          />
          <div
            className="landing-preview-dialog relative z-[181] w-full max-w-[26rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="landing-preview-close"
              onClick={() => setActivePreview(null)}
            >
              {copy.landing.install.closePreview}
            </button>
            <button
              type="button"
              className="landing-preview-frame"
              aria-label={`${copy.landing.install.closePreview}: ${activePreview.alt}`}
              onClick={() => setActivePreview(null)}
            >
              <img
                src={activePreview.src}
                alt={activePreview.alt}
                className="h-full w-full object-contain"
              />
            </button>
            <p className="landing-preview-caption">{activePreview.alt}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScreenshotCard({
  src,
  alt,
  className,
  onPreview,
}: {
  src: string;
  alt: string;
  className?: string;
  onPreview?: (preview: { src: string; alt: string }) => void;
}) {
  const { copy } = useI18n();

  return (
    <button
      type="button"
      className={["landing-phone-clickable", className].filter(Boolean).join(" ")}
      onClick={() => onPreview?.({ src, alt })}
      aria-label={`${copy.landing.install.previewOpenLabel}: ${alt}`}
    >
      <div className="landing-phone-stage h-full w-full">
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
    </button>
  );
}

function InstallStepsCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Surface className="landing-comparison-card p-5 sm:p-6">
      <h3 className="landing-comparison-title">{title}</h3>
      <ol className="mt-4 space-y-2 text-sm leading-7 text-muted">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </Surface>
  );
}
