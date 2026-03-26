import type { ReactNode } from "react";

export function renderNavIcon(to: string): ReactNode {
  if (to === "/home") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
        <path
          d="M3.5 8.5 10 3.8l6.5 4.7v7.2a.8.8 0 0 1-.8.8h-3.9v-4.3H8.2v4.3H4.3a.8.8 0 0 1-.8-.8V8.5Z"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (to === "/illnesses/active") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
        <path
          d="M2.5 10h3.3l1.7-3.3 2.3 6.1 2.1-4h5.6"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (to === "/children") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
        <circle cx="7" cy="7" r="2.1" strokeWidth="1.7" />
        <circle cx="13.4" cy="7.9" r="1.8" strokeWidth="1.7" />
        <path
          d="M3.8 15.7c.6-2.1 2.2-3.3 4.3-3.3s3.7 1.2 4.3 3.3M11 15.7c.4-1.6 1.6-2.6 3.2-2.6 1.3 0 2.4.8 3 2"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (to === "/medicine-cabinet") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
        <rect x="3.5" y="5" width="13" height="10.5" rx="2.2" strokeWidth="1.7" />
        <path d="M7 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" strokeWidth="1.7" />
        <path d="M10 8v4M8 10h4" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <circle cx="10" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
