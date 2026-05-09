import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

type MoreNavItem = {
  key: "family" | "settings" | "support" | "terms" | "privacy";
  title: string;
  subtitle: string;
};

export type MoreScreenContent = {
  title: string;
  subtitle: string;
  sectionTitle: string;
  accountDescription: string;
  familyNameLabel: string;
  displayNameLabel: string;
  phoneLabel: string;
  relationshipLabel: string;
  logoutLabel: string;
  familyRoleLabel: string;
  noPhoneValue: string;
  noRelationshipValue: string;
  logoutConfirmTitle: string;
  logoutConfirmCancel: string;
  logoutConfirmAccept: string;
  navItems: MoreNavItem[];
};

function mapFamilyRole({
  familyRole,
  isFamilyOwner,
  locale,
}: {
  familyRole: string;
  isFamilyOwner: boolean;
  locale: MobileLocale;
}) {
  const isRu = locale === "ru";

  if (isFamilyOwner) {
    return isRu ? "Владелец семьи" : "Family owner";
  }

  if (familyRole === "admin") {
    return isRu ? "Администратор семьи" : "Family admin";
  }

  return isRu ? "Участник семьи" : "Family member";
}

export function buildMoreScreenContent(
  locale: MobileLocale,
  session: MobileAuthSession,
): MoreScreenContent {
  const isRu = locale === "ru";
  const isFamilyOwner =
    session.family.ownerAccountId != null &&
    session.family.ownerAccountId === session.account.id;
  const roleLabel = mapFamilyRole({
    familyRole: session.account.familyRole,
    isFamilyOwner,
    locale,
  });

  return {
    title: isRu ? "Ещё" : "More",
    subtitle: isRu
      ? "Профиль, семейные настройки и полезные переходы в одном спокойном месте."
      : "Profile, family settings, and utility links in one calm place.",
    sectionTitle: isRu ? "Разделы" : "Sections",
    accountDescription: session.family.name,
    familyNameLabel: isRu ? "Название семьи" : "Family name",
    displayNameLabel: isRu ? "Имя в семье" : "Family name",
    phoneLabel: isRu ? "Телефон" : "Phone",
    relationshipLabel: isRu ? "Кто я в семье" : "Who I am in family",
    logoutLabel: isRu ? "Выйти из аккаунта" : "Log out",
    familyRoleLabel: roleLabel,
    noPhoneValue: isRu ? "Телефон не добавлен" : "No phone yet",
    noRelationshipValue: isRu ? "Роль не указана" : "No family title yet",
    logoutConfirmTitle: isRu ? "Выйти из аккаунта?" : "Log out?",
    logoutConfirmCancel: isRu ? "Нет" : "No",
    logoutConfirmAccept: isRu ? "Да" : "Yes",
    navItems: [
      {
        key: "family",
        title: isRu ? "Семья" : "Family",
        subtitle: isRu
          ? "Состав семьи, роли и доступ."
          : "Family members, roles, and access.",
      },
      {
        key: "settings",
        title: isRu ? "Настройки" : "Settings",
        subtitle: isRu
          ? "Язык, уведомления и приложение."
          : "Language, notifications, and app preferences.",
      },
      {
        key: "support",
        title: isRu ? "Поддержка" : "Support",
        subtitle: isRu
          ? "Помощь и связь с командой."
          : "Help and contact with the team.",
      },
      {
        key: "terms",
        title: isRu ? "Условия использования" : "Terms of Use",
        subtitle: isRu
          ? "Юридические условия сервиса."
          : "Service terms and legal details.",
      },
      {
        key: "privacy",
        title: isRu ? "Политика конфиденциальности" : "Privacy Policy",
        subtitle: isRu
          ? "Как мы храним и используем данные."
          : "How data is stored and used.",
      },
    ],
  };
}
