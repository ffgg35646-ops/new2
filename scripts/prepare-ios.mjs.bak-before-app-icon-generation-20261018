import { readFile, writeFile } from "node:fs/promises";

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
if (!process.exitCode) {
  console.log(changed ? "iOS deployment target set to 15.0." : "iOS deployment target is already 15.0.");
  console.log("iOS 15.0 is compatible with iPhone X and newer hardware.");
}
