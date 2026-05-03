import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppLanguage } from "@shared/i18n";
import { AnalyticsEvents, trackEvent } from "@shared/analytics";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getAuthOnboardingSlides,
  type AuthOnboardingCardCopy,
  type AuthOnboardingSlide,
} from "@client/onboarding/authOnboardingSlides";

const ONBOARDING_ARTBOARD_ASPECT_RATIO = 941 / 2039;

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function renderLines(text: string, className: string) {
  if (!text.includes("\n")) {
    return text;
  }

  return text.split("\n").map((line) => (
    <span key={`${text}-${line}`} className={className}>
      {line}
    </span>
  ));
}

function OnboardingCard({ card }: { card: AuthOnboardingCardCopy }) {
  return (
    <div className={joinClasses("auth-onboarding-card", `auth-onboarding-card--${card.slot}`)}>
      <div className="auth-onboarding-card__text">
        <p className="auth-onboarding-card__title">
          {renderLines(card.title, "auth-onboarding-card__line")}
        </p>
        <p className="auth-onboarding-card__subtitle">
          {renderLines(card.subtitle, "auth-onboarding-card__line")}
        </p>
      </div>
    </div>
  );
}

function OnboardingSlide({
  slide,
  index,
  total,
  language,
  viewportWidth,
  viewportHeight,
}: {
  slide: AuthOnboardingSlide;
  index: number;
  total: number;
  language: AppLanguage;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const viewportRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 0;
  const artboardFitsWidth = viewportRatio <= ONBOARDING_ARTBOARD_ASPECT_RATIO;
  const artboardWidth = artboardFitsWidth
    ? viewportWidth
    : viewportHeight * ONBOARDING_ARTBOARD_ASPECT_RATIO;
  const artboardHeight = artboardFitsWidth
    ? viewportWidth / ONBOARDING_ARTBOARD_ASPECT_RATIO
    : viewportHeight;
  const artboardOffsetX = (viewportWidth - artboardWidth) / 2;
  const artboardOffsetY = (viewportHeight - artboardHeight) / 2;

  return (
    <section
      className="auth-onboarding-stage"
      aria-label={`slide ${index + 1} of ${total}`}
      style={{ width: viewportWidth > 0 ? `${viewportWidth}px` : undefined }}
    >
      <div
        className={joinClasses(
          "auth-onboarding-phone",
          `auth-onboarding-phone--${slide.variant}`,
          `auth-onboarding-phone--${language}`
        )}
      >
        <div className="auth-onboarding-canvas">
          <div
            className="auth-onboarding-artboard"
            style={{
              width: `${artboardWidth}px`,
              height: `${artboardHeight}px`,
              left: `${artboardOffsetX}px`,
              top: `${artboardOffsetY}px`,
            }}
          >
            <img src={slide.imageSrc} alt="" className="auth-onboarding-phone__image" draggable={false} />

            <div className="auth-onboarding-copy auth-onboarding-copy--hero">
              <h1 className="auth-onboarding-copy__title">
                {renderLines(slide.title, "auth-onboarding-copy__line")}
              </h1>
              <p className="auth-onboarding-copy__subtitle">{slide.subtitle}</p>
            </div>

            {slide.cards.map((card) => (
              <OnboardingCard key={`${slide.id}-${card.slot}-${card.title}`} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OnboardingPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const markAuthOnboardingSeen = useAppStore((s) => s.markAuthOnboardingSeen);
  const slides = useMemo(() => getAuthOnboardingSlides(language), [language]);
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const swipeViewportRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const activeSlide = slides[index] ?? slides[0];
  const isLast = index === slides.length - 1;
  const isFirst = index === 0;

  if (!activeSlide) {
    return null;
  }

  useEffect(() => {
    const viewportNode = swipeViewportRef.current;
    if (!viewportNode) {
      return;
    }

    const updateViewportWidth = () => {
      setViewportWidth(viewportNode.clientWidth);
      setViewportHeight(viewportNode.clientHeight);
    };

    updateViewportWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateViewportWidth());
      observer.observe(viewportNode);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  const finish = () => {
    markAuthOnboardingSeen();
    trackEvent(AnalyticsEvents.WORKSPACE_INTRO_COMPLETED, {
      context: "auth_onboarding",
      slide_count: slides.length,
    });
    navigate("/auth?mode=register", { replace: true });
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((current) => Math.min(current + 1, slides.length - 1));
  };

  const goPrev = () => {
    setIndex((current) => Math.max(current - 1, 0));
  };

  const goTo = (nextIndex: number) => {
    setIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const currentX = event.touches[0]?.clientX ?? null;
    if (startX === null || currentX === null) {
      return;
    }

    let deltaX = currentX - startX;
    const pushingPastStart = isFirst && deltaX > 0;
    const pushingPastEnd = isLast && deltaX < 0;
    if (pushingPastStart || pushingPastEnd) {
      deltaX *= 0.35;
    }

    touchDeltaXRef.current = deltaX;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
    setIsDragging(false);
    const deltaX = touchDeltaXRef.current;
    touchDeltaXRef.current = 0;
    setDragOffset(0);
    if (Math.abs(deltaX) < 38) {
      return;
    }
    if (deltaX < 0) {
      goNext();
      return;
    }
    goPrev();
  };

  return (
    <main className="auth-onboarding-page">
      <div className="auth-onboarding-shell">
        <div
          ref={swipeViewportRef}
          className="auth-onboarding-swipe"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={joinClasses(
              "auth-onboarding-track",
              isDragging && "auth-onboarding-track--dragging"
            )}
            style={{
              width: viewportWidth > 0 ? `${viewportWidth * slides.length}px` : undefined,
              transform: `translate3d(${(-index * viewportWidth) + dragOffset}px, 0, 0)`,
            }}
          >
            {slides.map((slide, slideIndex) => (
              <OnboardingSlide
                key={slide.id}
                slide={slide}
                index={slideIndex}
                total={slides.length}
                language={language}
                viewportWidth={viewportWidth}
                viewportHeight={viewportHeight}
              />
            ))}
          </div>
        </div>

        <div className="auth-onboarding-footer">
          <button type="button" className="auth-onboarding-footer__skip" onClick={finish}>
            {language === "ru" ? "Пропустить" : "Skip"}
          </button>

          <div className="auth-onboarding-pagination" aria-label={`slide ${index + 1} of ${slides.length}`}>
            {slides.map((slide, slideIndex) => (
              <button
                type="button"
                key={slide.id}
                className={joinClasses(
                  "auth-onboarding-pagination__dot",
                  slideIndex === index && "auth-onboarding-pagination__dot--active"
                )}
                aria-label={`${slideIndex + 1}`}
                aria-pressed={slideIndex === index}
                onClick={() => goTo(slideIndex)}
              />
            ))}
          </div>

          <button type="button" className="auth-onboarding-footer__next" onClick={goNext}>
            {isLast ? (language === "ru" ? "Начать" : "Start") : language === "ru" ? "Далее" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}
