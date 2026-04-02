import { Link } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { Surface } from "@shared/components/Surface";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

export function LandingPage() {
  const { copy } = useI18n();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="landing-page-glow pointer-events-none absolute inset-0 -z-10" />
      <V3BackgroundDoodles className="landing-doodle-layer" />
      <div className="landing-v3-decor landing-v3-decor-a" aria-hidden="true" />
      <div className="landing-v3-decor landing-v3-decor-b" aria-hidden="true" />

      <main className="px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-6">
        <div className="mx-auto max-w-[78rem] space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="landing-topbar-shell">
            <div className="landing-topbar-inner">
              <div className="landing-hero-reset-topline">
                <Link to="/" className="landing-hero-reset-brandicon" aria-label={copy.common.brandName}>
                  <img src="/pwa-icon.png" alt="" className="landing-hero-reset-logo" />
                </Link>
                <Link to="/" className="landing-hero-reset-brandmark" aria-label={copy.common.brandName}>
                  <BrandWordmark
                    className="landing-hero-reset-brand"
                    ariaLabel={copy.common.brandName}
                  />
                </Link>
                <div className="landing-hero-reset-actions-inline">
                  <Link
                    to="/auth?mode=login"
                    className="landing-secondary-button landing-topline-button rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    {copy.landing.hero.login}
                  </Link>
                  <LanguageSwitch
                    className="landing-language-switch"
                    triggerClassName="landing-topline-button"
                  />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="landing-secondary-button landing-topline-button landing-theme-toggle rounded-full px-4 py-2 text-sm"
                    aria-label={
                      theme === "light"
                        ? copy.landing.hero.themeToggleAriaDark
                        : copy.landing.hero.themeToggleAriaLight
                    }
                  >
                    {theme === "light" ? copy.common.themeDarkText : copy.common.themeLightText}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-hero-reset">
            <div className="landing-hero-reset-inner">
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(20rem,0.98fr)] lg:items-center lg:gap-6">
                <div className="min-w-0 text-left lg:flex lg:h-full lg:max-w-[33rem] lg:flex-col">
                  <p className="landing-section-label inline-flex w-fit items-center rounded-full border border-[color:rgba(159,140,219,0.2)] bg-[color:rgba(205,191,241,0.34)] px-3 py-1.5 justify-start">
                    {copy.landing.hero.eyebrow}
                  </p>
                  <h1 className="landing-hero-reset-title mx-0 mt-3 max-w-[24ch] text-left text-[clamp(1.9rem,3.3vw,2.85rem)]">
                    <>
                      {copy.landing.hero.titleLines[0]}
                      <br />
                      {copy.landing.hero.titleLines[1]}
                      <br />
                      {copy.landing.hero.titleLines[2]}
                    </>
                  </h1>
                  <p className="landing-hero-reset-lead mx-0 mt-3 max-w-[34rem] text-left">
                    {copy.landing.hero.lead}
                  </p>

                  <div className="mt-5 flex flex-col items-start gap-3">
                    <Link
                      to="/auth?mode=register"
                      className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                    >
                      {copy.landing.hero.createAccount}
                    </Link>
                    <p className="text-sm text-muted">
                      {copy.landing.hero.loginPrompt}{" "}
                      <Link
                        to="/auth?mode=login"
                        className="font-semibold text-[color:var(--color-primary)] underline-offset-4 hover:underline"
                      >
                        {copy.landing.hero.login}
                      </Link>
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {copy.landing.hero.highlights.map((item, index) => {
                      const Icon =
                        index === 0 ? HeroStethoscopeIcon : index === 1 ? HeroBellRingIcon : HeroShieldCheckIcon;
                      return (
                        <div key={item} className="flex items-center gap-2.5 text-sm font-semibold leading-6 text-foreground/85">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--color-primary)]">
                            <Icon />
                          </span>
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[color:rgba(159,140,219,0.3)] bg-[color:rgba(205,191,241,0.34)] p-3 shadow-[0_26px_60px_-42px_rgba(73,56,129,0.24)] lg:ml-auto lg:w-full lg:max-w-[40rem] lg:self-center">
                  <div className="space-y-3">
                    {copy.landing.cards.map((item, index) => {
                      const Icon =
                        index === 0
                          ? HeroChildIcon
                          : index === 1
                            ? HeroAlarmIcon
                            : index === 2
                              ? HeroCalendarClockIcon
                              : HeroFamilyIcon;

                      return (
                        <Surface
                          key={item.title}
                          className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4"
                        >
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[color:var(--color-primary)]">
                              <Icon />
                            </span>
                            <p className="min-w-0 text-sm font-semibold leading-6 text-foreground sm:text-[0.98rem]">
                              {item.title}
                            </p>
                            <p className="min-w-0 text-sm leading-6 text-muted">{item.description}</p>
                          </div>
                        </Surface>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            {[
              {
                icon: <HeroStethoscopeIcon />,
                title: "Видно, как меняется состояние ребенка",
                description: "Симптомы, заметки и температура собраны в одной хронологии.",
              },
              {
                icon: <HeroBellRingIcon />,
                title: "Напоминания приходят вовремя",
                description: "Уведомления о лекарствах и витаминах приходят в нужный момент.",
              },
              {
                icon: <HeroShieldCheckIcon />,
                title: "Сроки годности не теряются",
                description: "Напоминания приходят до даты истечения срока.",
              },
              {
                icon: <HeroFamilyIcon />,
                title: "Семья действует по одному плану",
                description: "Все участники семьи видят общий план ухода.",
              },
            ].map((item) => (
              <Surface key={item.title} className="landing-comparison-card p-5 sm:p-6">
                <span className="inline-flex h-6 w-6 items-center justify-center text-[color:var(--color-primary)]">
                  {item.icon}
                </span>
                <h3 className="mt-3 text-[1.02rem] font-semibold leading-7 text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </Surface>
            ))}
          </section>

          <section className="landing-section-shell landing-section-shell--child overflow-hidden">
            <div className="px-0 py-4 sm:py-5">
              <div className="landing-child-hero-shell">
                <h2 className="landing-section-title">
                  Дети: профиль, симптомы, температура и напоминания
                </h2>
                <p className="mt-4 max-w-[68rem] text-sm leading-7 text-muted sm:text-base">
                  Создайте профиль ребенка, отслеживайте симптомы и температуру, добавляйте заметки
                  и получайте напоминания, когда пора дать лекарство.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    "Профиль ребенка создан",
                    "Наблюдение по дням",
                  ].map((label) => (
                    <span key={label} className="landing-child-pill">
                      {label}
                    </span>
                  ))}
                </div>

                <div className="landing-child-shell mt-6">
                  <div className="grid gap-3 lg:grid-cols-3">
                    {[
                      {
                        title: "Состояние",
                        lines: ["Симптомы: кашель, слабость", "Температура: 38.1°"],
                      },
                      {
                        title: "Лечение",
                        lines: ["План приема добавлен", "Заметка: день 2, стало легче"],
                      },
                      {
                        title: "Напоминания",
                        lines: ["Дать лекарство в 14:00", "Следующий шаг виден сразу"],
                      },
                    ].map((item) => (
                      <Surface
                        key={item.title}
                        className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4"
                      >
                        <div className="flex flex-col gap-2">
                          <h3 className="text-[1.02rem] font-semibold leading-7 text-foreground">
                            {item.title}
                          </h3>
                          <div className="space-y-1.5 text-sm font-medium leading-7 text-muted">
                            {item.lines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </Surface>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Таблетница</p>
              <h2 className="landing-section-title mt-2">
                Настройте напоминания о лекарствах и витаминах для себя или близкого человека
              </h2>
              <p className="mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
                Повторяющиеся напоминания помогают держать режим приема без путаницы и не забывать
                о следующем шаге.
              </p>

              <Surface className="mt-6 rounded-[2rem] border border-border/70 bg-white/96 p-5 sm:p-6">
                <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                  <div className="space-y-3">
                    {[
                      "Повторяющиеся напоминания",
                      "Для себя или семьи",
                      "Понятный режим без путаницы",
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-3 rounded-[1.2rem] bg-[color:rgba(205,191,241,0.14)] px-4 py-3">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--color-primary)]">
                          <HeroAlarmIcon />
                        </span>
                        <span className="text-sm font-medium leading-6 text-foreground">{line}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.6rem] bg-[color:rgba(205,191,241,0.18)] px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--color-primary)]">
                      Исход
                    </p>
                    <p className="mt-3 text-[1.02rem] font-semibold leading-7 text-foreground">
                      Никто не забывает о следующем приеме.
                    </p>
                  </div>
                </div>
              </Surface>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Домашняя аптечка</p>
              <h2 className="landing-section-title mt-2">
                Отслеживайте сроки годности лекарств в домашней аптечке
              </h2>
              <p className="mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
                Добавляйте лекарства и получайте напоминания до истечения срока годности.
              </p>

              <Surface className="mt-6 rounded-[2rem] border border-border/70 bg-white/96 p-5 sm:p-6">
                <div className="space-y-3">
                  <div className="rounded-[1.4rem] bg-[color:rgba(205,191,241,0.14)] px-4 py-3 text-sm font-medium leading-6 text-foreground">
                    Контроль сроков годности лекарств дома
                  </div>
                  <div className="rounded-[1.4rem] bg-[color:rgba(205,191,241,0.14)] px-4 py-3 text-sm font-medium leading-6 text-foreground">
                    Парацетамол: срок истекает через 12 дней
                  </div>
                  <div className="rounded-[1.4rem] bg-[color:rgba(205,191,241,0.14)] px-4 py-3 text-sm font-medium leading-6 text-foreground">
                    Напоминание: проверьте аптечку в выходные
                  </div>
                </div>
              </Surface>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Семейный аккаунт</p>
              <h2 className="landing-section-title mt-2">
                Родители и родственники работают в одном пространстве
              </h2>
              <p className="mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
                Родители и родственники видят общие планы и остаются синхронизированы по
                напоминаниям.
              </p>
              <p className="mt-5 text-[1.02rem] font-semibold leading-7 text-foreground">
                Мама добавила план, папа его видит, бабушка получает напоминание.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["Мама", "Папа", "Бабушка", "Дедушка", "Другие родственники"].map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-border/70 bg-white/90 px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Доверие и приватность</p>
              <h2 className="landing-section-title mt-2">Вы сами выбираете, кто видит семейные данные</h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Surface className="landing-comparison-card p-5 sm:p-6">
                  <p className="text-[1.02rem] font-semibold leading-7 text-foreground">
                    Вы сами выбираете, кто видит общую семейную информацию.
                  </p>
                </Surface>
                <Surface className="landing-comparison-card p-5 sm:p-6">
                  <p className="text-[1.02rem] font-semibold leading-7 text-foreground">
                    Доступ можно выдать и отозвать в любой момент.
                  </p>
                </Surface>
              </div>

              <p className="mt-5 text-sm leading-7 text-muted">
                Общие данные видят только приглашенные вами члены семьи.
              </p>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Вопросы и ответы</p>
              <h2 className="landing-section-title mt-2">Частые вопросы</h2>

              <div className="mt-6 space-y-4">
                {[
                  [
                    "Можно создать профили для нескольких детей?",
                    "Да, в одном семейном аккаунте можно вести несколько профилей детей.",
                  ],
                  [
                    "Можно поставить напоминания для другого члена семьи?",
                    "Да, напоминания можно настроить для другого члена семьи.",
                  ],
                  [
                    "Домашняя аптечка отслеживает только сроки годности?",
                    "Да, домашняя аптечка фокусируется на напоминаниях о сроках годности.",
                  ],
                  [
                    "Несколько родственников могут пользоваться одним аккаунтом?",
                    "Да, несколько родственников могут координироваться в одном аккаунте.",
                  ],
                  [
                    "Кто видит общую информацию?",
                    "Только приглашенные члены семьи с открытым доступом.",
                  ],
                  [
                    "Можно использовать PillPath и для витаминов?",
                    "Да, напоминания работают и для витаминов, и для лекарств.",
                  ],
                ].map(([question, answer]) => (
                  <Surface key={question} className="landing-comparison-card p-5 sm:p-6">
                    <h3 className="text-[1.02rem] font-semibold leading-7 text-foreground">
                      {question}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{answer}</p>
                  </Surface>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function HeroStethoscopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" />
    </svg>
  );
}

function HeroChildIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 10l.01 0" />
      <path d="M15 10l.01 0" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M12 3a2 2 0 0 0 0 4" />
    </svg>
  );
}

function HeroBellRingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
      <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" />
      <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" />
    </svg>
  );
}

function HeroAlarmIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5" />
      <path d="m5 3-2 2" />
      <path d="m19 3 2 2" />
    </svg>
  );
}

function HeroShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-4 8 4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeroCalendarClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="17" r="3" />
      <path d="M17 15.6V17l1 1" />
    </svg>
  );
}

function HeroFamilyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
