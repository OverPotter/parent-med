import type {
  Child,
  FamilySubscriptionAccess,
  FeedingRecord,
  IllnessEpisode,
  SleepSession,
  WeightEntry,
} from "@shared/types/api";
import { hasLiveActivityAccess } from "@shared/utils/liveActivityAccess";
import {
  isChildLockedByPlan,
  isDowngradedChildrenState,
} from "@shared/subscription/childPlanAccess";
import { getChildrenCopy } from "@client/i18n/children";
import { ChildCard } from "./ChildCard";

export function ChildrenCardsList({
  children,
  activeEpisodes,
  latestWeights,
  activeSleeps,
  activeFeedings,
  familyAccess,
  accountId,
  language,
  t,
  canActChild,
  canEditChild,
  onAddFeeding,
  onStartEpisode,
  onLockedActionAttempt,
}: {
  children: Child[];
  activeEpisodes: Array<IllnessEpisode | null>;
  latestWeights: Array<WeightEntry | null>;
  activeSleeps: Array<SleepSession | null>;
  activeFeedings: Array<FeedingRecord | null>;
  familyAccess: FamilySubscriptionAccess | null | undefined;
  accountId: string | null;
  language: "ru" | "en";
  t: (text: string, variables?: Record<string, string | number>) => string;
  canActChild: (childId: string) => boolean;
  canEditChild: (childId: string) => boolean;
  onAddFeeding: (child: Child) => void;
  onStartEpisode: (child: Child, activeEpisode: IllnessEpisode | null) => void;
  onLockedActionAttempt: () => void;
}) {
  const copy = getChildrenCopy(language).childrenPage;

  return (
    <ul className="grid gap-4">
      {children.map((child, index) => {
        const activeEpisode = activeEpisodes[index] ?? null;
        const canAct = canActChild(child.id);
        const canEdit = canEditChild(child.id);
        const planLocksChildActions = isChildLockedByPlan(child.id, familyAccess);
        const isPrimaryFreeChild =
          isDowngradedChildrenState(familyAccess) && familyAccess?.freePrimaryChildId === child.id;

        return (
          <ChildCard
            key={child.id}
            child={child}
            activeEpisode={activeEpisode}
            activeEpisodeStartedAt={activeEpisode?.startedAt ?? null}
            latestWeightEntry={latestWeights[index] ?? null}
            activeSleep={activeSleeps[index] ?? null}
            activeFeeding={activeFeedings[index] ?? null}
            onAddFeeding={() => onAddFeeding(child)}
            onStartEpisode={() => onStartEpisode(child, activeEpisode)}
            isStartingEpisode={false}
            hasActiveEpisode={Boolean(activeEpisode)}
            canActChild={canAct}
            canEditChild={canEdit}
            canUseLiveActivities={hasLiveActivityAccess(familyAccess)}
            planLocksChildActions={planLocksChildActions}
            isPrimaryFreeChild={Boolean(isPrimaryFreeChild)}
            onLockedActionAttempt={onLockedActionAttempt}
            currentAccountId={accountId}
            copy={copy}
            language={language}
            t={t}
          />
        );
      })}
    </ul>
  );
}
