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

// Replace the generated placeholder app icon with this app's actual logo.
const iconSource = path.join(root, "public", "logo.jpg");
const iconSet = path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
const iconContentsFile = path.join(iconSet, "Contents.json");
if (!existsSync(iconSource) || !existsSync(iconContentsFile)) {
  console.error("iOS release stopped: the app logo or generated AppIcon.appiconset is missing.");
  process.exit(1);
}

const iconSizeResult = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", iconSource], {
  encoding: "utf8",
});
if (iconSizeResult.status !== 0) {
  console.error("iOS release stopped: macOS could not inspect public/logo.jpg.");
  process.exit(1);
}
const widthMatch = iconSizeResult.stdout.match(/pixelWidth:\s*(\d+)/);
const heightMatch = iconSizeResult.stdout.match(/pixelHeight:\s*(\d+)/);
if (!widthMatch || !heightMatch || widthMatch[1] !== heightMatch[1]) {
  console.error("iOS release stopped: public/logo.jpg must be a square image before it can be used as an App Store icon.");
  process.exit(1);
}

const iconContents = JSON.parse(readFileSync(iconContentsFile, "utf8"));
const generatedIconFiles = new Set();
for (const image of iconContents.images ?? []) {
  if (!image.filename || typeof image.size !== "string") continue;
  const sizeMatch = image.size.match(/^([\d.]+)x([\d.]+)$/);
  if (!sizeMatch) continue;

  const scale = Number.parseFloat(String(image.scale ?? "1x").replace("x", "")) || 1;
  const pixelWidth = Math.round(Number(sizeMatch[1]) * scale);
  const pixelHeight = Math.round(Number(sizeMatch[2]) * scale);
  const destination = path.join(iconSet, image.filename);
  const iconResult = spawnSync(
    "sips",
    [
      "-s", "format", "png",
      "-z", String(pixelHeight), String(pixelWidth),
      iconSource,
      "--out", destination,
    ],
    { encoding: "utf8" },
  );
  if (iconResult.status !== 0) {
    console.error("iOS release stopped: could not generate icon " + image.filename);
    process.exit(1);
  }
  generatedIconFiles.add(image.filename);
}
if (!generatedIconFiles.size) {
  console.error("iOS release stopped: generated AppIcon.appiconset contains no supported icon entries.");
  process.exit(1);
}
console.log("Generated " + generatedIconFiles.size + " iOS app icon sizes from public/logo.jpg.");

const privacySource = path.join(root, "config", "ios", "PrivacyInfo.xcprivacy");
const privacyDestination = path.join(root, "ios", "App", "App", "PrivacyInfo.xcprivacy");
const privacySourceDir = path.join(root, "ios", "App", "App");
if (existsSync(privacySource) && existsSync(privacySourceDir)) {
  copyFileSync(privacySource, privacyDestination);

  // Capacitor 6 templates do not consistently register privacy manifests in the
  // Xcode project. Add an explicit file reference + Copy Bundle Resources entry.
  const projectPath = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
  if (existsSync(projectPath)) {
    let project = readFileSync(projectPath, "utf8");
    if (!project.includes("PrivacyInfo.xcprivacy")) {
      const buildFileId = "A0A100000000000000000001";
      const fileRefId = "A0A100000000000000000002";
      const buildFileMarker = "/* Begin PBXBuildFile section */";
      const fileRefMarker = "/* Begin PBXFileReference section */";
      const resourcesMarker = "/* Begin PBXResourcesBuildPhase section */";
      if (!project.includes(buildFileMarker) || !project.includes(fileRefMarker) || !project.includes(resourcesMarker)) {
        console.error("iOS release stopped: could not safely register PrivacyInfo.xcprivacy in the Xcode project.");
        process.exit(1);
      }

      project = project.replace(
        buildFileMarker,
        buildFileMarker + "\n\t\t" + buildFileId + " /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = " + fileRefId + " /* PrivacyInfo.xcprivacy */; };",
      );
      project = project.replace(
        fileRefMarker,
        fileRefMarker + "\n\t\t" + fileRefId + " /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = \"<group>\"; };",
      );

      // Add the file reference specifically to the App PBXGroup, not the
      // PBXNativeTarget (which also contains "name = App;").
      const groupsStart = project.indexOf("/* Begin PBXGroup section */");
      const groupsEnd = project.indexOf("/* End PBXGroup section */", groupsStart);
      if (groupsStart < 0 || groupsEnd < 0) {
        console.error("iOS release stopped: could not locate Xcode PBXGroup section.");
        process.exit(1);
      }
      const groupsSection = project.slice(groupsStart, groupsEnd);
      const appGroupIndex = groupsSection.indexOf("/* App */ = {");
      if (appGroupIndex < 0) {
        console.error("iOS release stopped: could not locate the App group in the Xcode project.");
        process.exit(1);
      }
      const appChildrenStart = groupsSection.indexOf("children = (", appGroupIndex);
      const appChildrenEnd = groupsSection.indexOf(");", appChildrenStart);
      const appGroupTail = groupsSection.slice(appChildrenEnd, appChildrenEnd + 300);
      if (
        appChildrenStart < 0 ||
        appChildrenEnd < 0 ||
        !groupsSection.slice(appGroupIndex, appGroupIndex + 8000).includes("path = App;")
      ) {
        console.error("iOS release stopped: could not safely locate the App group's children list.");
        process.exit(1);
      }
      const globalChildrenEnd = groupsStart + appChildrenEnd;
      project = project.slice(0, globalChildrenEnd) +
        "\n\t\t\t\t" + fileRefId + " /* PrivacyInfo.xcprivacy */," +
        project.slice(globalChildrenEnd);

      const resourcesStart = project.indexOf(resourcesMarker);
      const resourcesEnd = project.indexOf("/* End PBXResourcesBuildPhase section */", resourcesStart);
      const resourcePhase = project.slice(resourcesStart, resourcesEnd);
      const filesLine = resourcePhase.match(/files = \(\s*([\s\S]*?)\s*\);/);
      if (!filesLine) {
        console.error("iOS release stopped: could not locate the Copy Bundle Resources list.");
        process.exit(1);
      }
      const updatedResources = resourcePhase.replace(
        filesLine[0],
        filesLine[0].replace(");", "\n\t\t\t\t" + buildFileId + " /* PrivacyInfo.xcprivacy in Resources */,\n\t\t\t);"),
      );
      project = project.slice(0, resourcesStart) + updatedResources + project.slice(resourcesEnd);
      writeFileSync(projectPath, project, "utf8");
    }
  }
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
