import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const files = [
  {
    path: "ios/App/Podfile",
    patch(content) {
      const updated = content.replace(
        /^platform :ios,\s*['"][^'"]+['"]/m,
        "platform :ios, '15.0'",
      );
      if (!/^platform :ios,\s*['"]15\.0['"]/m.test(updated)) {
        throw new Error("Could not locate the iOS platform version in ios/App/Podfile.");
      }
      return updated;
    },
  },
  {
    path: "ios/App/App.xcodeproj/project.pbxproj",
    patch(content) {
      const updated = content.replace(
        /IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/g,
        "IPHONEOS_DEPLOYMENT_TARGET = 15.0;",
      );
      if (!updated.includes("IPHONEOS_DEPLOYMENT_TARGET = 15.0;")) {
        throw new Error("Could not locate the iOS deployment target in the Xcode project.");
      }
      return updated;
    },
  },

  {
    path: "ios/App/App/Info.plist",
    patch(content) {
      const descriptions = [
        [
          "NSCameraUsageDescription",
          "نستخدم الكاميرا لالتقاط صور العقارات وإرفاقها بالإعلانات أو المحادثات.",
        ],
        [
          "NSPhotoLibraryUsageDescription",
          "نستخدم مكتبة الصور لاختيار صور العقارات وإرفاقها بالإعلانات أو المحادثات.",
        ],
        [
          "NSPhotoLibraryAddUsageDescription",
          "نحتاج إذنًا لحفظ الصور في مكتبة الصور عند طلب المستخدم ذلك.",
        ],
      ];

      let updated = content;
      for (const [key, description] of descriptions) {
        const keyTag = `<key>${key}</key>`;
        const keyValuePattern = new RegExp(
          `^[\\t ]*<key>${key}</key>\\s*<string>[\\s\\S]*?</string>`,
          "m",
        );
        const entry = `        <key>${key}</key>\\n        <string>${description}</string>`;

        if (keyValuePattern.test(updated)) {
          updated = updated.replace(keyValuePattern, entry);
          continue;
        }

        if (updated.includes(keyTag)) {
          throw new Error(`The ${key} entry exists without a string value.`);
        }

        const rootClose = updated.lastIndexOf("</dict>");
        if (rootClose < 0 || !updated.includes("</plist>")) {
          throw new Error("Could not locate the root dictionary in ios/App/App/Info.plist.");
        }
        updated = `${updated.slice(0, rootClose)}${entry}\\n${updated.slice(rootClose)}`;
      }

      for (const key of [
        "NSCameraUsageDescription",
        "NSPhotoLibraryUsageDescription",
        "NSPhotoLibraryAddUsageDescription",
      ]) {
        if (!updated.includes(`<key>${key}</key>`)) {
          throw new Error(`Failed to add ${key} to Info.plist.`);
        }
      }
      return updated;
    },
  },
];

let changed = 0;
for (const file of files) {
  let original;
  try {
    original = await readFile(file.path, "utf8");
  } catch {
    console.error("iOS native project is missing. Run: npm run cap:ios:add");
    process.exitCode = 1;
    break;
  }
  const updated = file.patch(original);
  if (updated !== original) {
    await writeFile(file.path, updated, "utf8");
    changed += 1;
  }
}

async function prepareAppIcon() {
  const source = "public/logo.jpg";
  const assetDir = "ios/App/App/Assets.xcassets/AppIcon.appiconset";
  const output = assetDir + "/AppIcon.png";
  const tempPng = assetDir + "/aqar-icon-temp.png";
  const resized = assetDir + "/aqar-icon-resized.png";

  await access(source);
  await mkdir(assetDir, { recursive: true });

  // Convert the existing project logo, fit it within a square canvas without
  // distorting it, and write the single 1024x1024 iOS app icon Xcode expects.
  await execFileAsync("sips", ["-s", "format", "png", source, "--out", tempPng]);
  await execFileAsync("sips", ["-Z", "1024", tempPng, "--out", resized]);
  await execFileAsync("sips", [
    "--padToHeightWidth", "1024", "1024",
    "--padColor", "FFFFFF",
    resized,
    "--out", output,
  ]);

  const dimensions = await execFileAsync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", output]);
  if (!/pixelWidth: 1024/.test(dimensions.stdout) || !/pixelHeight: 1024/.test(dimensions.stdout)) {
    throw new Error("Generated iOS AppIcon is not 1024x1024 pixels.");
  }

  await writeFile(
    assetDir + "/Contents.json",
    JSON.stringify({
      images: [
        {
          filename: "AppIcon.png",
          idiom: "universal",
          platform: "ios",
          size: "1024x1024",
        },
      ],
      info: { author: "xcode", version: 1 },
    }, null, 2) + "\n",
    "utf8",
  );

  await Promise.all([
    rm(tempPng, { force: true }),
    rm(resized, { force: true }),
  ]);
  console.log("iOS AppIcon generated from public/logo.jpg (1024x1024).");
}

if (!process.exitCode) {
  try {
    await prepareAppIcon();
  } catch (error) {
    console.error("Could not prepare the iOS app icon:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(changed ? "iOS deployment target set to 15.0." : "iOS deployment target is already 15.0.");
  console.log("iOS 15.0 is compatible with iPhone X and newer hardware.");
}
