import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadEnv } from "vite";

const root = process.cwd();
const env = loadEnv("production", root, "");
const configuredUrl =
  process.env["CAPACITOR_SERVER_URL"] ||
  env["CAPACITOR_SERVER_URL"] ||
  process.env["VITE_PUBLIC_APP_URL"] ||
  env["VITE_PUBLIC_APP_URL"] ||
  process.env["PUBLIC_APP_URL"] ||
  env["PUBLIC_APP_URL"] ||
  "";

if (!configuredUrl.trim()) {
  console.error(
    "iOS release stopped: provide CAPACITOR_SERVER_URL (or VITE_PUBLIC_APP_URL) with the deployed HTTPS app URL. No production settings were changed.",
  );
  process.exit(1);
}

let appUrl;
try {
  appUrl = new URL(configuredUrl.trim());
} catch {
  console.error("iOS release stopped: the configured app URL is invalid.");
  process.exit(1);
}

if (
  appUrl.protocol !== "https:" ||
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(appUrl.hostname)
) {
  console.error("iOS release stopped: use a public HTTPS app URL, never a local development address.");
  process.exit(1);
}

process.env["CAPACITOR_BUILD_TARGET"] = "release";
process.env["CAPACITOR_SERVER_URL"] = appUrl.origin;

// Capacitor still requires a webDir when the app loads its hosted web app.
// This page is only a safe packaged fallback for configuration/network failures.
const webDir = path.join(root, "www");
mkdirSync(webDir, { recursive: true });
const fallback = path.join(webDir, "index.html");
if (!existsSync(fallback)) {
  const html =
    '<!doctype html>\n' +
    '<html lang="ar" dir="rtl">\n' +
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>عقار البطين</title></head>\n' +
    '<body style="font-family:Arial,sans-serif;padding:24px;text-align:center">\n' +
    '<main><h1>عقار البطين</h1><p>تعذّر الاتصال بالخدمة. تحقق من اتصال الإنترنت ثم افتح التطبيق مرة أخرى.</p></main>\n' +
    '</body>\n</html>\n';
  writeFileSync(fallback, html, "utf8");
}

const xcodeProject = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
if (existsSync(path.join(root, "ios")) && !existsSync(xcodeProject)) {
  console.error("The ios/ directory exists but does not contain a generated Capacitor project. Back it up and inspect it before retrying.");
  process.exit(1);
}

const action = existsSync(xcodeProject) ? "sync" : "add";
const result = spawnSync("npx", ["cap", action, "ios"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const privacySource = path.join(root, "config", "ios", "PrivacyInfo.xcprivacy");
const privacyDestination = path.join(root, "ios", "App", "PrivacyInfo.xcprivacy");
if (existsSync(privacySource) && existsSync(path.dirname(privacyDestination))) {
  copyFileSync(privacySource, privacyDestination);
}

if (existsSync(xcodeProject)) {
  let project = readFileSync(xcodeProject, "utf8");
  project = project.replace(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/g, "IPHONEOS_DEPLOYMENT_TARGET = 14.0;");
  writeFileSync(xcodeProject, project, "utf8");
}

const podfile = path.join(root, "ios", "App", "Podfile");
if (existsSync(podfile)) {
  let podContent = readFileSync(podfile, "utf8");
  podContent = podContent.replace(/platform :ios, ['"][^'"]+['"]/, "platform :ios, '14.0'");
  writeFileSync(podfile, podContent, "utf8");
}

console.log("iOS project prepared for iOS 14+ using " + appUrl.origin + ".");
console.log("Web code is served from the deployed app. Native plugin/configuration changes still require a new App Store build.");
