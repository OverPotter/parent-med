import { DisclosureHeader } from "@shared/components/DisclosureHeader";
import { Surface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { tSettings } from "./copy";

export function SettingsSecuritySection({
  language,
  isPasswordFormOpen,
  onTogglePasswordForm,
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
  isPasswordFormOpen: boolean;
  onTogglePasswordForm: () => void;
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
      <Surface className="p-5 sm:p-6">
        <DisclosureHeader isOpen={isPasswordFormOpen} onToggle={onTogglePasswordForm}>
          <>
            <p className="app-card-title">{tSettings(language, "changePassword")}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {tSettings(language, "changePasswordHint")}
            </p>
          </>
        </DisclosureHeader>
        {isPasswordFormOpen ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSubmitPasswordChange}
                disabled={isPasswordPending}
                className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5"
              >
                {isPasswordPending
                  ? tSettings(language, "saving")
                  : tSettings(language, "updatePassword")}
              </button>
              {passwordSuccess ? (
                <p className="soft-text-success text-sm">{passwordSuccess}</p>
              ) : null}
            </div>
            {passwordError ? (
              <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {passwordError}
              </div>
            ) : null}
          </>
        ) : null}
      </Surface>

      <Surface className="p-5 sm:p-6">
        <p className="app-card-title text-[color:var(--color-danger)]">
          {tSettings(language, "dangerZone")}
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">{tSettings(language, "dangerZoneHint")}</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {tSettings(language, "deleteAccountDescription")}
        </p>
        {deleteAccountError ? (
          <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
            {deleteAccountError}
          </div>
        ) : null}
        {accountFamilyRole === "owner" ? (
          <>
            <p className="mt-4 text-sm leading-6 text-muted">
              {tSettings(language, "deleteFamilyDescription")}
            </p>
            {deleteFamilyError ? (
              <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {deleteFamilyError}
              </div>
            ) : null}
          </>
        ) : null}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDeleteAccount}
              className="app-btn-danger-md soft-button-danger inline-flex min-h-[2.95rem] items-center justify-center px-4 sm:min-h-[3.1rem] sm:px-5"
            >
              {tSettings(language, "deleteAccount")}
            </button>
            {accountFamilyRole === "owner" ? (
              <button
                type="button"
                onClick={onDeleteFamily}
                className="app-btn-danger-md soft-button-danger inline-flex min-h-[2.95rem] items-center justify-center px-4 sm:min-h-[3.1rem] sm:px-5"
              >
                {tSettings(language, "deleteFamily")}
              </button>
            ) : null}
          </div>
        </div>
      </Surface>
    </>
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
        className="soft-input w-full px-4"
      />
    </label>
  );
}
