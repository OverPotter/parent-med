import { buildShareableInviteUrl } from "../../../shared/config/inviteLinks.js";

interface InviteResponseLike {
  invitePath: string;
}

interface RunCreateInviteFlowArgs {
  canShareInvite: boolean;
  currentOrigin?: string;
  createInvite: () => Promise<InviteResponseLike>;
  markInviteCopied: (value: boolean) => void;
  onShareInvite: (inviteUrl: string) => Promise<boolean>;
  setError: (value: string | null) => void;
  shareFailedMessage: string;
}

export async function runCreateInviteFlow({
  canShareInvite,
  createInvite,
  currentOrigin,
  markInviteCopied,
  onShareInvite,
  setError,
  shareFailedMessage,
}: RunCreateInviteFlowArgs): Promise<string | null> {
  const invite = await createInvite();
  markInviteCopied(false);

  const inviteUrl = buildShareableInviteUrl(invite.invitePath, currentOrigin);
  if (!inviteUrl) {
    setError(shareFailedMessage);
    return null;
  }

  if (canShareInvite) {
    await onShareInvite(inviteUrl);
  }

  return inviteUrl;
}
