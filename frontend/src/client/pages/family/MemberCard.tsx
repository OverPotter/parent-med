import { useEffect, useState } from "react";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import type { AppLanguage } from "@shared/i18n";
import type { FamilyMember } from "@shared/types/api";
import {
  appBtnJournalSecondaryClass,
} from "../child-illness/shared";
import { roleLabel, tFamily } from "./copy";
import { ProfileEditDialog } from "./ProfileEditDialog";

export interface MemberCardProps {
  member: FamilyMember;
  isCurrent: boolean;
  forceEdit: boolean;
  isOwner: boolean;
  canEditProfile: boolean;
  ownersCount: number;
  isPending: boolean;
  language: AppLanguage;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
  onSaveProfile: (payload: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
    email?: string | null;
  }) => Promise<boolean>;
  onHideForcedEdit: () => void;
}

export function MemberCard({
  member,
  isCurrent,
  forceEdit,
  isOwner,
  canEditProfile,
  ownersCount,
  isPending,
  language,
  onPromote,
  onDemote,
  onDelete,
  onSaveProfile,
  onHideForcedEdit,
}: MemberCardProps) {
  const canDemote = member.familyRole === "owner" && ownersCount > 1 && !isCurrent;
  const canPromote = member.familyRole !== "owner" && !isCurrent;
  const canDelete = !isCurrent;
  const [isEditing, setIsEditing] = useState(forceEdit);
  const [displayName, setDisplayName] = useState(member.displayName || "");
  const [relationshipLabel, setRelationshipLabel] = useState(member.relationshipLabel || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [email, setEmail] = useState(member.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
  const [isDemoteConfirmOpen, setIsDemoteConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setDisplayName(member.displayName || "");
    setRelationshipLabel(member.relationshipLabel || "");
    setPhone(member.phone || "");
    setEmail(member.email || "");
    setEmailError(null);
  }, [member.displayName, member.relationshipLabel, member.phone, member.email]);

  useEffect(() => {
    if (forceEdit) {
      setIsEditing(true);
    }
  }, [forceEdit]);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <ConfirmDialog
        isOpen={isPromoteConfirmOpen}
        title={tFamily(language, "confirmPromoteTitle")}
        description={tFamily(language, "confirmPromoteDescription")}
        confirmLabel={tFamily(language, "confirmPromoteAction")}
        cancelLabel={tFamily(language, "cancel")}
        confirmTone="danger"
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-card-title text-base">
              {member.displayName || member.login || tFamily(language, "noName")}
            </p>
            {member.relationshipLabel && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">
                {member.relationshipLabel}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                member.familyRole === "owner" ? "soft-pill-primary" : "soft-pill"
              }`}
            >
              {roleLabel(member.familyRole, language)}
            </span>
            {isCurrent && (
              <span className="soft-pill rounded-full px-2.5 py-1 text-[11px]">
                {tFamily(language, "thisIsYou")}
              </span>
            )}
          </div>
          <div className="mt-2 grid gap-1.5">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">Login: </span>@{member.login}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">Email: </span>
              {member.email || tFamily(language, "emailMissing")}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground/90">
                {tFamily(language, "phone")}:{" "}
              </span>
              {member.phone || tFamily(language, "phoneMissing")}
            </p>
          </div>
        </div>

        {(isOwner || canEditProfile) && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {canEditProfile && (
              <button
                type="button"
                onClick={() =>
                  setIsEditing((current) => {
                    const next = !current;
                    if (!next) {
                      onHideForcedEdit();
                    }
                    return next;
                  })
                }
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {isEditing ? tFamily(language, "hideProfile") : tFamily(language, "editProfile")}
              </button>
            )}
            {canPromote && (
              <button
                type="button"
                onClick={() => setIsPromoteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "makeOwner")}
              </button>
            )}
            {canDemote && (
              <button
                type="button"
                onClick={() => setIsDemoteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "makeAdult")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isPending}
                className={`${appBtnJournalSecondaryClass} min-h-[2.55rem] px-3 text-[0.78rem] disabled:opacity-50 sm:min-h-[2.35rem] sm:text-[0.76rem]`}
              >
                {tFamily(language, "removeFromFamily")}
              </button>
            )}
          </div>
        )}
      </div>

      <ProfileEditDialog
        language={language}
        isOpen={isEditing}
        isCurrent={isCurrent}
        displayName={displayName}
        relationshipLabel={relationshipLabel}
        phone={phone}
        email={email}
        emailError={emailError}
        isPending={isPending}
        onClose={() => {
          setIsEditing(false);
          onHideForcedEdit();
        }}
        onDisplayNameChange={setDisplayName}
        onRelationshipLabelChange={setRelationshipLabel}
        onPhoneChange={setPhone}
        onEmailChange={(value) => {
          setEmail(value);
          setEmailError(null);
        }}
        onSubmit={async () => {
          const normalizedEmail = email.trim().toLowerCase();
          const isValidEmail =
            normalizedEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
          if (!isValidEmail) {
            setEmailError(tFamily(language, "invalidEmail"));
            return;
          }
          const isSaved = await onSaveProfile({
            displayName: displayName.trim() || member.login,
            relationshipLabel: relationshipLabel.trim() || null,
            phone: phone.trim() || null,
            email: isCurrent ? normalizedEmail || null : undefined,
          });
          if (isSaved) {
            setIsEditing(false);
          }
        }}
      />
    </div>
  );
}
