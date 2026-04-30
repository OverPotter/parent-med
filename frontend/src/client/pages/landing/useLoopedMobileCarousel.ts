import { useEffect, useState, type RefObject } from "react";

type UseLoopedMobileCarouselParams = {
  trackRef: RefObject<HTMLDivElement | null>;
  itemCount: number;
  enabled: boolean;
  initialVirtualIndex?: number;
  snapDelayMs?: number;
};

function toRealCarouselIndex(virtualIndex: number, itemCount: number) {
  if (virtualIndex <= 0) return itemCount - 1;
  if (virtualIndex >= itemCount + 1) return 0;
  return virtualIndex - 1;
}

export function useLoopedMobileCarousel({
  trackRef,
  itemCount,
  enabled,
  initialVirtualIndex = 1,
  snapDelayMs = 120,
}: UseLoopedMobileCarouselParams) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [virtualIndex, setVirtualIndex] = useState(initialVirtualIndex);

  useEffect(() => {
    if (!enabled || itemCount === 0) {
      setActiveIndex(0);
      setVirtualIndex(initialVirtualIndex);
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    if (itemCount === 1) {
      setActiveIndex(0);
      setVirtualIndex(0);
      return;
    }

    let snapTimeoutId: number | null = null;

    const getSlideStep = () => Math.max(track.clientWidth, 1);

    const syncState = (nextVirtualIndex: number) => {
      setVirtualIndex(nextVirtualIndex);
      setActiveIndex(toRealCarouselIndex(nextVirtualIndex, itemCount));
    };

    const jumpWithoutAnimation = (targetVirtualIndex: number) => {
      const previousBehavior = track.style.scrollBehavior;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = getSlideStep() * targetVirtualIndex;
      track.style.scrollBehavior = previousBehavior;
      syncState(targetVirtualIndex);
    };

    const ensureInitialOffset = () => {
      const step = getSlideStep();
      if (track.scrollLeft < step * 0.5 || track.scrollLeft > step * (itemCount + 0.5)) {
        jumpWithoutAnimation(1);
      }
    };

    const markInteraction = () => {
      if (snapTimeoutId !== null) {
        window.clearTimeout(snapTimeoutId);
      }
    };

    const releaseInteraction = () => {
      if (snapTimeoutId !== null) {
        window.clearTimeout(snapTimeoutId);
      }

      snapTimeoutId = window.setTimeout(() => {
        const step = getSlideStep();
        const nearestVirtualIndex = Math.round(track.scrollLeft / step);

        if (nearestVirtualIndex <= 0) {
          jumpWithoutAnimation(itemCount);
          return;
        }

        if (nearestVirtualIndex >= itemCount + 1) {
          jumpWithoutAnimation(1);
          return;
        }

        track.scrollTo({ left: step * nearestVirtualIndex, behavior: "auto" });
        syncState(nearestVirtualIndex);
      }, snapDelayMs);
    };

    const handleScroll = () => {
      const nextVirtualIndex = Math.round(track.scrollLeft / getSlideStep());
      syncState(nextVirtualIndex);
    };

    ensureInitialOffset();

    track.addEventListener("scroll", handleScroll, { passive: true });
    track.addEventListener("touchstart", markInteraction, { passive: true });
    track.addEventListener("pointerdown", markInteraction, { passive: true });
    track.addEventListener("touchend", releaseInteraction, { passive: true });
    track.addEventListener("pointerup", releaseInteraction, { passive: true });
    track.addEventListener("pointercancel", releaseInteraction, { passive: true });
    window.addEventListener("touchend", releaseInteraction, { passive: true });
    window.addEventListener("pointerup", releaseInteraction, { passive: true });
    window.addEventListener("pointercancel", releaseInteraction, { passive: true });
    window.addEventListener("resize", ensureInitialOffset);
    window.addEventListener("orientationchange", ensureInitialOffset);

    return () => {
      if (snapTimeoutId !== null) {
        window.clearTimeout(snapTimeoutId);
      }

      track.removeEventListener("scroll", handleScroll);
      track.removeEventListener("touchstart", markInteraction);
      track.removeEventListener("pointerdown", markInteraction);
      track.removeEventListener("touchend", releaseInteraction);
      track.removeEventListener("pointerup", releaseInteraction);
      track.removeEventListener("pointercancel", releaseInteraction);
      window.removeEventListener("touchend", releaseInteraction);
      window.removeEventListener("pointerup", releaseInteraction);
      window.removeEventListener("pointercancel", releaseInteraction);
      window.removeEventListener("resize", ensureInitialOffset);
      window.removeEventListener("orientationchange", ensureInitialOffset);
    };
  }, [enabled, initialVirtualIndex, itemCount, snapDelayMs, trackRef]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    if (!enabled || itemCount <= 1) {
      setActiveIndex(index);
      setVirtualIndex(index);
      return;
    }

    const nextVirtualIndex = index + 1;
    track.scrollTo({ left: Math.max(track.clientWidth, 1) * nextVirtualIndex, behavior: "smooth" });
    setActiveIndex(index);
    setVirtualIndex(nextVirtualIndex);
  };

  return { activeIndex, virtualIndex, scrollToIndex };
}
