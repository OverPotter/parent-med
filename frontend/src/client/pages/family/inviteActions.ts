interface InviteResponseLike {
  token: string;
}

interface RunCreateInviteFlowArgs {
  canShareInvite: boolean;
  createInvite: () => Promise<InviteResponseLike>;
  markInviteCopied: (value: boolean) => void;
  onShareInvite: (inviteCode: string) => Promise<boolean>;
  setError: (value: string | null) => void;
  shareFailedMessage: string;
}

export async function runCreateInviteFlow({
  canShareInvite,
  createInvite,
  markInviteCopied,
  onShareInvite,
  setError,
  shareFailedMessage,
}: RunCreateInviteFlowArgs): Promise<string | null> {
  const invite = await createInvite();
  markInviteCopied(false);

  const inviteCode = invite.token.trim();
  if (!inviteCode) {
    setError(shareFailedMessage);
    return null;
  }

  if (canShareInvite) {
    await onShareInvite(inviteCode);
  }

  return inviteCode;
}
