import type { ReactNode } from "react";

type IconProps = {
  active?: boolean;
  className?: string;
};

function NavIconFrame({
  children,
  active = false,
  className,
}: IconProps & { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={["app-nav-icon", active ? "app-nav-icon--active" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

function JournalIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active} className="app-nav-icon--journal">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16.5 18.75h-9A2.25 2.25 0 0 1 5.25 16.5v-9A2.25 2.25 0 0 1 7.5 5.25h9A2.25 2.25 0 0 1 18.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25Z" />
        <path d="M9 9h6" />
        <path d="M9 12h6" />
        <path d="M9 15h3.75" />
      </svg>
    </NavIconFrame>
  );
}

function ChildrenIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active} className="app-nav-icon--children">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path d="M4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    </NavIconFrame>
  );
}

function PillboxIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active} className="app-nav-icon--pillbox">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 6.75v5.25l3 1.5" />
        <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
      </svg>
    </NavIconFrame>
  );
}

function CabinetIcon({ active = false }: IconProps) {
  return (
    <NavIconFrame active={active} className="app-nav-icon--cabinet">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" />
        <path d="M20.25 14.15a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387" />
        <path d="M3.75 14.15c.194.165.42.295.673.38A23.978 23.978 0 0 0 12 15.75c2.648 0 5.195-.429 7.577-1.22.253-.084.479-.215.673-.38" />
        <path d="M3.75 14.15A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387" />
        <path d="M15.75 6.144V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894" />
        <path d="M15.75 6.144a48.667 48.667 0 0 0-7.5 0" />
        <path d="M12 12.75h.008v.008H12v-.008Z" />
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
