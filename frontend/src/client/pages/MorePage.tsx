import { Link } from "react-router-dom";
import { RowSurface, Surface } from "@shared/components/Surface";

const moreLinks = [
  {
    to: "/family",
    title: "Семья",
    description: "Название семьи и список родителей. Редкие настройки, не ежедневный сценарий.",
  },
  {
    to: "/account",
    title: "Аккаунт",
    description: "Email, тема, выход из приложения и управление профилем.",
  },
  {
    to: "/illnesses/history",
    title: "История",
    description: "Архив завершённых наблюдений по детям.",
  },
  {
    to: "/about",
    title: "О приложении",
    description: "Короткое описание сервиса и что в нём можно вести.",
  },
];

export function MorePage() {
  return (
    <div className="min-w-0 space-y-7">
      <Surface className="soft-hero overflow-hidden">
        <div className="border-b border-border/70 px-5 py-5 sm:px-8 sm:py-7">
          <p className="text-sm font-medium tracking-[0.04em] text-primary">Ещё</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Настройки и вторичные разделы
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Здесь собраны экраны, которые нужны реже: семья, аккаунт, архив и справка о продукте.
          </p>
        </div>
      </Surface>

      <ul className="grid gap-4">
        {moreLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <RowSurface>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                  </div>
                  <span className="soft-pill-primary rounded-full px-3 py-1 text-xs">Открыть</span>
                </div>
              </RowSurface>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
