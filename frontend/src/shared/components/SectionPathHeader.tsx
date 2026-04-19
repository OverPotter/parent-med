import { Link } from "react-router-dom";

export function SectionPathHeader({
  backTo,
  backLabel,
  pathLabel,
  title,
  hint,
}: {
  backTo?: string;
  backLabel?: string;
  pathLabel: string;
  title: string;
  hint?: string;
}) {
  return (
    <>
      <div className="app-section-path hidden sm:flex">
        {backTo && backLabel ? (
          <Link to={backTo} className="app-section-path__back">
            {backLabel}
          </Link>
        ) : (
          <span />
        )}
        <span className="app-section-path__label">{pathLabel}</span>
      </div>
      <div className="app-mobile-section-intro sm:hidden">
        <h1 className="app-mobile-section-intro__title">{title}</h1>
        {hint ? <p className="app-mobile-section-intro__hint">{hint}</p> : null}
      </div>
    </>
  );
}
