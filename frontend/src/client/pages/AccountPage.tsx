import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateAccountProfile } from "@shared/api/auth";
import { fetchMyFamilyMembers, updateFamilyMemberProfile } from "@shared/api/families";
import { PageIntro } from "@shared/components/PageIntro";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";

const accountCopy = {
  ru: {
    title: "Профиль",
    subtitle: "Личные данные аккаунта.",
    name: "Имя",
    login: "Логин",
    email: "Email",
    role: "Роль",
    language: "Язык",
    theme: "Тема",
    notSet: "Не указано",
    owner: "Владелец",
    member: "Участник",
    light: "Светлая",
    dark: "Тёмная",
    auto: "Авто",
    edit: "Редактировать профиль",
    editTitle: "Редактировать профиль",
    editHint: "Личные данные видны взрослым участникам вашей семьи.",
    displayName: "Имя",
    displayNamePlaceholder: "Например: Анна",
    relationship: "Кем приходитесь",
    relationshipPlaceholder: "Например: мама, папа, бабушка",
    phone: "Телефон",
    emailPlaceholder: "name@example.com",
    save: "Сохранить",
    saving: "Сохраняем…",
    back: "Назад",
    invalidEmail: "Укажите корректный email.",
    updateFailed: "Не удалось сохранить профиль.",
    openSettings: "Открыть настройки приложения",
  },
  en: {
    title: "Profile",
    subtitle: "Personal account details.",
    name: "Name",
    login: "Login",
    email: "Email",
    role: "Role",
    language: "Language",
    theme: "Theme",
    notSet: "Not set",
    owner: "Owner",
    member: "Member",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    edit: "Edit profile",
    editTitle: "Edit profile",
    editHint: "Personal details are visible to adult members of your family.",
    displayName: "Name",
    displayNamePlaceholder: "Example: Anna",
    relationship: "Relationship",
    relationshipPlaceholder: "Example: mom, dad, grandma",
    phone: "Phone",
    emailPlaceholder: "name@example.com",
    save: "Save",
    saving: "Saving…",
    back: "Back",
    invalidEmail: "Enter a valid email.",
    updateFailed: "Could not save the profile.",
    openSettings: "Open app settings",
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(accountDisplayName ?? "");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(accountEmail ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const copy = accountCopy[language];
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family-members"],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(accountId && isEditingProfile),
  });
  const currentMember = familyMembers.find((member) => member.id === accountId) ?? null;
  const themeLabel = theme === "light" ? copy.light : theme === "dark" ? copy.dark : copy.auto;
  const roleLabel =
    accountFamilyRole === "owner"
      ? copy.owner
      : accountFamilyRole === "adult"
        ? copy.member
        : copy.notSet;
  const profileTitleName = accountDisplayName || accountLogin || copy.notSet;

  useEffect(() => {
    if (!isEditingProfile) {
      return;
    }
    setDisplayName(currentMember?.displayName || accountDisplayName || "");
    setRelationshipLabel(currentMember?.relationshipLabel || "");
    setPhone(currentMember?.phone || "");
    setEmail(accountEmail || "");
    setFormError(null);
  }, [accountDisplayName, accountEmail, currentMember, isEditingProfile]);

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
      setIsEditingProfile(false);
    },
    onError: (error: { message?: string; response?: { data?: { detail?: string } } }) => {
      setFormError(error.response?.data?.detail ?? error.message ?? copy.updateFailed);
    },
  });

  if (isEditingProfile) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <div className="app-section-path hidden sm:flex">
          <button
            type="button"
            onClick={() => setIsEditingProfile(false)}
            className="app-section-path__back"
          >
            {language === "ru" ? "← К профилю" : "← Back to profile"}
          </button>
          <span className="app-section-path__label">
            {language === "ru" ? "Профиль / Редактирование" : "Profile / Edit"}
          </span>
        </div>

        <div className="space-y-1 px-1">
          <h1 className="app-card-title">
            {copy.editTitle} · {profileTitleName}
          </h1>
          <p className="text-sm text-muted">{copy.editHint}</p>
        </div>

        <Surface className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="soft-field-label">{copy.displayName}</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.displayNamePlaceholder}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="soft-field-label">{copy.relationship}</span>
              <input
                type="text"
                value={relationshipLabel}
                onChange={(event) => setRelationshipLabel(event.target.value)}
                className="soft-input w-full px-4"
                placeholder={copy.relationshipPlaceholder}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="soft-field-label">{copy.phone}</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="soft-input w-full px-4"
                placeholder="+375 ..."
              />
            </label>
            <label className="block space-y-1.5">
              <span className="soft-field-label">{copy.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFormError(null);
                }}
                className="soft-input w-full px-4"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
              />
            </label>
          </div>

          {formError ? (
            <div className="soft-note-danger mt-4 rounded-2xl px-4 py-3 text-sm">{formError}</div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveProfileMutation.mutate()}
              disabled={saveProfileMutation.isPending || !displayName.trim()}
              className="app-btn-primary-md soft-button-primary inline-flex min-h-[2.95rem] items-center justify-center px-4 disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5"
            >
              {saveProfileMutation.isPending ? copy.saving : copy.save}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              disabled={saveProfileMutation.isPending}
              className="soft-pill inline-flex min-h-[2.4rem] items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-semibold tracking-[-0.015em] text-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {copy.back}
            </button>
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        compactOnMobile
        className="app-safe-top-standalone"
      />

      <Surface className="p-5 sm:p-6">
        <div className="soft-panel-muted rounded-[24px] px-4 py-4 sm:px-5">
          <div className="grid gap-2.5 text-[0.95rem] leading-6 text-foreground">
            <p>
              <span className="font-semibold text-muted">{copy.name}: </span>
              {accountDisplayName || copy.notSet}
            </p>
            <p>
              <span className="font-semibold text-muted">{copy.login}: </span>
              {accountLogin ? `@${accountLogin}` : copy.notSet}
            </p>
            <p>
              <span className="font-semibold text-muted">{copy.email}: </span>
              {accountEmail || copy.notSet}
            </p>
            <p>
              <span className="font-semibold text-muted">{copy.role}: </span>
              {roleLabel}
            </p>
            <p>
              <span className="font-semibold text-muted">{copy.language}: </span>
              {language === "en" ? "EN" : "RU"}
            </p>
            <p>
              <span className="font-semibold text-muted">{copy.theme}: </span>
              {themeLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="soft-pill inline-flex min-h-[2.4rem] items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-semibold tracking-[-0.015em] text-foreground transition hover:opacity-90"
          >
            {copy.edit}
          </button>
          <Link to="/settings" className="app-btn-primary-md soft-button-primary px-4">
            {copy.openSettings}
          </Link>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{copy.editHint}</p>
      </Surface>
    </div>
  );
}
