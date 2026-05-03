import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppLanguage } from "@shared/i18n";
import type { RevenueCatPlanKey } from "@shared/utils/revenueCatOfferingSelection";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { getPrivacyPolicyUrl, getTermsOfUseUrl } from "@shared/config/legal";
import { openExternalUrl } from "@shared/utils/openExternalUrl";
import paywallHeader from "../../../design/paywall/paywall_header.png";
import "./paywallTheme.css";
import { useSwipeToDismissSheet } from "./useSwipeToDismissSheet";

type PostRegistrationOfferDialogProps = {
  isOpen: boolean;
  language: AppLanguage;
  isPending?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onClose: () => void;
  onUpgrade: (plan: RevenueCatPlanKey) => void | Promise<unknown>;
  onRestorePurchases: () => void | Promise<unknown>;
};

type OfferCopy = {
  readyBadge: string;
  title: string;
  subtitle: string;
  freeTitle: string;
  freeItems: string[];
  freeForever: string;
  plusTitle: string;
  plusItems: string[];
  plansLabel: string;
  monthlyTitle: string;
  monthlyPrice: string;
  annualTitle: string;
  annualPrice: string;
  annualBadge: string;
  primaryCta: string;
  restore: string;
  terms: string;
  privacyLink: string;
};

type OfferPlanCardProps = {
  title: string;
  price: string;
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
};

function OfferPlanCard({ title, price, badge, isSelected, onSelect }: OfferPlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-[20px] px-3 py-2.5 text-center transition ${
        isSelected
          ? "border-2 border-[rgba(244,91,166,0.55)] bg-[rgba(244,91,166,0.06)] shadow-[0_16px_34px_rgba(244,91,166,0.10)]"
          : "border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-soft)]"
      }`}
    >
      {badge ? (
        <div className="absolute -right-[2px] -top-[2px] rounded-tr-[22px] rounded-bl-[18px] bg-[#F06AA8] px-3 py-1.5 text-center text-[9px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(240,106,168,0.16)]">
          {badge}
        </div>
      ) : null}
      <div className="text-[12px] font-bold text-[var(--text-primary)]">{title}</div>
      <div className="mt-1 text-[18px] font-extrabold tracking-[-0.04em] text-[var(--text-primary)]">
        {price}
      </div>
      <div className="mt-1.5 flex justify-center">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-[13px] font-bold ${
            isSelected ? "border-[#F06AA8] bg-[#F45BA6] text-white" : "border-[#E8D8F5] text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
    </button>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 stroke-current">
      <path
        d="M10 16.1 4.6 11c-1.7-1.6-1.8-4.3-.2-6 .8-.8 1.8-1.2 2.9-1.2 1.2 0 2.3.5 3.1 1.5.8-1 1.9-1.5 3.1-1.5 1.1 0 2.2.4 2.9 1.2 1.6 1.7 1.5 4.4-.2 6L10 16.1Z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="m10 2.8 1.9 4 4.4.5-3.2 3 1 4.4-4.1-2.2-4.1 2.2 1-4.4-3.2-3 4.4-.5 1.9-4Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] stroke-current">
      <circle cx="10" cy="10" r="7.1" strokeWidth="1.6" />
      <path d="m7.1 10.2 1.8 1.8 4-4.3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getOfferCopy(language: AppLanguage): OfferCopy {
  if (language === "ru") {
    return {
      readyBadge: "Аккаунт создан",
      title: "Начните бесплатно или с Plus",
      subtitle: "Выберите подходящий режим для заботы о семье.",
      freeTitle: "Free",
      freeItems: [
        "1 взрослый аккаунт",
        "1 ребёнок",
        "1 план лекарств",
        "Домашняя аптечка",
        "Уведомления",
        "Аналитика",
      ],
      freeForever: "Бесплатно навсегда",
      plusTitle: "Plus",
      plusItems: [
        "Всё из Free, а ещё:",
        "Вся семья и приглашения",
        "Безлимит детей",
        "Справочник лекарств",
        "Доступы и приватность",
        "Live Activities",
        "Экспорт CSV / Excel",
      ],
      plansLabel: "Выберите план Plus",
      monthlyTitle: "Месяц",
      monthlyPrice: "5,99 $",
      annualTitle: "Год",
      annualPrice: "49,99 $",
      annualBadge: "Выгоднее",
      primaryCta: "Начать 7-дневный период",
      restore: "Восстановить покупки",
      terms: "Условия",
      privacyLink: "Конфиденциальность",
    };
  }

  return {
    readyBadge: "Account created",
    title: "Start with Free or Plus",
    subtitle: "Choose the setup that fits your family care flow.",
    freeTitle: "Free",
    freeItems: [
      "1 adult account",
      "1 child",
      "1 medication plan",
      "Medicine cabinet",
      "Notifications",
      "Analytics",
    ],
    freeForever: "Free forever",
    plusTitle: "Plus",
    plusItems: [
      "Everything in Free, plus:",
      "Whole family and invites",
      "Unlimited children",
      "Medicine guide",
      "Access and privacy controls",
      "Live Activities",
      "CSV / Excel export",
    ],
    plansLabel: "Choose a Plus plan",
    monthlyTitle: "Month",
    monthlyPrice: "$5.99",
    annualTitle: "Year",
    annualPrice: "$49.99",
    annualBadge: "Best value",
    primaryCta: "Start 7-day trial",
    restore: "Restore purchases",
    terms: "Terms",
    privacyLink: "Privacy",
  };
}

export function PostRegistrationOfferDialog({
  isOpen,
  language,
  isPending = false,
  errorMessage = null,
  successMessage = null,
  onClose,
  onUpgrade,
  onRestorePurchases,
}: PostRegistrationOfferDialogProps) {
  const copy = useMemo(() => getOfferCopy(language), [language]);
  const [selectedPlan, setSelectedPlan] = useState<RevenueCatPlanKey>("annual");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { sheetOffsetY, isSheetDismissAnimating, handleTouchEnd, handleTouchMove, handleTouchStart } =
    useSwipeToDismissSheet({
      isOpen,
      onDismiss: isPending ? () => undefined : onClose,
      scrollRef,
    });

  if (!isOpen) {
    return null;
  }

  const handleLegalNavigation = (url: string) => {
    onClose();
    if (url.startsWith("/")) {
      navigate(url);
      return;
    }
    void openExternalUrl(url);
  };
  const legalLinks = [
    { key: "restore", label: copy.restore, onClick: () => void onRestorePurchases(), disabled: isPending },
    { key: "terms", label: copy.terms, onClick: () => handleLegalNavigation(getTermsOfUseUrl()), disabled: false },
    { key: "privacy", label: copy.privacyLink, onClick: () => handleLegalNavigation(getPrivacyPolicyUrl()), disabled: false },
  ] as const;

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={isPending}
      closeOnBackdrop={false}
      placement="bottom"
      zIndexClassName="z-[230]"
      backdropAriaLabel={language === "ru" ? "Закрыть предложение Plus" : "Close Plus offer"}
      containerClassName="flex items-end justify-center p-0 sm:p-4"
      backdropClassName="bg-[rgba(15,23,42,0.52)] backdrop-blur-md"
    >
      <div
        className={`pillpath-paywall-theme relative z-[1] flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden will-change-transform sm:h-auto sm:max-h-[96dvh] sm:rounded-[34px] sm:shadow-[0_32px_90px_rgba(15,23,42,0.28)] ${
          isSheetDismissAnimating ? "transition-transform duration-300 ease-out" : ""
        }`}
        style={{ transform: `translateY(${sheetOffsetY}px)` }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[linear-gradient(180deg,#FFD5E6_0%,#FFE2F0_42%,#F6E1FF_72%,rgba(246,225,255,0)_100%)]"
        />
        <div
          className="absolute inset-x-0 top-0 z-[2] h-[calc(env(safe-area-inset-top)+52px)] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <div
          ref={scrollRef}
          className="relative flex h-full touch-pan-y flex-col overflow-y-auto overflow-x-hidden bg-[#FFF1F8] [overscroll-behavior-y:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="relative h-[23vh] min-h-[188px] max-h-[236px] shrink-0 overflow-hidden bg-[#FFF1F8]"
            style={{
              borderBottomLeftRadius: "50% 18%",
              borderBottomRightRadius: "50% 18%",
            }}
          >
            <img
              src={paywallHeader}
              alt=""
              className="h-full w-full scale-[1.04] object-cover [object-position:center_top]"
            />
            <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,224,238,0.10)_48%,rgba(255,241,248,0.22)_100%)]" />
          </div>

          <div className="relative flex-1 bg-[#FFF1F8] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto flex max-w-[360px] flex-col">
              <div className="mx-auto mt-1 rounded-full border border-[#A9E1B9] bg-[#F2FFF6] px-3 py-1 text-[12px] font-semibold text-[#2F9E57] shadow-[0_10px_24px_rgba(47,158,87,0.10)]">
                {copy.readyBadge}
              </div>

              <h2 className="mt-2.5 text-center text-[1.52rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-center text-[0.89rem] leading-[1.4] text-[var(--text-secondary)]">
                {copy.subtitle}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-[22px] bg-[linear-gradient(180deg,#F3F8FF_0%,#EAF2FF_100%)] p-3 shadow-[0_18px_40px_rgba(86,134,255,0.10)]">
                  <div className="flex items-center gap-2 text-[#4677DA]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE8FF] text-[#5A8FFF] shadow-[0_6px_16px_rgba(86,134,255,0.10)]">
                      <HeartIcon />
                    </span>
                    <div className="text-[1rem] font-bold">{copy.freeTitle}</div>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {copy.freeItems.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-[#4B5563]">
                        <span className="mt-[1px] text-[#76A2FF]">
                          <CheckCircleIcon />
                        </span>
                        <span className="text-[12px] leading-[1.25]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[11px] font-semibold text-[#3F6FD1]">{copy.freeForever}</div>
                </div>

                <div className="rounded-[22px] border border-[rgba(244,91,166,0.18)] bg-[linear-gradient(180deg,#FFE6F1_0%,#FFD7E8_100%)] p-3 shadow-[0_18px_40px_rgba(244,91,166,0.16)]">
                  <div className="flex items-center gap-2 text-[#F25797]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F45BA6] text-white shadow-[0_8px_18px_rgba(244,91,166,0.18)]">
                      <StarIcon />
                    </span>
                    <div className="text-[1rem] font-bold">{copy.plusTitle}</div>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {copy.plusItems.map((item, index) => (
                      <div key={item} className={`flex items-start gap-2 ${index === 0 ? "text-[#8B5CF6]" : "text-[#4B5563]"}`}>
                        {index === 0 ? null : (
                          <span className="mt-[1px] text-[#FF6A9E]">
                            <CheckCircleIcon />
                          </span>
                        )}
                        <span className={`text-[12px] leading-[1.25] ${index === 0 ? "font-semibold text-[#F25797]" : ""}`}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C25A95]">
                {copy.plansLabel}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <OfferPlanCard
                  title={copy.annualTitle}
                  price={copy.annualPrice}
                  badge={copy.annualBadge}
                  isSelected={selectedPlan === "annual"}
                  onSelect={() => setSelectedPlan("annual")}
                />
                <OfferPlanCard
                  title={copy.monthlyTitle}
                  price={copy.monthlyPrice}
                  isSelected={selectedPlan === "monthly"}
                  onSelect={() => setSelectedPlan("monthly")}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  void onUpgrade(selectedPlan);
                }}
                disabled={isPending}
                className="mt-3 h-[47px] w-full rounded-[22px] bg-[linear-gradient(90deg,#F45BA6_0%,#8B5CF6_100%)] px-5 text-[15px] font-bold leading-6 tracking-[-0.2px] text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {copy.primaryCta}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2 h-[43px] w-full rounded-[20px] border border-[rgba(124,95,255,0.36)] bg-white/82 px-5 text-[13px] font-semibold text-[#6C4AE4] shadow-[0_12px_28px_rgba(15,23,42,0.05)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPending}
              >
                {language === "ru" ? "Продолжить бесплатно" : "Continue with Free"}
              </button>

              {errorMessage ? (
                <p className="mt-2.5 text-left text-[12px] leading-[17px] text-[#D14343]">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="pillpath-paywall-success mt-2.5 rounded-[18px] px-4 py-3 text-left text-[12px] font-semibold leading-[17px]">
                  {successMessage}
                </p>
              ) : null}

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[13px] font-medium text-[var(--color-pink)]">
                {legalLinks.map((item, index) => (
                  <div key={item.key} className="contents">
                    {index > 0 ? (
                      <span className="text-[color:color-mix(in_srgb,var(--color-pink)_45%,white)]">|</span>
                    ) : null}
                    <button type="button" onClick={item.onClick} className="bg-transparent" disabled={item.disabled}>
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
}

export type { RevenueCatPlanKey as PaywallPlanKey };
