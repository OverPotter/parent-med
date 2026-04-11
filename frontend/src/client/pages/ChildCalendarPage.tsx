import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";

export function ChildCalendarPage() {
  const { language } = useI18n();
  const { childId } = useParams<{ childId: string }>();
  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{language === "ru" ? "Загрузка…" : "Loading…"}</p>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="px-1">
        <Link to={`/children/${child.id}`} className="inline-flex text-sm text-primary hover:underline">
          {language === "ru" ? "← К профилю ребёнка" : "← Back to child profile"}
        </Link>
      </div>
      <PageIntro
        title={language === "ru" ? "Календарь" : "Calendar"}
        subtitle={
          language === "ru"
            ? "Заглушка под общий календарь событий ребёнка."
            : "Placeholder for the child event calendar."
        }
        hideOnMobile
      />
      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-2 text-[1.42rem] tracking-[-0.04em]">
            {language === "ru" ? "Календарь" : "Calendar"}
          </h1>
          <p className="text-sm text-muted">
            {language === "ru"
              ? "Заглушка под общий календарь событий ребёнка."
              : "Placeholder for the child event calendar."}
          </p>
        </Surface>
      </div>
      <Surface className="p-6">
        <p className="text-sm text-muted">
          {language === "ru"
            ? "Здесь будет дневной календарь с фильтрами по сну, кормлению и болезням."
            : "This page will host the day calendar with filters for sleep, feeding, and illnesses."}
        </p>
      </Surface>
    </div>
  );
}
