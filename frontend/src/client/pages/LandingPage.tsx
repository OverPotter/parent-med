import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

type PhoneMode = "app" | "notification";

const heroCards = [
  {
    title: "Что уже отмечено",
    description: "Сразу видно, что уже добавили и кто обновил информацию.",
  },
  {
    title: "Что дальше",
    description: "Напоминание и нужное действие остаются рядом с текущим экраном.",
  },
  {
    title: "Одна картина для семьи",
    description: "Все смотрят на одно общее состояние, а не собирают его по сообщениям.",
  },
];

const slides = [
  {
    label: "Напоминание",
    title: "Напоминание приходит на телефон и ведёт сразу к нужному экрану",
    description:
      "Короткое уведомление помогает быстро вернуться туда, где нужно что-то обновить или проверить.",
    src: "",
    alt: "Экран телефона с push уведомлением",
    phoneMode: "notification" as PhoneMode,
  },
  {
    label: "Общая история",
    title: "Все важные записи собираются в одном месте",
    description:
      "Отметки, комментарии и история не теряются между телефонами и не остаются только в чате.",
    src: "/landing/illness-mobile.png",
    alt: "Экран общего журнала",
    phoneMode: "app" as PhoneMode,
  },
  {
    label: "Профили семьи",
    title: "Аптечка, записи и профили семьи остаются под рукой",
    description:
      "У семьи один общий контекст, но всё остаётся разложено по понятным и спокойным разделам.",
    src: "/landing/children-mobile.png",
    alt: "Экран профилей семьи",
    phoneMode: "app" as PhoneMode,
  },
];

const comparison = {
  oldWay: [
    "кто-то пишет в чат, что уже что-то сделал",
    "время и детали быстро теряются",
    "целую картину потом приходится собирать вручную",
  ],
  newWay: [
    "важные отметки сразу попадают в общее пространство",
    "видно время, детали и кто обновил запись",
    "дальше проще понять, что уже сделано и что осталось",
  ],
};

const workflow = [
  {
    step: "01",
    title: "Создаёте аккаунт",
    description: "Без длинного старта. Достаточно логина и пароля, остальное можно добавить позже.",
  },
  {
    step: "02",
    title: "Добавляете семью и всё важное",
    description: "Собираете аптечку, записи и напоминания в одном понятном пространстве.",
  },
  {
    step: "03",
    title: "Пользуетесь вместе",
    description:
      "Когда что-то меняется, все видят одну историю и быстрее ориентируются без лишних сообщений.",
  },
];

export function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const slide = slides[activeSlide]!;

  const goPrev = () => setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const goNext = () => setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="landing-page-glow pointer-events-none absolute inset-0 -z-10" />

      <main className="px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-6">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="landing-hero-reset">
            <div className="landing-hero-reset-inner">
              <div className="landing-hero-reset-topline">
                <Link to="/" className="landing-hero-reset-brandmark" aria-label="Parent Med">
                  <img src="/pwa-icon.svg" alt="" className="landing-hero-reset-logo" />
                  <span className="landing-hero-reset-brand">Parent Med</span>
                </Link>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="landing-secondary-button landing-theme-toggle rounded-full px-4 py-2 text-sm"
                  aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
                >
                  {theme === "light" ? "Ночь" : "День"}
                </button>
              </div>
              <h1 className="landing-hero-reset-title">
                Одно общее место для семьи вместо чатов и заметок
              </h1>
              <p className="landing-hero-reset-lead">
                Parent Med помогает держать рядом аптечку, важные записи и напоминания, чтобы дома
                всё было понятнее, спокойнее и без потерь между сообщениями и заметками.
              </p>

              <div className="landing-hero-reset-actions">
                <Link
                  to="/auth?mode=register"
                  className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                >
                  Создать аккаунт
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="landing-secondary-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  Уже есть аккаунт
                </Link>
              </div>

              <div className="landing-hero-reset-grid">
                {heroCards.map((item) => (
                  <div key={item.title} className="landing-hero-reset-card">
                    <p className="landing-hero-reset-card-title">{item.title}</p>
                    <p className="landing-hero-reset-card-text">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-section-shell overflow-hidden">
            <div className="landing-section-header px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Как это выглядит внутри</p>
              <h2 className="landing-section-title mt-2">
                Три экрана, по которым сразу понятно, как работает Parent Med
              </h2>
            </div>

            <div className="grid gap-6 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div className="landing-slider-shell">
                <PhoneFrame
                  src={slide.src}
                  alt={slide.alt}
                  mode={slide.phoneMode}
                  onClick={goNext}
                  ariaLabel={`Показать следующий экран: ${slides[(activeSlide + 1) % slides.length]?.label}`}
                  slideKey={`${activeSlide}-${slide.label}`}
                >
                  {activeSlide === 0 ? <PushBubble /> : null}
                </PhoneFrame>
              </div>

              <div className="min-w-0">
                <div className="landing-slider-label">{slide.label}</div>
                <h3 className="landing-section-title mt-3 text-[1.7rem] sm:text-[2rem]">
                  {slide.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
                  {slide.description}
                </p>

                <div className="landing-slider-controls mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="landing-secondary-button rounded-2xl px-4 py-3 text-sm"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="landing-cta-button rounded-2xl px-4 py-3 text-sm"
                  >
                    Следующий экран
                  </button>
                </div>

                <div className="landing-slider-dots mt-6">
                  {slides.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={[
                        "landing-slider-dot",
                        index === activeSlide ? "landing-slider-dot-active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={`Показать экран ${index + 1}`}
                    >
                      <span className="landing-slider-dot-index">{`0${index + 1}`}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="landing-comparison grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Surface className="landing-section-shell p-5 sm:p-6 lg:p-7">
              <p className="landing-section-label">Почему не чат</p>
              <h2 className="landing-section-title mt-2">
                Записи нужны не только для памяти, но и для общего спокойствия дома
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                Чат помогает быстро написать сообщение, но не помогает быстро понять общую картину.
                Когда всё собрано в одном месте, семье проще держать контекст под рукой.
              </p>
            </Surface>

            <div className="grid gap-4 sm:grid-cols-2">
              <Surface className="landing-comparison-card p-5 sm:p-6">
                <p className="landing-comparison-title">Когда всё остаётся в чате</p>
                <ul className="mt-4 space-y-3">
                  {comparison.oldWay.map((point) => (
                    <li key={point} className="landing-comparison-item">
                      <span className="landing-comparison-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Surface>

              <Surface className="landing-comparison-card landing-comparison-card-primary p-5 sm:p-6">
                <p className="landing-comparison-title">Когда всё собрано в Parent Med</p>
                <ul className="mt-4 space-y-3">
                  {comparison.newWay.map((point) => (
                    <li key={point} className="landing-comparison-item">
                      <span className="landing-comparison-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>
          </section>

          <section id="how-it-works">
            <Surface className="landing-section-shell overflow-hidden">
              <div className="landing-section-header px-5 py-5 sm:px-8 sm:py-7">
                <p className="landing-section-label">Как это работает</p>
                <h2 className="landing-section-title mt-2">
                  Начать можно быстро и без долгого привыкания
                </h2>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
                {workflow.map((item) => (
                  <RowSurface
                    key={item.step}
                    className="soft-landing-step landing-flow-card h-full"
                  >
                    <div className="soft-landing-step-number">{item.step}</div>
                    <h3 className="app-card-title mt-3 text-lg">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                  </RowSurface>
                ))}
              </div>
            </Surface>
          </section>
        </div>
      </main>
    </div>
  );
}

function PhoneFrame({
  src,
  alt,
  className,
  children,
  mode = "app",
  onClick,
  ariaLabel,
  slideKey,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: ReactNode;
  mode?: PhoneMode;
  onClick?: () => void;
  ariaLabel?: string;
  slideKey?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["soft-phone-frame landing-phone-trigger", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel ?? alt}
    >
      {children}
      <div className="soft-phone-screen">
        <div key={slideKey} className="landing-phone-stage h-full w-full">
          {mode === "notification" ? (
            <NotificationPhoneScreen />
          ) : (
            <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
      </div>
    </button>
  );
}

function PushBubble() {
  return (
    <div className="soft-phone-push">
      <p className="landing-meta-label text-[11px] uppercase tracking-[0.16em]">Напоминание</p>
      <p className="mt-1 text-sm font-semibold text-foreground">Проверьте важную запись</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Откройте нужный экран и обновите информацию.
      </p>
    </div>
  );
}

function NotificationPhoneScreen() {
  return (
    <div className="landing-notification-screen">
      <div className="landing-notification-time">
        <p className="landing-notification-clock">21:14</p>
        <p className="landing-notification-date">Сегодня, вечернее напоминание</p>
      </div>

      <div className="landing-notification-card">
        <p className="landing-meta-label text-[11px] uppercase tracking-[0.16em]">
          Push-уведомление
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">
          Проверьте следующую важную запись
        </p>
        <p className="mt-2 text-xs leading-5 text-muted">
          Откройте приложение и сразу перейдите к нужному экрану.
        </p>
      </div>

      <div className="landing-notification-hint">
        <span className="landing-notification-pill">Нажали на push</span>
        <span className="landing-notification-arrow" />
        <span className="landing-notification-pill">Открылся нужный экран</span>
      </div>
    </div>
  );
}
