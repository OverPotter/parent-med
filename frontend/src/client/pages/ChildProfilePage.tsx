import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchLatestHeightEntryByChildId } from "@shared/api/heightEntries";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { formatDate } from "@shared/utils/date";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5";

export function ChildProfilePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
  const common = getChildrenCopy(language).common;
  const { childId } = useParams<{ childId: string }>();

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  const { data: latestHeight = null } = useQuery({
    queryKey: ["height-entry-latest", childId],
    queryFn: () => fetchLatestHeightEntryByChildId(childId!),
    enabled: !!childId,
  });

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{common.loading}</p>;
  }

  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const babyModeLabel = child.babyModeEnabled ? copy.babyModeEnabled : copy.babyModeDisabled;
  const primaryActionClass =
    `${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`;
  const secondaryActionClass =
    "soft-panel-muted inline-flex min-h-[2.9rem] w-full items-center justify-center rounded-[22px] border border-white/60 px-4 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(89,60,154,0.08)] transition hover:border-primary/30 hover:text-primary";

  return (
    <div className="min-w-0 space-y-6">
      <div className="px-1">
        <Link to="/children" className="inline-flex text-sm text-primary hover:underline">
          {language === "ru" ? "← К детям" : "← Back to children"}
        </Link>
      </div>

      <PageIntro
        title={child.name}
        hideOnMobile
        action={
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                to={`/children/${child.id}/illness?view=history`}
                className={primaryActionClass}
              >
                {copy.history}
              </Link>
              {child.babyModeEnabled ? (
                <Link to={`/children/${child.id}/feeding`} className={primaryActionClass}>
                  {copy.feedingSectionOpen}
                </Link>
              ) : null}
              {child.babyModeEnabled ? (
                <Link to={`/children/${child.id}/sleep`} className={primaryActionClass}>
                  {copy.sleepSectionOpen}
                </Link>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-white/65 bg-white/55 px-3 py-3 shadow-[0_18px_38px_rgba(89,60,154,0.08)] backdrop-blur-md">
              <div className="mb-3 h-px w-full rounded-full bg-[linear-gradient(90deg,rgba(127,86,217,0.02),rgba(127,86,217,0.18),rgba(127,86,217,0.02))]" />
              <div className="grid w-full grid-cols-3 gap-2">
                <Link to={`/children/${child.id}/weight`} className={secondaryActionClass}>
                  {copy.weightCardTitle}
                </Link>
                <Link to={`/children/${child.id}/height`} className={secondaryActionClass}>
                  {copy.heightCardTitle}
                </Link>
                <Link to={`/children/${child.id}/calendar`} className={secondaryActionClass}>
                  {copy.calendar}
                </Link>
              </div>
            </div>
          </div>
        }
      />

      <div className="md:hidden">
        <Surface className="p-4">
          <h1 className="app-title mb-3 text-[1.42rem] tracking-[-0.04em]">{child.name}</h1>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to={`/children/${child.id}/illness?view=history`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full text-center sm:min-h-[3.05rem]`}
            >
              {copy.history}
            </Link>
            {child.babyModeEnabled ? (
              <Link
                to={`/children/${child.id}/feeding`}
                className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full sm:min-h-[3.05rem]`}
              >
                {copy.feedingSectionOpen}
              </Link>
            ) : null}
            {child.babyModeEnabled ? (
              <Link
                to={`/children/${child.id}/sleep`}
                className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full sm:col-span-2 sm:min-h-[3.05rem]`}
              >
                {copy.sleepSectionOpen}
              </Link>
            ) : null}
          </div>
          <div className="mt-4 border-t border-white/65 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <Link to={`/children/${child.id}/weight`} className={secondaryActionClass}>
                {copy.weightCardTitle}
              </Link>
              <Link to={`/children/${child.id}/height`} className={secondaryActionClass}>
                {copy.heightCardTitle}
              </Link>
              <Link to={`/children/${child.id}/calendar`} className={secondaryActionClass}>
                {copy.calendar}
              </Link>
            </div>
          </div>
        </Surface>
      </div>

      <Surface className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="app-card-title">{copy.basic}</h2>
          <span
            className={[
              "soft-pill inline-flex rounded-full px-3 py-1 text-xs font-medium",
              child.babyModeEnabled
                ? "border-primary/25 bg-primary/10 text-primary"
                : "text-muted",
            ].join(" ")}
          >
            {copy.babyMode}: {babyModeLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <BasicMetricCard label={copy.age} value={ageLabel ?? copy.ageMissing} />
          <BasicMetricCard
            label={copy.birthDate}
            value={child.birthDate ? formatDate(child.birthDate) : copy.birthDateMissing}
          />
          <BasicMetricCard
            label={copy.latestWeight}
            value={
              latestWeight
                ? formatWeightValue(latestWeight.valueKg, language)
                : copy.latestWeightMissing
            }
          />
          <BasicMetricCard
            label={copy.latestHeight}
            value={
              latestHeight
                ? formatHeightValue(latestHeight.valueCm, language)
                : copy.latestHeightMissing
            }
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {child.allergies && <InfoLine label={copy.allergies} value={child.allergies} />}
          {child.notes && <InfoLine label={copy.notes} value={child.notes} fullWidth />}
          {hasExtraContacts(child) && (
            <details className="soft-panel-muted rounded-[24px] px-4 py-4 sm:col-span-2">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                {copy.contactsSummary}
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:col-span-2">
              <p className="text-sm text-muted">{copy.noExtra}</p>
            </div>
          )}
        </div>
      </Surface>

      <div className="px-1">
        <Link
          to={`/children/${child.id}/edit`}
          className={`${appBtnSecondaryClass} min-h-[2.95rem] w-full sm:min-h-[3.05rem]`}
        >
          {copy.editProfile}
        </Link>
      </div>
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
      className={`soft-panel-muted rounded-[24px] px-4 py-4 ${
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

function BasicMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="soft-panel-muted rounded-[22px] px-4 py-3.5">
      <p className="soft-field-label">{label}</p>
      <p className="mt-1 text-[1rem] font-semibold leading-6 tracking-[-0.025em] text-foreground">
        {value}
      </p>
    </div>
  );
}
