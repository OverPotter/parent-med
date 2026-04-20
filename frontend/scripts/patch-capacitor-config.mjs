import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const configPath = resolve("ios/App/App/capacitor.config.json");
const requiredPlugins = [
  "KeyboardPlugin",
  "LiveActivitiesPlugin",
  "PushNotificationsPlugin",
  "SecureStoragePlugin",
];

const raw = readFileSync(configPath, "utf8");
const parsed = JSON.parse(raw);
const current = Array.isArray(parsed.packageClassList) ? parsed.packageClassList : [];

parsed.packageClassList = Array.from(new Set([...current, ...requiredPlugins])).sort((a, b) =>
  requiredPlugins.indexOf(a) - requiredPlugins.indexOf(b)
);

writeFileSync(configPath, `${JSON.stringify(parsed, null, "\t")}\n`, "utf8");
console.log("[PM] patched capacitor.config.json packageClassList", parsed.packageClassList);
