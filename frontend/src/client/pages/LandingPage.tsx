import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BrandWordmark } from "@shared/components/BrandWordmark";
import { LanguageSwitch } from "@shared/components/LanguageSwitch";
import { Surface } from "@shared/components/Surface";
import { V3BackgroundDoodles } from "@shared/components/V3BackgroundDoodles";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

const FEATURE_SECTION_IDS = ["children", "pillbox", "cabinet", "family", "trust"] as const;
type FeatureSectionId = (typeof FEATURE_SECTION_IDS)[number];

export function LandingPage() {
  const { copy } = useI18n();
  const MOBILE_FAQ_LIMIT = 4;
  const [isHeroMobile, setIsHeroMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );
  const [isFeatureMobile, setIsFeatureMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 767 : false
  );
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const heroCardsCarouselRef = useRef<HTMLDivElement | null>(null);
  const featureCarouselRef = useRef<HTMLDivElement | null>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [featureSlideIndex, setFeatureSlideIndex] = useState(0);
  const [featureVirtualIndex, setFeatureVirtualIndex] = useState(1);
  const [featureSlideHeight, setFeatureSlideHeight] = useState<number | null>(null);
  const [showAllFaqMobile, setShowAllFaqMobile] = useState(false);
  const featureSlides = useMemo(
    () =>
      FEATURE_SECTION_IDS.map((sectionId) => {
        if (sectionId === "children") return copy.landing.sections.children.title;
        if (sectionId === "pillbox") return copy.landing.sections.pillbox.title;
        if (sectionId === "cabinet") return copy.landing.sections.cabinet.title;
        if (sectionId === "family") return copy.landing.sections.family.title;
        return copy.landing.sections.trust.title;
      }),
    [copy.landing.sections]
  );
  const realSlidesCount = FEATURE_SECTION_IDS.length;
  const heroCards = copy.landing.cards;
  const heroRealSlidesCount = heroCards.length;
  const loopedHeroCards = useMemo(() => {
    if (heroCards.length <= 1) return heroCards;
    const firstCard = heroCards[0];
    const lastCard = heroCards[heroCards.length - 1];
    if (!firstCard || !lastCard) return heroCards;
    return [lastCard, ...heroCards, firstCard];
  }, [heroCards]);
  const loopedFeatureSections = useMemo<FeatureSectionId[]>(() => {
    const firstSection = FEATURE_SECTION_IDS[0];
    const lastSection = FEATURE_SECTION_IDS[FEATURE_SECTION_IDS.length - 1];
    if (!firstSection || !lastSection) return [...FEATURE_SECTION_IDS];
    return [lastSection, ...FEATURE_SECTION_IDS, firstSection];
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsHeroMobile(window.innerWidth <= 640);
      setIsFeatureMobile(window.innerWidth <= 767);
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const toRealIndex = (virtualIndex: number) => {
    if (virtualIndex <= 0) return realSlidesCount - 1;
    if (virtualIndex >= realSlidesCount + 1) return 0;
    return virtualIndex - 1;
  };

  const toRealHeroIndex = (virtualIndex: number) => {
    if (virtualIndex <= 0) return heroRealSlidesCount - 1;
    if (virtualIndex >= heroRealSlidesCount + 1) return 0;
    return virtualIndex - 1;
  };

  useEffect(() => {
    const track = heroCardsCarouselRef.current;
    if (!track || heroRealSlidesCount <= 1 || !isHeroMobile) return;
    let snapTimeoutId: number | null = null;
    const getSlideStep = () => {
      return Math.max(track.clientWidth, 1);
    };

    const jumpWithoutAnimation = (targetVirtualIndex: number) => {
      const previousBehavior = track.style.scrollBehavior;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = getSlideStep() * targetVirtualIndex;
      track.style.scrollBehavior = previousBehavior;
      setHeroSlideIndex(toRealHeroIndex(targetVirtualIndex));
    };

    const ensureInitialOffset = () => {
      const step = getSlideStep();
      if (track.scrollLeft < step * 0.5 || track.scrollLeft > step * (heroRealSlidesCount + 0.5)) {
        jumpWithoutAnimation(1);
      }
    };

    const markInteraction = () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
    };

    const releaseInteraction = () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
      snapTimeoutId = window.setTimeout(() => {
        const step = getSlideStep();
        const nearestVirtualIndex = Math.round(track.scrollLeft / step);
        if (nearestVirtualIndex <= 0) {
          jumpWithoutAnimation(heroRealSlidesCount);
          return;
        }
        if (nearestVirtualIndex >= heroRealSlidesCount + 1) {
          jumpWithoutAnimation(1);
          return;
        }
        track.scrollTo({ left: step * nearestVirtualIndex, behavior: "auto" });
        setHeroSlideIndex(toRealHeroIndex(nearestVirtualIndex));
      }, 120);
    };

    const onScroll = () => {
      const step = getSlideStep();
      setHeroSlideIndex(toRealHeroIndex(Math.round(track.scrollLeft / step)));
    };

    ensureInitialOffset();
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("touchstart", markInteraction, { passive: true });
    track.addEventListener("pointerdown", markInteraction, { passive: true });
    track.addEventListener("touchend", releaseInteraction, { passive: true });
    track.addEventListener("pointerup", releaseInteraction, { passive: true });
    track.addEventListener("pointercancel", releaseInteraction, { passive: true });
    window.addEventListener("touchend", releaseInteraction, { passive: true });
    window.addEventListener("pointerup", releaseInteraction, { passive: true });
    window.addEventListener("pointercancel", releaseInteraction, { passive: true });

    const onResize = () => ensureInitialOffset();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("touchstart", markInteraction);
      track.removeEventListener("pointerdown", markInteraction);
      track.removeEventListener("touchend", releaseInteraction);
      track.removeEventListener("pointerup", releaseInteraction);
      track.removeEventListener("pointercancel", releaseInteraction);
      window.removeEventListener("touchend", releaseInteraction);
      window.removeEventListener("pointerup", releaseInteraction);
      window.removeEventListener("pointercancel", releaseInteraction);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [heroRealSlidesCount, isHeroMobile]);

  const scrollToHeroSlide = (index: number) => {
    const track = heroCardsCarouselRef.current;
    if (!track) return;
    const step = Math.max(track.clientWidth, 1);
    const targetVirtualIndex = index + 1;
    track.scrollTo({ left: step * targetVirtualIndex, behavior: "smooth" });
    setHeroSlideIndex(index);
  };

  useEffect(() => {
    const track = featureCarouselRef.current;
    if (!track || !isFeatureMobile) return;
    let snapTimeoutId: number | null = null;
    const getSlideStep = () => {
      // Every mobile slide is exactly 100% width, so using track width avoids
      // fractional drift and clipped neighboring cards.
      return Math.max(track.clientWidth, 1);
    };

    const jumpWithoutAnimation = (targetVirtualIndex: number) => {
      const previousBehavior = track.style.scrollBehavior;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = getSlideStep() * targetVirtualIndex;
      track.style.scrollBehavior = previousBehavior;
      setFeatureVirtualIndex(targetVirtualIndex);
      setFeatureSlideIndex(toRealIndex(targetVirtualIndex));
    };

    const ensureInitialOffset = () => {
      if (window.innerWidth >= 768) return;
      const step = getSlideStep();
      if (track.scrollLeft < step * 0.5 || track.scrollLeft > step * (realSlidesCount + 0.5)) {
        jumpWithoutAnimation(1);
      }
    };

    const markInteraction = () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
    };

    const releaseInteraction = () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
      snapTimeoutId = window.setTimeout(() => {
        const step = getSlideStep();
        const nearestVirtualIndex = Math.round(track.scrollLeft / step);

        if (nearestVirtualIndex <= 0) {
          jumpWithoutAnimation(realSlidesCount);
          return;
        }
        if (nearestVirtualIndex >= realSlidesCount + 1) {
          jumpWithoutAnimation(1);
          return;
        }
        const targetLeft = step * nearestVirtualIndex;
        track.scrollTo({ left: targetLeft, behavior: "auto" });
        setFeatureVirtualIndex(nearestVirtualIndex);
        setFeatureSlideIndex(toRealIndex(nearestVirtualIndex));
      }, 130);
    };

    const onScroll = () => {
      const step = getSlideStep();
      const rawVirtualIndex = track.scrollLeft / step;
      const virtualIndex = Math.round(rawVirtualIndex);
      setFeatureVirtualIndex(virtualIndex);
      setFeatureSlideIndex(toRealIndex(virtualIndex));
    };

    ensureInitialOffset();

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("touchstart", markInteraction, { passive: true });
    track.addEventListener("pointerdown", markInteraction, { passive: true });
    track.addEventListener("touchend", releaseInteraction, { passive: true });
    track.addEventListener("pointerup", releaseInteraction, { passive: true });
    track.addEventListener("pointercancel", releaseInteraction, { passive: true });
    window.addEventListener("touchend", releaseInteraction, { passive: true });
    window.addEventListener("pointerup", releaseInteraction, { passive: true });
    window.addEventListener("pointercancel", releaseInteraction, { passive: true });

    return () => {
      if (snapTimeoutId) {
        window.clearTimeout(snapTimeoutId);
      }
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("touchstart", markInteraction);
      track.removeEventListener("pointerdown", markInteraction);
      track.removeEventListener("touchend", releaseInteraction);
      track.removeEventListener("pointerup", releaseInteraction);
      track.removeEventListener("pointercancel", releaseInteraction);
      window.removeEventListener("touchend", releaseInteraction);
      window.removeEventListener("pointerup", releaseInteraction);
      window.removeEventListener("pointercancel", releaseInteraction);
    };
  }, [realSlidesCount, isFeatureMobile]);

  useEffect(() => {
    const track = featureCarouselRef.current;
    if (!track || !isFeatureMobile) return;

    const recalcSlideHeight = () => {
      if (window.innerWidth >= 768) {
        setFeatureSlideHeight(null);
        return;
      }

      const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-feature-slide]"));
      if (slides.length === 0) return;

      const nextHeight = Math.ceil(
        Math.max(
          ...slides.map((slide) => {
            const inner = slide.querySelector<HTMLElement>(".landing-feature-slide-inner");
            return inner?.scrollHeight ?? inner?.offsetHeight ?? slide.scrollHeight;
          })
        )
      );
      setFeatureSlideHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    recalcSlideHeight();
    const rafId = window.requestAnimationFrame(recalcSlideHeight);
    const timeoutId = window.setTimeout(recalcSlideHeight, 180);

    const observer = new ResizeObserver(() => recalcSlideHeight());
    observer.observe(track);
    Array.from(track.querySelectorAll<HTMLElement>("[data-feature-slide]")).forEach((slide) => {
      observer.observe(slide);
    });

    window.addEventListener("resize", recalcSlideHeight);
    window.addEventListener("orientationchange", recalcSlideHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("resize", recalcSlideHeight);
      window.removeEventListener("orientationchange", recalcSlideHeight);
    };
  }, [copy.landing.sections, isFeatureMobile]);

  const scrollToFeatureSlide = (index: number) => {
    const track = featureCarouselRef.current;
    if (!track) return;
    const step = Math.max(track.clientWidth, 1);
    const targetVirtualIndex = index + 1;
    track.scrollTo({ left: step * targetVirtualIndex, behavior: "smooth" });
    setFeatureVirtualIndex(targetVirtualIndex);
    setFeatureSlideIndex(index);
  };

  const renderFeatureSlide = (sectionId: FeatureSectionId) => {
    if (sectionId === "children") {
      return (
        <div className="landing-feature-slide-inner px-0 py-4 sm:py-5">
          <div className="landing-child-hero-shell">
            <h2 className="landing-section-title">{copy.landing.sections.children.title}</h2>
            <p className="landing-section-body mt-4 max-w-[68rem] text-sm leading-7 text-muted sm:text-base">
              {copy.landing.sections.children.description}
            </p>

            <ul className="landing-mobile-summary mt-4 md:hidden">
              {copy.landing.sections.children.mobilePoints.map((line) => (
                <li key={line} className="landing-mobile-summary-item">
                  <span className="landing-mobile-summary-text">{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden flex-wrap gap-3 md:flex">
              {copy.landing.sections.children.chips.map((label) => (
                <span key={label} className="landing-child-pill">
                  {label}
                </span>
              ))}
            </div>

            <div className="landing-child-shell mt-6 hidden md:block">
              <div className="grid gap-3 lg:grid-cols-3">
                {copy.landing.sections.children.cards.map((item) => (
                  <Surface
                    key={item.title}
                    className="landing-feature-card landing-hero-card-item rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4"
                  >
                    <div className="flex flex-col gap-2">
                      <h3 className="landing-card-title text-[1.02rem] font-semibold leading-7 text-foreground">
                        {item.title}
                      </h3>
                      <div className="space-y-1.5 text-sm font-medium leading-7 text-muted">
                        {item.lines.map((line) => (
                          <p key={line} className="landing-card-body">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--color-primary)] sm:text-base">
              {copy.landing.sections.children.footer}
            </p>
          </div>
        </div>
      );
    }

    if (sectionId === "pillbox") {
      return (
        <div className="landing-feature-slide-inner px-0 py-4 sm:py-5">
          <div className="landing-child-hero-shell">
            <h2 className="landing-section-title">{copy.landing.sections.pillbox.title}</h2>
            <p className="landing-section-body mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
              {copy.landing.sections.pillbox.description}
            </p>

            <ul className="landing-mobile-summary mt-4 md:hidden">
              {copy.landing.sections.pillbox.mobilePoints.map((line) => (
                <li key={line} className="landing-mobile-summary-item">
                  <span className="landing-mobile-summary-text">{line}</span>
                </li>
              ))}
            </ul>

            <div className="landing-child-shell mt-6 hidden md:block">
              <div className="grid gap-3 lg:grid-cols-2">
                <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                  <ul className="space-y-1.5 text-[15px] font-medium leading-7 text-muted sm:text-base">
                    {copy.landing.sections.pillbox.bullets.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]" />
                        <span className="landing-card-body">{line}</span>
                      </li>
                    ))}
                  </ul>
                </Surface>
                <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                  <div className="flex flex-col items-start gap-2">
                    <span className="landing-child-pill">
                      {copy.landing.sections.pillbox.chips[0]}
                    </span>
                    <span className="landing-child-pill landing-child-pill--active">
                      {copy.landing.sections.pillbox.chips[1]}
                    </span>
                    <span className="landing-child-pill">
                      {copy.landing.sections.pillbox.chips[2]}
                    </span>
                  </div>
                </Surface>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--color-primary)] sm:text-base">
              {copy.landing.sections.pillbox.footer}
            </p>
          </div>
        </div>
      );
    }

    if (sectionId === "cabinet") {
      return (
        <div className="landing-feature-slide-inner px-0 py-4 sm:py-5">
          <div className="landing-child-hero-shell">
            <h2 className="landing-section-title">{copy.landing.sections.cabinet.title}</h2>
            <p className="landing-section-body mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
              {copy.landing.sections.cabinet.description}
            </p>

            <ul className="landing-mobile-summary mt-4 md:hidden">
              {copy.landing.sections.cabinet.mobilePoints.map((line) => (
                <li key={line} className="landing-mobile-summary-item">
                  <span className="landing-mobile-summary-text">{line}</span>
                </li>
              ))}
            </ul>

            <div className="landing-child-shell mt-6 hidden md:block">
              <div className="grid gap-3 lg:grid-cols-2">
                <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                  <div className="flex h-full flex-col items-start gap-2 text-sm font-medium leading-7 text-muted sm:text-base">
                    <h3 className="landing-card-title text-[1.02rem] font-semibold leading-7 text-foreground">
                      {copy.landing.sections.cabinet.statusTitle}
                    </h3>
                    <p className="flex items-start gap-2 text-[15px] font-medium leading-7 text-muted sm:text-base">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]" />
                      <span className="landing-card-body">
                        {copy.landing.sections.cabinet.statusItems[0]}
                      </span>
                    </p>
                    <span className="landing-child-pill landing-child-pill--danger landing-card-body">
                      {copy.landing.sections.cabinet.statusItems[1]}
                    </span>
                    <span className="landing-child-pill landing-card-body">
                      {copy.landing.sections.cabinet.statusItems[2]}
                    </span>
                  </div>
                </Surface>
                <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                  <div className="flex h-full flex-col gap-2">
                    <h3 className="landing-card-title text-[1.02rem] font-semibold leading-7 text-foreground">
                      {copy.landing.sections.cabinet.checklistTitle}
                    </h3>
                    <ul className="space-y-1.5 text-sm font-medium leading-7 text-muted sm:text-base">
                      {copy.landing.sections.cabinet.checklistItems.map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]" />
                          <span className="landing-card-body">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Surface>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--color-primary)] sm:text-base">
              {copy.landing.sections.cabinet.footer}
            </p>
          </div>
        </div>
      );
    }

    if (sectionId === "family") {
      return (
        <div className="landing-feature-slide-inner px-0 py-4 sm:py-5">
          <div className="landing-child-hero-shell">
            <h2 className="landing-section-title">{copy.landing.sections.family.title}</h2>
            <p className="landing-section-body mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
              {copy.landing.sections.family.description}
            </p>
            <ul className="landing-mobile-summary mt-4 md:hidden">
              {copy.landing.sections.family.mobilePoints.map((line) => (
                <li key={line} className="landing-mobile-summary-item">
                  <span className="landing-mobile-summary-text">{line}</span>
                </li>
              ))}
            </ul>
            <div className="landing-child-shell mt-5 hidden md:block">
              <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                <h3 className="landing-card-title text-[1.02rem] font-semibold leading-7 text-foreground">
                  {copy.landing.sections.family.flowTitle}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm font-medium leading-7 text-muted sm:text-base">
                  {copy.landing.sections.family.flowSteps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]" />
                      <span className="landing-card-body">{step}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>
            <div className="mt-4 hidden flex-wrap gap-2 sm:gap-3 md:flex">
              {copy.landing.sections.family.roles.map((role) => (
                <span key={role} className="landing-child-pill text-sm">
                  {role}
                </span>
              ))}
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--color-primary)] sm:text-base">
              {copy.landing.sections.family.footer}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="landing-feature-slide-inner px-0 py-4 sm:py-5">
        <div className="landing-child-hero-shell">
          <h2 className="landing-section-title">{copy.landing.sections.trust.title}</h2>
          <p className="landing-section-body mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
            {copy.landing.sections.trust.description}
          </p>

          <ul className="landing-mobile-summary mt-4 md:hidden">
            {copy.landing.sections.trust.mobilePoints.map((line) => (
              <li key={line} className="landing-mobile-summary-item">
                <span className="landing-mobile-summary-text">{line}</span>
              </li>
            ))}
          </ul>

          <div className="landing-child-shell mt-6 hidden md:block">
            <div className="grid gap-3 lg:grid-cols-2">
              <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                <p className="landing-card-body text-sm font-medium leading-7 text-muted sm:text-base">
                  {copy.landing.sections.trust.cards[0]}
                </p>
              </Surface>
              <Surface className="landing-feature-card rounded-[1.4rem] px-4 py-4 sm:px-5 sm:py-4">
                <p className="landing-card-body text-sm font-medium leading-7 text-muted sm:text-base">
                  {copy.landing.sections.trust.cards[1]}
                </p>
              </Surface>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-[color:var(--color-primary)] sm:text-base">
            {copy.landing.sections.trust.footer}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="landing-page-glow pointer-events-none absolute inset-0 -z-10" />
      <V3BackgroundDoodles className="landing-doodle-layer" />
      <div className="landing-v3-decor landing-v3-decor-a" aria-hidden="true" />
      <div className="landing-v3-decor landing-v3-decor-b" aria-hidden="true" />

      <main className="px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-6">
        <div className="mx-auto max-w-[78rem] space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="landing-topbar-shell">
            <div className="landing-topbar-inner">
              <div className="landing-hero-reset-topline">
                <Link
                  to="/"
                  className="landing-hero-reset-brandicon"
                  aria-label={copy.common.brandName}
                >
                  <img src="/pwa-icon.png" alt="" className="landing-hero-reset-logo" />
                </Link>
                <Link
                  to="/"
                  className="landing-hero-reset-brandmark"
                  aria-label={copy.common.brandName}
                >
                  <BrandWordmark
                    className="landing-hero-reset-brand"
                    ariaLabel={copy.common.brandName}
                  />
                </Link>
                <div className="landing-hero-reset-actions-inline">
                  <Link
                    to="/auth?mode=login"
                    className="landing-topline-button rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    {copy.landing.hero.login}
                  </Link>
                  <LanguageSwitch
                    className="landing-language-switch"
                    triggerClassName="landing-topline-button"
                  />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="landing-topline-button landing-theme-toggle rounded-full"
                    aria-label={
                      effectiveTheme === "light"
                        ? copy.landing.hero.themeToggleAriaDark
                        : copy.landing.hero.themeToggleAriaLight
                    }
                    title={
                      effectiveTheme === "light"
                        ? copy.landing.hero.themeToggleAriaDark
                        : copy.landing.hero.themeToggleAriaLight
                    }
                  >
                    <span aria-hidden="true" className="inline-flex">
                      {effectiveTheme === "light" ? <LandingMoonIcon /> : <LandingSunIcon />}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-hero-reset">
            <div className="landing-hero-reset-inner">
              <div className="landing-hero-grid mt-3 grid gap-4 lg:grid-cols-[minmax(0,0.96fr)_minmax(18rem,0.88fr)] lg:items-center lg:gap-5">
                <div className="min-w-0 text-left lg:flex lg:h-full lg:max-w-[33rem] lg:flex-col">
                  <p className="landing-section-label inline-flex w-fit items-center rounded-full border border-[color:rgba(159,140,219,0.2)] bg-[color:rgba(205,191,241,0.34)] px-3 py-1.5 justify-start">
                    {copy.landing.hero.eyebrow}
                  </p>
                  <h1 className="landing-hero-reset-title mx-0 mt-2.5 max-w-[24ch] text-left text-[clamp(1.9rem,3.3vw,2.85rem)]">
                    <>
                      {copy.landing.hero.titleLines[0]}
                      <br />
                      {copy.landing.hero.titleLines[1]}
                      <br />
                      {copy.landing.hero.titleLines[2]}
                    </>
                  </h1>
                  <p className="landing-hero-reset-lead mx-0 mt-2.5 max-w-[33rem] text-left">
                    {copy.landing.hero.lead}
                  </p>

                  <div className="landing-hero-cta-wrap mt-4 flex flex-col items-start gap-2.5">
                    <p className="text-sm text-muted">
                      {copy.landing.hero.loginPrompt}{" "}
                      <Link
                        to="/auth?mode=login"
                        className="font-semibold text-[color:var(--color-primary)] underline-offset-4 hover:underline"
                      >
                        {copy.landing.hero.login}
                      </Link>
                    </p>
                    <Link
                      to="/auth?mode=register"
                      className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                    >
                      {copy.landing.hero.createAccount}
                    </Link>
                  </div>

                  <div className="mt-4 hidden space-y-2.5 sm:block">
                    {copy.landing.hero.highlights.map((item, index) => {
                      const Icon =
                        index === 0
                          ? HeroStethoscopeIcon
                          : index === 1
                            ? HeroBellRingIcon
                            : HeroShieldCheckIcon;
                      return (
                        <div
                          key={item}
                          className="flex items-center gap-2.5 text-sm font-semibold leading-6 text-foreground/85"
                        >
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--color-primary)]">
                            <Icon />
                          </span>
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="landing-hero-cards-shell mx-auto min-w-0 max-w-[34rem] overflow-hidden bg-transparent p-0 shadow-none md:rounded-[2rem] md:border md:border-[color:rgba(159,140,219,0.3)] md:bg-[color:rgba(205,191,241,0.34)] md:p-3 md:shadow-[0_26px_60px_-42px_rgba(73,56,129,0.24)] lg:ml-auto lg:w-full lg:max-w-[35.5rem] lg:self-center">
                  <div ref={heroCardsCarouselRef} className="landing-hero-cards-track">
                    {(isHeroMobile && heroRealSlidesCount > 1 ? loopedHeroCards : heroCards).map(
                      (item, index, arr) => {
                        const Icon =
                          item.title === copy.landing.cards[0]?.title
                            ? HeroChildIcon
                            : item.title === copy.landing.cards[1]?.title
                              ? HeroAlarmIcon
                              : item.title === copy.landing.cards[2]?.title
                                ? HeroCalendarClockIcon
                                : HeroFamilyIcon;

                        return (
                          <Surface
                            key={`${item.title}-${index}`}
                            data-hero-slide
                            className={`landing-feature-card landing-hero-card-item rounded-[1.35rem] px-3.5 py-2.5 text-left sm:px-4 sm:py-3.5 ${
                              isHeroMobile &&
                              heroRealSlidesCount > 1 &&
                              (index === 0 || index === arr.length - 1)
                                ? "landing-hero-card-item--clone"
                                : ""
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 sm:flex-col sm:items-start sm:gap-1.5">
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:rgba(138,123,191,0.12)] text-[color:var(--color-primary)]">
                                  <Icon />
                                </span>
                                <p className="landing-card-title landing-hero-card-title min-w-0 flex-1 break-words text-sm font-semibold leading-6 text-foreground sm:text-[0.98rem]">
                                  {item.title}
                                </p>
                              </div>
                              <p className="landing-card-body min-w-0 text-sm leading-6 text-muted">
                                {item.description}
                              </p>
                            </div>
                          </Surface>
                        );
                      }
                    )}
                  </div>
                  {isHeroMobile && heroRealSlidesCount > 1 ? (
                    <div className="landing-hero-cards-dots sm:hidden">
                      {heroCards.map((item, index) => (
                        <button
                          key={item.title}
                          type="button"
                          className={`landing-hero-cards-dot ${
                            heroSlideIndex === index ? "landing-hero-cards-dot--active" : ""
                          }`}
                          onClick={() => scrollToHeroSlide(index)}
                          aria-label={item.title}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="hidden gap-4 md:grid lg:grid-cols-3">
            {copy.landing.sections.strip.slice(0, 3).map((item, index) => (
              <Surface key={item.title} className="landing-comparison-card p-5 sm:p-6">
                <span className="inline-flex h-6 w-6 items-center justify-center text-[color:var(--color-primary)]">
                  {index === 0 ? (
                    <HeroStethoscopeIcon />
                  ) : index === 1 ? (
                    <HeroBellRingIcon />
                  ) : index === 2 ? (
                    <HeroShieldCheckIcon />
                  ) : (
                    <HeroFamilyIcon />
                  )}
                </span>
                <h3 className="mt-3 text-[1.02rem] font-semibold leading-7 text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </Surface>
            ))}
          </section>

          <div className="landing-feature-carousel">
            <div className="mb-2 px-1 md:hidden">
              <h2 className="landing-feature-carousel-heading">Что умеет PillPath</h2>
            </div>
            <div
              ref={featureCarouselRef}
              className="landing-feature-carousel-track"
              style={
                featureSlideHeight
                  ? ({
                      ["--feature-slide-height" as string]: `${featureSlideHeight}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {(isFeatureMobile ? loopedFeatureSections : FEATURE_SECTION_IDS).map(
                (sectionId, loopIndex) => (
                  <section
                    key={`${sectionId}-${loopIndex}`}
                    data-feature-slide
                    data-virtual-index={loopIndex}
                    className={`landing-feature-slide landing-section-shell landing-section-shell--child overflow-hidden ${
                      featureVirtualIndex === loopIndex ? "landing-feature-slide--active" : ""
                    }`}
                  >
                    {renderFeatureSlide(sectionId)}
                  </section>
                )
              )}
            </div>
            <div className="landing-feature-carousel-dots md:hidden">
              {featureSlides.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`landing-feature-carousel-dot ${featureSlideIndex === index ? "landing-feature-carousel-dot--active" : ""}`}
                  onClick={() => scrollToFeatureSlide(index)}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          <section className="landing-section-shell landing-section-shell--child landing-faq-section overflow-hidden">
            <div className="px-0 py-4 sm:py-5">
              <div className="landing-child-hero-shell">
                <h2 className="landing-section-title">{copy.landing.sections.faq.title}</h2>

                <div className="landing-child-shell mt-6">
                  <div className="space-y-2.5 md:hidden">
                    {(showAllFaqMobile
                      ? copy.landing.sections.faq.items
                      : copy.landing.sections.faq.items.slice(0, MOBILE_FAQ_LIMIT)
                    ).map((item) => (
                      <details key={item.question} className="landing-faq-item-mobile">
                        <summary className="landing-faq-summary-mobile">{item.question}</summary>
                        <p className="landing-faq-answer-mobile">{item.answer}</p>
                      </details>
                    ))}
                    {copy.landing.sections.faq.items.length > MOBILE_FAQ_LIMIT ? (
                      <button
                        type="button"
                        className="landing-faq-more-button"
                        onClick={() => setShowAllFaqMobile((prev) => !prev)}
                      >
                        {showAllFaqMobile
                          ? copy.landing.sections.faq.showLess
                          : copy.landing.sections.faq.showMore}
                      </button>
                    ) : null}
                  </div>
                  <div className="hidden space-y-3 md:block">
                    {copy.landing.sections.faq.items.map((item) => (
                      <Surface
                        key={item.question}
                        className="landing-feature-card rounded-[1.4rem] px-4 py-3.5 sm:px-5 sm:py-4"
                      >
                        <h3 className="text-[1.02rem] font-semibold leading-7 text-foreground">
                          {item.question}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm leading-7 text-muted sm:text-base">{item.answer}</p>
                        </div>
                      </Surface>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-section-shell landing-section-shell--child overflow-hidden">
            <div className="px-0 py-4 sm:py-5">
              <div className="landing-child-hero-shell landing-child-hero-shell--cta">
                <h2 className="landing-section-title">{copy.landing.sections.finalCta.title}</h2>
                <p className="mt-4 max-w-[62rem] text-sm leading-7 text-muted sm:text-base">
                  {copy.landing.sections.finalCta.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/auth?mode=register"
                    className="landing-cta-button rounded-2xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--landing-cta-ring)]"
                  >
                    {copy.landing.sections.finalCta.primary}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function HeroStethoscopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" />
    </svg>
  );
}

function LandingMoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1rem] w-[1rem] fill-none stroke-current"
    >
      <path
        d="M14.5 3.5a7.9 7.9 0 1 0 6 13.05A8.7 8.7 0 0 1 14.5 3.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LandingSunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1rem] w-[1rem] fill-none stroke-current"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeroChildIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 10l.01 0" />
      <path d="M15 10l.01 0" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M12 3a2 2 0 0 0 0 4" />
    </svg>
  );
}

function HeroBellRingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
      <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" />
      <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" />
    </svg>
  );
}

function HeroAlarmIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5" />
      <path d="m5 3-2 2" />
      <path d="m19 3 2 2" />
    </svg>
  );
}

function HeroShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-4 8 4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeroCalendarClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="17" r="3" />
      <path d="M17 15.6V17l1 1" />
    </svg>
  );
}

function HeroFamilyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
