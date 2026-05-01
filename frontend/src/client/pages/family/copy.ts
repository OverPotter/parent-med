import type { AppLanguage } from "@shared/i18n";

export const familyCopy = {
  ru: {
    title: "Семья",
    subtitle: "Родители и близкие работают в одном семейном пространстве.",
    moreBack: "← Ещё",
    familyBack: "← Семья",
    loadFamilyFailed: "Не удалось загрузить семью.",
    loadMembersFailed: "Не удалось загрузить участников.",
    updateFamilyFailed: "Не удалось обновить название семьи.",
    createInviteFailed: "Не удалось создать ссылку приглашения.",
    updateRoleFailed: "Не удалось обновить роль участника.",
    deleteMemberFailed: "Не удалось удалить участника из семьи.",
    leaveFamilyFailed: "Не удалось выйти из семьи.",
    updateProfileFailed: "Не удалось обновить профиль участника.",
    familyNameTitle: "Название семьи",
    familyNameDescription: "Общее название, которое видят все участники семьи.",
    edit: "Изменить",
    hide: "Скрыть",
    familyNameMissing: "Название пока не указано",
    newFamilyName: "Новое название",
    newFamilyNamePlaceholder: "Например: Семья Ивановых",
    saving: "Сохраняем…",
    save: "Сохранить",
    cancel: "Отмена",
    membersTitle: "Участники семьи",
    membersDescription:
      "Здесь собраны все участники семьи. Вы можете пригласить близких и настроить, кто что видит и может менять.",
    yourProfileTitle: "Вы",
    currentNoAccessDescription:
      "Сейчас у вас нет доступа к данным семьи. Обратитесь к владельцу семьи или администратору.",
    yourProfileDescription: "Так вас будут видеть другие участники семьи.",
    otherMembersTitle: "Остальные участники",
    otherMembersDescription: "Профили, роли и доступы остальных участников семьи.",
    allMembersTitle: "Все участники",
    allMembersDescription: "Полный список участников семьи с ролями и доступом.",
    openAllMembers: "Все участники",
    noFamilyTitle: "Семья ещё не подключена",
    noFamilyDescription:
      "Сейчас у вас нет семейного пространства. Попросите владельца семьи прислать приглашение и откройте его на этом устройстве.",
    noOtherMembers: "Кроме вас, в семье пока никого нет.",
    peopleShort: "чел.",
    membersLoading: "Загружаем участников…",
    noMembers: "У семьи пока нет подключённых участников.",
    inviteTitle: "Пригласить близкого",
    inviteDescription:
      "Отправьте приглашение близкому. Он откроет ссылку, войдёт в свой аккаунт или создаст новый и присоединится к вашей семье.",
    ownerOnly: "Приглашения создаёт владелец семьи",
    creatingInvite: "Создаём приглашение…",
    createInvite: "Создать приглашение",
    invitesPlusOnly: "Приглашения доступны в Plus.",
    newLink: "Последнее приглашение",
    validUntil: "Действует до",
    inviteCopied: "Ссылка скопирована",
    inviteShareReady: "Открылось меню «Поделиться».",
    inviteCopyFailed: "Не удалось скопировать ссылку.",
    inviteShareFailed: "Не удалось открыть меню «Поделиться».",
    shareInvite: "Поделиться",
    copyInvite: "Скопировать ссылку",
    inviteShareTextPrefix: "Присоединяйся к нашей семье в PillPath.",
    inviteShareTextSuffix: "Открой это приглашение:",
    familyOwner: "Владелец семьи",
    admin: "Администратор",
    member: "Участник",
    noName: "Без имени",
    thisIsYou: "Это вы",
    emailMissing: "Email не указан",
    phoneMissing: "Телефон не указан",
    hideProfile: "Скрыть",
    editProfile: "Редактировать",
    makeOwner: "Сделать админом",
    makeAdult: "Сделать участником",
    removeFromFamily: "Удалить",
    leaveFamily: "Выйти из семьи",
    leaveFamilyDescription:
      "Вы потеряете доступ к детям, аптечке и таблетнице этой семьи. Для вашего аккаунта будет создана новая пустая семья.",
    confirmLeaveFamilyTitle: "Выйти из семьи?",
    confirmLeaveFamilyDescription:
      "Вы потеряете доступ к детям, аптечке и таблетнице этой семьи. Для вас будет создана новая пустая семья.",
    confirmLeaveFamilyAction: "Да, выйти",
    confirmPromoteTitle: "Сделать участника администратором?",
    confirmPromoteDescription: "Участник сможет управлять ролями, участниками и правами доступа.",
    confirmPromoteAction: "Да, сделать админом",
    confirmDemoteTitle: "Снять права администратора?",
    confirmDemoteDescription: "Участник останется в семье, но потеряет права управления семьёй.",
    confirmDemoteAction: "Да, сделать участником",
    confirmRemoveTitle: "Удалить участника из семьи?",
    confirmRemoveDescription:
      "Аккаунт участника будет удалён. Чтобы вернуть доступ, его нужно будет зарегистрировать заново или снова пригласить в семью.",
    confirmRemoveAction: "Да, удалить",
    displayName: "Имя в семье",
    displayNamePlaceholder: "Например: Оля",
    relationship: "Кто это в семье",
    relationshipPlaceholder: "Например: мама",
    relationshipHint:
      "Можно написать так, как вас будут понимать в семье: мама, папа, бабушка, дедушка, няня.",
    phone: "Телефон",
    email: "Email",
    emailPlaceholder: "you@example.com",
    invalidEmail: "Введите корректный email или оставьте поле пустым.",
    saveProfile: "Сохранить профиль",
    accessTitle: "Доступ",
    accessDescription: "Какие данные участник видит и может менять.",
    allChildren: "Все дети",
    childrenScope: "Каких детей видит",
    childrenScopeAll: "Все дети",
    childrenScopeSelected: "Выбранные дети",
    childrenScopeHint: "Выберите, всех детей увидит участник или только отдельных.",
    noChildrenForAccess: "В семье пока нет детей, которых можно выбрать.",
    selectedChildren: "Выбранные дети",
    selectedChildrenEmpty: "Дети не выбраны",
    selectedChildrenAction: "Выбрать детей",
    selectedChildrenHint: "Сразу выберите всех детей или только тех, кого увидит участник.",
    childrenAccess: "Доступ к детям / журналу",
    childrenAccessHint:
      "Нет доступа — дети и журнал скрыты. Только смотреть — без записей. Может записывать уход — температуру, кормление, сон и факты по болезни. Полный доступ — может ещё и менять сам сценарий.",
    cabinetAccess: "Аптечка",
    cabinetAccessHint:
      "Только смотреть — видит аптечку и сроки. Полный доступ — добавляет, редактирует и удаляет лекарства.",
    pillboxAccess: "Таблетница",
    pillboxAccessHintFull:
      "Только смотреть — видит план. Может отмечать приём — подтверждает, что лекарство дали. Полный доступ — меняет план и участников.",
    pillboxAccessHintLimited:
      "Если к детям нет полного доступа, в приёмах можно оставить только просмотр или отметку приёма.",
    view: "Только просмотр",
    actAccess: "Можно отмечать",
    editAccess: "Можно менять",
    childrenObserve: "Только смотреть",
    childrenAct: "Может записывать уход",
    childrenLead: "Полный доступ",
    cabinetObserve: "Только смотреть",
    cabinetLead: "Полный доступ",
    pillboxObserve: "Только смотреть",
    pillboxAct: "Может отмечать приём",
    pillboxLead: "Полный доступ",
    hidden: "Нет доступа",
    cabinetPush: "Может получать уведомления",
    cabinetPushLabel: "Уведомления по аптечке",
    cabinetPushHint: "Если включено, push по срокам и просрочке будут приходить этому участнику.",
    manageAccess: "Настроить",
    hideAccess: "Скрыть",
    saveAccess: "Сохранить настройки доступа",
    accessSummaryAllChildren: "Все дети",
    accessSummarySelectedChildren: "Выбранные дети",
    actionsTitle: "Действия",
    currentAccessTitle: "Текущие настройки",
    accessEditorTitle: "Настройки доступа",
    deleteMemberShort: "Удалить",
    noFamilyAccessTitle: "Нет доступа",
    noFamilyAccessDescription:
      "Сейчас участник не увидит детей, приёмы и аптечку. Если нужен доступ, его сможет открыть владелец семьи или администратор.",
    pillboxActNotice: "Участник сможет отметить, что лекарство дали, но не сможет менять сам план.",
    chooseAriaPrefix: "Выбрать",
    memberPickerHint: "Выберите участника, чтобы открыть его профиль и доступы.",
    devLatestInviteTitle: "Тестовое приглашение",
    devLatestInviteHintWithFamily:
      "Здесь можно открыть или скопировать тестовую ссылку для последнего приглашения в семью «{familyName}».",
    devLatestInviteHintWithoutFamily:
      "Если приглашение уже было создано на другом симуляторе, здесь появится тестовая ссылка для последнего приглашения.",
    devJoinLatestInvite: "Открыть последнее приглашение",
    devLatestInviteUrlLabel: "Тестовая ссылка",
    devLatestInviteUrlEmpty: "Тестовая ссылка пока недоступна.",
    devCopyLatestInvite: "Скопировать ссылку",
    devLatestInviteCopied: "Ссылка скопирована",
    devJoining: "Подключаем…",
  },
  en: {
    title: "Family",
    subtitle: "Parents and relatives work together in one family space.",
    moreBack: "← More",
    familyBack: "← Family",
    loadFamilyFailed: "Could not load family.",
    loadMembersFailed: "Could not load members.",
    updateFamilyFailed: "Could not update the family name.",
    createInviteFailed: "Could not create an invite link.",
    updateRoleFailed: "Could not update the member role.",
    deleteMemberFailed: "Could not remove the member from the family.",
    leaveFamilyFailed: "Could not leave the family.",
    updateProfileFailed: "Could not update the member profile.",
    familyNameTitle: "Family name",
    familyNameDescription: "Shared name visible to everyone in your family space.",
    edit: "Edit",
    hide: "Hide",
    familyNameMissing: "Family name is not set yet",
    newFamilyName: "New family name",
    newFamilyNamePlaceholder: "Example: The Ivanov Family",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    membersTitle: "Family members",
    membersDescription:
      "Everyone in the family is listed here. You can invite relatives and manage what each person can see or edit.",
    yourProfileTitle: "You",
    currentNoAccessDescription:
      "You currently do not have access to family data. Contact the family owner or an admin.",
    yourProfileDescription: "This is how other family members will see you.",
    otherMembersTitle: "Other members",
    otherMembersDescription: "Profiles, roles, and access settings for the rest of the family.",
    allMembersTitle: "All members",
    allMembersDescription: "The full family list with roles and access settings.",
    openAllMembers: "All members",
    noFamilyTitle: "No family connected yet",
    noFamilyDescription:
      "You do not have a family workspace yet. Ask the family owner to send you an invite and open it on this device.",
    noOtherMembers: "There is no one else in the family yet.",
    peopleShort: "people",
    membersLoading: "Loading members…",
    noMembers: "No family members are connected yet.",
    inviteTitle: "Invite a family member",
    inviteDescription:
      "Send an invite to a family member. They can open the link, sign in to their account or create a new one, and join your family.",
    ownerOnly: "Only the family owner can create invites",
    creatingInvite: "Creating invite…",
    createInvite: "Create invite",
    invitesPlusOnly: "Invites are available in Plus.",
    newLink: "Latest invite",
    validUntil: "Valid until",
    inviteCopied: "Link copied",
    inviteShareReady: "Share sheet opened.",
    inviteCopyFailed: "Could not copy the link.",
    inviteShareFailed: "Could not open the share sheet.",
    shareInvite: "Share",
    copyInvite: "Copy link",
    inviteShareTextPrefix: "Join our family in PillPath.",
    inviteShareTextSuffix: "Open this invite:",
    familyOwner: "Family owner",
    admin: "Admin",
    member: "Member",
    noName: "No name",
    thisIsYou: "You",
    emailMissing: "Email is not set",
    phoneMissing: "Phone is not set",
    hideProfile: "Hide",
    editProfile: "Edit",
    makeOwner: "Make admin",
    makeAdult: "Make member",
    removeFromFamily: "Remove",
    leaveFamily: "Leave family",
    leaveFamilyDescription:
      "You will lose access to this family's children, cabinet, and pillbox. A new empty family will be created for your account.",
    confirmLeaveFamilyTitle: "Leave this family?",
    confirmLeaveFamilyDescription:
      "You will lose access to this family's children, cabinet, and pillbox. A new empty family will be created for your account.",
    confirmLeaveFamilyAction: "Yes, leave",
    confirmPromoteTitle: "Promote this member to admin?",
    confirmPromoteDescription:
      "The member will be able to manage roles, members, and access permissions.",
    confirmPromoteAction: "Yes, make admin",
    confirmDemoteTitle: "Remove admin access?",
    confirmDemoteDescription:
      "The member will stay in the family but lose family management permissions.",
    confirmDemoteAction: "Yes, make member",
    confirmRemoveTitle: "Remove this member from family?",
    confirmRemoveDescription:
      "This member's account will be deleted. To restore access later, they will need to sign up again or join with a new invite.",
    confirmRemoveAction: "Yes, remove",
    displayName: "Family name",
    displayNamePlaceholder: "Example: Olivia",
    relationship: "Relationship",
    relationshipPlaceholder: "Example: mom",
    relationshipHint:
      "Use the role your family will understand right away: mom, dad, grandma, grandpa, nanny.",
    phone: "Phone",
    email: "Email",
    emailPlaceholder: "you@example.com",
    invalidEmail: "Enter a valid email or leave the field empty.",
    saveProfile: "Save profile",
    accessTitle: "Access",
    accessDescription: "What data this member can view and edit.",
    allChildren: "All children",
    childrenScope: "Which children are visible",
    childrenScopeAll: "All children",
    childrenScopeSelected: "Selected children",
    childrenScopeHint: "Choose whether this member sees all children or only selected ones.",
    noChildrenForAccess: "There are no children in the family to choose yet.",
    selectedChildren: "Selected children",
    selectedChildrenEmpty: "No children selected",
    selectedChildrenAction: "Choose children",
    selectedChildrenHint: "Choose all children or only the children this member can see.",
    childrenAccess: "Children / journal access",
    childrenAccessHint:
      "No access hides children and the journal. View only means no records. Can log care covers temperature, feeding, sleep, and illness facts. Full access can also manage the workflow.",
    cabinetAccess: "Medicine cabinet",
    cabinetAccessHint:
      "View only can see the cabinet and dates. Full access can add, change, and remove medicines.",
    pillboxAccess: "Pillbox",
    pillboxAccessHintFull:
      "View only can monitor the plan. Can mark doses confirms the medicine was given. Full access can edit the plan itself.",
    pillboxAccessHintLimited:
      "Without full child access, pillbox can only stay in view or mark-dose mode.",
    view: "View only",
    actAccess: "Can mark doses",
    editAccess: "Can edit",
    childrenObserve: "View only",
    childrenAct: "Can log care",
    childrenLead: "Full access",
    cabinetObserve: "View only",
    cabinetLead: "Full access",
    pillboxObserve: "View only",
    pillboxAct: "Can mark doses",
    pillboxLead: "Full access",
    hidden: "No access",
    cabinetPush: "Can receive reminders",
    cabinetPushLabel: "Cabinet reminders",
    cabinetPushHint:
      "When enabled, this member receives cabinet push reminders about expiry and overdue packs.",
    manageAccess: "Configure",
    hideAccess: "Hide",
    saveAccess: "Save access settings",
    accessSummaryAllChildren: "All children",
    accessSummarySelectedChildren: "Selected children",
    actionsTitle: "Actions",
    currentAccessTitle: "Current settings",
    accessEditorTitle: "Access settings",
    deleteMemberShort: "Remove",
    noFamilyAccessTitle: "No access",
    noFamilyAccessDescription:
      "This member will not see children, pillbox, or the cabinet. The family owner or an admin can reopen access later.",
    pillboxActNotice: "This actor can log doses, but cannot create or edit plans.",
    chooseAriaPrefix: "Choose",
    memberPickerHint: "Choose a member to open their profile and access settings.",
    devLatestInviteTitle: "Test invite",
    devLatestInviteHintWithFamily:
      'You can open or copy the test link for the latest invite to "{familyName}" here.',
    devLatestInviteHintWithoutFamily:
      "If an invite was already created on another simulator, the latest test link will appear here.",
    devJoinLatestInvite: "Open latest invite",
    devLatestInviteUrlLabel: "Test link",
    devLatestInviteUrlEmpty: "The test link is not available right now.",
    devCopyLatestInvite: "Copy link",
    devLatestInviteCopied: "Link copied",
    devJoining: "Joining…",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export function tFamily(language: AppLanguage, key: keyof (typeof familyCopy)["ru"]) {
  return familyCopy[language][key];
}

export function roleLabel(
  role: string,
  language: AppLanguage,
  options?: { isOwner?: boolean }
): string {
  if (options?.isOwner) {
    return tFamily(language, "familyOwner");
  }
  return role === "admin" ? tFamily(language, "admin") : tFamily(language, "member");
}

export function childrenAccessRoleLabel(access: "view" | "act" | "edit", language: AppLanguage) {
  if (access === "edit") return tFamily(language, "childrenLead");
  if (access === "act") return tFamily(language, "childrenAct");
  return tFamily(language, "childrenObserve");
}

export function cabinetAccessRoleLabel(access: "none" | "view" | "edit", language: AppLanguage) {
  if (access === "none") return tFamily(language, "hidden");
  return access === "edit" ? tFamily(language, "cabinetLead") : tFamily(language, "cabinetObserve");
}

export function pillboxAccessRoleLabel(
  access: "none" | "view" | "act" | "edit",
  language: AppLanguage
) {
  if (access === "none") return tFamily(language, "hidden");
  if (access === "edit") return tFamily(language, "pillboxLead");
  if (access === "act") return tFamily(language, "pillboxAct");
  return tFamily(language, "pillboxObserve");
}

export function familyInviteShareText(language: AppLanguage, familyTitle: string) {
  const prefix = tFamily(language, "inviteShareTextPrefix");
  const suffix = tFamily(language, "inviteShareTextSuffix");
  return language === "ru"
    ? `${prefix} ${familyTitle}. ${suffix}`
    : `${prefix} ${familyTitle} ${suffix}`;
}

export function otherMembersCountLabel(language: AppLanguage, count: number) {
  if (language === "ru") {
    return `В семье ещё ${count} ${count === 1 ? "участник" : "участника"}.`;
  }
  return `${count} more member${count === 1 ? "" : "s"} in the family.`;
}

export function familyTemplateText(
  language: AppLanguage,
  key: "devLatestInviteHintWithFamily",
  params: { familyName: string }
) {
  return tFamily(language, key).replace("{familyName}", params.familyName);
}
