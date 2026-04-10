import type { ReactNode } from "react";

type IconProps = {
  active?: boolean;
};

function NavIconFrame({ children, active = false }: IconProps & { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={["app-nav-icon", active ? "app-nav-icon--active" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}

function JournalIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 5.5h9.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7.75a2.25 2.25 0 0 1-2.25-2.25V7.75A2.25 2.25 0 0 1 7.75 5.5Z" />
        <path d="M8.25 9h7.5" />
        <path d="M8.25 12h7.5" />
        <path d="M8.25 15h4.75" />
      </svg>
    </NavIconFrame>
  );
}

function ChildrenIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="9" r="2.25" />
        <circle cx="15.5" cy="9.75" r="1.85" />
        <path d="M5.75 17.25c.5-2.2 2.18-3.55 4.26-3.55 2.02 0 3.63 1.28 4.18 3.38" />
        <path d="M13.1 17.25c.35-1.5 1.52-2.45 2.95-2.45 1.38 0 2.45.86 2.86 2.2" />
      </svg>
    </NavIconFrame>
  );
}

function PillboxIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5.25" y="7" width="13.5" height="10" rx="3.4" />
        <path d="M12 7v10" />
        <path d="M8.1 12h.01" strokeWidth="2.2" />
        <path d="M15.9 12h.01" strokeWidth="2.2" />
      </svg>
    </NavIconFrame>
  );
}

function CabinetIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5.5" y="6" width="13" height="12.5" rx="2.75" />
        <path d="M12 9v6" />
        <path d="M9 12h6" />
      </svg>
    </NavIconFrame>
  );
}

function MoreIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 12h.01" />
        <path d="M12 12h.01" />
        <path d="M17.5 12h.01" />
      </svg>
    </NavIconFrame>
  );
}

export function renderNavIcon(to: string, active = false): ReactNode {
  if (to === "/home") {
    return <JournalIcon active={active} />;
  }

  if (to === "/illnesses/active") {
    return <JournalIcon active={active} />;
  }

  if (to === "/children") {
    return <ChildrenIcon active={active} />;
  }

  if (to === "/medicine-cabinet") {
    return <CabinetIcon active={active} />;
  }

  if (to === "/pillbox") {
    return <PillboxIcon active={active} />;
  }

  return <MoreIcon active={active} />;
}
