import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchMyFamilyAccess } from "@shared/api/families";
import { fetchLatestHeightEntryByChildId } from "@shared/api/heightEntries";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { Surface } from "@shared/components/Surface";
import { PlusBadge } from "@shared/components/PlusBadge";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { canEditChild, canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { isChildLockedByPlan } from "@shared/subscription/childPlanAccess";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import { resolveChildExportGateState } from "@client/pages/children/childExportAccess";
import { ChildExportDialog } from "@client/pages/children/ChildExportDialog";
import { UpgradeDialog } from "@client/subscription/UpgradeDialog";
import { useSubscriptionUpgrade } from "@client/subscription/useSubscriptionUpgrade";
import { formatChildDatePlain } from "@client/utils/childDateFormat";
import { useRef, useState } from "react";

export function ChildProfilePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [upgradeEntryPoint, setUpgradeEntryPoint] = useState<"child_actions_locked" | "csv_export">(
    "child_actions_locked"
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const canViewProfile = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);
  const { data: familyAccess, isLoading: isFamilyAccessLoading } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    staleTime: 60 * 1000,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const { upgradeToPlus, restorePurchases, isUpgradePending, upgradeErrorMessage, clearUpgradeError } =
    useSubscriptionUpgrade(accountId, currentFamilyId, canManageSubscription);

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewProfile,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId && canViewProfile,
  });

  const { data: latestHeight = null } = useQuery({
    queryKey: ["height-entry-latest", childId],
    queryFn: () => fetchLatestHeightEntryByChildId(childId!),
    enabled: !!childId && canViewProfile,
  });

  if (!childId || !canViewProfile) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{copy.loading}</p>;
  }

  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const babyModeLabel = child.babyModeEnabled ? copy.babyModeEnabled : copy.babyModeDisabled;
  const canEditProfile = canEditChild(child.id, accountFamilyRole, accountAccessPolicy);
  const planLocksChildActions = isChildLockedByPlan(child.id, familyAccess);
  const exportGateState = resolveChildExportGateState({
    familyAccess,
    isLoading: isFamilyAccessLoading,
  });
  const canExportCsv = exportGateState === "allowed";
  const profileNavActionClass = "soft-pill app-profile-action";
  const quickLinks = [
    {
      to: `/children/${child.id}/illness?view=history`,
      label: copy.history,
      locked: false,
    },
    ...(child.babyModeEnabled
      ? [
          {
            to: `/children/${child.id}/feeding`,
            label: copy.feedingSection,
            locked: planLocksChildActions,
          },
          {
            to: `/children/${child.id}/sleep`,
            label: copy.sleepSection,
            locked: planLocksChildActions,
          },
        ]
      : []),
    { to: `/children/${child.id}/weight`, label: copy.weightCardTitle, locked: false },
    { to: `/children/${child.id}/height`, label: copy.heightCardTitle, locked: false },
    { to: `/children/${child.id}/calendar`, label: copy.calendar, locked: false },
  ];

  return (
    <div ref={rootRef} className="child-profile-shell min-h-[100dvh] space-y-6">
      <IosEdgeBackGesture
        isEnabled={isIosShell}
        onBack={() => navigate("/children", { replace: true })}
        targetRef={rootRef}
      />
      <ChildSectionTopBar
        onBack={() => navigate("/children", { replace: true })}
        backLabel={language === "ru" ? "← К детям" : "← Back to children"}
        title={`${copy.eyebrow} · ${child.name}`}
        hint={copy.subtitle}
        action={
          <div className="flex min-w-[11rem] flex-col gap-2">
            {canEditProfile ? (
              planLocksChildActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeEntryPoint("child_actions_locked");
                    setIsUpgradeDialogOpen(true);
                  }}
                  className={`${profileNavActionClass} min-h-[2.4rem] shrink-0`}
                >
                  {copy.editProfile}
                </button>
              ) : (
                <Link
                  to={`/children/${child.id}/edit`}
                  className={`${profileNavActionClass} min-h-[2.4rem] shrink-0`}
                >
                  {copy.editProfile}
                </Link>
              )
            ) : null}
          </div>
        }
      />
      <UpgradeDialog
        isOpen={isUpgradeDialogOpen}
        language={language}
        entryPoint={upgradeEntryPoint}
        onRequestOpen={() => {
          setIsUpgradeDialogOpen(true);
        }}
        isPending={isUpgradePending}
        canUpgrade={canManageSubscription}
        errorMessage={upgradeErrorMessage}
        onClose={() => {
          clearUpgradeError();
          setIsUpgradeDialogOpen(false);
        }}
        onUpgrade={(preferredPackageIdentifier) => upgradeToPlus(preferredPackageIdentifier)}
        onRestorePurchases={() => {
          void restorePurchases();
        }}
      />
      <ChildExportDialog
        isOpen={isExportDialogOpen}
        childId={child.id}
        childName={child.name}
        language={language}
        onClose={() => setIsExportDialogOpen(false)}
      />

      <div className="mx-auto w-full max-w-2xl space-y-3 pt-2">
        <Surface className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {quickLinks.map((item) =>
              item.locked ? (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    setUpgradeEntryPoint("child_actions_locked");
                    setIsUpgradeDialogOpen(true);
                  }}
                  className={`${profileNavActionClass} min-h-[2.6rem]`}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${profileNavActionClass} min-h-[2.6rem]`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </Surface>
      </div>

      <Surface className="mx-auto w-full max-w-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3 px-1">
          <h2 className="app-card-title">{copy.basic}</h2>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <BasicMetricPill
            label={copy.babyMode}
            value={babyModeLabel}
            tone={child.babyModeEnabled ? "bg-teal-500" : "bg-slate-400"}
          />
          <BasicMetricPill label={copy.age} value={ageLabel ?? copy.ageMissing} tone="bg-sky-500" />
          <BasicMetricPill
            label={copy.birthDate}
            value={
              child.birthDate
                ? formatChildDatePlain(child.birthDate, language, { forceYear: true })
                : copy.birthDateMissing
            }
            tone="bg-violet-500"
          />
          <BasicMetricPill
            label={copy.latestWeight}
            value={
              latestWeight
                ? formatWeightValue(latestWeight.valueKg, language)
                : copy.latestWeightMissing
            }
            tone="bg-emerald-500"
          />
          <BasicMetricPill
            label={copy.latestHeight}
            value={
              latestHeight
                ? formatHeightValue(latestHeight.valueCm, language)
                : copy.latestHeightMissing
            }
            tone="bg-lime-500"
          />
        </div>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {child.allergies && <InfoLine label={copy.allergies} value={child.allergies} />}
          {child.notes && <InfoLine label={copy.notes} value={child.notes} fullWidth />}
          {hasExtraContacts(child) && (
            <details className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)] sm:col-span-2">
              <summary className="cursor-pointer list-none text-sm font-extrabold tracking-[-0.02em] text-foreground">
                {copy.contactsSummary}
              </summary>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {child.institutionName && (
                  <InfoLine label={copy.institution} value={child.institutionName} />
                )}
                {child.institutionPhone && (
                  <InfoLine label={copy.institutionPhone} value={child.institutionPhone} />
                )}
                {child.doctorName && <InfoLine label={copy.doctor} value={child.doctorName} />}
                {child.doctorPhone && (
                  <InfoLine label={copy.doctorPhone} value={child.doctorPhone} />
                )}
              </div>
            </details>
          )}
          {!hasProfileDetails(child, latestWeight, latestHeight) && (
            <div className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-4 sm:col-span-2">
              <p className="text-sm text-muted">{copy.noExtra}</p>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={exportGateState === "loading"}
            onClick={() => {
              if (exportGateState === "loading") {
                return;
              }
              if (canExportCsv) {
                setIsExportDialogOpen(true);
                return;
              }
              setUpgradeEntryPoint("csv_export");
              setIsUpgradeDialogOpen(true);
            }}
            className={`${profileNavActionClass} inline-flex min-h-[2.4rem] shrink-0 items-center gap-2`}
          >
            <span>{copy.exportData}</span>
            {exportGateState === "locked" ? (
              <PlusBadge className="min-w-[3rem] px-2.5 py-0.5 text-[0.68rem]" />
            ) : null}
          </button>
        </div>
      </Surface>
    </div>
  );
}

function hasProfileDetails(
  child: {
    birthDate: string | null;
    institutionName: string | null;
    institutionPhone: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    allergies: string | null;
    notes: string | null;
  },
  latestWeight: { valueKg: number } | null,
  latestHeight: { valueCm: number } | null
) {
  return Boolean(
    child.birthDate ||
    child.institutionName ||
    child.institutionPhone ||
    child.doctorName ||
    child.doctorPhone ||
    child.allergies ||
    child.notes ||
    latestWeight ||
    latestHeight
  );
}

function hasExtraContacts(child: {
  institutionName: string | null;
  institutionPhone: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
}) {
  return Boolean(
    child.institutionName || child.institutionPhone || child.doctorName || child.doctorPhone
  );
}

function formatWeightValue(valueKg: number, language: "ru" | "en"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
}

function formatHeightValue(valueCm: number, language: "ru" | "en"): string {
  const unit = language === "ru" ? "см" : "cm";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueCm % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueCm)} ${unit}`;
}

function InfoLine({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)] ${
        fullWidth ? "sm:col-span-2 xl:col-span-3" : ""
      }`}
    >
      <p className="soft-field-label">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-base font-medium leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function BasicMetricPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex min-h-[3.15rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[0.68rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
          {value}
        </span>
      </span>
    </div>
  );
}
