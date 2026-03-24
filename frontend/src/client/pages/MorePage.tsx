import { Link } from "react-router-dom";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";

const moreLinks = [
  {
    to: "/family",
    title: "Семья",
    description: "Название семьи, участники и приглашения.",
  },
  {
    to: "/account",
    title: "Аккаунт",
    description: "Email, имя в семье, напоминания и безопасность.",
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
    <div className="min-w-0 space-y-6">
      <PageIntro
        title="Ещё"
        subtitle="Семья, аккаунт, история и справка в одном месте."
        hideOnMobile
      />
      <ul className="soft-panel rounded-[30px] p-3 sm:p-4 grid gap-3 sm:gap-4">
        {moreLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <RowSurface>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="app-card-title text-base">{item.title}</p>
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
