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
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={copy.more.title}
        subtitle={copy.more.subtitle}
        compactOnMobile
        hideOnMobile
      />
      <div className="app-mobile-section-intro sm:hidden">
        <h1 className="app-mobile-section-intro__title">{copy.more.title}</h1>
        <p className="app-mobile-section-intro__hint">{copy.more.subtitle}</p>
      </div>
      <ul className="soft-panel rounded-[32px] p-3 sm:p-4 grid gap-3 sm:gap-4">
        {copy.more.links.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="app-card-title">{item.title}</p>
                    <p className="app-card-description-2l mt-1.5 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-center">
                    <span className="soft-pill-primary hidden rounded-full px-3.5 py-1.5 text-[11px] md:inline-flex">
                      {copy.more.openLabel}
                    </span>
                    <span className="soft-pill rounded-full px-2.5 py-2 text-[11px]">
                      <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              </RowSurface>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
