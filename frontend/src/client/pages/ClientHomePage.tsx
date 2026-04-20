import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { appBtnJournalSecondaryClass, SectionTitle } from "./child-illness/shared";

export function ClientHomePage() {
  const { copy, language } = useI18n();
  const navigate = useNavigate();
  const homeTitle = language === "ru" ? "Помощь" : "Help";
  const homeSubtitle =
    language === "ru"
      ? "Короткий гид по основным разделам и полезным действиям."
      : "A quick guide to the main sections and useful actions.";
  const homeMobileHint =
    language === "ru"
      ? "Главные разделы приложения и что в них делать."
      : "Main app sections and what you can do there.";

  const handleBack = () => {
    const historyState = typeof window !== "undefined" ? window.history.state : null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/more");
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={homeTitle}
        subtitle={homeSubtitle}
        action={
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
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
            {language === "ru" ? "← Ещё" : "← More"}
          </button>
          <h1 className="app-mobile-section-intro__title">{homeTitle}</h1>
          <p className="app-mobile-section-intro__hint">{homeMobileHint}</p>
        </div>
      </div>

      {copy.clientHome.sections.map((section) => (
        <HelpCardSection
          key={section.title}
          title={section.title}
          description={section.description}
          action={section.action}
          items={section.items}
        />
      ))}

      <HelpCardSection
        title={copy.clientHome.analytics.title}
        description={copy.clientHome.analytics.description}
        items={copy.clientHome.analytics.items}
      />

      <HelpInstallSection
        title={copy.clientHome.install.title}
        description={
          <>
            <BrandWordmark className="brand-wordmark-inline" />{" "}
            {copy.clientHome.install.description}
          </>
        }
        cards={copy.clientHome.install.cards}
      />
    </div>
  );
}

function HelpCardSection({
  title,
  description,
  action,
  items,
}: {
  title: string;
  description: ReactNode;
  action?: { to: string; label: string };
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <SectionTitle
        title={title}
        subtitle={typeof description === "string" ? description : ""}
        action={
          action ? (
            <Link
              to={action.to}
              className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
            >
              {action.label}
            </Link>
          ) : undefined
        }
      />
      <div className="mt-4 divide-y divide-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)]">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={index === 0 ? "pb-3 sm:pb-4" : "pt-3 sm:pt-4"}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_52%,var(--color-foreground))]"
              />
              <div className="min-w-0">
                <h3 className="app-card-title text-[1.02rem] sm:text-[1.08rem]">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </RowSurface>
  );
}

function HelpInstallSection({
  title,
  description,
  cards,
}: {
  title: string;
  description: ReactNode;
  cards: Array<{ title: string; steps: string[] }>;
}) {
  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="min-w-0">
        <h2 className="app-card-title">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {cards.map((item) => (
          <InstallCard key={item.title} title={item.title} steps={item.steps} />
        ))}
      </div>
    </RowSurface>
  );
}

function InstallCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-[22px] border border-[color:color-mix(in_srgb,var(--color-border)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_54%,transparent)] px-4 py-4">
      <h3 className="app-card-title text-[1.02rem] sm:text-[1.08rem]">{title}</h3>
      <ol className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
