export type InviteFailureState = {
  title: string;
  description: string;
  inlineMessage: string;
  blocksAuth: boolean;
  clearPendingRoute: boolean;
  transient?: boolean;
};

export function resolveInviteFailureState(params: {
  language: "ru" | "en";
  code: string | null;
  detail: string | null;
  kind: "preview" | "action";
}): InviteFailureState {
  const fallbackDescription =
    params.language === "ru"
      ? "Не удалось проверить приглашение. Попробуйте ещё раз немного позже."
      : "Could not verify the invite right now. Try again a bit later.";
  const fallbackInlineMessage =
    params.detail ||
    (params.language === "ru"
      ? "Не удалось продолжить по приглашению."
      : "Could not continue with this invite.");

  switch (params.code) {
    case "FAMILY_INVITE_NOT_FOUND":
      return {
        title: params.language === "ru" ? "Приглашение не найдено" : "Invite not found",
        description:
          params.language === "ru"
            ? "Эта ссылка больше не работает. Попросите владельца семьи отправить новое приглашение."
            : "This link no longer works. Ask the family owner to send a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "Эта ссылка больше не работает. Нужна новая ссылка."
            : "This link no longer works. A new invite link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_ALREADY_USED":
      return {
        title: params.language === "ru" ? "Приглашение уже использовано" : "Invite already used",
        description:
          params.language === "ru"
            ? "По этой ссылке уже присоединились к семье. Попросите отправить новое приглашение."
            : "This link has already been used to join the family. Ask for a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "Это приглашение уже использовано. Нужна новая ссылка."
            : "This invite has already been used. A new link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_EXPIRED":
      return {
        title: params.language === "ru" ? "Срок приглашения истёк" : "Invite expired",
        description:
          params.language === "ru"
            ? "Срок действия этой ссылки закончился. Попросите владельца семьи отправить новое приглашение."
            : "This invite link has expired. Ask the family owner to send a new one.",
        inlineMessage:
          params.language === "ru"
            ? "Срок действия приглашения истёк. Нужна новая ссылка."
            : "This invite has expired. A new link is needed.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "FAMILY_INVITE_INVALID":
    case "DEV_INVITE_DISABLED":
      return {
        title: params.language === "ru" ? "Приглашение недоступно" : "Invite unavailable",
        description:
          params.language === "ru"
            ? "Семья по этой ссылке недоступна. Попросите отправить новое приглашение."
            : "The family behind this link is unavailable. Ask for a new invite.",
        inlineMessage:
          params.language === "ru"
            ? "По этой ссылке сейчас нельзя присоединиться к семье."
            : "You cannot join the family through this link right now.",
        blocksAuth: true,
        clearPendingRoute: true,
      };
    case "ALREADY_IN_FAMILY":
      return {
        title:
          params.language === "ru"
            ? "Аккаунт уже в этой семье"
            : "This account is already in the family",
        description:
          params.language === "ru"
            ? "Вы уже подключены к этой семье. Можно просто открыть семейный кабинет."
            : "You are already connected to this family. Open the family workspace directly.",
        inlineMessage:
          params.language === "ru"
            ? "Этот аккаунт уже состоит в нужной семье."
            : "This account is already in the target family.",
        blocksAuth: params.kind === "preview",
        clearPendingRoute: true,
      };
    case "CURRENT_FAMILY_NOT_EMPTY":
      return {
        title:
          params.language === "ru"
            ? "Сначала освободите текущую семью"
            : "Leave your current family first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть другие участники."
            : "You cannot move to another family while your current family still has other members.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала нужно освободить текущую семью: в ней ещё есть другие участники."
            : "Your current family still has other members, so you cannot join another family yet.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    case "CURRENT_FAMILY_HAS_CHILDREN":
      return {
        title:
          params.language === "ru"
            ? "Сначала перенесите детей"
            : "Move children out of your current family first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть детские профили."
            : "You cannot join another family while child profiles still exist in your current family.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала уберите детские профили из текущей семьи."
            : "Remove child profiles from your current family first.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    case "CURRENT_FAMILY_HAS_MEDICINES":
      return {
        title:
          params.language === "ru"
            ? "Сначала освободите аптечку"
            : "Clear the current medicine cabinet first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть лекарства в аптечке."
            : "You cannot join another family while your current family still has medicines in the cabinet.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала очистите аптечку текущей семьи."
            : "Clear the medicine cabinet in your current family first.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    case "CURRENT_FAMILY_HAS_PARENTS":
      return {
        title:
          params.language === "ru"
            ? "Сначала освободите текущую семью"
            : "Clear the current family first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть профили родителей."
            : "You cannot join another family while parent profiles still exist in your current family.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала удалите профили родителей из текущей семьи."
            : "Remove parent profiles from your current family first.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    case "CURRENT_FAMILY_HAS_PILLBOX":
      return {
        title:
          params.language === "ru"
            ? "Сначала завершите планы приёма"
            : "Finish current pillbox plans first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока в вашей текущей семье есть активные планы приёма."
            : "You cannot join another family while your current family still has pillbox plans.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала завершите планы приёма в текущей семье."
            : "Finish pillbox plans in your current family first.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    case "BILLING_OWNER_TRANSFER_REQUIRED":
      return {
        title:
          params.language === "ru"
            ? "Сначала передайте управление подпиской"
            : "Transfer subscription ownership first",
        description:
          params.language === "ru"
            ? "Нельзя перейти в другую семью, пока на этом аккаунте оформлена семейная подписка."
            : "You cannot join another family while this account manages the current family subscription.",
        inlineMessage:
          params.language === "ru"
            ? "Сначала передайте семейную подписку другому участнику или отмените её."
            : "Transfer the family subscription to another member or cancel it first.",
        blocksAuth: false,
        clearPendingRoute: false,
      };
    default:
      return {
        title:
          params.language === "ru"
            ? "Не удалось продолжить по приглашению"
            : "Could not continue with this invite",
        description: params.detail || fallbackDescription,
        inlineMessage: fallbackInlineMessage,
        blocksAuth: params.kind === "preview",
        clearPendingRoute: false,
        transient: true,
      };
  }
}
