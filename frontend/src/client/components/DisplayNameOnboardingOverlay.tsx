import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecoveryCode } from "@shared/api/auth";
import { FullscreenOverlay } from "@shared/components/FullscreenOverlay";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import { updateFamilyMemberProfile } from "@shared/api/families";
import { isRecoveryCodeValid, normalizeRecoveryCode } from "@shared/utils/recoveryCode";
import { tFamily } from "../pages/family/copy";
import { tSettings } from "../pages/settings/copy";
import {
  getDisplayNameOnboardingSkipKey,
  getRecoveryCodeOnboardingSkipKey,
} from "./displayNameOnboardingKeys";
import {
  shouldShowDisplayNameOnboarding,
  shouldShowRecoveryCodeOnboarding,
} from "./profileOnboarding";

export function DisplayNameOnboardingOverlay() {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const accountNeedsProfileCompletion = useAppStore((s) => s.accountNeedsProfileCompletion);
  const accountHasRecoveryCode = useAppStore((s) => s.accountHasRecoveryCode);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const setAccountProfile = useAppStore((s) => s.setAccountProfile);
  const [displayName, setDisplayName] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [step, setStep] = useState<"display-name" | "recovery-code" | null>(null);

  useEffect(() => {
    if (!accountId || typeof window === "undefined") {
      setStep(null);
      return;
    }
    if (step === "recovery-code") {
      return;
    }
    const didSkipDisplayName =
      window.sessionStorage.getItem(getDisplayNameOnboardingSkipKey(accountId)) === "1";
    const didSkipRecoveryCode =
      window.sessionStorage.getItem(getRecoveryCodeOnboardingSkipKey(accountId)) === "1";
    if (
      shouldShowDisplayNameOnboarding({
        accountId,
        needsProfileCompletion: accountNeedsProfileCompletion,
        didSkipDisplayName,
      })
    ) {
      setStep("display-name");
      return;
    }
    if (
      shouldShowRecoveryCodeOnboarding({
        accountId,
        hasRecoveryCode: accountHasRecoveryCode,
        didSkipRecoveryCode,
      })
    ) {
      setStep("recovery-code");
      return;
    }
    setStep(null);
  }, [accountHasRecoveryCode, accountId, accountNeedsProfileCompletion, step]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error("Account is not ready");
      }
      return updateFamilyMemberProfile(accountId, {
        display_name: displayName.trim(),
        relationship_label: relationshipLabel.trim() || null,
      });
    },
    onSuccess: (member) => {
      setAccountProfile({ displayName: member.displayName });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["family-members"] }),
        queryClient.invalidateQueries({ queryKey: ["family-members", currentFamilyId] }),
        queryClient.invalidateQueries({ queryKey: ["families", "me", "members", currentFamilyId] }),
      ]);
      if (
        shouldShowRecoveryCodeOnboarding({
          accountId,
          hasRecoveryCode: accountHasRecoveryCode,
          didSkipRecoveryCode:
            typeof window !== "undefined" && accountId
              ? window.sessionStorage.getItem(getRecoveryCodeOnboardingSkipKey(accountId)) === "1"
              : false,
        })
      ) {
        setStep("recovery-code");
      } else {
        setStep(null);
      }
      setDisplayName("");
      setRelationshipLabel("");
    },
  });

  const recoveryCodeMutation = useMutation({
    mutationFn: async () =>
      updateRecoveryCode({ recovery_code: normalizeRecoveryCode(recoveryCode) }),
    onSuccess: () => {
      setAccountProfile({ hasRecoveryCode: true });
      if (typeof window !== "undefined" && accountId) {
        window.sessionStorage.setItem(getRecoveryCodeOnboardingSkipKey(accountId), "1");
      }
      setRecoveryCode("");
      setStep(null);
    },
  });

  const isOpen = step !== null;

  const closeRecoveryStep = () => {
    if (typeof window !== "undefined" && accountId) {
      window.sessionStorage.setItem(getRecoveryCodeOnboardingSkipKey(accountId), "1");
    }
    setRecoveryCode("");
    setStep(null);
  };

  const closeDisplayStep = () => {
    if (typeof window !== "undefined" && accountId) {
      window.sessionStorage.setItem(getDisplayNameOnboardingSkipKey(accountId), "1");
    }
    setDisplayName("");
    setRelationshipLabel("");
    if (
      shouldShowRecoveryCodeOnboarding({
        accountId,
        hasRecoveryCode: accountHasRecoveryCode,
        didSkipRecoveryCode:
          typeof window !== "undefined" && accountId
            ? window.sessionStorage.getItem(getRecoveryCodeOnboardingSkipKey(accountId)) === "1"
            : false,
      })
    ) {
      setStep("recovery-code");
      return;
    }
    setStep(null);
  };

  return (
    <FullscreenOverlay
      isOpen={isOpen}
      onClose={step === "recovery-code" ? closeRecoveryStep : closeDisplayStep}
      backLabel={language === "ru" ? "Пропустить" : "Skip"}
      title={
        step === "recovery-code"
          ? language === "ru"
            ? "Добавьте секретную фразу"
            : "Add a recovery phrase"
          : language === "ru"
            ? "Как вас показывать в семье?"
            : "How should the family see you?"
      }
      hint={
        step === "recovery-code"
          ? language === "ru"
            ? "Если забудете пароль, эта фраза поможет быстро вернуть доступ. Позже её можно поменять в настройках."
            : "If you forget your password, this phrase helps restore access quickly. You can change it later in settings."
          : language === "ru"
            ? "Это имя будет видно в семейной ленте, аптечке и отметках о приёмах."
            : "This name appears in the family timeline, medicine cabinet, and medication logs."
      }
      maxWidthClassName="max-w-[28rem]"
      closeDisabled={saveMutation.isPending || recoveryCodeMutation.isPending}
    >
      <div className="soft-panel rounded-[28px] p-5 sm:p-6">
        {step === "recovery-code" ? (
          <>
            <label className="block">
              <span className="soft-field-label">
                {language === "ru" ? "Секретная фраза" : "Recovery phrase"}
              </span>
              <input
                type="text"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                className="soft-input mt-2 w-full px-4"
                placeholder={tSettings(language, "recoveryCodePlaceholder")}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>

            {recoveryCodeMutation.isError ? (
              <p className="soft-note-danger mt-4">
                {(recoveryCodeMutation.error as { response?: { data?: { detail?: string } } })
                  ?.response?.data?.detail ?? tSettings(language, "recoveryCodeTooShort")}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeRecoveryStep}
                className="app-btn-secondary-md soft-button-secondary inline-flex min-h-[2.8rem] flex-1 items-center justify-center px-4"
              >
                {language === "ru" ? "Позже" : "Later"}
              </button>
              <button
                type="button"
                onClick={() => recoveryCodeMutation.mutate()}
                disabled={recoveryCodeMutation.isPending || !isRecoveryCodeValid(recoveryCode)}
                className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.8rem] flex-1 items-center justify-center px-4 disabled:opacity-50"
              >
                {recoveryCodeMutation.isPending
                  ? language === "ru"
                    ? "Сохраняем…"
                    : "Saving…"
                  : language === "ru"
                    ? "Сохранить"
                    : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4">
              <label className="block">
                <span className="soft-field-label">
                  {language === "ru" ? "Имя в семье" : "Family name"}
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="soft-input mt-2 w-full px-4"
                  placeholder={language === "ru" ? "Например: Аня" : "Example: Anna"}
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="soft-field-label">{tFamily(language, "relationship")}</span>
                <input
                  type="text"
                  value={relationshipLabel}
                  onChange={(event) => setRelationshipLabel(event.target.value)}
                  className="soft-input mt-2 w-full px-4"
                  placeholder={tFamily(language, "relationshipPlaceholder")}
                  autoComplete="off"
                />
              </label>
            </div>

            {saveMutation.isError ? (
              <p className="soft-note-danger mt-4">
                {(saveMutation.error as { response?: { data?: { detail?: string } } })?.response
                  ?.data?.detail ??
                  (language === "ru"
                    ? "Не удалось сохранить имя."
                    : "Could not save the name.")}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeDisplayStep}
                className="app-btn-secondary-md soft-button-secondary inline-flex min-h-[2.8rem] flex-1 items-center justify-center px-4"
              >
                {language === "ru" ? "Позже" : "Later"}
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !displayName.trim()}
                className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.8rem] flex-1 items-center justify-center px-4 disabled:opacity-50"
              >
                {saveMutation.isPending
                  ? language === "ru"
                    ? "Сохраняем…"
                    : "Saving…"
                  : language === "ru"
                    ? "Сохранить"
                    : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </FullscreenOverlay>
  );
}
