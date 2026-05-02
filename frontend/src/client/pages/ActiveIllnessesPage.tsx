/**
 * Активные наблюдения: текущие эпизоды по всем детям семьи.
 */

import { useEffect } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchAdministrationEventsByEpisodeId } from "@shared/api/administrationEvents";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, Surface } from "@shared/components/Surface";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { canViewCabinet } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { hasLiveActivityAccess } from "@shared/utils/liveActivityAccess";
import { getChildrenCopy } from "@client/i18n/children";
import { useIllnessLiveObservationToggle } from "@client/hooks/useIllnessLiveObservationToggle";
import { ActiveIllnessCard } from "./active-illnesses/ActiveIllnessCard";

export function ActiveIllnessesPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).activeIllnesses;
  const common = getChildrenCopy(language).common;
  const pageTitle = language === "ru" ? "Журнал" : "Health";
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountId = useAppStore((s) => s.accountId);
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const now = useNow(isIosShell ? 30_000 : 15_000);
  const currentTime = new Date(now);
  const liveQueryOptions = useLiveQueryOptions(isIosShell ? 8_000 : 5_000);
  const canSeeCabinet = canViewCabinet(accountFamilyRole, accountAccessPolicy);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });
  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId && canSeeCabinet,
    ...liveQueryOptions,
  });
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    ...familyAccessQueryOptions,
  });
  const canUseLiveActivities = hasLiveActivityAccess(familyAccess);
  const liveObservationToggle = useIllnessLiveObservationToggle({
    accountId,
    navigateOnSuccess: false,
  });

  const episodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });
  const isActiveEpisodesLoading =
    children.length > 0 && episodeQueries.some((query) => query.isLoading || query.isPending);
  const activeChildren = children
    .map((child, index) => ({
      child,
      episode:
        (episodeQueries[index]?.data ?? []).find((episode) => episode.status === "active") ?? null,
    }))
    .filter((item) => item.episode);

  const medicationPlanQueries = useQueries({
    queries: activeChildren.map(({ episode }) => ({
      queryKey: ["episode-medication-plans", episode!.id],
      queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode!.id),
      enabled: !!episode?.id,
      ...liveQueryOptions,
    })),
  });
  const administrationQueries = useQueries({
    queries: activeChildren.map(({ episode }) => ({
      queryKey: ["administration-events", episode!.id],
      queryFn: () => fetchAdministrationEventsByEpisodeId(episode!.id),
      enabled: !!episode?.id,
      ...liveQueryOptions,
    })),
  });

  useEffect(() => {
    if (isLoading || isActiveEpisodesLoading || activeChildren.length > 0) {
      return;
    }

    navigate("/children", { replace: true });
  }, [activeChildren.length, isActiveEpisodesLoading, isLoading, navigate]);

  if (!currentFamilyId) {
    return (
      <Surface className="p-5">
        <h1 className="app-title text-[1.9rem] sm:text-[2.2rem]">{pageTitle}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </Surface>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro title={pageTitle} subtitle={copy.subtitle} compactOnMobile hideOnMobile />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{pageTitle}</h1>
          <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
        </div>
      </div>

      {(isLoading || isActiveEpisodesLoading) && <p className="text-muted">{common.loading}</p>}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length === 0 ? (
        <EmptyState>
          <div className="space-y-2">
            <p>{copy.empty}</p>
            <p>
              {language === "ru"
                ? "Откройте раздел «Дети», чтобы начать новое наблюдение."
                : "Open the Children section to start a new tracking session."}
            </p>
          </div>
        </EmptyState>
      ) : null}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length > 0 ? (
        <ul className="grid gap-3">
          {activeChildren.map(({ child, episode }, index) => (
            <ActiveIllnessCard
              key={child.id}
              child={child}
              episode={episode!}
              medicines={householdMedicines}
              plans={medicationPlanQueries[index]?.data ?? []}
              administrations={administrationQueries[index]?.data ?? []}
              now={currentTime}
              accountId={accountId}
              canUseLiveActivities={canUseLiveActivities}
              isTogglingLiveObservation={liveObservationToggle.isTogglingEpisode(episode!.id)}
              onToggleLiveObservation={() => liveObservationToggle.toggleLiveObservation(episode!)}
              copy={copy}
              t={t}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
