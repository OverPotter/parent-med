import { BrandWordmark } from "@shared/components/BrandWordmark";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function AboutPage() {
  const { copy } = useI18n();

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.about.eyebrow}
        subtitle={copy.about.subtitle}
        compactOnMobile
        className="app-safe-top-standalone"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {copy.about.features.map((item) => (
          <FeatureCard key={item.title} title={item.title} description={item.description} />
        ))}
      </div>

      <section className="space-y-4">
        <div className="min-w-0">
          <p className="app-kicker">{copy.about.install.eyebrow}</p>
          <h2 className="app-title mt-2 text-[1.7rem] sm:text-[2.15rem]">
            {copy.about.install.title}
          </h2>
          <p className="app-subtitle mt-3 max-w-2xl text-sm">
            <BrandWordmark className="brand-wordmark-inline" /> {copy.about.install.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {copy.about.install.cards.map((item) => (
            <InstallCard key={item.title} title={item.title} steps={item.steps} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Surface className="p-5 sm:p-6">
      <h2 className="app-card-title">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </Surface>
  );
}

function InstallCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5">
      <h3 className="app-card-title">{title}</h3>
      <ol className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </RowSurface>
  );
}
