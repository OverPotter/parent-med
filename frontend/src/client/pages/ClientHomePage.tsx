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
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
        Умная аптечка и ведение болезни ребёнка
      </h1>
      <p className="mt-2 text-muted">
        Выберите семью в разделе «Семья», затем добавляйте детей, препараты и ведите эпизоды
        болезни.
      </p>
      {currentFamilyName && (
        <Surface className="mt-4 border-l-4 border-l-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
          Текущая семья: <span className="font-medium">{currentFamilyName}</span>
        </Surface>
      )}
      {!currentFamilyId && (
        <EmptyState className="mt-4 bg-muted/20 text-foreground">
          Семья не выбрана. Перейдите в раздел{" "}
          <Link to="/family" className="text-primary underline">
            Семья
          </Link>{" "}
          и создайте семью.
        </EmptyState>
      )}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <Link
            to="/children"
            className="block transition hover:border-primary/40 hover:bg-primary/5"
          >
            <RowSurface className="h-full">
              <span className="font-medium text-foreground">Дети</span>
              <span className="mt-1 block text-sm text-muted">
                Создание детей, редактирование и переход в личную историю
              </span>
            </RowSurface>
          </Link>
        </li>
        <li>
          <Link
            to="/illnesses/active"
            className="block transition hover:border-primary/40 hover:bg-primary/5"
          >
            <RowSurface className="h-full">
              <span className="font-medium text-foreground">Активные болезни</span>
              <span className="mt-1 block text-sm text-muted">
                Кто болеет прямо сейчас и какие эпизоды открыты
              </span>
            </RowSurface>
          </Link>
        </li>
        <li>
          <Link
            to="/illnesses/history"
            className="block transition hover:border-primary/40 hover:bg-primary/5"
          >
            <RowSurface className="h-full">
              <span className="font-medium text-foreground">История болезней</span>
              <span className="mt-1 block text-sm text-muted">
                История эпизодов по каждому ребёнку
              </span>
            </RowSurface>
          </Link>
        </li>
        <li>
          <Link
            to="/family"
            className="block transition hover:border-primary/40 hover:bg-primary/5"
          >
            <RowSurface className="h-full">
              <span className="font-medium text-foreground">Семья</span>
              <span className="mt-1 block text-sm text-muted">Название семьи и родители</span>
            </RowSurface>
          </Link>
        </li>
        <li>
          <Link
            to="/medicine-cabinet"
            className="block transition hover:border-primary/40 hover:bg-primary/5"
          >
            <RowSurface className="h-full">
              <span className="font-medium text-foreground">Аптечка</span>
              <span className="mt-1 block text-sm text-muted">Упаковки и сроки годности</span>
            </RowSurface>
          </Link>
        </li>
      </ul>
    </div>
  );
}
