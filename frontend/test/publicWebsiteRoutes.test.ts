import test from "node:test";
import assert from "node:assert/strict";

import {
  PUBLIC_WEBSITE_SHARED_ROUTE_PATHS,
  isPublicWebsiteSharedRoute,
} from "../src/app/publicWebsiteRoutes.js";

test("public website shared routes keep join-family available", () => {
  assert.equal(isPublicWebsiteSharedRoute("/join-family"), true);
  assert.deepEqual(PUBLIC_WEBSITE_SHARED_ROUTE_PATHS, [
    "/",
    "/join-family",
    "/legal",
    "/legal/privacy",
    "/legal/terms",
    "/legal/support",
  ]);
});
