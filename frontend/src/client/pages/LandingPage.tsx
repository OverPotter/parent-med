import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useAppStore } from "@shared/store/useAppStore";

const heroCards = [
  {
    title: "Ничего не теряется",
    description:
      "Записи, лекарства и важные действия остаются в одном месте, а не распадаются по сообщениям и заметкам.",
  },
  {
    title: "Все видят одно и то же",
    description: "Одна общая картина помогает семье быстрее договориться и ничего не упустить.",
  },
  {
    title: "Видно, что уже сделали",
    description: "Легко проверить последние записи, время событий и кто обновил информацию.",
  },
  {
    title: "Понятно, что дальше",
    description: "Следующие шаги и важные действия остаются рядом, когда они действительно нужны.",
  },
];

const comparison = {
  oldWay: [
    "важная запись быстро уходит вверх",
    "приходится переспросить, кто и что уже сделал",
    "общую картину приходится собирать вручную",
  ],
  newWay: [
    "последние записи всегда под рукой",
    "сразу видно, что уже сделали и кто это отметил",
    "вся семья смотрит на одну и ту же картину",
  ],
};

const workflow = [
  {
    step: "01",
    title: "Добавляете ребёнка и начинаете запись",
    description:
      "Создаёте профиль ребёнка и открываете наблюдение, когда нужно зафиксировать состояние, лекарства и важные изменения.",
  },
  {
    step: "02",
    title: "Фиксируете всё в одной истории",
    description:
      "Температура, приёмы, комментарии и напоминания собираются в одной ленте, а не теряются между сообщениями.",
  },
  {
    step: "03",
    title: "Семья видит, что происходит дальше",
    description:
      "Все взрослые видят текущий статус, последние действия и быстрее понимают, что уже сделали и что ещё нужно.",
  },
];

export function LandingPage() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [activePreview, setActivePreview] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (activePreview) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [activePreview]);

  useEffect(() => {
    if (!activePreview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePreview(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePreview]);

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="landing-page-glow pointer-events-none absolute inset-0 -z-10" />
      <V3BackgroundDoodles className="landing-doodle-layer" />
      <div className="landing-v3-decor landing-v3-decor-a" aria-hidden="true" />
      <div className="landing-v3-decor landing-v3-decor-b" aria-hidden="true" />

      <main className="px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-6">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="landing-hero-reset">
            <div className="landing-hero-reset-inner">
              <div className="landing-hero-reset-topline">
                <Link to="/" className="landing-hero-reset-brandmark" aria-label="Parent Med">
                  <img src="/pwa-icon.png" alt="" className="landing-hero-reset-logo" />
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
              <p className="landing-section-label mt-6 justify-center">Семейный трекер здоровья ребёнка</p>
              <h1 className="landing-hero-reset-title">
                Всё важное о ребёнке в одном месте
              </h1>
              <p className="landing-hero-reset-lead">
                Parent Med помогает семье вести наблюдение за ребёнком, держать под рукой
                лекарства, домашнюю аптечку и важные записи в одном месте, чтобы не терять детали
                между сообщениями, заметками и памятью.
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
            <div className="grid gap-6 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="min-w-0">
                <p className="landing-section-label">Как выглядит продукт</p>
                <h2 className="landing-section-title mt-2">
                  Три экрана, по которым сразу понятен рабочий сценарий
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
                  Parent Med показывает не отдельные разрозненные записи, а целый рабочий сценарий:
                  текущее наблюдение, историю записей и быстрый вход в профиль ребёнка.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="landing-comparison-item">
                    <span className="landing-comparison-dot" />
                    <span>Текущее наблюдение помогает быстро понять, что можно сделать сейчас.</span>
                  </li>
                  <li className="landing-comparison-item">
                    <span className="landing-comparison-dot" />
                    <span>История записей собирает температуру, лекарства и заметки в одной ленте.</span>
                  </li>
                  <li className="landing-comparison-item">
                    <span className="landing-comparison-dot" />
                    <span>Профиль ребёнка даёт быстрый вход в работу без лишнего архивного шума.</span>
                  </li>
                </ul>
              </div>

              <div className="landing-phone-gallery" aria-label="Скриншоты Parent Med">
                <ScreenshotCard
                  src="/landing/IMG_7138.PNG"
                  alt="Экран текущего наблюдения по ребёнку"
                  className="landing-screenshot-card landing-phone-gallery-item landing-phone-gallery-item-primary"
                  onPreview={setActivePreview}
                />
                <ScreenshotCard
                  src="/landing/IMG_7140.PNG"
                  alt="Экран ленты событий по ребёнку"
                  className="landing-screenshot-card landing-phone-gallery-item"
                  onPreview={setActivePreview}
                />
                <ScreenshotCard
                  src="/landing/IMG_7141.PNG"
                  alt="Экран списка детей"
                  className="landing-screenshot-card landing-phone-gallery-item"
                  onPreview={setActivePreview}
                />
              </div>
            </div>
          </section>

          <section className="landing-comparison grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Surface className="landing-section-shell p-5 sm:p-6 lg:p-7">
              <p className="landing-section-label">Вместо переписки</p>
              <h2 className="landing-section-title mt-2">
                Когда важное не приходится искать по чату
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                Чат помогает быстро написать сообщение, но плохо помогает понять, что уже сделали,
                что происходит сейчас и что нужно дальше.
              </p>
            </Surface>

            <div className="grid gap-4 sm:grid-cols-2">
              <Surface className="landing-comparison-card p-5 sm:p-6">
                <p className="landing-comparison-title">Когда всё остаётся в переписке</p>
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
                <p className="landing-section-label">Рабочий сценарий</p>
                <h2 className="landing-section-title mt-2">
                  Не просто записи, а понятный сценарий для всей семьи
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                  Parent Med нужен не для хранения отдельных заметок, а для того, чтобы вся семья
                  быстрее понимала состояние ребёнка и следующие действия.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  Помимо записей и наблюдения, в Parent Med под рукой остаётся и домашняя аптечка.
                </p>
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

          <section className="landing-section-shell overflow-hidden">
            <div className="landing-section-header px-5 py-5 sm:px-8 sm:py-7">
              <p className="landing-section-label">Установка на телефон</p>
              <h2 className="landing-section-title mt-2">
                Parent Med можно добавить на домашний экран
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                Приложение уже работает как PWA, поэтому устанавливается через браузер без App Store
                и Google Play.
              </p>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-2">
              <InstallStepsCard
                title="iPhone / iPad"
                steps={[
                  "Откройте Parent Med в Safari.",
                  "Нажмите «Поделиться».",
                  "Выберите «На экран Домой».",
                  "Подтвердите добавление.",
                ]}
              />
              <InstallStepsCard
                title="Android"
                steps={[
                  "Откройте Parent Med в Chrome.",
                  "Нажмите меню браузера.",
                  "Выберите «Установить приложение» или «Добавить на главный экран».",
                  "Подтвердите установку.",
                ]}
              />
            </div>

            <div className="landing-install-cta border-t border-border/60 px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Сначала зарегистрируйтесь, потом установите приложение на телефон.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Так иконка на домашнем экране сразу откроет ваш семейный кабинет.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
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
                    Войти
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {activePreview ? (
        <div
          className="landing-preview fixed inset-0 z-[180] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePreview(null)}
        >
          <button
            type="button"
            aria-label="Закрыть увеличенный просмотр"
            className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--color-background)_58%,transparent)] backdrop-blur-sm"
            onClick={() => setActivePreview(null)}
          />
          <div
            className="landing-preview-dialog relative z-[181] w-full max-w-[26rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="landing-preview-close"
              onClick={() => setActivePreview(null)}
            >
              Закрыть
            </button>
            <button
              type="button"
              className="landing-preview-frame"
              aria-label={`Закрыть просмотр: ${activePreview.alt}`}
              onClick={() => setActivePreview(null)}
            >
              <img
                src={activePreview.src}
                alt={activePreview.alt}
                className="h-full w-full object-contain"
              />
            </button>
            <p className="landing-preview-caption">{activePreview.alt}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScreenshotCard({
  src,
  alt,
  className,
  onPreview,
}: {
  src: string;
  alt: string;
  className?: string;
  onPreview?: (preview: { src: string; alt: string }) => void;
}) {
  return (
    <button
      type="button"
      className={["landing-phone-clickable", className].filter(Boolean).join(" ")}
      onClick={() => onPreview?.({ src, alt })}
      aria-label={`Открыть увеличенный просмотр: ${alt}`}
    >
      <div className="landing-phone-stage h-full w-full">
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
    </button>
  );
}

function InstallStepsCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Surface className="landing-comparison-card p-5 sm:p-6">
      <h3 className="landing-comparison-title">{title}</h3>
      <ol className="mt-4 space-y-2 text-sm leading-7 text-muted">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </Surface>
  );
}
