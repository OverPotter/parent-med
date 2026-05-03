import babyCareImage from "../../../design/preview/baby_care.png";
import familyOverviewImage from "../../../design/preview/family_overview.png";
import familyMedicationPlanImage from "../../../design/preview/family_medication_plan.png";

type PreviewLocale = "RU" | "EN";
type PreviewVariant = "family-overview" | "baby-care" | "family-medication-plan";

type PreviewCard = {
  title: string;
  subtitle: string;
  className: string;
};

type PreviewSlide = {
  label: PreviewLocale;
  title: string;
  subtitle: string;
  skipLabel: string;
  nextLabel: string;
  paginationLabel: string;
  cards: readonly PreviewCard[];
};

const familyOverviewSlides = {
  ru: {
    label: "RU",
    title: "Забота о семье —\nв одном месте",
    subtitle:
      "Напоминания, планы приёма, домашняя аптечка и единый актуальный план для всех близких.",
    skipLabel: "Пропустить",
    nextLabel: "Далее",
    paginationLabel: "Слайд 1 из 3",
    cards: [
      { title: "Напоминания", subtitle: "что делать дальше", className: "onboarding-preview-card--top" },
      {
        title: "Планы приёма",
        subtitle: "лекарства и витамины",
        className: "onboarding-preview-card--left-middle",
      },
      {
        title: "Кто отметил",
        subtitle: "видно всей семье",
        className: "onboarding-preview-card--right-middle",
      },
      {
        title: "Права доступа",
        subtitle: "роли и видимость",
        className: "onboarding-preview-card--left-bottom",
      },
      {
        title: "Домашняя аптечка",
        subtitle: "остатки и сроки",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
  en: {
    label: "EN",
    title: "Family care,\nall in one place",
    subtitle:
      "Reminders, medication plans, a home medicine cabinet, and one up-to-date care view for the whole family.",
    skipLabel: "Skip",
    nextLabel: "Next",
    paginationLabel: "Slide 1 of 3",
    cards: [
      { title: "Reminders", subtitle: "what to do next", className: "onboarding-preview-card--top" },
      {
        title: "Care plans",
        subtitle: "medicine and vitamins",
        className: "onboarding-preview-card--left-middle",
      },
      {
        title: "Check-ins",
        subtitle: "seen by the family",
        className: "onboarding-preview-card--right-middle",
      },
      {
        title: "Access roles",
        subtitle: "roles and visibility",
        className: "onboarding-preview-card--left-bottom",
      },
      {
        title: "Home medicine\ncabinet",
        subtitle: "supplies and expiry",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
} as const;

const babyCareSlides = {
  ru: {
    label: "RU",
    title: "Всё о малыше —\nв одном месте",
    subtitle:
      "Режим малыша, кормления, сон, температура, заметки и напоминания — всё собрано в одном приложении.",
    skipLabel: "Пропустить",
    nextLabel: "Далее",
    paginationLabel: "Слайд 2 из 3",
    cards: [
      { title: "Кормления", subtitle: "сегодня 5 раз", className: "onboarding-preview-card--top-left" },
      { title: "Сон", subtitle: "ночь 8 ч 20 мин", className: "onboarding-preview-card--top-right" },
      { title: "Заметки", subtitle: "симптомы и наблюдения", className: "onboarding-preview-card--left-middle" },
      { title: "Температура", subtitle: "37.2 °C", className: "onboarding-preview-card--right-middle" },
      { title: "Напоминания", subtitle: "что сделать дальше", className: "onboarding-preview-card--left-bottom" },
      {
        title: "Live Activity",
        subtitle: "важное\nна экране\nблокировки",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
  en: {
    label: "EN",
    title: "Everything for baby,\nin one place",
    subtitle:
      "Baby routine, feedings, sleep, temperature, notes, and reminders — all in one app.",
    skipLabel: "Skip",
    nextLabel: "Next",
    paginationLabel: "Slide 2 of 3",
    cards: [
      { title: "Feedings", subtitle: "5 times today", className: "onboarding-preview-card--top-left" },
      { title: "Sleep", subtitle: "8 h 20 min tonight", className: "onboarding-preview-card--top-right" },
      { title: "Notes", subtitle: "symptoms and observations", className: "onboarding-preview-card--left-middle" },
      { title: "Temperature", subtitle: "37.2 °C", className: "onboarding-preview-card--right-middle" },
      { title: "Reminders", subtitle: "what to do next", className: "onboarding-preview-card--left-bottom" },
      {
        title: "Live Activity",
        subtitle: "key updates\non\nlock screen",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
} as const;

const familyMedicationPlanSlides = {
  ru: {
    label: "RU",
    title: "План приёма\nдля близких",
    subtitle:
      "Создавайте напоминания о таблетках и витаминах для близких — а доступ, видимость и действия можно настроить под каждого.",
    skipLabel: "Пропустить",
    nextLabel: "Далее",
    paginationLabel: "Слайд 3 из 3",
    cards: [
      { title: "Напоминания", subtitle: "пора принять лекарство", className: "onboarding-preview-card--top" },
      {
        title: "План приёма",
        subtitle: "витамины и лекарства",
        className: "onboarding-preview-card--left-middle",
      },
      {
        title: "Кто отметил",
        subtitle: "видно всей семье",
        className: "onboarding-preview-card--right-middle",
      },
      {
        title: "Настройка доступа",
        subtitle: "кто что видит",
        className: "onboarding-preview-card--left-bottom",
      },
      {
        title: "Только отмечать",
        subtitle: "без редактирования",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
  en: {
    label: "EN",
    title: "Medication plan\nfor loved ones",
    subtitle:
      "Create tablet and vitamin reminders for loved ones, with access and visibility tailored for each person.",
    skipLabel: "Skip",
    nextLabel: "Next",
    paginationLabel: "Slide 3 of 3",
    cards: [
      { title: "Reminders", subtitle: "time to take meds", className: "onboarding-preview-card--top" },
      {
        title: "Care plan",
        subtitle: "vitamins and\nmeds",
        className: "onboarding-preview-card--left-middle",
      },
      {
        title: "Check-ins",
        subtitle: "seen by the family",
        className: "onboarding-preview-card--right-middle",
      },
      {
        title: "Access setup",
        subtitle: "who sees what",
        className: "onboarding-preview-card--left-bottom",
      },
      {
        title: "View only",
        subtitle: "no editing needed",
        className: "onboarding-preview-card--right-bottom",
      },
    ],
  },
} as const;

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function renderCardText(text: string) {
  if (!text.includes("\n")) {
    return text;
  }

  return text.split("\n").map((line) => (
    <span key={`${text}-${line}`} className="onboarding-preview-card__line">
      {line}
    </span>
  ));
}

function PreviewPhone({
  imageSrc,
  variant,
  label,
  title,
  subtitle,
  cards,
  skipLabel,
  nextLabel,
  paginationLabel,
}: PreviewSlide & {
  imageSrc: string;
  variant: PreviewVariant;
}) {
  return (
    <section className="onboarding-preview-panel">
      <div className="onboarding-preview-panel__label">{label}</div>

      <div
        className={joinClasses(
          "onboarding-preview-phone",
          `onboarding-preview-phone--${variant}`,
          `onboarding-preview-phone--${label.toLowerCase()}`
        )}
        aria-label={`${label} onboarding preview`}
      >
        <img
          src={imageSrc}
          alt=""
          className="onboarding-preview-phone__image"
          draggable={false}
        />

        <div className="onboarding-preview-copy onboarding-preview-copy--hero">
          <h2 className="onboarding-preview-copy__title">
            {title.split("\n").map((line) => (
              <span key={line} className="onboarding-preview-copy__line">
                {line}
              </span>
            ))}
          </h2>
          <p className="onboarding-preview-copy__subtitle">{subtitle}</p>
        </div>

        {cards.map((card) => (
          <div key={`${label}-${card.title}`} className={joinClasses("onboarding-preview-card", card.className)}>
            <div className="onboarding-preview-card__text">
              <p className="onboarding-preview-card__title">{renderCardText(card.title)}</p>
              <p className="onboarding-preview-card__subtitle">{renderCardText(card.subtitle)}</p>
            </div>
          </div>
        ))}

        <div className="onboarding-preview-footer">
          <button type="button" className="onboarding-preview-footer__skip">
            {skipLabel}
          </button>

          <div className="onboarding-preview-pagination" aria-label={paginationLabel}>
            <span className="onboarding-preview-pagination__dot" />
            <span className="onboarding-preview-pagination__dot onboarding-preview-pagination__dot--active" />
            <span className="onboarding-preview-pagination__dot" />
          </div>

          <button type="button" className="onboarding-preview-footer__next">
            {nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

export function OnboardingPreviewPage() {
  return (
    <main className="onboarding-preview-page">
      <div className="onboarding-preview-shell">
        <div className="onboarding-preview-toolbar">
          <div>
            <p className="onboarding-preview-toolbar__eyebrow">Preview</p>
            <h1 className="onboarding-preview-toolbar__title">Onboarding slides</h1>
          </div>
          <p className="onboarding-preview-toolbar__hint">
            Сохраненные preview для всех экранов: русский и английский рядом для проверки переполнения.
          </p>
        </div>

        {previewSections.map((section) => (
          <section key={section.eyebrow} className="onboarding-preview-section">
            <div className="onboarding-preview-section__header">
              <p className="onboarding-preview-section__eyebrow">{section.eyebrow}</p>
              <h2 className="onboarding-preview-section__title">{section.title}</h2>
            </div>

            <div className="onboarding-preview-grid">
              <PreviewPhone imageSrc={section.imageSrc} variant={section.variant} {...section.slides.ru} />
              <PreviewPhone imageSrc={section.imageSrc} variant={section.variant} {...section.slides.en} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const previewSections: Array<{
  eyebrow: string;
  title: string;
  imageSrc: string;
  variant: PreviewVariant;
  slides: { ru: PreviewSlide; en: PreviewSlide };
}> = [
  {
    eyebrow: "Slide 1",
    title: "Family overview",
    imageSrc: familyOverviewImage,
    variant: "family-overview",
    slides: familyOverviewSlides,
  },
  {
    eyebrow: "Slide 2",
    title: "Baby care",
    imageSrc: babyCareImage,
    variant: "baby-care",
    slides: babyCareSlides,
  },
  {
    eyebrow: "Slide 3",
    title: "Family medication plan",
    imageSrc: familyMedicationPlanImage,
    variant: "family-medication-plan",
    slides: familyMedicationPlanSlides,
  },
];
