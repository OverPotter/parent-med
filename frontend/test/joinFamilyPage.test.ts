import test from "node:test";
import assert from "node:assert/strict";

import { resolveInviteFailureState } from "../src/shared/runtime/inviteFailureState.js";

test("resolveInviteFailureState maps used handoff to explicit blocked invite state", () => {
  const state = resolveInviteFailureState({
    language: "ru",
    code: "FAMILY_INVITE_HANDOFF_ALREADY_USED",
    detail: null,
    kind: "preview",
  });

  assert.equal(state.blocksAuth, true);
  assert.equal(state.clearPendingRoute, true);
  assert.match(state.title, /использовано/i);
  assert.match(state.inlineMessage, /использован/i);
});

test("resolveInviteFailureState maps expired handoff to explicit blocked invite state", () => {
  const state = resolveInviteFailureState({
    language: "en",
    code: "FAMILY_INVITE_HANDOFF_EXPIRED",
    detail: null,
    kind: "action",
  });

  assert.equal(state.blocksAuth, true);
  assert.equal(state.clearPendingRoute, true);
  assert.match(state.title, /expired/i);
  assert.match(state.inlineMessage, /invite link again/i);
});
