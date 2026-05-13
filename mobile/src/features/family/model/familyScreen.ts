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
            preferredLanguage: locale === "ru" ? "ru" : "en",
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
          (locale === "ru" ? "Участник семьи" : "Family member"),
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
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    case "act":
      return isRu ? "Может записывать уход" : "Can log care";
    default:
      return isRu ? "Полный доступ" : "Full access";
  }
}

function cabinetAccessLabel(
  value: FamilyCabinetAccess,
  locale: MobileLocale,
) {
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    default:
      return isRu ? "Полный доступ" : "Full access";
  }
}

function pillboxAccessLabel(
  value: FamilyPillboxAccess,
  locale: MobileLocale,
) {
  const isRu = locale === "ru";

  switch (value) {
    case "none":
      return isRu ? "Нет доступа" : "No access";
    case "view":
      return isRu ? "Только смотреть" : "View only";
    case "act":
      return isRu ? "Может отмечать приём" : "Can mark doses";
    default:
      return isRu ? "Полный доступ" : "Full access";
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
    accessSettingsTitle: isRu ? "Настройки доступа" : "Access settings",
    profileFactsTitle: isRu ? "Профиль" : "Profile",
    childrenScopeTitle: isRu ? "Каких детей видит" : "Children scope",
    childrenAccessTitle: isRu ? "Доступ к детям / журналу" : "Children access",
    cabinetAccessTitle: isRu ? "Аптечка" : "Medicine cabinet",
    pillboxAccessTitle: isRu ? "Таблетница" : "Pillbox",
    cabinetPushTitle: isRu ? "Уведомления по аптечке" : "Cabinet notifications",
    allChildrenLabel: isRu ? "Все дети" : "All children",
    selectedChildrenLabel: isRu ? "Выбранные дети" : "Selected children",
    hiddenLabel: isRu ? "Нет доступа" : "Hidden",
    saveAccessLabel: isRu ? "Сохранить настройки доступа" : "Save access settings",
    editProfileLabel: isRu ? "Редактировать профиль" : "Edit profile",
    manageAccessLabel: isRu ? "Настроить доступ" : "Manage access",
    makeAdminLabel: isRu ? "Сделать админом" : "Make admin",
    makeMemberLabel: isRu ? "Сделать участником" : "Make member",
    removeMemberLabel: isRu ? "Удалить из семьи" : "Remove from family",
    displayNameLabel: isRu ? "Имя в семье" : "Display name",
    relationshipLabel: isRu ? "Кто это в семье" : "Relationship",
    phoneLabel: isRu ? "Телефон" : "Phone",
    noPhoneLabel: isRu ? "Не указан" : "Not set",
    confirmPromoteTitle: isRu ? "Сделать участника администратором?" : "Promote to admin?",
    confirmPromoteMessage: isRu
      ? "Участник сможет управлять ролями, участниками и правами доступа."
      : "The member will be able to manage roles, members, and access.",
    confirmDemoteTitle: isRu ? "Снять права администратора?" : "Remove admin rights?",
    confirmDemoteMessage: isRu
      ? "Участник останется в семье, но потеряет права управления."
      : "The member stays in the family but loses management rights.",
    confirmDeleteTitle: isRu ? "Удалить участника из семьи?" : "Remove member from family?",
    confirmDeleteMessage: isRu
      ? "Участник потеряет доступ к семье. Для него будет создана новая пустая семья."
      : "The member will lose access and get a new empty family.",
    confirmActionLabel: isRu ? "Подтвердить" : "Confirm",
    cancelActionLabel: isRu ? "Отмена" : "Cancel",
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
