import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function ClientHomePage() {
  const { copy } = useI18n();

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {copy.clientHome.sections.map((section) => (
        <HelpSection
          key={section.title}
          title={section.title}
          description={section.description}
          action={section.action}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {section.items.map((item) => (
              <InfoCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </HelpSection>
      ))}

      <HelpSection
        title={copy.clientHome.analytics.title}
        description={copy.clientHome.analytics.description}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {copy.clientHome.analytics.items.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </HelpSection>

      <HelpSection
        title={copy.clientHome.install.title}
        description={
          <>
            <BrandWordmark className="brand-wordmark-inline" />{" "}
            {copy.clientHome.install.description}
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {copy.clientHome.install.cards.map((item) => (
            <InstallCard key={item.title} title={item.title} steps={item.steps} />
          ))}
        </div>
      </HelpSection>
    </div>
  );
}

function HelpSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: ReactNode;
  action?: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <Surface className="overflow-hidden p-0">
      <section>
        <div className="border-b border-border/70 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="app-card-title">{title}</h2>
              <p className="app-card-description-2l mt-1.5 max-w-3xl text-sm leading-6 text-muted">
                {description}
              </p>
            </div>
            {action ? (
              <Link
                to={action.to}
                className="app-btn-secondary-md soft-button-secondary inline-flex px-4"
              >
                {action.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </section>
    </Surface>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
      <h3 className="app-card-title">{title}</h3>
      <p className="app-card-description-2l mt-2 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

function InstallCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
      <h3 className="app-card-title">{title}</h3>
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
