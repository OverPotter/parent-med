import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePushPromptControls } from "@client/layout/PushPromptControlContext";
import { logout } from "@shared/api/auth";
import { setBearerToken } from "@shared/api/client";
import { HeaderUtilityActions } from "@shared/components/Layout";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { cleanupDeviceSessionArtifacts } from "@shared/utils/sessionCleanup";

type ChildSectionTopBarProps = {
  backHref?: string;
  onBack?: () => void;
  backLabel: string;
  title?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  containerClassName?: string;
};

export function ChildSectionTopBar({
  backHref,
  onBack,
  backLabel,
  title,
  hint,
  action,
  containerClassName = "max-w-2xl",
}: ChildSectionTopBarProps) {
  const { copy } = useI18n();
  const {
    showNotificationBell,
    isNotificationBellActive,
    notificationBellVariant,
    onNotificationBellClick,
  } = usePushPromptControls();
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const clearSession = useAppStore((s) => s.clearSession);
  const accountLabel = accountDisplayName || accountEmail || copy.common.userFallback;

  const handleLogout = async () => {
    const refreshToken = useAppStore.getState().refreshToken;
    setBearerToken(null);
    clearSession();
    try {
      await logout(refreshToken);
    } catch {
      // Local logout must still work if the backend session is already gone.
    }
    await cleanupDeviceSessionArtifacts({ includeServerCleanup: false });
  };

  return (
    <div className="shrink-0 -mx-3 bg-background px-3 sm:-mx-6 sm:px-6">
      <div className="child-section-top-bar-shell bg-background pb-3">
        <div className={`mx-auto w-full ${containerClassName}`}>
          <div className="child-section-top-bar flex min-w-0 items-center justify-between gap-2 px-1 pt-0.5">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-[2.35rem] min-w-0 flex-1 items-center text-sm text-primary hover:underline"
              >
                <span className="truncate">{backLabel}</span>
              </button>
            ) : (
              <Link
                to={backHref ?? "#"}
                className="inline-flex min-h-[2.35rem] min-w-0 flex-1 items-center text-sm text-primary hover:underline"
              >
                <span className="truncate">{backLabel}</span>
              </Link>
            )}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HeaderUtilityActions
                accountLabel={accountLabel}
                familyLabel={copy.common.family}
                servicesLabel={copy.clientLayout.nav.more}
                settingsLabel={copy.common.settings}
                logoutLabel={copy.common.logoutFromAccount}
                menuLabel={copy.common.profileMenuLabel}
                onLogout={handleLogout}
                feedbackLabel={copy.feedback.navShort}
                notificationLabel={copy.clientLayout.pushPrompt.title}
                showNotificationBell={showNotificationBell}
                isNotificationBellActive={isNotificationBellActive}
                notificationBellVariant={notificationBellVariant}
                onNotificationBellClick={onNotificationBellClick}
              />
            </div>
          </div>
          {title || hint || action ? (
            <div className="mt-2.5 flex items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                {title ? <h2 className="app-card-title">{title}</h2> : null}
                {hint ? <p className="mt-1 text-sm leading-6 text-muted">{hint}</p> : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
