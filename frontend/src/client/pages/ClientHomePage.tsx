/**
 * Главная: приветствие и быстрые ссылки (семья, дети, аптечка).
 */

import { Link } from "react-router-dom";
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
        <p className="mt-4 rounded-lg border border-border bg-primary/5 p-4 text-sm text-foreground">
          Текущая семья: <span className="font-medium">{currentFamilyName}</span>
        </p>
      )}
      {!currentFamilyId && (
        <p className="mt-4 rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground">
          Семья не выбрана. Перейдите в раздел{" "}
          <Link to="/family" className="text-primary underline">
            Семья
          </Link>{" "}
          и создайте семью.
        </p>
      )}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            to="/family"
            className="block rounded-xl border border-border bg-background p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <span className="font-medium text-foreground">Семья</span>
            <span className="mt-1 block text-sm text-muted">Название семьи и родители</span>
          </Link>
        </li>
        <li>
          <Link
            to="/children"
            className="block rounded-xl border border-border bg-background p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <span className="font-medium text-foreground">Дети</span>
            <span className="mt-1 block text-sm text-muted">Список детей и вес</span>
          </Link>
        </li>
        <li>
          <Link
            to="/medicine-cabinet"
            className="block rounded-xl border border-border bg-background p-4 transition hover:border-primary hover:bg-primary/5"
          >
            <span className="font-medium text-foreground">Аптечка</span>
            <span className="mt-1 block text-sm text-muted">Упаковки и сроки годности</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
