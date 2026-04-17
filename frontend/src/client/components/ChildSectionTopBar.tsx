import { Link } from "react-router-dom";
import { logout } from "@shared/api/auth";
import { FeedbackIcon, ProfileMenu } from "@shared/components/Layout";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

type ChildSectionTopBarProps = {
  backHref: string;
  backLabel: string;
};

export function ChildSectionTopBar({ backHref, backLabel }: ChildSectionTopBarProps) {
  const { copy } = useI18n();
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const clearSession = useAppStore((s) => s.clearSession);
  const accountLabel = accountDisplayName || accountLogin || copy.common.userFallback;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local logout must still work if the backend session is already gone.
    } finally {
      clearSession();
    }
  };

  return (
    <div className="child-section-top-bar flex items-center justify-between gap-3 px-1 pt-1">
      <Link
        to={backHref}
        className="inline-flex min-h-[2.35rem] items-center text-sm text-primary hover:underline"
      >
        {backLabel}
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/feedback"
          className="app-header-utility-button app-header-icon-button inline-flex items-center justify-center p-0"
          aria-label={copy.feedback.navShort}
          title={copy.feedback.navShort}
        >
          <FeedbackIcon />
          <span className="sr-only">{copy.feedback.navShort}</span>
        </Link>
        <ProfileMenu
          accountLabel={accountLabel}
          servicesLabel={copy.clientLayout.nav.more}
          settingsLabel={copy.common.settings}
          logoutLabel={copy.common.logoutFromAccount}
          menuLabel={copy.common.profileMenuLabel}
          onLogout={handleLogout}
          iconOnly
        />
      </div>
    </div>
  );
}
