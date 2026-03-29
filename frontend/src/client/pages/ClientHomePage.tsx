import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";

const actions = [
  {
    to: "/children",
    title: "Добавить ребёнка",
    description: "Если профиля ещё нет, начните отсюда.",
  },
  {
    to: "/children",
    title: "Начать наблюдение",
    description: "Откройте ребёнка и запустите наблюдение из карточки.",
  },
  {
    to: "/children",
    title: "Посмотреть текущее",
    description: "Откройте ребёнка или перейдите в наблюдения, если они уже активны.",
  },
  {
    to: "/medicine-cabinet",
    title: "Открыть аптечку",
    description: "Проверить лекарства, сроки и даты вскрытия.",
  },
];

const sections = [
  {
    title: "Дети",
    description: "Профили детей, история и вход в текущее наблюдение.",
  },
  {
    title: "Наблюдения",
    description: "Температура, приёмы, заметки и ближайшие действия.",
  },
  {
    title: "Аптечка",
    description: "Домашние препараты, упаковки и сроки годности.",
  },
  {
    title: "Ещё",
    description: "Семья, аккаунт и история завершённых наблюдений.",
  },
];

const faq = [
  {
    title: "Где начать",
    description:
      "Сначала добавьте ребёнка, потом откройте наблюдение, когда нужно что-то фиксировать.",
  },
  {
    title: "Где текущее состояние",
    description: "В «Наблюдениях» видны только активные эпизоды и последние действия.",
  },
  {
    title: "Где семейные настройки",
    description: "Название семьи, участники и приглашения находятся в разделе «Ещё» → «Семья».",
  },
];

export function ClientHomePage() {
  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <Surface className="soft-hero overflow-hidden">
        <div className="hidden px-5 py-5 sm:px-6 sm:py-7 lg:block lg:px-8 lg:py-9">
          <span className="soft-pill-primary inline-flex rounded-full px-3 py-1 text-xs">
            Помощь
          </span>
          <h1 className="app-title mt-4 max-w-2xl text-[2rem] sm:text-[2.7rem]">
            Быстрая навигация по Parent Med
          </h1>
          <p className="app-subtitle mt-3 max-w-2xl text-sm leading-7 sm:mt-4 sm:leading-8">
            Если нужно быстро понять, куда нажать, начните с одного из частых действий ниже.
          </p>
        </div>
        <div className="px-5 py-4 lg:hidden">
          <p className="app-card-title text-[1.08rem]">Помощь</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Быстрые входы и короткие подсказки по основным разделам.
          </p>
        </div>
      </Surface>

      <section>
        <div className="mb-4">
          <h2 className="app-card-title text-lg">Частые действия</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Самые полезные входы без лишнего поиска по меню.
          </p>
        </div>
        <ul className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          {actions.map((item) => (
            <li key={item.title}>
              <Link
                to={item.to}
                className="block transition-transform duration-200 hover:-translate-y-0.5"
              >
                <RowSurface className="h-full rounded-[26px] sm:rounded-[30px]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="app-card-title text-base">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                    </div>
                    <span className="soft-pill-primary inline-flex w-fit rounded-full px-3.5 py-1.5 text-xs">
                      Открыть
                    </span>
                  </div>
                </RowSurface>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="app-card-title text-lg">Что где лежит</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Коротко по основным разделам приложения.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((item) => (
            <div key={item.title} className="soft-card rounded-[28px] px-4 py-4 sm:px-5">
              <h3 className="app-card-title text-[1.02rem]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="app-card-title text-lg">Короткие ответы</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {faq.map((item) => (
            <Surface key={item.title} className="p-5 sm:p-6">
              <h3 className="app-card-title text-[1.02rem]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
            </Surface>
          ))}
        </div>
      </section>

      <Surface className="overflow-hidden">
        <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <p className="app-kicker">Установка на телефон</p>
          <h2 className="app-title mt-2 text-[1.7rem] sm:text-[2.15rem]">
            Приложение можно добавить на домашний экран
          </h2>
          <p className="app-subtitle mt-3 max-w-2xl text-sm">
            Parent Med уже настроен как PWA, поэтому установка идёт через браузер без App Store и
            Google Play.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-2">
          <InstallCard
            title="iPhone / iPad"
            steps={[
              "Откройте приложение в Safari.",
              "Нажмите «Поделиться».",
              "Выберите «На экран Домой».",
              "Подтвердите добавление.",
            ]}
          />
          <InstallCard
            title="Android"
            steps={[
              "Откройте приложение в Chrome.",
              "Нажмите меню браузера.",
              "Выберите «Установить приложение» или «Добавить на главный экран».",
              "Подтвердите установку.",
            ]}
          />
        </div>
      </Surface>
    </div>
  );
}

function InstallCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="soft-card rounded-[30px] px-4 py-4 sm:px-5">
      <h3 className="app-card-title text-[1.05rem]">{title}</h3>
      <ol className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
