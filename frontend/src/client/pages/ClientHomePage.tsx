import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { Surface } from "@shared/components/Surface";

const guideSections = [
  {
    title: "Дети",
    description: "Профили детей, история по каждому ребёнку и вход в текущее наблюдение.",
    items: [
      {
        title: "Добавить ребёнка",
        description: "Если профиля ещё нет, начните здесь.",
      },
      {
        title: "Открыть историю",
        description: "Зайдите в ребёнка и откройте его завершённые эпизоды.",
      },
    ],
    action: { to: "/children", label: "Открыть детей" },
  },
  {
    title: "Наблюдения",
    description: "Текущее состояние ребёнка: температура, лекарства, комментарии и reminders.",
    items: [
      {
        title: "Начать наблюдение",
        description: "Откройте карточку ребёнка и запустите новое наблюдение.",
      },
      {
        title: "Добавлять записи",
        description: "Внутри наблюдения можно фиксировать температуру, приёмы и заметки.",
      },
      {
        title: "Проверить напоминания",
        description: "Если у эпизода guided-режим, здесь же видны ближайшие действия и планы.",
      },
    ],
    action: { to: "/illnesses/active", label: "Открыть наблюдения" },
  },
  {
    title: "Аптечка",
    description: "Домашние препараты, упаковки, сроки годности и даты вскрытия.",
    items: [
      {
        title: "Добавить упаковку",
        description: "Сначала найдите препарат в каталоге или заполните вручную.",
      },
      {
        title: "Следить за сроками",
        description: "На карточках видно, что скоро истекает и что уже нельзя использовать.",
      },
      {
        title: "Использовать в наблюдении",
        description: "Препараты из аптечки можно выбирать прямо в эпизоде болезни.",
      },
    ],
    action: { to: "/medicine-cabinet", label: "Открыть аптечку" },
  },
] as const;

const analyticsTips = [
  {
    title: "Где искать аналитику",
    description:
      "Откройте ребёнка, затем его историю. Там есть общая сводка и разбор каждого эпизода.",
  },
  {
    title: "Что показывает сводка",
    description:
      "Она помогает понять, как часто ребёнок болел, как менялась частота и насколько длинными были эпизоды.",
  },
  {
    title: "Что показывает разбор",
    description:
      "Внутри эпизода видны температура, ключевые события, лекарства и краткая картина по записи.",
  },
] as const;

export function ClientHomePage() {
  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {guideSections.map((section) => (
        <HelpSection
          key={section.title}
          title={section.title}
          description={section.description}
          action={section.action}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {section.items.map((item) => (
              <InfoCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </HelpSection>
      ))}

      <HelpSection
        title="Как пользоваться аналитикой"
        description="Аналитика живёт внутри истории ребёнка и помогает быстро понять общую картину и детали каждого эпизода."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {analyticsTips.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </HelpSection>

      <HelpSection
        title="Установка на телефон"
        description={
          <>
            <BrandWordmark className="brand-wordmark-inline" /> уже настроен как PWA, поэтому
            приложение можно добавить на домашний экран прямо из браузера.
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
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
      </HelpSection>
    </div>
  );
}

function HelpSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: ReactNode;
  action?: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <Surface className="overflow-hidden p-0">
      <section>
        <div className="border-b border-border/70 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="app-card-title text-lg sm:text-[1.1rem]">{title}</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{description}</p>
            </div>
            {action ? (
              <Link
                to={action.to}
                className="soft-button-secondary inline-flex min-h-[2.7rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em]"
              >
                {action.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </section>
    </Surface>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
      <h3 className="app-card-title text-[1.02rem]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

function InstallCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
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
