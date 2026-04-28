import { useRef } from "react";
import { useHistoryBackFallback } from "@client/pages/legal/useHistoryBackFallback";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path
        d="M4.5 10h10m-4-4 4 4-4 4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const backLinkClass = "inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary";
const supportBulletClass = "flex items-start gap-2 text-sm leading-6 text-muted";

export function SupportPage() {
  const handleBack = useHistoryBackFallback("/legal");
  const rootRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={rootRef} className="min-w-0 space-y-6 sm:space-y-8">
      <IosEdgeBackGesture isEnabled onBack={handleBack} targetRef={rootRef} />
      <PageIntro
        title="Помощь"
        subtitle="Выберите тип обращения. Для всех запросов используйте форму внутри приложения."
        action={
          <button type="button" onClick={handleBack} className={backLinkClass}>
            ← Правовая информация
          </button>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <button type="button" onClick={handleBack} className={backLinkClass}>
            ← Правовая информация
          </button>
          <h1 className="app-mobile-section-intro__title">Помощь</h1>
          <p className="app-mobile-section-intro__hint">
            Выберите тип обращения. Для всех запросов используйте форму внутри приложения.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:gap-4">
        <li>
          <Link
            to="/feedback"
            className="block transition-transform duration-200 hover:-translate-y-0.5"
          >
            <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="app-card-title">Баг, неудобство или идея</p>
                  <div className="mt-1.5 space-y-1.5">
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Что случилось или что хочется улучшить.</span>
                    </p>
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Что вы ожидали увидеть.</span>
                    </p>
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Если можно, добавьте шаги или скрин.</span>
                    </p>
                  </div>
                </div>
                <span className="mt-1 text-muted">
                  <ArrowRightIcon />
                </span>
              </div>
            </RowSurface>
          </Link>
        </li>

        <li>
          <Link
            to="/feedback"
            className="block transition-transform duration-200 hover:-translate-y-0.5"
          >
            <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="app-card-title">Запрос по данным и privacy</p>
                  <div className="mt-1.5 space-y-1.5">
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Напишите, что именно нужно: доступ, исправление или удаление.</span>
                    </p>
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Укажите регион и контакт для ответа.</span>
                    </p>
                    <p className={supportBulletClass}>
                      <span aria-hidden="true">•</span>
                      <span>Мы вернёмся с дальнейшими шагами.</span>
                    </p>
                  </div>
                </div>
                <span className="mt-1 text-muted">
                  <ArrowRightIcon />
                </span>
              </div>
            </RowSurface>
          </Link>
        </li>
      </ul>
    </div>
  );
}
