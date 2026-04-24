import { useEffect, useRef } from "react";
import type { AppLanguage } from "@shared/i18n";
import { FullscreenOverlay } from "@shared/components/FullscreenOverlay";
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
  hasRecoveryCode,
  isPasswordDialogOpen,
  isRecoveryCodeDialogOpen,
  onOpenPasswordDialog,
  onOpenRecoveryCodeDialog,
  onClosePasswordDialog,
  onCloseRecoveryCodeDialog,
  currentPassword,
  newPassword,
  confirmPassword,
  recoveryCode,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onRecoveryCodeChange,
  onSubmitPasswordChange,
  onSubmitRecoveryCode,
  isPasswordPending,
  isRecoveryCodePending,
  passwordSuccess,
  passwordError,
  recoveryCodeSuccess,
  recoveryCodeError,
  accountFamilyRole,
  deleteAccountError,
  deleteFamilyError,
  onDeleteAccount,
  onDeleteFamily,
}: {
  language: AppLanguage;
  hasRecoveryCode: boolean;
  isPasswordDialogOpen: boolean;
  isRecoveryCodeDialogOpen: boolean;
  onOpenPasswordDialog: () => void;
  onOpenRecoveryCodeDialog: () => void;
  onClosePasswordDialog: () => void;
  onCloseRecoveryCodeDialog: () => void;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  recoveryCode: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRecoveryCodeChange: (value: string) => void;
  onSubmitPasswordChange: () => void;
  onSubmitRecoveryCode: () => void;
  isPasswordPending: boolean;
  isRecoveryCodePending: boolean;
  passwordSuccess: string | null;
  passwordError: string | null;
  recoveryCodeSuccess: string | null;
  recoveryCodeError: string | null;
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
        title={tSettings(language, "recoveryCode")}
        hint={
          hasRecoveryCode
            ? tSettings(language, "recoveryCodeLockedHint")
            : tSettings(language, "recoveryCodeHint")
        }
        badge={
          hasRecoveryCode ? (
            <span
              className="soft-pill-success inline-flex h-[2.08rem] w-[2.08rem] items-center justify-center rounded-full px-0 text-[0.82rem] sm:h-[2.16rem] sm:w-[2.16rem]"
              aria-label={tSettings(language, "recoveryCodeConfigured")}
            >
              <span aria-hidden="true">✓</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenRecoveryCodeDialog}
              className={compactPrimaryActionClass}
            >
              {tSettings(language, "recoveryCode")}
            </button>
          )
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
            <button type="button" onClick={onDeleteAccount} className={destructiveActionClass}>
              {tSettings(language, "deleteAccount")}
            </button>
          }
        />
        {deleteAccountError ? (
          <div className="soft-note-danger mx-4 mt-1 rounded-2xl px-4 py-3 text-sm">
            {deleteAccountError}
          </div>
        ) : null}
        {accountFamilyRole === "admin" ? (
          <>
            <SettingsRow
              title={tSettings(language, "deleteFamily")}
              hint={tSettings(language, "deleteFamilyDescription")}
              separated
              align="start"
              forceInlineActions
              actions={
                <button type="button" onClick={onDeleteFamily} className={destructiveActionClass}>
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
      <RecoveryCodeDialog
        language={language}
        isOpen={isRecoveryCodeDialogOpen}
        onClose={onCloseRecoveryCodeDialog}
        recoveryCode={recoveryCode}
        onRecoveryCodeChange={onRecoveryCodeChange}
        onSubmit={onSubmitRecoveryCode}
        isPending={isRecoveryCodePending}
        successMessage={recoveryCodeSuccess}
        errorMessage={recoveryCodeError}
      />
    </>
  );
}

const RECOVERY_CODE_DIALOG_HISTORY_KEY = "__pm_settings_recovery_code_dialog__";

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
    const dialogState = { ...currentState, [PASSWORD_DIALOG_HISTORY_KEY]: true };

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
        window.history.state[PASSWORD_DIALOG_HISTORY_KEY]
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
      window.history.state[PASSWORD_DIALOG_HISTORY_KEY]
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
      backLabel={language === "ru" ? "← Настройки" : "← Settings"}
      title={tSettings(language, "changePassword")}
      hint={tSettings(language, "changePasswordHint")}
      maxWidthClassName="max-w-[32rem]"
      closeDisabled={isPending}
    >
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
    </FullscreenOverlay>
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

function RecoveryCodeDialog({
  language,
  isOpen,
  onClose,
  recoveryCode,
  onRecoveryCodeChange,
  onSubmit,
  isPending,
  successMessage,
  errorMessage,
}: {
  language: AppLanguage;
  isOpen: boolean;
  onClose: () => void;
  recoveryCode: string;
  onRecoveryCodeChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}) {
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
    const dialogState = { ...currentState, [RECOVERY_CODE_DIALOG_HISTORY_KEY]: true };

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
        window.history.state[RECOVERY_CODE_DIALOG_HISTORY_KEY]
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
      window.history.state[RECOVERY_CODE_DIALOG_HISTORY_KEY]
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
      backLabel={language === "ru" ? "← Настройки" : "← Settings"}
      title={tSettings(language, "recoveryCode")}
      hint={tSettings(language, "recoveryCodeHint")}
      maxWidthClassName="max-w-[32rem]"
      closeDisabled={isPending}
    >
      <div className="soft-panel overflow-hidden rounded-[28px] border border-border shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="p-4 sm:p-5">
          <label className="block space-y-1.5">
            <span className="soft-field-label">{tSettings(language, "recoveryCodeLabel")}</span>
            <input
              type="text"
              value={recoveryCode}
              onChange={(event) => onRecoveryCodeChange(event.target.value)}
              className={illnessCompactInputClass}
              placeholder={tSettings(language, "recoveryCodePlaceholder")}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          {successMessage ? <p className="soft-text-success mt-4 text-sm">{successMessage}</p> : null}
          {errorMessage ? (
            <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
              {errorMessage}
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
            {isPending ? tSettings(language, "saving") : tSettings(language, "recoveryCode")}
          </button>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
