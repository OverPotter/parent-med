import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJoinFamilyLoginPayload,
  buildJoinFamilyRegisterPayload,
  resolveJoinFamilyAction,
} from "../src/client/pages/joinFamilyModel.js";

test("buildJoinFamilyLoginPayload trims email and preserves invite token", () => {
  assert.deepEqual(
    buildJoinFamilyLoginPayload({
      email: "  mama@example.com  ",
      password: "password123",
      rememberMe: true,
      token: "invite-token",
      isDevLatestShortcut: false,
    }),
    {
      email: "mama@example.com",
      password: "password123",
      remember_me: true,
      invite_token: "invite-token",
      use_latest_dev_invite: undefined,
    }
  );
});

test("buildJoinFamilyRegisterPayload uses dev latest shortcut when token is absent", () => {
  assert.deepEqual(
    buildJoinFamilyRegisterPayload({
      email: " user@example.com ",
      password: "password123",
      rememberMe: false,
      token: "",
      isDevLatestShortcut: true,
      language: "ru",
    }),
    {
      email: "user@example.com",
      password: "password123",
      remember_me: false,
      invite_token: undefined,
      use_latest_dev_invite: true,
      preferred_language: "ru",
    }
  );
});

test("resolveJoinFamilyAction treats ALREADY_IN_FAMILY as login success", () => {
  const result = resolveJoinFamilyAction({
    error: {
      response: {
        data: {
          code: "ALREADY_IN_FAMILY",
          detail: "already there",
        },
      },
    },
    mode: "login",
    language: "ru",
    email: "  mama@example.com ",
    loginFailedMessage: "login failed",
    registerFailedMessage: "register failed",
  });

  assert.equal(result.type, "success");
  if (result.type === "success") {
    assert.deepEqual(result.successState, {
      kind: "login",
      email: "mama@example.com",
      alreadyInFamily: true,
    });
  }
});

test("resolveJoinFamilyAction maps guard errors to invite-specific inline message", () => {
  const result = resolveJoinFamilyAction({
    error: {
      response: {
        data: {
          code: "CURRENT_FAMILY_HAS_CHILDREN",
        },
      },
    },
    mode: "login",
    language: "ru",
    email: "mama@example.com",
    loginFailedMessage: "login failed",
    registerFailedMessage: "register failed",
  });

  assert.equal(result.type, "error");
  if (result.type === "error") {
    assert.equal(result.errorMessage, "Сначала уберите детские профили из текущей семьи.");
  }
});

test("resolveJoinFamilyAction falls back to raw detail for unknown errors", () => {
  const result = resolveJoinFamilyAction({
    error: {
      response: {
        data: {
          code: "SOMETHING_NEW",
          detail: "Custom backend message",
        },
      },
    },
    mode: "register",
    language: "en",
    email: "user@example.com",
    loginFailedMessage: "login failed",
    registerFailedMessage: "register failed",
  });

  assert.equal(result.type, "error");
  if (result.type === "error") {
    assert.equal(result.errorMessage, "Custom backend message");
  }
});
