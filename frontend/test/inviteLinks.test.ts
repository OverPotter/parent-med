import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLatestDevInviteUrl,
  buildShareableInviteUrl,
} from "../src/shared/config/inviteLinks.js";

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

test("invite link uses dev LAN https origin instead of localhost in dev mode", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "http://localhost:5173", {
      DEV: true,
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "",
      VITE_DEV_INVITE_SITE_URL: "",
    }),
    "https://192.168.0.160:5173/join-family?token=abc"
  );
});

test("invite link prefers explicit dev invite origin override in dev mode", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "http://127.0.0.1:5173", {
      DEV: true,
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "",
      VITE_DEV_INVITE_SITE_URL: "https://10.0.0.5:5173",
    }),
    "https://10.0.0.5:5173/join-family?token=abc"
  );
});

test("invite link ignores production app origin in dev mode", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "https://parent-med.app", {
      DEV: true,
      VITE_APP_SITE_URL: "https://parent-med.app",
      VITE_MARKETING_SITE_URL: "https://parent-med.app",
      VITE_DEV_INVITE_SITE_URL: "",
    }),
    "https://192.168.0.160:5173/join-family?token=abc"
  );
});

test("invite link prefers dev invite origin when api points to local backend", () => {
  assert.equal(
    buildShareableInviteUrl("/join-family?token=abc", "https://parent-med.app", {
      DEV: false,
      VITE_API_URL: "http://192.168.0.160:8000",
      VITE_APP_SITE_URL: "https://parent-med.app",
      VITE_MARKETING_SITE_URL: "https://parent-med.app",
      VITE_DEV_INVITE_SITE_URL: "",
    }),
    "https://192.168.0.160:5173/join-family?token=abc"
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

test("latest dev invite helper reuses the shared dev invite origin logic", () => {
  assert.equal(
    buildLatestDevInviteUrl("http://localhost:5173", {
      DEV: true,
      VITE_APP_SITE_URL: "",
      VITE_MARKETING_SITE_URL: "",
      VITE_DEV_INVITE_SITE_URL: "",
    }),
    "https://192.168.0.160:5173/join-family?dev-latest=1"
  );
});
