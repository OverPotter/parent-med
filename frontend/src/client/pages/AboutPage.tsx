import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";

export function AboutPage() {
  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Parent Med"
        subtitle="Семейный кабинет для детей, домашней аптечки и истории болезни. Это не ежедневный рабочий экран, поэтому описание вынесено сюда отдельно."
        eyebrow="О приложении"
        hideOnMobile
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          title="О семье"
          description="Семья задаёт контекст аккаунта: родители, дети и общая домашняя аптечка."
        />
        <FeatureCard
          title="О детях"
          description="По каждому ребёнку можно вести эпизоды болезни, температуру и историю."
        />
        <FeatureCard
          title="О лекарствах"
          description="Аптечка хранит реальные упаковки, сроки годности и правила после вскрытия."
        />
      </div>

      <Surface className="overflow-hidden">
        <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <p className="app-kicker">Установка на телефон</p>
          <h2 className="app-title mt-2 text-[1.7rem] sm:text-[2.15rem]">
            Приложение можно установить как иконку на домашний экран
          </h2>
          <p className="app-subtitle mt-3 max-w-2xl text-sm">
            Parent Med уже настроен как PWA. Установка идёт через браузер без App Store и Google
            Play.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-3">
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
          <InstallCard
            title="Локальная разработка"
            steps={[
              "Откройте приложение с телефона по IP ноутбука в одной Wi‑Fi сети.",
              "Используйте браузер Safari или Chrome, а не встроенный webview.",
              "Если иконка установки не появилась, обновите страницу и попробуйте снова.",
            ]}
          />
        </div>
      </Surface>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Surface className="p-5 sm:p-6">
      <h2 className="app-card-title text-[1.05rem]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </Surface>
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
