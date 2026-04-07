import { Link } from "react-router-dom";
import { useI18n } from "@shared/hooks/useI18n";

export function MedicalDisclaimer() {
  const { language } = useI18n();

  return (
    <div className="soft-note-warning rounded-2xl px-4 py-3 text-xs leading-6 text-muted sm:text-sm">
      <p>
        {language === "ru"
          ? "Важно: это информационный семейный сервис. Мы не врачи, не ставим диагнозы, не назначаем лечение и не несем ответственность за медицинские решения."
          : "Important: this is an informational family service. We are not doctors, we do not diagnose or prescribe treatment, and we are not responsible for medical decisions."}
      </p>
      <p className="mt-1.5">
        {language === "ru"
          ? "При симптомах обратитесь к врачу."
          : "For symptoms, contact a doctor."}{" "}
        <Link to="/legal" className="underline">
          {language === "ru" ? "Подробнее" : "Learn more"}
        </Link>
      </p>
    </div>
  );
}
