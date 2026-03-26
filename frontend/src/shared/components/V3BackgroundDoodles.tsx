type V3BackgroundDoodlesProps = {
  className?: string;
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function DoodleCar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M5 14.5h14M7.5 14.5l1.4-4h6.2l1.4 4M7.25 17.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm9.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM4.5 12.8l1.4-3.2c.3-.7.9-1.1 1.7-1.1h8.8c.8 0 1.4.4 1.7 1.1l1.4 3.2v2.7c0 .6-.4 1-1 1h-.7"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleBird() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M7.5 15.5c0-4.7 3.2-8.5 7.2-8.5 1.4 0 2.7.4 3.8 1.2-.9.1-1.6.7-1.9 1.6 1 .6 1.7 1.8 1.7 3.1 0 2.2-1.9 4-4.2 4-.8 0-1.6-.2-2.2-.6-.7 1.3-2.1 2.2-3.7 2.2-1.7 0-3.1-1-3.7-2.4h3Z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DoodleThermometer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M12 5.5a2 2 0 0 0-2 2v6.4a3.5 3.5 0 1 0 4 0V7.5a2 2 0 0 0-2-2Z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11v5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DoodleStethoscope() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M7 5v4a4 4 0 1 0 8 0V5M9 5V3.8M15 5V3.8M15.5 15.5v1a3.5 3.5 0 0 0 7 0v-1.3a2.2 2.2 0 1 0-2.2 2.2h-2.6"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleBear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M8 9.5a2.2 2.2 0 1 1-1.8-3.4A2.2 2.2 0 0 1 8 9.5Zm10 0a2.2 2.2 0 1 0 1.8-3.4A2.2 2.2 0 0 0 18 9.5ZM12 19c3.7 0 6-2.2 6-5.5S15.7 8 12 8s-6 2.2-6 5.5S8.3 19 12 19Zm-1.5-5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5M10 12h.01M14 12h.01"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleDuck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M8 16.5c-1.7 0-3-1.2-3-2.8 0-1.7 1.4-3 3-3.1.6-1.8 2.4-3.1 4.5-3.1 2.6 0 4.8 2 4.8 4.5v.3a2.4 2.4 0 0 1 1.7 2.2c0 1.1-.9 2-2 2H8Zm7.8-4.7h2.2M10.5 13c.3 0 .5.2.5.5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function V3BackgroundDoodles({ className }: V3BackgroundDoodlesProps) {
  return (
    <div className={joinClasses("v3-doodle-layer", className)} aria-hidden="true">
      <div className="v3-doodle left-[4.5%] top-[8%] h-5 w-5 rotate-[-10deg]">
        <DoodleCar />
      </div>
      <div className="v3-doodle left-[1.8%] top-[18%] h-4 w-4 rotate-[8deg]">
        <DoodleBear />
      </div>
      <div className="v3-doodle right-[8%] top-[10%] h-6 w-6 rotate-[10deg]">
        <DoodleBird />
      </div>
      <div className="v3-doodle right-[2.4%] top-[18%] h-4 w-4 rotate-[-12deg]">
        <DoodleCar />
      </div>
      <div className="v3-doodle right-[5%] top-[28%] h-6 w-6 rotate-[8deg]">
        <DoodleDuck />
      </div>
      <div className="v3-doodle left-[3%] top-[36%] h-5 w-5 rotate-[-10deg]">
        <DoodleThermometer />
      </div>
      <div className="v3-doodle left-[5%] bottom-[22%] h-5 w-5 rotate-[12deg]">
        <DoodleBird />
      </div>
      <div className="v3-doodle right-[2.5%] bottom-[24%] h-5 w-5 rotate-[12deg]">
        <DoodleDuck />
      </div>
      <div className="v3-doodle left-[7%] bottom-[8%] h-7 w-7 rotate-[-8deg]">
        <DoodleThermometer />
      </div>
      <div className="v3-doodle right-[7%] bottom-[8%] h-8 w-8 rotate-[8deg]">
        <DoodleStethoscope />
      </div>
      <div className="v3-doodle left-[2.5%] bottom-[3%] h-6 w-6 rotate-[-12deg]">
        <DoodleBear />
      </div>
      <div className="v3-doodle right-[3%] bottom-[3%] h-5 w-5 rotate-[10deg]">
        <DoodleCar />
      </div>
    </div>
  );
}
