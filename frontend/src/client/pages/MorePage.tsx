import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path
        d="M4.5 10h10m-4-4 4 4-4 4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MorePage() {
  const { copy } = useI18n();

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.more.title}
        subtitle={copy.more.subtitle}
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />
      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{copy.more.title}</h1>
          <p className="app-mobile-section-intro__hint">{copy.more.subtitle}</p>
        </div>
      </div>
      <ul className="grid gap-3 sm:gap-4">
        {copy.more.links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="block transition-transform duration-200 hover:-translate-y-0.5">
              <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="app-card-title">{item.title}</p>
                    <p className="app-card-description-2l mt-1.5 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-muted">
                    <ArrowRightIcon />
                  </span>
                </div>
              </RowSurface>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
