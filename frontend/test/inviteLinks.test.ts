import test from "node:test";
import assert from "node:assert/strict";

import { buildShareableInviteUrl } from "../src/shared/config/inviteLinks.js";

test("invite link prefers explicit public app origin", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "capacitor://localhost", {
      VITE_APP_SITE_URL: "https://app.example.com",
      VITE_MARKETING_SITE_URL: "https://marketing.example.com/landing",
    }),
    "https://app.example.com/join-family?token=abc"
  );
});

test("invite link falls back to marketing origin in native shell", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "capacitor://localhost", {
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "https://marketing.example.com/landing",
    }),
    "https://marketing.example.com/join-family?token=abc"
  );
});

test("invite link uses runtime https origin on web when env is absent", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "https://parent-med.app", {
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "",
    }),
    "https://parent-med.app/join-family?token=abc"
  );
});

test("invite link stays empty when no public origin is available", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "capacitor://localhost", {
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "",
    }),
    ""
  );
});
