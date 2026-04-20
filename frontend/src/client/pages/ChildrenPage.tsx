/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchActiveFeedingRecordByChildId } from "@shared/api/feedingRecords";
import { fetchActiveSleepSessionByChildId } from "@shared/api/sleepSessions";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child } from "@shared/types/api";
import { getChildrenCopy } from "@client/i18n/children";
import { ChildCard } from "./children/ChildCard";
import { FeedingRecordDialog } from "./children/FeedingDialogs";
import { childActionPrimaryClass, childActionSecondaryClass } from "./children/shared";

type FeedingDialogState = {
  child: Child;
};

export function ChildrenPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).childrenPage;
  const common = getChildrenCopy(language).common;
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isIosShell = useIsIosShell();
  const [feedingDialog, setFeedingDialog] = useState<FeedingDialogState | null>(null);
  const [isChildrenAuxReady, setIsChildrenAuxReady] = useState(!isIosShell);
  const liveQueryOptions = useLiveQueryOptions(isIosShell ? 20000 : 10000);

  useEffect(() => {
    if (!isIosShell) {
      setIsChildrenAuxReady(true);
      return;
    }

    setIsChildrenAuxReady(false);
    let timeoutId: number | null = null;
    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setIsChildrenAuxReady(true);
      }, 700);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isIosShell, currentFamilyId]);

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id && isChildrenAuxReady,
      ...liveQueryOptions,
    })),
  });

  const latestWeightQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["weight-entry-latest", child.id],
      queryFn: () => fetchLatestWeightEntryByChildId(child.id),
      enabled: !!child.id && isChildrenAuxReady,
      ...liveQueryOptions,
    })),
  });

  const activeSleepQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["sleep-session-active", child.id],
      queryFn: () => fetchActiveSleepSessionByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled && isChildrenAuxReady,
      ...liveQueryOptions,
    })),
  });

  const activeFeedingQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["feeding-record-active", child.id],
      queryFn: () => fetchActiveFeedingRecordByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled && isChildrenAuxReady,
      ...liveQueryOptions,
    })),
  });

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="app-title">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        compactOnMobile
        hideOnMobile
        className="children-intro-hero"
        action={
          <button
            type="button"
            onClick={() => navigate("/children/new")}
            className={[
              childActionPrimaryClass,
              "w-full sm:w-auto",
              children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
            ].join(" ")}
          >
            {copy.addChild}
          </button>
        }
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
          <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
        </div>
      </div>

      {feedingDialog ? (
        <FeedingRecordDialog
          child={feedingDialog.child}
          copy={copy.childCard}
          language={language}
          onClose={() => setFeedingDialog(null)}
        />
      ) : null}

      {isLoading && <p className="text-muted">{common.loading}</p>}
      {error && (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? copy.loadError}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>{copy.empty}</p>
            <button
              type="button"
              onClick={() => navigate("/children/new")}
              className={`${childActionPrimaryClass} w-full sm:w-auto`}
            >
              {copy.addFirstChild}
            </button>
          </div>
        </EmptyState>
      )}

      {children.length > 0 && (
        <>
          <ul className="grid gap-4">
            {children.map((child, index) => {
              const activeEpisode = activeEpisodeQueries[index]?.data ?? null;

              return (
                <ChildCard
                  key={child.id}
                  child={child}
                  activeEpisodeStartedAt={activeEpisode?.startedAt ?? null}
                  latestWeightEntry={latestWeightQueries[index]?.data ?? null}
                  activeSleep={activeSleepQueries[index]?.data ?? null}
                  activeFeeding={activeFeedingQueries[index]?.data ?? null}
                  onAddFeeding={() => {
                    if (isDesktop) {
                      setFeedingDialog({ child });
                      return;
                    }
                    navigate(`/children/${child.id}/feeding/new`);
                  }}
                  onStartEpisode={() => {
                    if (activeEpisode) {
                      navigate("/illnesses/active");
                      return;
                    }
                    navigate(`/children/${child.id}/illness?mode=create`);
                  }}
                  isStartingEpisode={false}
                  hasActiveEpisode={!!activeEpisode}
                  copy={copy}
                  language={language}
                  t={t}
                />
              );
            })}
          </ul>

          <Surface className="soft-panel-muted p-4 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-card-title">{copy.addAnotherPromptTitle}</p>
                {copy.addAnotherPromptText ? (
                  <p className="mt-1 text-sm text-muted">{copy.addAnotherPromptText}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => navigate("/children/new")}
                className={childActionSecondaryClass}
              >
                {copy.addButtonShort}
              </button>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}
