import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";

const workflow = [
  {
    step: "01",
    title: "Создаёте семью",
    description:
      "Регистрация занимает минуту: логин и пароль обязательны, email можно добавить позже.",
  },
  {
    step: "02",
    title: "Добавляете ребёнка и аптечку",
    description:
      "Сохраняете профиль ребёнка, текущий вес, домашние препараты и сроки, чтобы всё было под рукой.",
  },
  {
    step: "03",
    title: "Ведёте болезнь вместе",
    description:
      "Если ребёнок заболел, родители видят одну историю и могут быстро понять, кто дал препарат и когда пора следующая доза.",
  },
];

const highlights = [
  {
    title: "Общая аптечка",
    description: "Препараты, сроки годности и актуальные планы приёма собраны в одном месте.",
  },
  {
    title: "Активные наблюдения",
    description: "Температура, комментарии и последнее действие видны сразу на любом устройстве.",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(176,218,195,0.35),transparent_45%),radial-gradient(circle_at_top_right,rgba(244,202,153,0.28),transparent_38%)]" />

      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-[28px] border border-border/70 bg-[color:var(--color-surface-soft)]/85 px-4 py-3 shadow-soft backdrop-blur sm:px-5">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/pwa-icon.svg" alt="" className="h-10 w-10 rounded-2xl" />
            <p className="text-sm font-semibold tracking-[0.06em] text-primary">Parent Med</p>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/auth?mode=login"
              className="soft-button-secondary rounded-full px-4 py-2 text-sm"
            >
              Войти
            </Link>
            <Link
              to="/auth?mode=register"
              className="soft-button-primary rounded-full px-4 py-2 text-sm"
            >
              Попробовать
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
          <Surface className="soft-hero overflow-hidden">
            <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-9">
              <div className="min-w-0 lg:pr-3">
                <h1 className="soft-landing-title mt-4 max-w-[20ch] text-[1.56rem] sm:text-[1.82rem] lg:text-[2.35rem]">
                  Одно место для лекарств, болезней, заметок и напоминаний
                </h1>
                <p className="soft-landing-lead mt-4 max-w-2xl text-sm leading-7 sm:text-base">
                  У каждого взрослого свой вход, а все важные действия остаются в одном общем
                  контексте без переписок и потери информации между устройствами.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/auth?mode=register"
                    className="soft-button-primary rounded-2xl px-5 py-3 text-sm"
                  >
                    Попробовать бесплатно
                  </Link>
                </div>

                <ul className="mt-7 space-y-4">
                  {highlights.map((item, index) => (
                    <li key={item.title} className="soft-landing-highlight-list flex gap-4">
                      <span className="soft-landing-highlight-index">{`0${index + 1}`}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-muted">
                          {item.description}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="soft-landing-visuals">
                <div className="soft-landing-phone-grid">
                  <PhoneFrame src="/landing/active-mobile.png" alt="Экран активных наблюдений">
                    <PushBubble />
                  </PhoneFrame>
                  <PhoneFrame
                    src="/landing/illness-mobile.png"
                    alt="Экран приёма лекарства и ленты"
                  />
                </div>
              </div>
            </div>
          </Surface>

          <section id="how-it-works">
            <Surface className="overflow-hidden">
              <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
                <p className="text-sm font-medium tracking-[0.04em] text-primary">
                  Как это работает
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                  Вход в продукт быстрее, чем переписка в чате о лекарствах
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  Главная задача первого экрана не в том, чтобы показать весь интерфейс, а чтобы
                  быстро дать понять, что сервис делает и как в него попасть.
                </p>
              </div>
              <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
                {workflow.map((item) => (
                  <RowSurface key={item.step} className="soft-landing-step h-full">
                    <div className="soft-landing-step-number">{item.step}</div>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                  </RowSurface>
                ))}
              </div>
            </Surface>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Surface className="p-5 sm:p-6">
              <p className="text-sm font-medium tracking-[0.04em] text-primary">Для семьи</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                Не общий аккаунт на всех, а нормальный совместный доступ
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                У каждого взрослого свой логин и пароль. Мама остаётся мамой, папа папой, а в
                истории видно, кто именно дал препарат или добавил запись. Это безопаснее и
                понятнее, чем один пароль на двоих.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniCard title="Семья" text="Общие дети, общая аптечка, единая история болезни." />
                <MiniCard
                  title="Участники"
                  text="Роли в семье, телефон, подпись в событиях и отдельные устройства."
                />
              </div>
            </Surface>

            <Surface className="p-5 sm:p-6">
              <p className="text-sm font-medium tracking-[0.04em] text-primary">Напоминания</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
                Короткие push и понятный следующий шаг
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Уведомление не висит само по себе: оно возвращает в рабочий экран, где сразу видно
                препарат, последнее действие и можно быстро отметить приём.
              </p>
              <div className="mt-5 space-y-3">
                <MockRow
                  title="Скоро можно дать"
                  subtitle="Напоминание приходит заранее и без лишнего текста"
                />
                <MockRow
                  title="Пора дать"
                  subtitle="Открывает активные болезни, а не уводит в случайный экран"
                />
                <MockRow
                  title="Приём не отмечен"
                  subtitle="Через 2 минуты напомнит, если запись ещё не появилась"
                />
              </div>
            </Surface>
          </div>

          <Surface className="soft-hero overflow-hidden">
            <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium tracking-[0.04em] text-primary">Попробовать</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                  Начать можно с логина и пароля. Email добавите позже.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  Для beta не нужен длинный onboarding. Зарегистрируйте первый аккаунт, создайте
                  семью и пригласите второго взрослого уже внутри приложения.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/auth?mode=register"
                  className="soft-button-primary rounded-2xl px-5 py-3 text-sm"
                >
                  Создать аккаунт
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="soft-button-secondary rounded-2xl px-5 py-3 text-sm"
                >
                  Уже есть аккаунт
                </Link>
              </div>
            </div>
          </Surface>
        </div>
      </main>
    </div>
  );
}

function MockRow({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <div className="soft-landing-row rounded-[22px] border border-border/70 bg-[color:var(--color-surface-soft)]/75 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
        </div>
        {badge && <span className="soft-pill rounded-full px-3 py-1 text-[11px]">{badge}</span>}
      </div>
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="soft-card rounded-[24px] px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function PhoneFrame({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={["soft-phone-frame", className].filter(Boolean).join(" ")}>
      {children}
      <div className="soft-phone-screen">
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}

function PushBubble() {
  return (
    <div className="soft-phone-push">
      <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Пора дать</p>
      <p className="mt-1 text-sm font-semibold text-foreground">Миша · Нурофен · 5 мл</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Откройте активные наблюдения и отметьте приём.
      </p>
    </div>
  );
}
