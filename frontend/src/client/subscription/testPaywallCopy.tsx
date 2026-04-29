import type { ReactNode } from "react";
import type { AppLanguage } from "@shared/i18n";

export type PaywallPlanKey = "monthly" | "annual";

export type PaywallPlanCopy = {
  title: string;
  price: string;
  period: string;
  subtitle?: string;
  badge?: string;
};

export type PaywallFeatureItem = {
  label: string;
  icon: ReactNode;
};

export type TestPaywallCopy = {
  subtitle: string;
  featureGrid: PaywallFeatureItem[];
  monthlyPlan: PaywallPlanCopy;
  annualPlan: PaywallPlanCopy;
  cta: string;
  monthlyLegal: string;
  annualLegal: string;
  restore: string;
  terms: string;
  privacy: string;
};

export function getTestPaywallCopy(language: AppLanguage): TestPaywallCopy {
  if (language === "ru") {
    return {
      subtitle:
        "Координирует детей, лекарства, напоминания и доступ для семьи в одном месте.",
      featureGrid: [
        {
          label: "Несколько детей",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <path d="M6.4 10.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" strokeWidth="1.7" />
              <path d="M13.8 9.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" strokeWidth="1.7" />
              <path d="M3.7 16c.6-2.1 2.4-3.4 4.9-3.4 2.6 0 4.3 1.3 5 3.4" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M13 15.7c.4-1.5 1.7-2.4 3.3-2.4" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          label: "Доступ для близких",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <path d="M10 3.3 4.8 5.5v4c0 3.2 2 5.7 5.2 7.5 3.2-1.8 5.2-4.3 5.2-7.5v-4L10 3.3Z" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="m7.7 9.9 1.5 1.5 3-3.2" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          label: "Live Activities",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <path d="M4.2 13.5c-1.2-1.3-1.8-2.8-1.8-4.5s.6-3.2 1.8-4.5M15.8 13.5c1.2-1.3 1.8-2.8 1.8-4.5s-.6-3.2-1.8-4.5" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M7 10.2 8.8 8l1.7 3 1.5-1.8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          label: "Планы приёмов для семьи",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <rect x="3.8" y="6.3" width="12.4" height="9.4" rx="2.2" strokeWidth="1.7" />
              <path d="M7.2 6V5a1.8 1.8 0 0 1 1.8-1.8h2a1.8 1.8 0 0 1 1.8 1.8v1" strokeWidth="1.7" />
              <path d="M10 8.6v4.6M7.7 10.9h4.6" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          label: "Экспорт данных",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <path d="M10 3.7v7.6M7.2 8.6 10 11.4l2.8-2.8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.4 13.2v1a1.9 1.9 0 0 0 1.9 1.9h7.4a1.9 1.9 0 0 0 1.9-1.9v-1" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          label: "Справочник лекарств",
          icon: (
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
              <path d="M6.2 4.6h6.1a1.7 1.7 0 0 1 1.7 1.7v8.3a1.1 1.1 0 0 1-1.8.8L10 13.8l-2.2 1.6a1.1 1.1 0 0 1-1.8-.8V6.3a1.7 1.7 0 0 1 1.7-1.7Z" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M8 7.7h4M8 10h3.1" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ),
        },
      ],
      monthlyPlan: {
        title: "Месячный план",
        price: "$5.99",
        period: "/ месяц",
      },
      annualPlan: {
        title: "Годовой план",
        price: "$49.99",
        period: "/ год",
        badge: "Выгоднее",
      },
      cta: "Попробовать 7 дней бесплатно",
      monthlyLegal:
        "7 дней бесплатно, затем $5.99/месяц. Автопродление. Отмена минимум за 24 часа до окончания периода.",
      annualLegal:
        "7 дней бесплатно, затем $49.99/год. Автопродление. Отмена минимум за 24 часа до окончания периода.",
      restore: "Восстановить покупки",
      terms: "Условия использования",
      privacy: "Политика конфиденциальности",
    };
  }

  return {
    subtitle:
      "Keeps children, medicines, reminders, and family access coordinated in one place.",
    featureGrid: [
      {
        label: "Multiple children",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <path d="M6.4 10.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" strokeWidth="1.7" />
            <path d="M13.8 9.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" strokeWidth="1.7" />
            <path d="M3.7 16c.6-2.1 2.4-3.4 4.9-3.4 2.6 0 4.3 1.3 5 3.4" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M13 15.7c.4-1.5 1.7-2.4 3.3-2.4" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Access for loved ones",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <path d="M10 3.3 4.8 5.5v4c0 3.2 2 5.7 5.2 7.5 3.2-1.8 5.2-4.3 5.2-7.5v-4L10 3.3Z" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="m7.7 9.9 1.5 1.5 3-3.2" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Live Activities",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <path d="M4.2 13.5c-1.2-1.3-1.8-2.8-1.8-4.5s.6-3.2 1.8-4.5M15.8 13.5c1.2-1.3 1.8-2.8 1.8-4.5s-.6-3.2-1.8-4.5" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M7 10.2 8.8 8l1.7 3 1.5-1.8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: "Family medication plans",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <rect x="3.8" y="6.3" width="12.4" height="9.4" rx="2.2" strokeWidth="1.7" />
            <path d="M7.2 6V5a1.8 1.8 0 0 1 1.8-1.8h2a1.8 1.8 0 0 1 1.8 1.8v1" strokeWidth="1.7" />
            <path d="M10 8.6v4.6M7.7 10.9h4.6" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Data export",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <path d="M10 3.7v7.6M7.2 8.6 10 11.4l2.8-2.8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.4 13.2v1a1.9 1.9 0 0 0 1.9 1.9h7.4a1.9 1.9 0 0 0 1.9-1.9v-1" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Medicine guide",
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
            <path d="M6.2 4.6h6.1a1.7 1.7 0 0 1 1.7 1.7v8.3a1.1 1.1 0 0 1-1.8.8L10 13.8l-2.2 1.6a1.1 1.1 0 0 1-1.8-.8V6.3a1.7 1.7 0 0 1 1.7-1.7Z" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M8 7.7h4M8 10h3.1" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
    monthlyPlan: {
      title: "Monthly plan",
      price: "$5.99",
      period: "/ month",
    },
    annualPlan: {
      title: "Annual plan",
      price: "$49.99",
      period: "/ year",
      badge: "Best value",
    },
    cta: "Try 7 days free",
    monthlyLegal:
      "7 days free, then $5.99/month. Auto-renews unless canceled at least 24 hours before the end of the current period.",
    annualLegal:
      "7 days free, then $49.99/year. Auto-renews unless canceled at least 24 hours before the end of the current period.",
    restore: "Restore purchases",
    terms: "Terms of use",
    privacy: "Privacy policy",
  };
}
