type V3BackgroundDoodlesProps = {
  className?: string;
  dense?: boolean;
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

function DoodleSun() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <circle cx="12" cy="12" r="4" strokeWidth="1.6" />
      <path
        d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DoodleMoon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-none stroke-current">
      <path
        d="M14.5 3.5a7.9 7.9 0 1 0 6 13.05A8.7 8.7 0 0 1 14.5 3.5Z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17.8 6.2h1.2M18.4 5.6v1.2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function V3BackgroundDoodles({ className, dense = true }: V3BackgroundDoodlesProps) {
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
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent left-[20%] top-[6%] h-10 w-10 rotate-[10deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent right-[19%] top-[10%] h-9 w-9 rotate-[-8deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent left-[22%] bottom-[12%] h-10 w-10 rotate-[8deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent v3-doodle-mobile-hide left-[42%] top-[8%] h-8 w-8 rotate-[-12deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent v3-doodle-mobile-hide right-[34%] top-[24%] h-10 w-10 rotate-[14deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent left-[14%] top-[44%] h-9 w-9 rotate-[16deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent right-[18%] bottom-[28%] h-8 w-8 rotate-[-10deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-light v3-doodle-accent v3-doodle-mobile-hide left-[36%] bottom-[16%] h-9 w-9 rotate-[12deg]">
        <DoodleSun />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent left-[20%] top-[6%] h-10 w-10 rotate-[10deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent right-[19%] top-[10%] h-9 w-9 rotate-[-8deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent right-[22%] bottom-[12%] h-10 w-10 rotate-[8deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent v3-doodle-mobile-hide left-[42%] top-[8%] h-8 w-8 rotate-[-12deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent v3-doodle-mobile-hide right-[34%] top-[24%] h-10 w-10 rotate-[14deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent left-[12%] top-[44%] h-9 w-9 rotate-[16deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent right-[18%] bottom-[28%] h-8 w-8 rotate-[-10deg]">
        <DoodleMoon />
      </div>
      <div className="v3-doodle v3-doodle-theme-dark v3-doodle-accent v3-doodle-mobile-hide left-[34%] bottom-[16%] h-9 w-9 rotate-[12deg]">
        <DoodleMoon />
      </div>
      {dense ? (
        <>
          <div className="v3-doodle left-[11%] top-[6%] h-4 w-4 rotate-[6deg]">
            <DoodleBear />
          </div>
          <div className="v3-doodle left-[16%] top-[15%] h-5 w-5 rotate-[-8deg]">
            <DoodleBird />
          </div>
          <div className="v3-doodle right-[14%] top-[7%] h-4 w-4 rotate-[12deg]">
            <DoodleDuck />
          </div>
          <div className="v3-doodle right-[15%] top-[22%] h-5 w-5 rotate-[-10deg]">
            <DoodleCar />
          </div>
          <div className="v3-doodle left-[10%] top-[52%] h-5 w-5 rotate-[10deg]">
            <DoodleThermometer />
          </div>
          <div className="v3-doodle right-[11%] top-[54%] h-6 w-6 rotate-[-10deg]">
            <DoodleBird />
          </div>
          <div className="v3-doodle left-[14%] bottom-[16%] h-4 w-4 rotate-[8deg]">
            <DoodleCar />
          </div>
          <div className="v3-doodle left-[20%] bottom-[6%] h-5 w-5 rotate-[-8deg]">
            <DoodleDuck />
          </div>
          <div className="v3-doodle right-[17%] bottom-[16%] h-5 w-5 rotate-[9deg]">
            <DoodleBear />
          </div>
          <div className="v3-doodle right-[18%] bottom-[6%] h-5 w-5 rotate-[-12deg]">
            <DoodleThermometer />
          </div>
          <div className="v3-doodle left-[28%] top-[10%] h-4 w-4 rotate-[8deg]">
            <DoodleCar />
          </div>
          <div className="v3-doodle right-[28%] top-[12%] h-4 w-4 rotate-[-8deg]">
            <DoodleBear />
          </div>
          <div className="v3-doodle left-[24%] top-[32%] h-5 w-5 rotate-[10deg]">
            <DoodleDuck />
          </div>
          <div className="v3-doodle right-[23%] top-[34%] h-5 w-5 rotate-[-10deg]">
            <DoodleBird />
          </div>
          <div className="v3-doodle left-[22%] bottom-[26%] h-4 w-4 rotate-[10deg]">
            <DoodleBear />
          </div>
          <div className="v3-doodle right-[24%] bottom-[28%] h-4 w-4 rotate-[-9deg]">
            <DoodleCar />
          </div>
          <div className="v3-doodle left-[30%] bottom-[10%] h-5 w-5 rotate-[-8deg]">
            <DoodleBird />
          </div>
          <div className="v3-doodle right-[30%] bottom-[10%] h-5 w-5 rotate-[8deg]">
            <DoodleDuck />
          </div>
        </>
      ) : null}
    </div>
  );
}
