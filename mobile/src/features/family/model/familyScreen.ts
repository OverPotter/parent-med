import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../api/familyMembersApi";
import type { ChildCard } from "../../children/model/childrenRedesign";

export type FamilyMemberRole = "owner" | "admin" | "member";
export type FamilyChildrenAccess = "none" | "view" | "act" | "edit";
export type FamilyCabinetAccess = "none" | "view" | "edit";
export type FamilyPillboxAccess = "none" | "view" | "act" | "edit";

export type FamilyUiChild = {
  id: string;
  name: string;
};

export type FamilyUiAccessPolicy = {
  allChildren: boolean;
  childIds: string[];
  childrenAccess: FamilyChildrenAccess;
  cabinetAccess: FamilyCabinetAccess;
  pillboxAccess: FamilyPillboxAccess;
  cabinetPushEnabled: boolean;
};

export type FamilyUiMember = {
  id: string;
  name: string;
  role: FamilyMemberRole;
  relationship: string;
  note: string;
  phone: string | null;
  email: string | null;
  accessPolicy: FamilyUiAccessPolicy;
  isCurrentUser?: boolean;
};

export type FamilyUiState = {
  adultsCount: number;
  childrenCount: number;
  routinesCount: number;
  children: FamilyUiChild[];
  members: FamilyUiMember[];
};

export type FamilyScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  adultsLabel: string;
  childrenLabel: string;
  routinesLabel: string;
  membersTitle: string;
  shareInviteLabel: string;
  copyInviteLabel: string;
  copiedInviteLabel: string;
  accessTitle: string;
  ownerRoleLabel: string;
  adminRoleLabel: string;
  memberRoleLabel: string;
  currentYouLabel: string;
  currentUserNote: string;
  accessSettingsTitle: string;
  profileFactsTitle: string;
  childrenScopeTitle: string;
  childrenAccessTitle: string;
  cabinetAccessTitle: string;
  pillboxAccessTitle: string;
  cabinetPushTitle: string;
  allChildrenLabel: string;
  selectedChildrenLabel: string;
  hiddenLabel: string;
  saveAccessLabel: string;
  editProfileLabel: string;
  manageAccessLabel: string;
  makeAdminLabel: string;
  makeMemberLabel: string;
  removeMemberLabel: string;
  displayNameLabel: string;
  relationshipLabel: string;
  phoneLabel: string;
  noPhoneLabel: string;
  confirmPromoteTitle: string;
  confirmPromoteMessage: string;
  confirmDemoteTitle: string;
  confirmDemoteMessage: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmActionLabel: string;
  cancelActionLabel: string;
  inviteCodeTitle: string;
  inviteReadyDescription: string;
  inviteEmptyDescription: string;
  inviteReadyStatus: string;
  joinFamilyTitle: string;
  joinFamilyDescription: string;
  joinFamilyPlaceholder: string;
  joinFamilyPreviewLabel: (familyName: string) => string;
  joinFamilyVerifyLabel: string;
  joinFamilyVerifyingLabel: string;
  joinFamilySubmitLabel: string;
  joinFamilySubmittingLabel: string;
  joinFamilySuccessTitle: string;
  joinFamilySuccessMessage: (familyName: string) => string;
  memberActionHint: string;
  accessTargetHint: string;
  accessInlineHint: string;
  cabinetPushHint: string;
  editProfileHint: string;
  saveProfileLabel: string;
  roleRuleOwnerDescription: string;
  roleRuleAdminDescription: string;
  roleRuleMemberDescription: string;
  shareInviteMessage: (inviteCode: string) => string;
  genericActionError: string;
  createInviteErrorTitle: string;
  saveAccessErrorTitle: string;
  saveProfileErrorTitle: string;
};

export type FamilyMemberPermissions = {
  canManageAccess: boolean;
  canPromote: boolean;
  canDemote: boolean;
  canDelete: boolean;
  canEditProfile: boolean;
};

function normalizeFamilyMemberRole(role: string): FamilyMemberRole {
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }

  return "member";
}

function getGenericFamilyMemberLabel(locale: MobileLocale) {
  if (locale === "ru") return "Участник семьи";
  if (locale === "de") return "Familienmitglied";
  if (locale === "pl") return "Członek rodziny";
  return "Family member";
}

function buildFamilyMemberNote(params: {
  locale: MobileLocale;
  isCurrentUser: boolean;
  role: FamilyMemberRole;
  accessPolicy: FamilyUiAccessPolicy;
}): string {
  const { locale, isCurrentUser, role, accessPolicy } = params;
  const isRu = locale === "ru";

  if (isCurrentUser) {
    return isRu ? "Это ваш текущий профиль." : "This is your current profile.";
  }

  const childrenScopeAllowed =
    accessPolicy.allChildren || accessPolicy.childIds.length > 0;
  const childrenText = childrenScopeAllowed
    ? childrenAccessLabel(accessPolicy.childrenAccess, locale)
    : isRu
      ? "нет доступа"
      : locale === "de"
        ? "kein Zugriff"
        : locale === "pl"
          ? "brak dostępu"
          : "no access";
  const cabinetText = cabinetAccessLabel(accessPolicy.cabinetAccess, locale).toLowerCase();
  const pillboxText = pillboxAccessLabel(accessPolicy.pillboxAccess, locale).toLowerCase();

  if (isRu) {
    const adminPrefix =
      role === "owner"
        ? "Управляет семьёй."
        : "";

    const accessSentence = `Доступ: дети и журнал — ${childrenText.toLowerCase()}, аптечка — ${cabinetText}, таблетница — ${pillboxText}.`;
    return adminPrefix ? `${adminPrefix} ${accessSentence}` : accessSentence;
  }

  if (locale === "de") {
    const adminPrefix = role === "owner" ? "Verwaltet die Familie." : "";
    const accessSentence = `Zugriff: Kinder und Journal ${childrenText.toLowerCase()}, Hausapotheke ${cabinetText}, Pillendose ${pillboxText}.`;
    return adminPrefix ? `${adminPrefix} ${accessSentence}` : accessSentence;
  }

  if (locale === "pl") {
    const adminPrefix = role === "owner" ? "Zarządza rodziną." : "";
    const accessSentence = `Dostęp: dzieci i dziennik ${childrenText.toLowerCase()}, apteczka ${cabinetText}, organizer leków ${pillboxText}.`;
    return adminPrefix ? `${adminPrefix} ${accessSentence}` : accessSentence;
  }

  const adminPrefix =
    role === "owner"
      ? "Manages the family."
      : "";
  const accessSentence = `Access: children and journal ${childrenText.toLowerCase()}, cabinet ${cabinetText}, pillbox ${pillboxText}.`;
  return adminPrefix ? `${adminPrefix} ${accessSentence}` : accessSentence;
}

export function buildFamilyStateFromData(params: {
  locale: MobileLocale;
  session: MobileAuthSession;
  familyMembers: MobileFamilyMember[];
  childrenCards: ChildCard[];
  routinesCount?: number;
}): FamilyUiState {
  const { locale, session, familyMembers, childrenCards, routinesCount = 0 } = params;
  const currentRole: FamilyMemberRole = session.family.ownerAccountId === session.account.id
    ? "owner"
    : normalizeFamilyMemberRole(session.account.familyRole);

  const children: FamilyUiChild[] = childrenCards.map((card) => ({
    id: card.child.id,
    name: card.child.name,
  }));

  const membersSource =
    familyMembers.length > 0
      ? familyMembers
      : [
          {
            id: session.account.id,
            email: session.account.email,
            familyId: session.family.id,
            displayName: session.account.displayName || session.account.email || "Parent",
            relationshipLabel: session.account.relationshipLabel ?? null,
            phone: session.account.phone ?? null,
            preferredLanguage: locale,
            familyRole: currentRole,
            accessPolicy: {
              allChildren: false,
              childIds: [],
              childrenAccess: "view" as const,
              cabinetAccess: "none" as const,
              pillboxAccess: "none" as const,
              cabinetPushEnabled: false,
            },
          },
        ];

  const members: FamilyUiMember[] = membersSource
    .map((member) => {
      const role = normalizeFamilyMemberRole(member.familyRole);
      const isCurrentUser = member.id === session.account.id;

      return {
        id: member.id,
        name: member.displayName || member.email || "Parent",
        role: isCurrentUser ? currentRole : role,
        relationship:
          member.relationshipLabel ||
          getGenericFamilyMemberLabel(locale),
        note: buildFamilyMemberNote({
          locale,
          isCurrentUser,
          role: isCurrentUser ? currentRole : role,
          accessPolicy: {
            ...member.accessPolicy,
          },
        }),
        phone: member.phone,
        email: member.email,
        accessPolicy: {
          ...member.accessPolicy,
        },
        isCurrentUser,
      };
    })
    .sort((left, right) => Number(Boolean(right.isCurrentUser)) - Number(Boolean(left.isCurrentUser)));

  return {
    adultsCount: members.length,
    childrenCount: children.length,
    routinesCount,
    children,
    members,
  };
}

function mapRoleLabel(
  role: FamilyMemberRole,
  locale: MobileLocale,
) {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  if (role === "owner") {
    return isRu
      ? "Владелец"
      : isDe
        ? "Inhaber"
        : isPl
          ? "Właściciel"
          : "Owner";
  }

  if (role === "admin") {
    return isRu
      ? "Админ"
      : isDe
        ? "Admin"
        : isPl
          ? "Admin"
          : "Admin";
  }

  return isRu
    ? "Участник"
    : isDe
      ? "Mitglied"
      : isPl
        ? "Członek"
        : "Member";
}

function childrenAccessLabel(
  value: FamilyChildrenAccess,
  locale: MobileLocale,
) {
  switch (value) {
    case "none":
      return locale === "ru"
        ? "Нет доступа"
        : locale === "de"
          ? "Kein Zugriff"
          : locale === "pl"
            ? "Brak dostępu"
            : "No access";
    case "view":
      return locale === "ru"
        ? "Только смотреть"
        : locale === "de"
          ? "Nur ansehen"
          : locale === "pl"
            ? "Tylko podgląd"
            : "View only";
    case "act":
      return locale === "ru"
        ? "Может записывать уход"
        : locale === "de"
          ? "Kann Pflege protokollieren"
          : locale === "pl"
            ? "Może zapisywać opiekę"
            : "Can log care";
    default:
      return locale === "ru"
        ? "Полный доступ"
        : locale === "de"
          ? "Voller Zugriff"
          : locale === "pl"
            ? "Pełny dostęp"
            : "Full access";
  }
}

function cabinetAccessLabel(
  value: FamilyCabinetAccess,
  locale: MobileLocale,
) {
  switch (value) {
    case "none":
      return locale === "ru"
        ? "Нет доступа"
        : locale === "de"
          ? "Kein Zugriff"
          : locale === "pl"
            ? "Brak dostępu"
            : "No access";
    case "view":
      return locale === "ru"
        ? "Только смотреть"
        : locale === "de"
          ? "Nur ansehen"
          : locale === "pl"
            ? "Tylko podgląd"
            : "View only";
    default:
      return locale === "ru"
        ? "Полный доступ"
        : locale === "de"
          ? "Voller Zugriff"
          : locale === "pl"
            ? "Pełny dostęp"
            : "Full access";
  }
}

function pillboxAccessLabel(
  value: FamilyPillboxAccess,
  locale: MobileLocale,
) {
  switch (value) {
    case "none":
      return locale === "ru"
        ? "Нет доступа"
        : locale === "de"
          ? "Kein Zugriff"
          : locale === "pl"
            ? "Brak dostępu"
            : "No access";
    case "view":
      return locale === "ru"
        ? "Только смотреть"
        : locale === "de"
          ? "Nur ansehen"
          : locale === "pl"
            ? "Tylko podgląd"
            : "View only";
    case "act":
      return locale === "ru"
        ? "Может отмечать приём"
        : locale === "de"
          ? "Kann Einnahmen markieren"
          : locale === "pl"
            ? "Może oznaczać dawki"
            : "Can mark doses";
    default:
      return locale === "ru"
        ? "Полный доступ"
        : locale === "de"
          ? "Voller Zugriff"
          : locale === "pl"
            ? "Pełny dostęp"
            : "Full access";
  }
}

export function buildFamilyScreenContent(
  locale: MobileLocale,
): FamilyScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    title: isRu ? "Семья" : isDe ? "Familie" : isPl ? "Rodzina" : "Family",
    subtitle: isRu
      ? "Участники, роли, доступ и приглашение — всё в одном месте."
      : isDe
        ? "Mitglieder, Rollen, Zugriff und Einladung an einem Ort."
        : isPl
          ? "Członkowie, role, dostęp i zaproszenie w jednym miejscu."
          : "Members, roles, access, and invitations in one place.",
    adultsLabel: isRu ? "Взрослые" : isDe ? "Erwachsene" : isPl ? "Dorośli" : "Adults",
    childrenLabel: isRu ? "Дети" : isDe ? "Kinder" : isPl ? "Dzieci" : "Children",
    routinesLabel: isRu ? "Рутины" : isDe ? "Routinen" : isPl ? "Rutyny" : "Routines",
    membersTitle: isRu ? "Участники" : isDe ? "Mitglieder" : isPl ? "Członkowie" : "Members",
    shareInviteLabel: isRu ? "Поделиться" : isDe ? "Teilen" : isPl ? "Udostępnij" : "Share",
    copyInviteLabel: isRu ? "Скопировать код" : isDe ? "Code kopieren" : isPl ? "Kopiuj kod" : "Copy code",
    copiedInviteLabel: isRu ? "Код скопирован" : isDe ? "Code kopiert" : isPl ? "Kod skopiowany" : "Code copied",
    accessTitle: isRu ? "Правила доступа" : isDe ? "Zugriffsregeln" : isPl ? "Zasady dostępu" : "Access rules",
    ownerRoleLabel: mapRoleLabel("owner", locale),
    adminRoleLabel: mapRoleLabel("admin", locale),
    memberRoleLabel: mapRoleLabel("member", locale),
    currentYouLabel: isRu ? "Вы" : isDe ? "Du" : isPl ? "Ty" : "You",
    currentUserNote: isRu
      ? "Это ваш текущий профиль."
      : isDe
        ? "Dies ist dein aktuelles Profil."
        : isPl
          ? "To jest Twój bieżący profil."
          : "This is your current profile.",
    accessSettingsTitle: isRu ? "Настройки доступа" : isDe ? "Zugriffseinstellungen" : isPl ? "Ustawienia dostępu" : "Access settings",
    profileFactsTitle: isRu ? "Профиль" : isDe ? "Profil" : isPl ? "Profil" : "Profile",
    childrenScopeTitle: isRu ? "Каких детей видит" : isDe ? "Kinderumfang" : isPl ? "Zakres dzieci" : "Children scope",
    childrenAccessTitle: isRu ? "Доступ к детям / журналу" : isDe ? "Zugriff auf Kinder / Journal" : isPl ? "Dostęp do dzieci / dziennika" : "Children access",
    cabinetAccessTitle: isRu ? "Аптечка" : isDe ? "Hausapotheke" : isPl ? "Apteczka" : "Medicine cabinet",
    pillboxAccessTitle: isRu ? "Таблетница" : isDe ? "Pillendose" : isPl ? "Organizer leków" : "Pillbox",
    cabinetPushTitle: isRu ? "Уведомления по аптечке" : isDe ? "Benachrichtigungen zur Hausapotheke" : isPl ? "Powiadomienia o apteczce" : "Cabinet notifications",
    allChildrenLabel: isRu ? "Все дети" : isDe ? "Alle Kinder" : isPl ? "Wszystkie dzieci" : "All children",
    selectedChildrenLabel: isRu ? "Выбранные дети" : isDe ? "Ausgewählte Kinder" : isPl ? "Wybrane dzieci" : "Selected children",
    hiddenLabel: isRu ? "Нет доступа" : isDe ? "Kein Zugriff" : isPl ? "Brak dostępu" : "Hidden",
    saveAccessLabel: isRu ? "Сохранить настройки доступа" : isDe ? "Zugriffseinstellungen speichern" : isPl ? "Zapisz ustawienia dostępu" : "Save access settings",
    editProfileLabel: isRu ? "Редактировать профиль" : isDe ? "Profil bearbeiten" : isPl ? "Edytuj profil" : "Edit profile",
    manageAccessLabel: isRu ? "Настроить доступ" : isDe ? "Zugriff verwalten" : isPl ? "Zarządzaj dostępem" : "Manage access",
    makeAdminLabel: isRu ? "Сделать админом" : isDe ? "Zum Admin machen" : isPl ? "Uczyń administratorem" : "Make admin",
    makeMemberLabel: isRu ? "Сделать участником" : isDe ? "Zum Mitglied machen" : isPl ? "Uczyń członkiem" : "Make member",
    removeMemberLabel: isRu ? "Удалить из семьи" : isDe ? "Aus der Familie entfernen" : isPl ? "Usuń z rodziny" : "Remove from family",
    displayNameLabel: isRu ? "Имя в семье" : isDe ? "Name in der Familie" : isPl ? "Imię w rodzinie" : "Display name",
    relationshipLabel: isRu ? "Кто это в семье" : isDe ? "Wer das in der Familie ist" : isPl ? "Kim jest w rodzinie" : "Relationship",
    phoneLabel: isRu ? "Телефон" : isDe ? "Telefon" : isPl ? "Telefon" : "Phone",
    noPhoneLabel: isRu ? "Не указан" : isDe ? "Nicht angegeben" : isPl ? "Nie podano" : "Not set",
    confirmPromoteTitle: isRu ? "Сделать участника администратором?" : isDe ? "Zum Administrator machen?" : isPl ? "Uczynić członka administratorem?" : "Promote to admin?",
    confirmPromoteMessage: isRu
      ? "Участник сможет управлять ролями, участниками и правами доступа."
      : isDe
        ? "Das Mitglied kann Rollen, Mitglieder und Zugriffsrechte verwalten."
        : isPl
          ? "Członek będzie mógł zarządzać rolami, członkami i dostępem."
          : "The member will be able to manage roles, members, and access.",
    confirmDemoteTitle: isRu ? "Снять права администратора?" : isDe ? "Adminrechte entziehen?" : isPl ? "Usunąć uprawnienia administratora?" : "Remove admin rights?",
    confirmDemoteMessage: isRu
      ? "Участник останется в семье, но потеряет права управления."
      : isDe
        ? "Das Mitglied bleibt in der Familie, verliert aber die Verwaltungsrechte."
        : isPl
          ? "Członek pozostanie w rodzinie, ale utraci uprawnienia do zarządzania."
          : "The member stays in the family but loses management rights.",
    confirmDeleteTitle: isRu ? "Удалить участника из семьи?" : isDe ? "Mitglied aus der Familie entfernen?" : isPl ? "Usunąć członka z rodziny?" : "Remove member from family?",
    confirmDeleteMessage: isRu
      ? "Участник потеряет доступ к семье. Для него будет создана новая пустая семья."
      : isDe
        ? "Das Mitglied verliert den Zugriff auf die Familie und erhält eine neue leere Familie."
        : isPl
          ? "Członek utraci dostęp do rodziny i otrzyma nową pustą rodzinę."
          : "The member will lose access and get a new empty family.",
    confirmActionLabel: isRu ? "Подтвердить" : isDe ? "Bestätigen" : isPl ? "Potwierdź" : "Confirm",
    cancelActionLabel: isRu ? "Отмена" : isDe ? "Abbrechen" : isPl ? "Anuluj" : "Cancel",
    inviteCodeTitle: isRu
      ? "Код приглашения"
      : isDe
        ? "Einladungscode"
        : isPl
          ? "Kod zaproszenia"
          : "Invitation code",
    inviteReadyDescription: isRu
      ? "Код готов. Можно открыть блок и поделиться им."
      : isDe
        ? "Der Code ist bereit. Öffnen Sie den Bereich und teilen Sie ihn."
        : isPl
          ? "Kod jest gotowy. Otwórz sekcję i udostępnij go."
          : "The code is ready. Open the block to share it.",
    inviteEmptyDescription: isRu
      ? "Пока кода нет. Создайте его, когда захотите пригласить взрослого."
      : isDe
        ? "Noch kein Code. Erstellen Sie ihn, wenn Sie einen Erwachsenen einladen möchten."
        : isPl
          ? "Nie ma jeszcze kodu. Utwórz go, gdy chcesz zaprosić dorosłego."
          : "No code yet. Create one when you want to invite an adult.",
    inviteReadyStatus: isRu
      ? "Код готов к использованию"
      : isDe
        ? "Code ist einsatzbereit"
        : isPl
          ? "Kod jest gotowy do użycia"
          : "Code is ready to use",
    joinFamilyTitle: isRu
      ? "Есть код семьи?"
      : isDe
        ? "Haben Sie einen Familiencode?"
        : isPl
          ? "Masz kod rodziny?"
          : "Have a family code?",
    joinFamilyDescription: isRu
      ? "Введите код приглашения, чтобы присоединиться к семье с Plus."
      : isDe
        ? "Geben Sie den Einladungscode ein, um einer Plus-Familie beizutreten."
        : isPl
          ? "Wpisz kod zaproszenia, aby dołączyć do rodziny Plus."
          : "Enter an invite code to join a Plus family.",
    joinFamilyPlaceholder: isRu
      ? "Например: ABC12345"
      : isDe
        ? "Zum Beispiel: ABC12345"
        : isPl
          ? "Na przykład: ABC12345"
          : "Example: ABC12345",
    joinFamilyPreviewLabel: (familyName: string) =>
      isRu
        ? `Код ведёт в семью «${familyName}».`
        : isDe
          ? `Der Code führt zur Familie „${familyName}“.`
          : isPl
            ? `Kod prowadzi do rodziny „${familyName}”.`
            : `This code joins “${familyName}”.`,
    joinFamilyVerifyLabel: isRu
      ? "Проверить код"
      : isDe
        ? "Code prüfen"
        : isPl
          ? "Sprawdź kod"
          : "Verify code",
    joinFamilyVerifyingLabel: isRu
      ? "Проверяем..."
      : isDe
        ? "Prüfen..."
        : isPl
          ? "Sprawdzanie..."
          : "Verifying...",
    joinFamilySubmitLabel: isRu
      ? "Присоединиться"
      : isDe
        ? "Beitreten"
        : isPl
          ? "Dołącz"
          : "Join",
    joinFamilySubmittingLabel: isRu
      ? "Вступаем..."
      : isDe
        ? "Beitritt..."
        : isPl
          ? "Dołączanie..."
          : "Joining...",
    joinFamilySuccessTitle: isRu
      ? "Вы присоединились"
      : isDe
        ? "Sie sind beigetreten"
        : isPl
          ? "Dołączono"
          : "Joined",
    joinFamilySuccessMessage: (familyName: string) =>
      isRu
        ? `Теперь вы участник семьи «${familyName}».`
        : isDe
          ? `Sie sind jetzt Mitglied der Familie „${familyName}“.`
          : isPl
            ? `Jesteś teraz członkiem rodziny „${familyName}”.`
            : `You are now a member of “${familyName}”.`,
    memberActionHint: isRu
      ? "Выберите, что хотите изменить для участника."
      : isDe
        ? "Wählen Sie aus, was Sie für dieses Mitglied ändern möchten."
        : isPl
          ? "Wybierz, co chcesz zmienić dla tego członka."
          : "Choose what you want to change for this member.",
    accessTargetHint: isRu
      ? "Выберите, что этот участник видит и может делать."
      : isDe
        ? "Wählen Sie aus, was dieses Mitglied sehen und tun kann."
        : isPl
          ? "Wybierz, co ten członek może widzieć i robić."
          : "Choose what this member can see and do.",
    accessInlineHint: isRu
      ? "Выберите, что участник видит и может делать."
      : isDe
        ? "Wählen Sie aus, was das Mitglied sehen und tun kann."
        : isPl
          ? "Wybierz, co członek może widzieć i robić."
          : "Choose what this member can see and do.",
    cabinetPushHint: isRu
      ? "Будут приходить только важные напоминания по аптечке."
      : isDe
        ? "Es werden nur wichtige Erinnerungen zur Hausapotheke gesendet."
        : isPl
          ? "Będą przychodzić tylko ważne przypomnienia o apteczce."
          : "Only important cabinet reminders will be sent.",
    editProfileHint: isRu
      ? "Измените имя, телефон и кто это в семье."
      : isDe
        ? "Aktualisieren Sie Name, Telefonnummer und Familienrolle."
        : isPl
          ? "Zmień imię, telefon i rolę w rodzinie."
          : "Update the name, phone, and family relationship.",
    saveProfileLabel: isRu
      ? "Сохранить профиль"
      : isDe
        ? "Profil speichern"
        : isPl
          ? "Zapisz profil"
          : "Save profile",
    roleRuleOwnerDescription: isRu
      ? "Управляет семьёй, приглашениями и критичными решениями."
      : isDe
        ? "Verwaltet Familie, Einladungen und wichtige Entscheidungen."
        : isPl
          ? "Zarządza rodziną, zaproszeniami i ważnymi decyzjami."
          : "Manages the family, invitations, and critical decisions.",
    roleRuleAdminDescription: isRu
      ? "Помогает управлять доступом и ежедневными сценариями."
      : isDe
        ? "Hilft beim Verwalten von Zugängen und täglichen Abläufen."
        : isPl
          ? "Pomaga zarządzać dostępem i codziennymi scenariuszami."
          : "Helps manage access and daily routines.",
    roleRuleMemberDescription: isRu
      ? "Пользуется нужными функциями и видит только доступные разделы."
      : isDe
        ? "Nutzt die nötigen Funktionen und sieht nur freigegebene Bereiche."
        : isPl
          ? "Korzysta z potrzebnych funkcji i widzi tylko dostępne sekcje."
          : "Uses the needed features and only sees allowed sections.",
    shareInviteMessage: (inviteCode: string) =>
      isRu
        ? `Присоединяйтесь к семье в PillPath. Код приглашения: ${inviteCode}`
        : isDe
          ? `Treten Sie der Familie in PillPath bei. Einladungscode: ${inviteCode}`
          : isPl
            ? `Dołącz do rodziny w PillPath. Kod zaproszenia: ${inviteCode}`
            : `Join the family in PillPath. Invitation code: ${inviteCode}`,
    genericActionError: isRu
      ? "Не удалось выполнить действие."
      : isDe
        ? "Aktion konnte nicht abgeschlossen werden."
        : isPl
          ? "Nie udało się wykonać działania."
          : "Could not complete the action.",
    createInviteErrorTitle: isRu
      ? "Не удалось создать приглашение"
      : isDe
        ? "Einladung konnte nicht erstellt werden"
        : isPl
          ? "Nie udało się utworzyć zaproszenia"
          : "Could not create invite",
    saveAccessErrorTitle: isRu
      ? "Не удалось сохранить настройки доступа"
      : isDe
        ? "Zugriffseinstellungen konnten nicht gespeichert werden"
        : isPl
          ? "Nie udało się zapisać ustawień dostępu"
          : "Could not save access settings",
    saveProfileErrorTitle: isRu
      ? "Не удалось сохранить профиль"
      : isDe
        ? "Profil konnte nicht gespeichert werden"
        : isPl
          ? "Nie udało się zapisać profilu"
          : "Could not save profile",
  };
}

export function buildFamilyMemberPermissions(params: {
  members: FamilyUiMember[];
  currentMember: FamilyUiMember;
  targetMember: FamilyUiMember;
}): FamilyMemberPermissions {
  const adminsCount = params.members.filter((member) => member.role === "admin").length;
  const isOwner = params.currentMember.role === "owner";
  const isAdmin = params.currentMember.role === "admin";
  const isCurrent = params.currentMember.id === params.targetMember.id;
  const isTargetOwner = params.targetMember.role === "owner";

  return {
    canManageAccess:
      isCurrent ||
      (isOwner || (isAdmin && params.targetMember.role === "member")),
    canPromote:
      isOwner &&
      !isCurrent &&
      !isTargetOwner &&
      params.targetMember.role !== "admin",
    canDemote:
      isOwner &&
      !isCurrent &&
      !isTargetOwner &&
      params.targetMember.role === "admin" &&
      adminsCount > 1,
    canDelete:
      !isCurrent &&
      !isTargetOwner &&
      (isOwner || (isAdmin && params.targetMember.role === "member")),
    canEditProfile: isCurrent,
  };
}
