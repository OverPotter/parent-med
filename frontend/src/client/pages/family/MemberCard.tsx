import { useEffect, useState } from "react";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Link } from "react-router-dom";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";
import { appBtnJournalSecondaryClass } from "../child-illness/shared";
import { buildMemberAccessSummaryItems } from "./accessPolicy";
import { roleLabel, tFamily } from "./copy";
import { ProfileEditDialog } from "./ProfileEditDialog";

export interface MemberCardProps {
  member: FamilyMember;
  familyOwnerAccountId?: string | null;
  isCurrent: boolean;
  forceEdit: boolean;
  canManageAccess: boolean;
  canManageRoles: boolean;
  canDeleteMember: boolean;
  canEditProfile: boolean;
  adminsCount: number;
  isPending: boolean;
  language: AppLanguage;
  onPromote: () => void;
  onDemote: () => void;
  accessHref?: string;
  onDelete: () => void;
  onSaveProfile: (payload: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<boolean>;
  onHideForcedEdit: () => void;
  headerAction?: React.ReactNode;
}

export function MemberCard({
  member,
  familyOwnerAccountId = null,
  isCurrent,
  forceEdit,
  canManageAccess,
  canManageRoles,
  canDeleteMember,
  canEditProfile,
  adminsCount,
  isPending,
  language,
  onPromote,
  onDemote,
  accessHref,
  onDelete,
  onSaveProfile,
  onHideForcedEdit,
  headerAction = null,
}: MemberCardProps) {
  const isOwner = familyOwnerAccountId === member.id;
  const canDemote =
    canManageRoles && member.familyRole === "admin" && adminsCount > 1 && !isCurrent && !isOwner;
  const canPromote = canManageRoles && member.familyRole !== "admin" && !isCurrent && !isOwner;
  const canDelete = canDeleteMember && !isCurrent && !isOwner;
  const [isEditing, setIsEditing] = useState(forceEdit);
  const [displayName, setDisplayName] = useState(member.displayName || "");
  const [relationshipLabel, setRelationshipLabel] = useState(member.relationshipLabel || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
  const [isDemoteConfirmOpen, setIsDemoteConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const memberLabel =
    member.displayName ||
    (isCurrent ? tFamily(language, "yourProfileTitle") : tFamily(language, "noName"));
  const roleToneClass =
    isOwner || member.familyRole === "admin" ? "soft-pill-primary" : "soft-pill";
  const avatarInitial = memberLabel.trim().charAt(0).toUpperCase();
  const profileFacts = [
    {
      label: tFamily(language, "displayName"),
      value: memberLabel,
    },
    member.relationshipLabel
      ? {
          label: tFamily(language, "relationship"),
          value: member.relationshipLabel,
        }
      : null,
    member.phone
      ? {
          label: tFamily(language, "phone"),
          value: member.phone,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  useEffect(() => {
    setDisplayName(member.displayName || "");
    setRelationshipLabel(member.relationshipLabel || "");
    setPhone(member.phone || "");
  }, [member.displayName, member.relationshipLabel, member.phone]);

  useEffect(() => {
    if (forceEdit) {
      setIsEditing(true);
    }
  }, [forceEdit]);

  const accessSummaryItems = buildMemberAccessSummaryItems(member.accessPolicy, language);

  return (
    <div className="space-y-4">
      <ConfirmDialog
        isOpen={isPromoteConfirmOpen}
        title={tFamily(language, "confirmPromoteTitle")}
        description={tFamily(language, "confirmPromoteDescription")}
        confirmLabel={tFamily(language, "confirmPromoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="primary"
        isPending={isPending}
        onCancel={() => setIsPromoteConfirmOpen(false)}
        onConfirm={() => {
          onPromote();
          setIsPromoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDemoteConfirmOpen}
        title={tFamily(language, "confirmDemoteTitle")}
        description={tFamily(language, "confirmDemoteDescription")}
        confirmLabel={tFamily(language, "confirmDemoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={isPending}
        onCancel={() => setIsDemoteConfirmOpen(false)}
        onConfirm={() => {
          onDemote();
          setIsDemoteConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={tFamily(language, "confirmRemoveTitle")}
        description={tFamily(language, "confirmRemoveDescription")}
        confirmLabel={tFamily(language, "confirmRemoveAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
        isPending={isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDelete();
          setIsDeleteConfirmOpen(false);
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-sm font-extrabold text-[color:color-mix(in_srgb,var(--color-primary)_82%,var(--color-foreground))]">
            {avatarInitial || "•"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex min-h-[2.35rem] items-center rounded-full px-3.5 py-2 text-[0.76rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:min-h-[2.45rem] sm:text-[0.8rem] ${roleToneClass}`}
              >
                {roleLabel(member.familyRole, language, { isOwner })}
              </span>
              {isCurrent ? (
                <span className="soft-pill inline-flex min-h-[2.35rem] items-center rounded-full px-3.5 py-2 text-[0.76rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:min-h-[2.45rem] sm:text-[0.8rem]">
                  {tFamily(language, "thisIsYou")}
                </span>
              ) : null}
            </div>
            <div className="mt-2 grid gap-1.5">
              {profileFacts.map((fact) => (
                <p key={fact.label} className="text-sm text-muted">
                  <span className="font-semibold text-foreground/90">{fact.label}: </span>
                  <span className="break-all">{fact.value}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {headerAction || canDelete ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {headerAction}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isPending}
                className="soft-pill-danger app-profile-action min-h-[2.3rem] shrink-0 px-3 text-[0.78rem] disabled:opacity-50"
              >
                {tFamily(language, "deleteMemberShort")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {(canManageAccess || canEditProfile || canPromote || canDemote) && (
        <div className="space-y-2.5 rounded-[20px] bg-surface-muted/55 px-3 py-3">
          <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
            {tFamily(language, "actionsTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {canEditProfile && (
              <ActionButton
                label={
                  isEditing ? tFamily(language, "hideProfile") : tFamily(language, "editProfile")
                }
                onClick={() =>
                  setIsEditing((current) => {
                    const next = !current;
                    if (!next) {
                      onHideForcedEdit();
                    }
                    return next;
                  })
                }
              />
            )}
            {canPromote && (
              <ActionButton
                label={tFamily(language, "makeOwner")}
                disabled={isPending}
                onClick={() => setIsPromoteConfirmOpen(true)}
              />
            )}
            {canDemote && (
              <ActionButton
                label={tFamily(language, "makeAdult")}
                disabled={isPending}
                onClick={() => setIsDemoteConfirmOpen(true)}
              />
            )}
            {canManageAccess && (
              <ActionLink
                label={tFamily(language, "manageAccess")}
                href={accessHref ?? "/family"}
              />
            )}
          </div>
        </div>
      )}

      <ProfileEditDialog
        language={language}
        isOpen={isEditing}
        displayName={displayName}
        relationshipLabel={relationshipLabel}
        phone={phone}
        isPending={isPending}
        onClose={() => {
          setIsEditing(false);
          onHideForcedEdit();
        }}
        onDisplayNameChange={setDisplayName}
        onRelationshipLabelChange={setRelationshipLabel}
        onPhoneChange={setPhone}
        onSubmit={async () => {
          const isSaved = await onSaveProfile({
            displayName: displayName.trim() || undefined,
            relationshipLabel: relationshipLabel.trim() || null,
            phone: phone.trim() || null,
          });
          if (isSaved) {
            setIsEditing(false);
          }
        }}
      />

      {canManageAccess ? (
        <div className="space-y-2.5 rounded-[20px] bg-surface-muted/55 px-3 py-3">
          <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted/85">
            {tFamily(language, "currentAccessTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {accessSummaryItems.map((item) => (
              <span
                key={item.key}
                className={[
                  "inline-flex min-h-[2.35rem] items-center rounded-[18px] px-3 py-1.5 text-[11px] font-semibold tracking-[-0.01em]",
                  item.toneClass,
                ].join(" ")}
              >
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        appBtnJournalSecondaryClass,
        "inline-flex min-h-[2.45rem] items-center justify-center px-3.5 text-[0.76rem] disabled:opacity-50",
      ].join(" ")}
    >
      <span className="text-center">{label}</span>
    </button>
  );
}

function ActionLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      to={href}
      className={[
        appBtnJournalSecondaryClass,
        "inline-flex min-h-[2.45rem] items-center justify-center px-3.5 text-[0.76rem]",
      ].join(" ")}
    >
      <span className="text-center">{label}</span>
    </Link>
  );
}
