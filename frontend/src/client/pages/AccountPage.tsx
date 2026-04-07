import { Link } from "react-router-dom";
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
    editHint: "Профиль участника редактируется в разделе «Семья».",
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
    editHint: "Member profile is edited in the Family section.",
    openSettings: "Open app settings",
  },
} as const;

export function AccountPage() {
  const { language } = useI18n();
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountEmail = useAppStore((s) => s.accountEmail);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const theme = useAppStore((s) => s.theme);

  const copy = accountCopy[language];
  const themeLabel =
    theme === "light" ? copy.light : theme === "dark" ? copy.dark : copy.auto;
  const roleLabel =
    accountFamilyRole === "owner"
      ? copy.owner
      : accountFamilyRole === "adult"
        ? copy.member
        : copy.notSet;

  return (
    <div className="min-w-0 space-y-6">
      <PageIntro
        title={copy.title}
        subtitle={copy.subtitle}
        compactOnMobile
        hideOnMobile
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
          <Link
            to="/family?edit=profile"
            className="app-btn-secondary-md soft-button-secondary px-4"
          >
            {copy.edit}
          </Link>
          <Link to="/settings" className="app-btn-primary-md soft-button-primary px-4">
            {copy.openSettings}
          </Link>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{copy.editHint}</p>
      </Surface>
    </div>
  );
}
