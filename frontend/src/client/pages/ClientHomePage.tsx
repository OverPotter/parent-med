/**
 * Главная: приветствие и быстрые ссылки по основным разделам.
 */

import { Link } from "react-router-dom";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";

export function ClientHomePage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);

  return (
    <div className="min-w-0 space-y-9">
      <Surface className="overflow-hidden">
        <div className="soft-hero border-b border-border/70 px-6 py-8 sm:px-8 sm:py-9">
          <p className="text-sm font-medium tracking-[0.04em] text-primary">Главная</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
            Умная аптечка и ведение болезни ребёнка
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-muted">
            Основные разделы под рукой: дети, текущие болезни, история и домашняя аптечка.
          </p>
        </div>
        <div className="grid gap-6 px-6 py-7 sm:grid-cols-3 sm:px-8 sm:py-8">
          <QuickStat
            label="Семья"
            value={currentFamilyName || "Не выбрана"}
            hint={currentFamilyId ? "Можно работать" : "Сначала выберите раздел «Семья»"}
          />
          <QuickStat
            label="Дети"
            value="Профили"
            hint="Создание, редактирование и переход в журнал болезни"
          />
          <QuickStat
            label="Аптечка"
            value="Упаковки"
            hint="Срок годности, вскрытие и использование в эпизодах"
          />
        </div>
      </Surface>

      {currentFamilyName && (
        <Surface className="soft-hero px-5 py-4 text-sm text-foreground">
          Сейчас выбрана семья: <span className="font-medium">{currentFamilyName}</span>
        </Surface>
      )}
      {!currentFamilyId && (
        <EmptyState className="text-foreground">
          Семья не выбрана. Перейдите в раздел{" "}
          <Link to="/family" className="text-primary underline">
            Семья
          </Link>{" "}
          и создайте семью.
        </EmptyState>
      )}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Разделы</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Короткие входы в основные рабочие сценарии.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <HomeLink
            to="/children"
            title="Дети"
            description="Профили детей, история, запуск нового эпизода."
          />
        </li>
        <li>
          <HomeLink
            to="/illnesses/active"
            title="Активные болезни"
            description="Только текущие эпизоды, без архивного шума."
          />
        </li>
        <li>
          <HomeLink
            to="/illnesses/history"
            title="История болезней"
            description="Завершённые эпизоды по детям и быстрый вход в архив."
          />
        </li>
        <li>
          <HomeLink to="/family" title="Семья" description="Название семьи и родители." />
        </li>
        <li>
          <HomeLink
            to="/medicine-cabinet"
            title="Аптечка"
            description="Домашние упаковки, сроки годности и готовность к приёму."
          />
        </li>
      </ul>
    </div>
  );
}

function QuickStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-3 text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-7 text-muted">{hint}</p>
    </div>
  );
}

function HomeLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link to={to} className="block transition-transform duration-200 hover:-translate-y-0.5">
      <RowSurface className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground">{title}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
          </div>
          <span className="soft-pill-primary rounded-full px-3 py-1 text-xs">Открыть</span>
        </div>
      </RowSurface>
    </Link>
  );
}
