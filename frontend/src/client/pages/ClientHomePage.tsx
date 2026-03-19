import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

const quickLinks = [
  {
    to: "/children",
    title: "Дети",
    description: "Профили детей, быстрый вход в текущую болезнь и запуск нового эпизода.",
  },
  {
    to: "/illnesses/active",
    title: "Активные болезни",
    description: "Только текущие эпизоды, когда нужен быстрый контроль без архивного шума.",
  },
  {
    to: "/medicine-cabinet",
    title: "Аптечка",
    description: "Упаковки дома, сроки годности, даты вскрытия и доступность к использованию.",
  },
  {
    to: "/more",
    title: "Ещё",
    description: "Семья, аккаунт, история болезней и описание сервиса.",
  },
];

export function ClientHomePage() {
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);

  return (
    <div className="min-w-0 space-y-8">
      <Surface className="soft-hero overflow-hidden">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-9">
          <div className="min-w-0">
            <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-xs">
              Desktop Home
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground">
              Семейный кабинет для детей, лекарств и истории болезни
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted">
              На десктопе есть место для обзорной главной, поэтому здесь остаётся краткое описание
              продукта и удобные входы в основные сценарии. На мобильном основной поток по-прежнему
              ведёт сразу в рабочие разделы.
            </p>
            {currentFamilyName && (
              <div className="mt-5">
                <span className="soft-pill inline-flex rounded-full px-3.5 py-1.5 text-xs">
                  Текущая семья: {currentFamilyName}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <HighlightCard
              title="О семье"
              description="Контекст аккаунта, родители и общая структура домашнего кабинета."
            />
            <HighlightCard
              title="О детях"
              description="Переход от профиля ребёнка к эпизодам болезни, температуре и приёмам."
            />
            <HighlightCard
              title="О лекарствах"
              description="Аптечка с реальными упаковками, сроками и базовой safety-логикой."
            />
          </div>
        </div>
      </Surface>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Быстрые входы</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Основные рабочие сценарии без лишних переходов по меню.
          </p>
        </div>
        <ul className="grid gap-4 xl:grid-cols-2">
          {quickLinks.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="block transition-transform duration-200 hover:-translate-y-0.5"
              >
                <RowSurface className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                    </div>
                    <span className="soft-pill-primary rounded-full px-3 py-1 text-xs">
                      Открыть
                    </span>
                  </div>
                </RowSurface>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Surface className="soft-hero overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-[0.04em] text-primary">На телефон</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
              Приложение можно установить на домашний экран
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Если основное использование будет с телефона, не обязательно каждый раз открывать его
              через браузер. Parent Med уже настроен как PWA.
            </p>
          </div>
          <div className="flex shrink-0">
            <Link to="/about" className="soft-button-primary rounded-2xl px-4 py-2.5 text-sm">
              Как установить
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function HighlightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="soft-card rounded-[24px] px-4 py-4 sm:px-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
