type BrandWordmarkProps = {
  className?: string;
  ariaLabel?: string;
};

function joinClasses(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function BrandWordmark({ className, ariaLabel = "PillPath" }: BrandWordmarkProps) {
  return (
    <span className={joinClasses("brand-wordmark", className)} aria-label={ariaLabel}>
      <span className="brand-wordmark-pill">Pill</span>
      <span className="brand-wordmark-path">Path</span>
    </span>
  );
}
