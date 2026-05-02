import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("apple-app-site-association lets the app own all runtime routes", () => {
  const filePath = resolve(process.cwd(), "public/apple-app-site-association");
  const association = JSON.parse(readFileSync(filePath, "utf8")) as {
    applinks?: {
      details?: Array<{
        components?: Array<Record<string, unknown>>;
      }>;
    };
  };

  const components = association.applinks?.details?.[0]?.components ?? [];
  assert.deepEqual(components[0], {
    "/": "*",
  });
});
