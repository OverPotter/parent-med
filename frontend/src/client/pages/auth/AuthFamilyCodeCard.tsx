import type { VerifiedFamilyCode } from "./familyCodeModel";
import { formatLocalizedDateTime } from "@shared/utils/date";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <circle cx="10" cy="10" r="7.25" strokeWidth="1.8" />
      <path
        d="m6.6 10.1 2.1 2.1 4.7-4.8"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface AuthFamilyCodeCardProps {
  language: "ru" | "en";
  isOpen: boolean;
  inputValue: string;
  error: string | null;
  verifiedFamilyCode: VerifiedFamilyCode | null;
  isPending: boolean;
  toggleTitle: string;
  toggleHint: string;
  placeholder: string;
  verifyLabel: string;
  verifyingLabel: string;
  verifiedTitle: string;
  changeLabel: string;
  confirmedLabel: string;
  validUntilLabel: string;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onVerify: () => void;
  onResetVerified: () => void;
}

export function AuthFamilyCodeCard({
  language,
  isOpen,
  inputValue,
  error,
  verifiedFamilyCode,
  isPending,
  toggleTitle,
  toggleHint,
  placeholder,
  verifyLabel,
  verifyingLabel,
  verifiedTitle,
  changeLabel,
  confirmedLabel,
  validUntilLabel,
  onToggle,
  onInputChange,
  onVerify,
  onResetVerified,
}: AuthFamilyCodeCardProps) {
  return (
    <div className="auth-v3-family-code-card">
      <button
        type="button"
        onClick={onToggle}
        className={joinClasses(
          "auth-v3-family-code-toggle",
          isOpen && "auth-v3-family-code-toggle-open",
          verifiedFamilyCode && "auth-v3-family-code-toggle-verified"
        )}
        aria-expanded={isOpen}
      >
        <span className="auth-v3-family-code-toggle-copy">
          <span className="auth-v3-family-code-toggle-title">{toggleTitle}</span>
          <span className="auth-v3-family-code-toggle-meta">
            {verifiedFamilyCode ? verifiedFamilyCode.familyName : toggleHint}
          </span>
        </span>
      </button>
      {isOpen ? (
        <div className="mt-3 space-y-3">
          {!verifiedFamilyCode ? (
            <>
              <label className="block">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    className="auth-v3-input w-full"
                    placeholder={placeholder}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={onVerify}
                disabled={isPending}
                className="auth-v3-handoff-secondary auth-v3-family-code-cta text-center"
              >
                {isPending ? verifyingLabel : verifyLabel}
              </button>
            </>
          ) : (
            <div className="auth-v3-family-code-preview">
              <div className="auth-v3-family-code-preview-header">
                <span className="auth-v3-family-code-badge">
                  <CheckCircleIcon />
                  {confirmedLabel}
                </span>
                <p className="auth-v3-family-code-name">{verifiedTitle}</p>
              </div>
              <div className="auth-v3-family-code-meta">
                <p className="auth-v3-family-code-meta-line auth-v3-family-code-meta-line-strong">
                  {verifiedFamilyCode.familyName}
                </p>
                <p className="auth-v3-family-code-meta-line">
                  {`${validUntilLabel} ${formatLocalizedDateTime(
                    verifiedFamilyCode.expiresAt,
                    language
                  )}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onResetVerified}
                className="auth-v3-linkish mt-3"
              >
                {changeLabel}
              </button>
            </div>
          )}
          {error ? <p className="auth-v3-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
