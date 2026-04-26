export function PlusBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex min-w-[3.4rem] items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] px-3 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-success)_80%,var(--color-foreground))] ${className}`.trim()}
    >
      Plus
    </span>
  );
}
