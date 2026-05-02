import test from "node:test";
import assert from "node:assert/strict";

import {
  PUBLIC_WEBSITE_SHARED_ROUTE_PATHS,
  isPublicWebsiteSharedRoute,
} from "../src/app/publicWebsiteRoutes.js";

test("public website shared routes include only landing and legal pages", () => {
  assert.equal(isPublicWebsiteSharedRoute("/join-family"), false);
  assert.deepEqual(PUBLIC_WEBSITE_SHARED_ROUTE_PATHS, [
    "/",
    "/legal",
    "/legal/privacy",
    "/legal/terms",
    "/legal/support",
  ]);
});
