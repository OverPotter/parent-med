import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { AppLanguage } from "@shared/i18n";
import { illnessCompactInputClass } from "../child-illness/shared";
import { tSettings } from "./copy";
import { SettingsRow, SettingsSection } from "./ui";

const PASSWORD_DIALOG_HISTORY_KEY = "__pm_settings_password_dialog__";
const compactPrimaryActionClass =
  "soft-pill-primary app-profile-action app-profile-action--selected min-h-[2.08rem] px-2.75 text-[0.69rem] tracking-[-0.022em] sm:min-h-[2.16rem] sm:px-3 sm:text-[0.71rem]";
const destructiveActionClass =
  "soft-pill-danger app-profile-action app-profile-action--active min-h-[2.08rem] px-2.75 text-[0.69rem] tracking-[-0.022em] sm:min-h-[2.16rem] sm:px-3 sm:text-[0.71rem]";

export function SettingsSecuritySection({
  language,
  isPasswordDialogOpen,
  onOpenPasswordDialog,
  onClosePasswordDialog,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmitPasswordChange,
  isPasswordPending,
  passwordSuccess,
  passwordError,
  accountFamilyRole,
  deleteAccountError,
  deleteFamilyError,
  onDeleteAccount,
  onDeleteFamily,
}: {
  language: AppLanguage;
  isPasswordDialogOpen: boolean;
  onOpenPasswordDialog: () => void;
  onClosePasswordDialog: () => void;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmitPasswordChange: () => void;
  isPasswordPending: boolean;
  passwordSuccess: string | null;
  passwordError: string | null;
  accountFamilyRole: string | null;
  deleteAccountError: string | null;
  deleteFamilyError: string | null;
  onDeleteAccount: () => void;
  onDeleteFamily: () => void;
}) {
  return (
    <>
      <SettingsSection
        title={tSettings(language, "changePassword")}
        hint={tSettings(language, "changePasswordHint")}
        badge={
          <button
            type="button"
            onClick={onOpenPasswordDialog}
            className={compactPrimaryActionClass}
          >
            {tSettings(language, "changePassword")}
          </button>
        }
      >
        {null}
      </SettingsSection>

      <SettingsSection
        title={tSettings(language, "dangerZone")}
        hint={tSettings(language, "dangerZoneHint")}
        tone="danger"
      >
        <SettingsRow
          title={tSettings(language, "deleteAccount")}
          hint={tSettings(language, "deleteAccountDescription")}
          align="start"
          forceInlineActions
          actions={
            <button
              type="button"
              onClick={onDeleteAccount}
              className={destructiveActionClass}
            >
              {tSettings(language, "deleteAccount")}
            </button>
          }
        />
        {deleteAccountError ? (
          <div className="soft-note-danger mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">
            {deleteAccountError}
          </div>
        ) : null}
        {accountFamilyRole === "owner" ? (
          <>
            <SettingsRow
              title={tSettings(language, "deleteFamily")}
              hint={tSettings(language, "deleteFamilyDescription")}
              separated
              align="start"
              forceInlineActions
              actions={
                <button
                  type="button"
                  onClick={onDeleteFamily}
                  className={destructiveActionClass}
                >
                  {tSettings(language, "deleteFamily")}
                </button>
              }
            />
            {deleteFamilyError ? (
              <div className="soft-note-danger mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">
                {deleteFamilyError}
              </div>
            ) : null}
          </>
        ) : null}
      </SettingsSection>

      <PasswordChangeDialog
        language={language}
        isOpen={isPasswordDialogOpen}
        onClose={onClosePasswordDialog}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={onCurrentPasswordChange}
        onNewPasswordChange={onNewPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
        onSubmit={onSubmitPasswordChange}
        isPending={isPasswordPending}
        passwordSuccess={passwordSuccess}
        passwordError={passwordError}
      />
    </>
  );
}

function PasswordChangeDialog({
  language,
  isOpen,
  onClose,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isPending,
  passwordSuccess,
  passwordError,
}: {
  language: AppLanguage;
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  passwordSuccess: string | null;
  passwordError: string | null;
}) {
  const isClosingFromHistoryRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const currentState =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const dialogState = { ...currentState, [PASSWORD_DIALOG_HISTORY_KEY]: true };

    window.history.pushState(dialogState, "", window.location.href);

    const handlePopState = () => {
      isClosingFromHistoryRef.current = true;
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (
        !isClosingFromHistoryRef.current &&
        window.history.state &&
        typeof window.history.state === "object" &&
        window.history.state[PASSWORD_DIALOG_HISTORY_KEY]
      ) {
        window.history.back();
      }
      isClosingFromHistoryRef.current = false;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overscrollBehavior = "none";

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const handleClose = () => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state === "object" &&
      window.history.state[PASSWORD_DIALOG_HISTORY_KEY]
    ) {
      window.history.back();
      return;
    }

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "max(0.75rem, var(--app-safe-top-runtime, env(safe-area-inset-top)))",
        paddingBottom: "max(1rem, var(--app-safe-bottom-runtime, env(safe-area-inset-bottom)))",
      }}
    >
      <div className="app-v3-background" aria-hidden="true">
        <div className="app-v3-decor app-v3-decor-a" />
        <div className="app-v3-decor app-v3-decor-b" />
        <div className="app-v3-decor app-v3-decor-c" />
        <div className="app-v3-noise" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/70 bg-background/88 px-4 pb-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto w-full max-w-[32rem]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex min-h-[2.25rem] items-center text-sm font-extrabold text-primary disabled:opacity-50"
            >
              {language === "ru" ? "← Настройки" : "← Settings"}
            </button>
            <div className="mt-1.5">
              <h2 className="app-card-title text-[1.25rem]">
                {tSettings(language, "changePassword")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {tSettings(language, "changePasswordHint")}
              </p>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3 sm:px-6">
          <div className="mx-auto w-full max-w-[32rem]">
            <div className="soft-panel overflow-hidden rounded-[28px] border border-border shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="p-4 sm:p-5">
                <div className="grid gap-4">
                  <PasswordField
                    label={tSettings(language, "currentPassword")}
                    value={currentPassword}
                    onChange={onCurrentPasswordChange}
                  />
                  <PasswordField
                    label={tSettings(language, "newPassword")}
                    value={newPassword}
                    onChange={onNewPasswordChange}
                  />
                  <PasswordField
                    label={tSettings(language, "confirmNewPassword")}
                    value={confirmPassword}
                    onChange={onConfirmPasswordChange}
                  />
                </div>
                {passwordSuccess ? (
                  <p className="soft-text-success mt-4 text-sm">{passwordSuccess}</p>
                ) : null}
                {passwordError ? (
                  <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                    {passwordError}
                  </div>
                ) : null}
              </div>
              <div className="border-t border-border/60 p-4 sm:px-5 sm:pb-5 sm:pt-4">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isPending}
                  className={`${compactPrimaryActionClass} w-full justify-center disabled:opacity-50`}
                >
                  {isPending ? tSettings(language, "saving") : tSettings(language, "updatePassword")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="soft-field-label">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={illnessCompactInputClass}
      />
    </label>
  );
}
