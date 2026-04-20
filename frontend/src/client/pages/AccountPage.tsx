import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateAccountProfile } from "@shared/api/auth";
import { fetchMyFamilyMembers, updateFamilyMemberProfile } from "@shared/api/families";
import { FullscreenOverlay } from "@shared/components/FullscreenOverlay";
import { PageIntro } from "@shared/components/PageIntro";
import { RowSurface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import {
  appBtnJournalPrimaryClass,
  appBtnJournalSecondaryClass,
  SectionTitle,
} from "./child-illness/shared";

const PROFILE_DIALOG_HISTORY_KEY = "__pm_account_profile_dialog__";

const accountCopy = {
  ru: {
    title: "Профиль",
    subtitle: "Личные данные и основные параметры аккаунта.",
    detailsTitle: "Данные аккаунта",
    detailsHint: "Основные данные аккаунта.",
    settingsTitle: "Параметры приложения",
    settingsHint: "Язык и тема.",
    name: "Имя",
    login: "Логин",
    email: "Email",
    phone: "Телефон",
    relationship: "Кто вы в семье",
    role: "Роль",
    language: "Язык",
    theme: "Тема",
    notSet: "Не указано",
    owner: "Владелец",
    member: "Участник",
    light: "День",
    dark: "Ночь",
    auto: "Авто",
    edit: "Редактировать профиль",
    editTitle: "Редактировать профиль",
    editHint: "Изменения увидят взрослые участники вашей семьи.",
    displayName: "Имя",
    displayNamePlaceholder: "Например: Анна",
    relationshipPlaceholder: "Например: мама, папа, бабушка",
    phonePlaceholder: "+375 ...",
    emailPlaceholder: "name@example.com",
    save: "Сохранить",
    saving: "Сохраняем…",
    invalidEmail: "Укажите корректный email.",
    updateFailed: "Не удалось сохранить профиль.",
    openSettings: "Открыть настройки",
  },
  en: {
    title: "Profile",
    subtitle: "Personal details and key account preferences.",
    detailsTitle: "Account details",
    detailsHint: "Main account details.",
    settingsTitle: "App preferences",
    settingsHint: "Language and theme.",
    name: "Name",
    login: "Login",
    email: "Email",
    phone: "Phone",
    relationship: "Relationship",
    role: "Role",
    language: "Language",
    theme: "Theme",
    notSet: "Not set",
    owner: "Owner",
    member: "Member",
    light: "Day",
    dark: "Night",
    auto: "Auto",
    edit: "Edit profile",
    editTitle: "Edit profile",
    editHint: "Changes are visible to adult members of your family.",
    displayName: "Name",
    displayNamePlaceholder: "Example: Anna",
    relationshipPlaceholder: "Example: mom, dad, grandma",
    phonePlaceholder: "+375 ...",
    emailPlaceholder: "name@example.com",
    save: "Save",
    saving: "Saving…",
    invalidEmail: "Enter a valid email.",
    updateFailed: "Could not save the profile.",
    openSettings: "Open settings",
  },
} as const;

export function AccountPage() {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const setAccountProfile = useAppStore((s) => s.setAccountProfile);
  const theme = useAppStore((s) => s.theme);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState(accountDisplayName ?? "");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(accountEmail ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const copy = accountCopy[language];
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family-members"],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(accountId),
  });

  const currentMember = familyMembers.find((member) => member.id === accountId) ?? null;
  const themeLabel = theme === "light" ? copy.light : theme === "dark" ? copy.dark : copy.auto;
  const roleLabel =
    accountFamilyRole === "owner"
      ? copy.owner
      : accountFamilyRole === "adult"
        ? copy.member
        : copy.notSet;

  useEffect(() => {
    if (!isProfileDialogOpen) {
      return;
    }

    setDisplayName(currentMember?.displayName || accountDisplayName || "");
    setRelationshipLabel(currentMember?.relationshipLabel || "");
    setPhone(currentMember?.phone || "");
    setEmail(accountEmail || "");
    setFormError(null);
  }, [accountDisplayName, accountEmail, currentMember, isProfileDialogOpen]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error(copy.updateFailed);
      }

      const normalizedEmail = email.trim().toLowerCase();
      const isValidEmail =
        normalizedEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
      if (!isValidEmail) {
        throw new Error(copy.invalidEmail);
      }

      const member = await updateFamilyMemberProfile(accountId, {
        display_name: displayName.trim() || accountLogin || copy.notSet,
        relationship_label: relationshipLabel.trim() || null,
        phone: phone.trim() || null,
      });
      const account = await updateAccountProfile({ email: normalizedEmail || null });
      return { member, account };
    },
    onSuccess: ({ member, account }) => {
      setAccountProfile({ displayName: member.displayName, email: account.email });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      setFormError(null);
      setIsProfileDialogOpen(false);
    },
    onError: (error: { message?: string; response?: { data?: { detail?: string } } }) => {
      setFormError(error.response?.data?.detail ?? error.message ?? copy.updateFailed);
    },
  });

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Link
            to="/more"
            className="inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
        }
        compactOnMobile
        hideOnMobile
        className="app-safe-top-standalone"
      />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <Link
            to="/more"
            className="mb-1 inline-flex min-h-[2.1rem] items-center text-sm font-extrabold text-primary"
          >
            {language === "ru" ? "← Ещё" : "← More"}
          </Link>
          <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
          <p className="app-mobile-section-intro__hint">{copy.subtitle}</p>
        </div>
      </div>

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle
          title={copy.detailsTitle}
          subtitle={copy.detailsHint}
          action={
            <button
              type="button"
              onClick={() => setIsProfileDialogOpen(true)}
              className={`${appBtnJournalSecondaryClass} min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
            >
              {copy.edit}
            </button>
          }
        />

        <div className="mt-4">
          <div className="grid grid-cols-2 gap-x-6">
            <ProfileGridCell label={copy.name} value={accountDisplayName || copy.notSet} />
            <ProfileGridCell
              label={copy.phone}
              value={currentMember?.phone || copy.notSet}
            />
            <ProfileGridCell
              label={copy.login}
              value={accountLogin ? `@${accountLogin}` : copy.notSet}
              borderedTop
            />
            <ProfileGridCell
              label={copy.role}
              value={roleLabel}
              borderedTop
            />
            <ProfileGridCell
              label={copy.email}
              value={accountEmail || copy.notSet}
              borderedTop
            />
            <ProfileGridCell
              label={copy.relationship}
              value={currentMember?.relationshipLabel || copy.notSet}
              borderedTop
            />
          </div>
        </div>
      </RowSurface>

      <RowSurface className="rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <SectionTitle
          title={copy.settingsTitle}
          subtitle={copy.settingsHint}
          action={
            <Link
              to="/settings"
              className={`${appBtnJournalSecondaryClass} inline-flex min-h-[2.35rem] whitespace-nowrap px-3 text-[0.78rem]`}
            >
              {copy.openSettings}
            </Link>
          }
        />

        <div className="mt-4">
          <ProfileFactRow
            label={copy.settingsTitle}
            value={`${copy.language}: ${language === "en" ? "EN" : "RU"} · ${copy.theme}: ${themeLabel}`}
          />
        </div>
      </RowSurface>

      <ProfileEditDialog
        language={language}
        isOpen={isProfileDialogOpen}
        isPending={saveProfileMutation.isPending}
        displayName={displayName}
        relationshipLabel={relationshipLabel}
        phone={phone}
        email={email}
        formError={formError}
        copy={copy}
        onClose={() => setIsProfileDialogOpen(false)}
        onDisplayNameChange={setDisplayName}
        onRelationshipLabelChange={setRelationshipLabel}
        onPhoneChange={setPhone}
        onEmailChange={(value) => {
          setEmail(value);
          setFormError(null);
        }}
        onSubmit={() => saveProfileMutation.mutate()}
      />
    </div>
  );
}

function ProfileFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <p className="text-xs font-medium tracking-[0.04em] text-muted">{label}</p>
      <p className="text-sm leading-6 text-foreground sm:text-right">{value}</p>
    </div>
  );
}

function ProfileGridCell({
  label,
  value,
  borderedTop = false,
}: {
  label: string;
  value: string;
  borderedTop?: boolean;
}) {
  return (
    <div
      className={[
        "min-w-0 py-3",
        borderedTop
          ? "border-t border-[color:color-mix(in_srgb,var(--color-border)_30%,transparent)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-[0.7rem] font-medium tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-[0.95rem] font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}

function ProfileEditDialog({
  language,
  isOpen,
  isPending,
  displayName,
  relationshipLabel,
  phone,
  email,
  formError,
  copy,
  onClose,
  onDisplayNameChange,
  onRelationshipLabelChange,
  onPhoneChange,
  onEmailChange,
  onSubmit,
}: {
  language: "ru" | "en";
  isOpen: boolean;
  isPending: boolean;
  displayName: string;
  relationshipLabel: string;
  phone: string;
  email: string;
  formError: string | null;
  copy: (typeof accountCopy)["ru"] | (typeof accountCopy)["en"];
  onClose: () => void;
  onDisplayNameChange: (value: string) => void;
  onRelationshipLabelChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const isClosingFromHistoryRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const currentState =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const dialogState = { ...currentState, [PROFILE_DIALOG_HISTORY_KEY]: true };

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
        window.history.state[PROFILE_DIALOG_HISTORY_KEY]
      ) {
        window.history.back();
      }
      isClosingFromHistoryRef.current = false;
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state === "object" &&
      window.history.state[PROFILE_DIALOG_HISTORY_KEY]
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
      backLabel={language === "ru" ? "← Профиль" : "← Profile"}
      title={copy.editTitle}
      hint={copy.editHint}
      maxWidthClassName="max-w-[32rem]"
      closeDisabled={isPending}
    >
      <div className="soft-panel overflow-hidden rounded-[28px] border border-border shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="soft-field-label">{copy.displayName}</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.displayNamePlaceholder}
              />
            </label>

            <label className="block">
              <span className="soft-field-label">{copy.relationship}</span>
              <input
                type="text"
                value={relationshipLabel}
                onChange={(event) => onRelationshipLabelChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.relationshipPlaceholder}
              />
            </label>

            <label className="block">
              <span className="soft-field-label">{copy.phone}</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.phonePlaceholder}
              />
            </label>

            <label className="block">
              <span className="soft-field-label">{copy.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
              />
            </label>

            {formError ? (
              <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm sm:col-span-2">
                {formError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-border/60 p-4 sm:px-5 sm:pb-5 sm:pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !displayName.trim()}
            className={`${appBtnJournalPrimaryClass} w-full justify-center disabled:opacity-50`}
          >
            {isPending ? copy.saving : copy.save}
          </button>
        </div>
      </div>
    </FullscreenOverlay>
  );
}
