import { useEffect, useRef } from "react";
import { FullscreenOverlay } from "@shared/components/FullscreenOverlay";
import type { AppLanguage } from "@shared/i18n";
import { appBtnJournalPrimaryClass } from "../child-illness/shared";
import { tFamily } from "./copy";

const PROFILE_DIALOG_HISTORY_KEY = "__pm_family_profile_dialog__";

interface ProfileEditDialogProps {
  language: AppLanguage;
  isOpen: boolean;
  displayName: string;
  relationshipLabel: string;
  phone: string;
  isPending: boolean;
  onClose: () => void;
  onDisplayNameChange: (value: string) => void;
  onRelationshipLabelChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export function ProfileEditDialog({
  language,
  isOpen,
  displayName,
  relationshipLabel,
  phone,
  isPending,
  onClose,
  onDisplayNameChange,
  onRelationshipLabelChange,
  onPhoneChange,
  onSubmit,
}: ProfileEditDialogProps) {
  const isClosingFromHistoryRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const currentState =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const dialogState = { ...currentState, [PROFILE_DIALOG_HISTORY_KEY]: true };

    window.history.pushState(dialogState, "", window.location.href);

    const handlePopState = () => {
      isClosingFromHistoryRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (
        !isClosingFromHistoryRef.current &&
        window.history.state &&
        typeof window.history.state === "object" &&
        window.history.state[PROFILE_DIALOG_HISTORY_KEY]
      ) {
        window.history.back();
      }
      isClosingFromHistoryRef.current = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state === "object" &&
      window.history.state[PROFILE_DIALOG_HISTORY_KEY]
    ) {
      window.history.back();
      return;
    }

    onClose();
  };

  return (
    <FullscreenOverlay
      isOpen={isOpen}
      onClose={handleClose}
      backLabel={language === "ru" ? "← Семья" : "← Family"}
      title={tFamily(language, "editProfile")}
      maxWidthClassName="max-w-[34rem]"
      closeDisabled={isPending}
    >
      <div className="soft-panel overflow-hidden rounded-[28px] border border-border shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="soft-field-label">{tFamily(language, "displayName")}</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={tFamily(language, "displayNamePlaceholder")}
              />
            </label>

            <label className="block">
              <span className="soft-field-label">{tFamily(language, "relationship")}</span>
              <input
                type="text"
                value={relationshipLabel}
                onChange={(event) => onRelationshipLabelChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={tFamily(language, "relationshipPlaceholder")}
              />
            </label>

            <label className="block">
              <span className="soft-field-label">{tFamily(language, "phone")}</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder="+375 ..."
              />
            </label>
          </div>
        </div>

        <div className="border-t border-border/60 p-4 sm:px-5 sm:pb-5 sm:pt-4">
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isPending || !displayName.trim()}
            className={`${appBtnJournalPrimaryClass} w-full justify-center disabled:opacity-50`}
          >
            {isPending ? tFamily(language, "saving") : tFamily(language, "saveProfile")}
          </button>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
