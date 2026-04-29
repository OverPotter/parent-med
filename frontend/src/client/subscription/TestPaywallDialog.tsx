import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppLanguage } from "@shared/i18n";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { getPrivacyPolicyUrl, getTermsOfUseUrl } from "@shared/config/legal";
import { openExternalUrl } from "@shared/utils/openExternalUrl";
import paywallHeader from "../../../design/paywall/paywall_header.png";
import "./paywallTheme.css";
import { markUpgradeDialogReopenPending } from "./upgradeDialogReopen";
import {
  getTestPaywallCopy,
  type PaywallPlanCopy,
  type PaywallPlanKey,
} from "./testPaywallCopy";
import { useSwipeToDismissSheet } from "./useSwipeToDismissSheet";

type TestPaywallDialogProps = {
  isOpen: boolean;
  language: AppLanguage;
  onClose: () => void;
  onUpgrade: (plan: PaywallPlanKey) => void | Promise<unknown>;
  isPurchasePending?: boolean;
  onRestorePurchases: () => void | Promise<unknown>;
  isRestorePending?: boolean;
  errorMessage?: string | null;
};

export function TestPaywallDialog({
  isOpen,
  language,
  onClose,
  onUpgrade,
  isPurchasePending = false,
  onRestorePurchases,
  isRestorePending = false,
  errorMessage = null,
}: TestPaywallDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlanKey>("annual");
  const copy = useMemo(() => getTestPaywallCopy(language), [language]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { sheetOffsetY, isSheetDismissAnimating, handleTouchEnd, handleTouchMove, handleTouchStart } =
    useSwipeToDismissSheet({
      isOpen,
      onDismiss: onClose,
      scrollRef,
    });

  if (!isOpen) {
    return null;
  }

  const plans: Record<PaywallPlanKey, PaywallPlanCopy> = {
    monthly: copy.monthlyPlan,
    annual: copy.annualPlan,
  };
  const selectedPlanLegal = selectedPlan === "annual" ? copy.annualLegal : copy.monthlyLegal;
  const handleLegalNavigation = (url: string) => {
    markUpgradeDialogReopenPending();
    onClose();
    if (url.startsWith("/")) {
      navigate(url, {
        state: {
          fromPaywall: true,
          paywallReturnTo: `${location.pathname}${location.search}${location.hash}`,
        },
      });
      return;
    }
    void openExternalUrl(url);
  };

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      zIndexClassName="z-[220]"
      backdropAriaLabel={language === "ru" ? "Закрыть тестовый paywall" : "Close test paywall"}
      containerClassName="flex items-end justify-center p-0 sm:p-4"
      backdropClassName="bg-[rgba(15,23,42,0.52)] backdrop-blur-md"
    >
      <div
        className={`pillpath-paywall-theme relative z-[1] flex h-[100dvh] w-full flex-col overflow-hidden will-change-transform sm:h-auto sm:max-h-[96dvh] sm:max-w-[420px] sm:rounded-[34px] sm:shadow-[0_32px_90px_rgba(15,23,42,0.28)] ${
          isSheetDismissAnimating ? "transition-transform duration-300 ease-out" : ""
        }`}
        style={{ transform: `translateY(${sheetOffsetY}px)` }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(180deg,#FFF4FA_0%,#F5E6FF_50%,rgba(235,228,255,0)_100%)]"
        />
        <div
          className="absolute inset-x-0 top-0 z-[2] h-[calc(env(safe-area-inset-top)+52px)] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-[3] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/78 text-base text-[var(--text-secondary)] shadow-[0_8px_18px_rgba(15,23,42,0.10)] backdrop-blur"
          aria-label={language === "ru" ? "Закрыть" : "Close"}
        >
          ×
        </button>

        <div
          ref={scrollRef}
          className="relative flex h-full touch-pan-y flex-col overflow-y-auto overflow-x-hidden [overscroll-behavior-y:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="hero relative h-[41vh] min-h-[310px] max-h-[372px] shrink-0 overflow-hidden bg-[#EBE4FF]">
            <img
              src={paywallHeader}
              alt=""
              className="h-full w-full origin-top scale-x-[1.01] scale-y-[1.08] object-cover [object-position:calc(45%_-_8px)_top]"
            />
            <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,244,250,0.08)_56%,rgba(245,230,255,0.12)_82%,#EBE4FF_100%)]" />
          </div>

          <div className="flex-1 px-[20px] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-[20px] sm:pb-6">
            <div className="relative z-[1] flex h-full flex-col pt-0">
              <div className="-mt-3 mb-0 flex items-center justify-center gap-2.5">
                <div className="text-[2.02rem] font-extrabold tracking-[-0.03em] text-[var(--text-primary)] [font-family:var(--font-logo)] sm:text-[2.2rem]">
                  Pill<span className="bg-[linear-gradient(90deg,#F45BA6_0%,#8B5CF6_100%)] bg-clip-text text-transparent">Path</span>
                </div>
                <div className="rounded-full bg-[linear-gradient(90deg,#F45BA6_0%,#8B5CF6_100%)] px-3 py-1.5 text-[0.96rem] font-bold text-[#FFFFFF] shadow-[0_12px_30px_rgba(244,91,166,0.15)]">
                  Plus
                </div>
              </div>

              <div className="mx-auto mt-1 w-full max-w-[340px]">
                <p className="text-left text-[0.94rem] leading-[23px] text-[var(--text-secondary)]">
                  {copy.subtitle}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-3 text-left">
                  {copy.featureGrid.map((item, index) => (
                    <div key={item.label} className="flex items-center gap-2.5 text-[#4B5563]">
                      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#F45BA6]">
                        {item.icon}
                      </span>
                      <span
                        className={`text-[14px] leading-[21px] ${
                          index % 2 === 0 ? "whitespace-nowrap" : "whitespace-normal"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5 mt-4 grid grid-cols-2 gap-[12px] text-center">
                {(Object.entries(plans) as Array<[PaywallPlanKey, PaywallPlanCopy]>).map(([key, plan]) => {
                  const selected = selectedPlan === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlan(key)}
                      className={`relative min-h-[138px] rounded-[26px] px-[10px] py-[12px] text-center transition ${
                        selected
                          ? "scale-[1.03] border-2 border-[rgba(244,91,166,0.6)] bg-[rgba(244,91,166,0.05)] shadow-[var(--shadow-accent)]"
                          : "border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-soft)]"
                      }`}
                    >
                      {plan.badge ? (
                        <div className="absolute right-[12px] top-[8px] rounded-full bg-[#F06AA8] px-[10px] py-[5px] text-[10px] font-bold leading-3 text-[var(--white)] shadow-[0_6px_14px_rgba(240,106,168,0.16)]">
                          {plan.badge}
                        </div>
                      ) : null}
                      <div
                        className={`text-[17px] font-bold leading-[21px] text-[var(--text-primary)] ${
                          plan.badge ? "mt-[22px]" : "mt-[12px]"
                        }`}
                      >
                        {plan.title}
                      </div>
                      <div className="mt-[9px] flex items-baseline justify-center gap-[5px] whitespace-nowrap">
                        <span className="text-[24px] font-extrabold leading-7 tracking-[-0.6px] text-[var(--text-primary)]">
                          {plan.price}
                        </span>
                        <span className="text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
                          {plan.period}
                        </span>
                      </div>
                      {plan.subtitle ? (
                        <p className="mt-[7px] text-[13px] leading-[18px] text-[var(--text-secondary)]">
                          {plan.subtitle}
                        </p>
                      ) : null}
                      <div
                        className={`mx-auto mt-[12px] flex h-[28px] w-[28px] items-center justify-center rounded-full text-[14px] font-extrabold ${
                          selected
                            ? "border-2 border-[#E9D5FF] bg-[#F45BA6] text-[var(--white)]"
                            : "border-2 border-[#E9D5FF] text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  void onUpgrade(selectedPlan);
                }}
                disabled={isPurchasePending}
                className="h-[54px] w-full rounded-[26px] bg-[linear-gradient(90deg,#F45BA6_0%,#8B5CF6_100%)] px-5 text-[18px] font-bold leading-6 tracking-[-0.2px] text-[#FFFFFF] shadow-[0_10px_24px_rgba(139,92,246,0.22)] transition active:scale-[0.98] active:opacity-[0.92] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {copy.cta}
              </button>

              <p className="mt-2 w-full text-left text-[12px] leading-[17px] text-[var(--text-muted)]">
                {selectedPlanLegal}
              </p>

              {errorMessage ? (
                <p className="mt-2 text-left text-[12px] leading-[17px] text-[#D14343]">
                  {errorMessage}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[13px] font-medium text-[var(--color-pink)]">
                <button
                  type="button"
                  onClick={() => {
                    void onRestorePurchases();
                  }}
                  className="bg-transparent disabled:opacity-60"
                  disabled={isRestorePending}
                >
                  {copy.restore}
                </button>
                <span className="text-[color:color-mix(in_srgb,var(--color-pink)_45%,white)]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    handleLegalNavigation(getTermsOfUseUrl());
                  }}
                  className="bg-transparent"
                >
                  {copy.terms}
                </button>
                <span className="text-[color:color-mix(in_srgb,var(--color-pink)_45%,white)]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    handleLegalNavigation(getPrivacyPolicyUrl());
                  }}
                  className="bg-transparent"
                >
                  {copy.privacy}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
}

export type { PaywallPlanKey } from "./testPaywallCopy";
