/**
 * Дети: создание, редактирование, удаление и переход к истории болезней.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchActiveFeedingRecordByChildId } from "@shared/api/feedingRecords";
import { fetchActiveSleepSessionByChildId } from "@shared/api/sleepSessions";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { hasNetworkUnavailableError } from "@shared/api/network";
import { ModuleOfflineState } from "@shared/components/ModuleOfflineState";
import { PageIntro } from "@shared/components/PageIntro";
import { PlusBadge } from "@shared/components/PlusBadge";
import { EmptyState, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useIsOffline } from "@shared/hooks/useIsOffline";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { hasLiveActivityAccess } from "@shared/utils/liveActivityAccess";
import {
  canActChild as canActChildAccess,
  canEditChild as canEditChildAccess,
  canManageChildrenList,
  canViewAnyChildren,
} from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import {
  hasReachedChildLimit,
  isDowngradedChildrenState,
} from "@shared/subscription/childPlanAccess";
import type { Child } from "@shared/types/api";
import { getChildrenCopy } from "@client/i18n/children";
import { SubscriptionUpgradeDialog } from "@client/subscription/SubscriptionUpgradeDialog";
import { useSubscriptionUpgradeDialogState } from "@client/subscription/useSubscriptionUpgradeDialogState";
import { useUpgradeDialogOpenState } from "@client/subscription/useUpgradeDialogOpenState";
import { ChildrenCardsList } from "./children/ChildrenCardsList";
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
  const accountId = useAppStore((s) => s.accountId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useIsDesktop();
  const isIosShell = useIsIosShell();
  const isOffline = useIsOffline();
  const [feedingDialog, setFeedingDialog] = useState<FeedingDialogState | null>(null);
  const { isUpgradeDialogOpen, setIsUpgradeDialogOpen, openUpgradeDialog } =
    useUpgradeDialogOpenState();
  const isChildrenAuxReady = true;
  const liveStatusQueryOptions = useLiveQueryOptions(isIosShell ? 30000 : 15000);
  const activeCareStatusQueryOptions = useLiveQueryOptions(5000);
  const illnessStatusQueryOptions = useLiveQueryOptions(5000);
  const stableIosChildrenListQueryOptions = isIosShell
    ? {
        refetchOnMount: false as const,
        refetchOnWindowFocus: false as const,
      }
    : {};
  const canSeeChildren = canViewAnyChildren(accountFamilyRole, accountAccessPolicy);
  const canCreateChild = canManageChildrenList(accountFamilyRole, accountAccessPolicy);
  const liveTargetChildId = searchParams.get("liveChild")?.trim() ?? "";
  const liveTargetAction =
    searchParams.get("liveAction") === "sleep"
      ? "sleep"
      : searchParams.get("liveAction") === "feeding"
        ? "feeding"
        : null;

  const {
    data: children = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId && canSeeChildren,
    ...liveStatusQueryOptions,
    ...stableIosChildrenListQueryOptions,
  });
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    ...familyAccessQueryOptions,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const showOfflineState = isOffline || hasNetworkUnavailableError([error]);
  const {
    upgradeToPlus,
    restorePurchases,
    isUpgradePending,
    upgradeErrorMessage,
    clearUpgradeError,
    restoreSuccessMessage,
  } = useSubscriptionUpgradeDialogState({
    language,
    accountId,
    currentFamilyId,
    canManageSubscription,
    subscriptionStatus: familyAccess?.subscriptionStatus ?? "inactive",
  });
  const childLimitReached =
    hasReachedChildLimit(familyAccess) ||
    (familyAccess?.maxChildren !== null && familyAccess?.maxChildren !== undefined
      ? children.length >= familyAccess.maxChildren
      : false);

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id && isChildrenAuxReady,
      ...illnessStatusQueryOptions,
    })),
  });

  const latestWeightQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["weight-entry-latest", child.id],
      queryFn: () => fetchLatestWeightEntryByChildId(child.id),
      enabled: !!child.id && isChildrenAuxReady,
      staleTime: 60_000,
      refetchOnMount: (isIosShell ? false : "always") as false | "always",
      refetchOnWindowFocus: isIosShell ? false : true,
      refetchOnReconnect: true,
    })),
  });

  const activeSleepQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["sleep-session-active", child.id],
      queryFn: () => fetchActiveSleepSessionByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled && isChildrenAuxReady,
      ...activeCareStatusQueryOptions,
    })),
  });

  const activeFeedingQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["feeding-record-active", child.id],
      queryFn: () => fetchActiveFeedingRecordByChildId(child.id),
      enabled: !!child.id && child.babyModeEnabled && isChildrenAuxReady,
      ...activeCareStatusQueryOptions,
    })),
  });

  useEffect(() => {
    if (!liveTargetChildId || children.length === 0) {
      return;
    }

    const selector = liveTargetAction
      ? `[data-live-action-target="${liveTargetAction}:${liveTargetChildId}"]`
      : `[data-child-card-id="${liveTargetChildId}"]`;

    let frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector(selector);
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      target.focus?.({ preventScroll: true });

      const next = new URLSearchParams(searchParams);
      next.delete("liveChild");
      next.delete("liveAction");
      setSearchParams(next, { replace: true });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [children.length, liveTargetAction, liveTargetChildId, searchParams, setSearchParams]);

  if (!currentFamilyId) {
    return (
      <div>
        <h1 className="app-title">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </div>
    );
  }

  if (!canSeeChildren) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={copy.title}
          subtitle={copy.subtitle}
          compactOnMobile
          hideOnMobile
          className="children-intro-hero"
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
            <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
          </div>
        </div>
        <EmptyState className="text-foreground">
          <div className="space-y-3">
            <p className="app-card-title">{copy.noAccessTitle}</p>
            <p className="text-sm leading-6 text-muted">{copy.noAccessDescription}</p>
          </div>
        </EmptyState>
      </div>
    );
  }

  if (showOfflineState) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={copy.title}
          subtitle={copy.subtitle}
          compactOnMobile
          hideOnMobile
          className="children-intro-hero"
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
            <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
          </div>
        </div>
        <ModuleOfflineState language={language} />
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
            onClick={() => {
              if (childLimitReached) {
                openUpgradeDialog();
                return;
              }
              navigate("/children/new");
            }}
            className={[
              childActionPrimaryClass,
              "w-full sm:w-auto",
              children.length > 0 ? "hidden sm:inline-flex" : "inline-flex",
              !canCreateChild ? "hidden" : "",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2">
              <span>{copy.addChild}</span>
              {childLimitReached ? <PlusBadge /> : null}
            </span>
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
          canUseLiveActivities={hasLiveActivityAccess(familyAccess)}
          onClose={() => setFeedingDialog(null)}
        />
      ) : null}
      <SubscriptionUpgradeDialog
        isOpen={isUpgradeDialogOpen}
        setIsOpen={setIsUpgradeDialogOpen}
        language={language}
        entryPoint="second_child"
        canManageSubscription={canManageSubscription}
        subscriptionStatus={familyAccess?.subscriptionStatus ?? "inactive"}
        isUpgradePending={isUpgradePending}
        upgradeErrorMessage={upgradeErrorMessage}
        restoreSuccessMessage={restoreSuccessMessage}
        clearUpgradeError={clearUpgradeError}
        upgradeToPlus={upgradeToPlus}
        restorePurchases={restorePurchases}
      />

      {isLoading && <p className="text-muted">{common.loading}</p>}
      {error && !showOfflineState && (
        <p className="soft-note-danger">
          {(error as { message?: string }).message ?? copy.loadError}
        </p>
      )}
      {!isLoading && !error && children.length === 0 && (
        <EmptyState className="text-foreground">
          <div className="space-y-4">
            <p>{canCreateChild ? copy.empty : copy.emptyMemberHint}</p>
            {canCreateChild ? (
              <button
                type="button"
                onClick={() => {
                  if (childLimitReached) {
                    openUpgradeDialog();
                    return;
                  }
                  navigate("/children/new");
                }}
                className={`${childActionPrimaryClass} w-full sm:w-auto`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{copy.addFirstChild}</span>
                  {childLimitReached ? <PlusBadge /> : null}
                </span>
              </button>
            ) : null}
          </div>
        </EmptyState>
      )}

      {children.length > 0 && (
        <>
          {isDowngradedChildrenState(familyAccess) ? (
            <Surface className="soft-panel-muted p-4">
              <div className="space-y-2">
                <p className="app-card-title">{copy.downgradedNoticeTitle}</p>
                <p className="text-sm leading-6 text-muted">{copy.downgradedNoticeDescription}</p>
              </div>
            </Surface>
          ) : null}
          <ChildrenCardsList
            children={children}
            activeEpisodes={activeEpisodeQueries.map((query) => query.data ?? null)}
            latestWeights={latestWeightQueries.map((query) => query.data ?? null)}
            activeSleeps={activeSleepQueries.map((query) => query.data ?? null)}
            activeFeedings={activeFeedingQueries.map((query) => query.data ?? null)}
            familyAccess={familyAccess}
            accountId={accountId}
            language={language}
            t={t}
            canActChild={(childId) =>
              canActChildAccess(childId, accountFamilyRole, accountAccessPolicy)
            }
            canEditChild={(childId) =>
              canEditChildAccess(childId, accountFamilyRole, accountAccessPolicy)
            }
            onAddFeeding={(child) => {
              const canAct = canActChildAccess(child.id, accountFamilyRole, accountAccessPolicy);
              if (!canAct) {
                return;
              }
              if (isDesktop) {
                setFeedingDialog({ child });
                return;
              }
              navigate(`/children/${child.id}/feeding/new`);
            }}
            onStartEpisode={(child, activeEpisode) => {
              if (activeEpisode) {
                navigate(`/children/${child.id}/illness`);
                return;
              }
              if (!canEditChildAccess(child.id, accountFamilyRole, accountAccessPolicy)) {
                return;
              }
              navigate(`/children/${child.id}/illness?mode=create`);
            }}
            onLockedActionAttempt={openUpgradeDialog}
          />

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
                onClick={() => {
                  if (childLimitReached) {
                    openUpgradeDialog();
                    return;
                  }
                  navigate("/children/new");
                }}
                className={childActionSecondaryClass}
                hidden={!canCreateChild}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{copy.addButtonShort}</span>
                  {childLimitReached ? <PlusBadge /> : null}
                </span>
              </button>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}
