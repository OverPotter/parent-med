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
  const isDe = locale === "de";
  const isPl = locale === "pl";

  if (isFamilyOwner) {
    return isRu ? "Владелец семьи" : isDe ? "Familieninhaber" : isPl ? "Właściciel rodziny" : "Family owner";
  }

  if (familyRole === "admin") {
    return isRu ? "Администратор семьи" : isDe ? "Familienadministrator" : isPl ? "Administrator rodziny" : "Family admin";
  }

  return isRu ? "Участник семьи" : isDe ? "Familienmitglied" : isPl ? "Członek rodziny" : "Family member";
}

export function buildMoreScreenContent(
  locale: MobileLocale,
  session: MobileAuthSession,
): MoreScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const isFamilyOwner =
    session.family.ownerAccountId != null &&
    session.family.ownerAccountId === session.account.id;
  const roleLabel = mapFamilyRole({
    familyRole: session.account.familyRole,
    isFamilyOwner,
    locale,
  });

  return {
    title: isRu ? "Ещё" : isDe ? "Mehr" : isPl ? "Więcej" : "More",
    subtitle: isRu
      ? "Профиль, семейные настройки и полезные переходы в одном спокойном месте."
      : isDe
        ? "Profil, Familieneinstellungen und nützliche Bereiche an einem ruhigen Ort."
      : isPl
        ? "Profil, ustawienia rodziny i przydatne przejścia w jednym spokojnym miejscu."
      : "Profile, family settings, and utility links in one calm place.",
    sectionTitle: isRu ? "Разделы" : isDe ? "Bereiche" : isPl ? "Sekcje" : "Sections",
    accountDescription: session.family.name,
    familyNameLabel: isRu ? "Название семьи" : isDe ? "Familienname" : isPl ? "Nazwa rodziny" : "Family name",
    displayNameLabel: isRu ? "Имя в семье" : isDe ? "Name in der Familie" : isPl ? "Imię w rodzinie" : "Name in family",
    phoneLabel: isRu ? "Телефон" : isDe ? "Telefon" : isPl ? "Telefon" : "Phone",
    relationshipLabel: isRu ? "Кто я в семье" : isDe ? "Wer ich in der Familie bin" : isPl ? "Kim jestem w rodzinie" : "Who I am in the family",
    logoutLabel: isRu ? "Выйти из аккаунта" : isDe ? "Abmelden" : isPl ? "Wyloguj się" : "Log out",
    familyRoleLabel: roleLabel,
    noPhoneValue: isRu ? "Телефон не добавлен" : isDe ? "Noch keine Telefonnummer" : isPl ? "Telefon nie został dodany" : "No phone yet",
    noRelationshipValue: isRu ? "Роль не указана" : isDe ? "Keine Familienrolle angegeben" : isPl ? "Rola nie została podana" : "No family role yet",
    logoutConfirmTitle: isRu ? "Выйти из аккаунта?" : isDe ? "Vom Konto abmelden?" : isPl ? "Wylogować się?" : "Log out?",
    logoutConfirmCancel: isRu ? "Нет" : isDe ? "Nein" : isPl ? "Nie" : "No",
    logoutConfirmAccept: isRu ? "Да" : isDe ? "Ja" : isPl ? "Tak" : "Yes",
    navItems: [
      {
        key: "family",
        title: isRu ? "Семья" : isDe ? "Familie" : isPl ? "Rodzina" : "Family",
        subtitle: isRu
          ? "Состав семьи, роли и доступ."
          : isDe
            ? "Mitglieder, Rollen und Zugriffsrechte."
          : isPl
            ? "Członkowie rodziny, role i dostęp."
          : "Family members, roles, and access.",
      },
      {
        key: "settings",
        title: isRu ? "Настройки" : isDe ? "Einstellungen" : isPl ? "Ustawienia" : "Settings",
        subtitle: isRu
          ? "Язык, уведомления и приложение."
          : isDe
            ? "Sprache, Benachrichtigungen und App."
          : isPl
            ? "Język, powiadomienia i aplikacja."
          : "Language, notifications, and app preferences.",
      },
      {
        key: "support",
        title: isRu ? "Поддержка" : isDe ? "Support" : isPl ? "Wsparcie" : "Support",
        subtitle: isRu
          ? "Помощь и связь с командой."
          : isDe
            ? "Hilfe und Kontakt zum Team."
          : isPl
            ? "Pomoc i kontakt z zespołem."
          : "Help and contact with the team.",
      },
      {
        key: "terms",
        title: isRu ? "Условия использования" : isDe ? "Nutzungsbedingungen" : isPl ? "Warunki korzystania" : "Terms of Use",
        subtitle: isRu
          ? "Юридические условия сервиса."
          : isDe
            ? "Rechtliche Bedingungen des Dienstes."
          : isPl
            ? "Warunki prawne korzystania z usługi."
          : "Service terms and legal details.",
      },
      {
        key: "privacy",
        title: isRu ? "Политика конфиденциальности" : isDe ? "Datenschutzerklärung" : isPl ? "Polityka prywatności" : "Privacy Policy",
        subtitle: isRu
          ? "Как мы храним и используем данные."
          : isDe
            ? "Wie wir Daten speichern und verwenden."
          : isPl
            ? "Jak przechowujemy i używamy danych."
          : "How data is stored and used.",
      },
    ],
  };
}
