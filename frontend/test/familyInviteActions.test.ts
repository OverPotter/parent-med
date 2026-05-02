import test from "node:test";
import assert from "node:assert/strict";

import { runCreateInviteFlow } from "../src/client/pages/family/inviteActions.js";

test("runCreateInviteFlow always shares the freshly created invite code", async () => {
  const createdInviteTokens: string[] = [];
  const sharedInviteTokens: string[] = [];
  const copiedStates: boolean[] = [];
  const errors: Array<string | null> = [];

  const createInvite = async () => {
    const token = `CODE${createdInviteTokens.length + 1}`;
    createdInviteTokens.push(token);
    return { token };
  };

  await runCreateInviteFlow({
    canShareInvite: true,
    createInvite,
    markInviteCopied: (value) => copiedStates.push(value),
    onShareInvite: async (inviteCode) => {
      sharedInviteTokens.push(inviteCode);
      return true;
    },
    setError: (value) => errors.push(value),
    shareFailedMessage: "share failed",
  });

  await runCreateInviteFlow({
    canShareInvite: true,
    createInvite,
    markInviteCopied: (value) => copiedStates.push(value),
    onShareInvite: async (inviteCode) => {
      sharedInviteTokens.push(inviteCode);
      return true;
    },
    setError: (value) => errors.push(value),
    shareFailedMessage: "share failed",
  });

  assert.deepEqual(createdInviteTokens, ["CODE1", "CODE2"]);
  assert.deepEqual(sharedInviteTokens, ["CODE1", "CODE2"]);
  assert.deepEqual(copiedStates, [false, false]);
  assert.deepEqual(errors, []);
});
