import test from "node:test";
import assert from "node:assert/strict";

import { runCreateInviteFlow } from "../src/client/pages/family/inviteActions.js";

test("runCreateInviteFlow always shares the freshly created invite url", async () => {
  const createdInvitePaths: string[] = [];
  const sharedInviteUrls: string[] = [];
  const copiedStates: boolean[] = [];
  const errors: Array<string | null> = [];

  const createInvite = async () => {
    const invitePath = `/join-family?token=${createdInvitePaths.length + 1}`;
    createdInvitePaths.push(invitePath);
    return { invitePath };
  };

  await runCreateInviteFlow({
    canShareInvite: true,
    currentOrigin: "https://pillpath.app",
    createInvite,
    markInviteCopied: (value) => copiedStates.push(value),
    onShareInvite: async (inviteUrl) => {
      sharedInviteUrls.push(inviteUrl);
      return true;
    },
    setError: (value) => errors.push(value),
    shareFailedMessage: "share failed",
  });

  await runCreateInviteFlow({
    canShareInvite: true,
    currentOrigin: "https://pillpath.app",
    createInvite,
    markInviteCopied: (value) => copiedStates.push(value),
    onShareInvite: async (inviteUrl) => {
      sharedInviteUrls.push(inviteUrl);
      return true;
    },
    setError: (value) => errors.push(value),
    shareFailedMessage: "share failed",
  });

  assert.deepEqual(createdInvitePaths, [
    "/join-family?token=1",
    "/join-family?token=2",
  ]);
  assert.deepEqual(sharedInviteUrls, [
    "https://pillpath.app/join-family?token=1",
    "https://pillpath.app/join-family?token=2",
  ]);
  assert.deepEqual(copiedStates, [false, false]);
  assert.deepEqual(errors, []);
});
