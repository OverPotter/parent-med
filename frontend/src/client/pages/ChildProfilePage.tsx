import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchLatestHeightEntryByChildId } from "@shared/api/heightEntries";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import { formatChildDatePlain } from "@client/utils/childDateFormat";

export function ChildProfilePage() {
  const { language } = useI18n();
  const copy = getChildrenCopy(language).childProfile;
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
    return <p className="text-sm text-muted">{copy.loading}</p>;
  }

  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const babyModeLabel = child.babyModeEnabled ? copy.babyModeEnabled : copy.babyModeDisabled;
  const profileNavActionClass = "soft-pill app-profile-action";
  const quickLinks = [
    {
      to: `/children/${child.id}/illness?view=history`,
      label: copy.history,
    },
    ...(child.babyModeEnabled
      ? [
          {
            to: `/children/${child.id}/feeding`,
            label: copy.feedingSection,
          },
          {
            to: `/children/${child.id}/sleep`,
            label: copy.sleepSection,
          },
        ]
      : []),
    { to: `/children/${child.id}/weight`, label: copy.weightCardTitle },
    { to: `/children/${child.id}/height`, label: copy.heightCardTitle },
    { to: `/children/${child.id}/calendar`, label: copy.calendar },
  ];

  return (
    <div className="-mx-3 min-w-0 space-y-6 bg-background px-3 sm:-mx-6 sm:px-6">
      <ChildSectionTopBar
        backHref="/children"
        backLabel={language === "ru" ? "← К детям" : "← Back to children"}
        title={`${copy.eyebrow} · ${child.name}`}
        hint={copy.subtitle}
        action={
          <Link
            to={`/children/${child.id}/edit`}
            className={`${profileNavActionClass} min-h-[2.4rem] shrink-0`}
          >
            {copy.editProfile}
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-3">
        <Surface className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${profileNavActionClass} min-h-[2.6rem]`}
              >
                {item.label}
              </Link>
            ))}
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
