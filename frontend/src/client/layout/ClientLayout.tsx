import { useEffect, useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import { fetchPillboxPlans } from "@shared/api/pillboxPlans";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Layout } from "@shared/components/Layout";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useNow } from "@shared/hooks/useNow";
import {
  canViewAnyChildren,
  canViewCabinet,
  canViewPillbox,
} from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { PushPromptControlProvider } from "./PushPromptControlContext";
import { useClientLayoutBoot } from "./clientLayout/useClientLayoutBoot";
import { useClientLayoutPushPrompt } from "./clientLayout/useClientLayoutPushPrompt";
import { useClientLayoutSplash } from "./clientLayout/useClientLayoutSplash";
import { useClientLayoutWarmup } from "./clientLayout/useClientLayoutWarmup";
export function ClientLayout() {
  const { copy, language } = useI18n();
  const location = useLocation();
  const accountId = useAppStore((s) => s.accountId);
  const authToken = useAppStore((s) => s.authToken);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const isIosShell = useIsIosShell();
  const now = useNow(15_000);
  const navStaleTime = isIosShell ? 30_000 : 15_000;
  const navRefetchInterval = isIosShell ? 60_000 : 30_000;
  const canSeeChildren = canViewAnyChildren(accountFamilyRole, accountAccessPolicy);
  const canSeePillbox = canViewPillbox(accountFamilyRole, accountAccessPolicy);
  const canSeeCabinet = canViewCabinet(accountFamilyRole, accountAccessPolicy);
  const {
    data: families = [],
    isSuccess,
    isLoading: isFamiliesLoading,
  } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const {
    isDeferredBootReady,
    isDeferredShellWorkReady,
    isIosPushUiReady,
    isInteractiveDataReady,
    isFirstNativeLaunch,
    firstNativeLaunchStorageKey,
  } = useClientLayoutBoot({
    isIosShell,
    authToken,
    accountId,
  });

  const {
    data: navChildren = [],
  } = useQuery({
    queryKey: ["children", currentFamilyId, "nav-observations"],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: Boolean(currentFamilyId && isDeferredBootReady && canSeeChildren),
    staleTime: navStaleTime,
    refetchInterval: navRefetchInterval,
  });

  const activeEpisodeQueries = useQueries({
    queries: navChildren.map((child) => ({
      queryKey: ["illness-episode-active", child.id, "nav-observations"],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: Boolean(currentFamilyId && child.id && isDeferredBootReady && canSeeChildren),
      staleTime: navStaleTime,
      refetchInterval: navRefetchInterval,
    })),
  });

  const activeEpisodesCount = useMemo(
    () => activeEpisodeQueries.reduce((total, query) => total + (query.data ? 1 : 0), 0),
    [activeEpisodeQueries]
  );

  const { data: pillboxPlans = [] } = useQuery({
    queryKey: ["pillbox-plans", currentFamilyId, language, "nav-attention"],
    queryFn: fetchPillboxPlans,
    enabled: Boolean(currentFamilyId && isDeferredBootReady && canSeePillbox),
    staleTime: navStaleTime,
    refetchInterval: navRefetchInterval,
  });

  const { isWarmupReady } = useClientLayoutWarmup({
    authToken,
    accountId,
    language,
    currentFamilyId,
    navChildren,
    pillboxPlans,
    isDeferredBootReady,
    isIosShell,
  });

  useClientLayoutSplash({
    isIosShell,
    authToken,
    accountId,
    currentFamilyId,
    familiesCount: families.length,
    isFamiliesLoading,
    isFamiliesSuccess: isSuccess,
    isDeferredBootReady,
    isDeferredShellWorkReady,
    isFirstNativeLaunch,
    firstNativeLaunchStorageKey,
    isWarmupReady,
  });

  const pillboxAttention = useMemo(() => {
    const threshold = now + 60_000;
    const dueNowCount = pillboxPlans.filter((plan) => {
      if (plan.status !== "active" || !plan.nextMedicationId || !plan.nextDoseAt) {
        return false;
      }
      const nextDoseTime = new Date(plan.nextDoseAt).getTime();
      return Number.isFinite(nextDoseTime) && nextDoseTime <= threshold;
    }).length;
    if (dueNowCount > 0) {
      return { count: dueNowCount, tone: "info" as const };
    }
    const activePlansCount = pillboxPlans.filter((plan) => plan.status === "active").length;
    if (activePlansCount > 0) {
      return { count: activePlansCount, tone: "success" as const };
    }
    return { count: 0, tone: "info" as const };
  }, [now, pillboxPlans]);

  const mobileNavLabels =
    language === "ru"
      ? {
          observations: "Журнал",
          children: "Дети",
          pillbox: "Приёмы",
          cabinet: "Аптечка",
        }
      : {
          observations: "Tracking",
          children: "Kids",
          pillbox: "Meds",
          cabinet: "Cabinet",
        };

  const observationsNavItem = {
    to: "/illnesses/active",
    label: copy.clientLayout.nav.observations,
    mobileLabel: mobileNavLabels.observations,
    exactActivePaths: ["/illnesses/active"],
    attentionCount: activeEpisodesCount > 0 ? activeEpisodesCount : undefined,
    attentionTone: "info" as const,
  };
  const childrenNavItem = {
    to: "/children",
    label: copy.clientLayout.nav.children,
    mobileLabel: mobileNavLabels.children,
    exactActivePaths: ["/children", "/children/:childId"],
    activePaths: ["/children"],
  };
  const isObservationsRoute = observationsNavItem.exactActivePaths.some((path) =>
    matchPath({ path, end: true }, location.pathname)
  );
  const shouldShowObservationsTab = canSeeChildren && (activeEpisodesCount > 0 || isObservationsRoute);
  const baseDesktopNavLinks = [
    ...(shouldShowObservationsTab ? [observationsNavItem] : []),
    ...(canSeeChildren ? [childrenNavItem] : []),
    ...(canSeePillbox
      ? [
          {
            to: "/pillbox",
            label: copy.clientLayout.nav.pillbox,
            mobileLabel: mobileNavLabels.pillbox,
            exactActivePaths: ["/pillbox"],
            attentionCount: pillboxAttention.count > 0 ? pillboxAttention.count : undefined,
            attentionTone: pillboxAttention.tone,
          },
        ]
      : []),
    ...(canSeeCabinet
      ? [
          {
            to: "/medicine-cabinet",
            label: copy.clientLayout.nav.cabinet,
            mobileLabel: mobileNavLabels.cabinet,
          },
        ]
      : []),
  ];

  const desktopNavLinks = baseDesktopNavLinks;
  const mobileNavLinks = baseDesktopNavLinks;
  const mainMenuPathMatchers = [
    { path: "/", end: true },
    { path: "/start", end: true },
    { path: "/children", end: true },
    { path: "/pillbox", end: true },
    { path: "/medicine-cabinet", end: true },
    { path: "/workspace", end: true },
    { path: "/illnesses/active", end: true },
    { path: "/more", end: true },
    { path: "/settings", end: true },
    { path: "/feedback", end: true },
    { path: "/account", end: true },
    { path: "/family", end: true },
    { path: "/about", end: true },
    { path: "/legal", end: false },
  ] as const;
  const pillboxMode = new URLSearchParams(location.search).get("mode");
  const isPillboxInnerRoute =
    location.pathname === "/pillbox" &&
    ["setup", "medication", "details", "analytics"].includes(pillboxMode ?? "");
  const isLegalRoute = Boolean(matchPath({ path: "/legal", end: false }, location.pathname));
  const isFeedbackRoute = Boolean(matchPath({ path: "/feedback", end: true }, location.pathname));
  const isSettingsRoute = Boolean(matchPath({ path: "/settings", end: true }, location.pathname));
  const isAccountRoute = Boolean(matchPath({ path: "/account", end: true }, location.pathname));
  const isFamilyRoute = Boolean(matchPath({ path: "/family", end: true }, location.pathname));
  const shouldKeepMobileNav =
    isSettingsRoute || isFeedbackRoute || isAccountRoute || isFamilyRoute;
  const shouldHideHeader =
    isLegalRoute ||
    isFeedbackRoute ||
    isSettingsRoute ||
    isAccountRoute ||
    isFamilyRoute ||
    isPillboxInnerRoute ||
    !mainMenuPathMatchers.some((matcher) => matchPath(matcher, location.pathname));
  const isMedicineCabinetAddRoute = Boolean(
    matchPath({ path: "/medicine-cabinet/add", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/add/:mode", end: true }, location.pathname) ||
    matchPath({ path: "/medicine-cabinet/:medicineId/new-pack", end: true }, location.pathname)
  );
  const shouldHideMobileNav = Boolean(
    isLegalRoute ||
    (shouldHideHeader && !shouldKeepMobileNav) ||
    isMedicineCabinetAddRoute ||
    matchPath({ path: "/children/:childId/illness", end: false }, location.pathname)
  );
  const isCompactNestedChrome = shouldHideHeader || isMedicineCabinetAddRoute;
  const pushPrompt = useClientLayoutPushPrompt({
    authToken,
    accountId,
    isDeferredShellWorkReady,
    isIosPushUiReady,
    isInteractiveDataReady,
    copy,
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    const firstFamily = families[0] ?? null;
    if (!currentFamilyId) {
      if (firstFamily) {
        setCurrentFamily(firstFamily);
      }
      return;
    }
    const family = families.find((item) => item.id === currentFamilyId);
    if (!family) {
      setCurrentFamily(firstFamily);
      return;
    }
    if (family.name !== currentFamilyName) {
      setCurrentFamily(family);
    }
  }, [currentFamilyId, currentFamilyName, families, isSuccess, setCurrentFamily]);

  return (
    <>
      <PushPromptControlProvider
        value={{
          showNotificationBell: pushPrompt.shouldShowNotificationPrompt,
          isNotificationBellActive: pushPrompt.isNotificationBellActive,
          onNotificationBellClick: pushPrompt.shouldShowNotificationPrompt
            ? () => pushPrompt.setIsPushDialogOpen(true)
            : null,
        }}
      >
        <Layout
          navLinks={desktopNavLinks}
          mobileNavLinks={mobileNavLinks}
          mobileNavHidden={shouldHideMobileNav}
          hideHeader={isCompactNestedChrome}
          compactHiddenChrome={isCompactNestedChrome}
          showNotificationBell={pushPrompt.shouldShowNotificationPrompt}
          isNotificationBellActive={pushPrompt.isNotificationBellActive}
          onNotificationBellClick={
            pushPrompt.shouldShowNotificationPrompt ? () => pushPrompt.setIsPushDialogOpen(true) : null
          }
        >
          <Outlet />
        </Layout>
      </PushPromptControlProvider>
      <ConfirmDialog
        isOpen={pushPrompt.isPushDialogOpen && pushPrompt.shouldShowNotificationPrompt}
        title={
          pushPrompt.nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.nativeBlockedTitle
            : copy.clientLayout.pushPrompt.title
        }
        description={[
          pushPrompt.nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.nativeBlockedDescription
            : copy.clientLayout.pushPrompt.description,
          pushPrompt.pushPromptError,
          pushPrompt.pushPromptSuccess,
        ]
          .filter(Boolean)
          .join(" ")}
        confirmLabel={
          pushPrompt.nativePushIssue === "system"
            ? copy.clientLayout.pushPrompt.openSettings
            : pushPrompt.isPushPending
              ? copy.clientLayout.pushPrompt.enabling
              : copy.clientLayout.pushPrompt.enable
        }
        cancelLabel={copy.clientLayout.pushPrompt.hide}
        isPending={pushPrompt.isPushPending}
        onCancel={pushPrompt.handleHidePushPrompt}
        onConfirm={() => {
          if (pushPrompt.nativePushIssue === "system") {
            pushPrompt.openNativeNotificationSettings();
            pushPrompt.setIsPushDialogOpen(false);
            return;
          }
          void pushPrompt.handleEnablePush();
        }}
      />
    </>
  );
}
