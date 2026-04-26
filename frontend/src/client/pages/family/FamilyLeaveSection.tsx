import { RowSurface } from "@shared/components/Surface";
import type { AppLanguage } from "@shared/i18n";
import { tFamily } from "./copy";

export function FamilyLeaveSection({
  language,
  onLeave,
}: {
  language: AppLanguage;
  onLeave: () => void;
}) {
  return (
    <RowSurface className="rounded-[26px] border border-danger/20 bg-danger/5 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="app-card-title text-danger">{tFamily(language, "leaveFamily")}</h2>
          <p className="text-sm leading-6 text-muted">
            {tFamily(language, "leaveFamilyDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="soft-pill-danger app-profile-action app-profile-action--active inline-flex min-h-[2.16rem] shrink-0 items-center justify-center px-3 text-[0.71rem] tracking-[-0.022em] sm:min-h-[2.24rem]"
        >
          {tFamily(language, "leaveFamily")}
        </button>
      </div>
    </RowSurface>
  );
}
