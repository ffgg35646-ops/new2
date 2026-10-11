import type { CapacitorConfig } from "@capacitor/cli";
import { loadEnv } from "vite";

const isReleaseBuild = process.env["CAPACITOR_BUILD_TARGET"] === "release";
const env = loadEnv(isReleaseBuild ? "production" : "development", process.cwd(), "");

const iosAppUrl = String(
  process.env["IOS_APP_URL"] ?? env["IOS_APP_URL"] ?? "",
).trim();

const explicitServerUrl = String(
  process.env["CAPACITOR_SERVER_URL"] ?? env["CAPACITOR_SERVER_URL"] ?? "",
).trim();

const publicAppUrl = String(
  process.env["VITE_PUBLIC_APP_URL"] ??
    env["VITE_PUBLIC_APP_URL"] ??
    process.env["PUBLIC_APP_URL"] ??
    env["PUBLIC_APP_URL"] ??
    "",
).trim();

// The iOS app has its own hosted UI endpoint. Never silently bind a release
// IPA to the web product's general public URL.
const serverUrl = isReleaseBuild
  ? iosAppUrl
  : explicitServerUrl || publicAppUrl || "http://192.168.100.10:8080";

if (isReleaseBuild) {
  if (!iosAppUrl) {
    throw new Error(
      "iOS release build stopped: set IOS_APP_URL to the dedicated HTTPS endpoint for the iOS app. The general web URL is not a fallback.",
    );
  }

  let releaseUrl: URL;
  try {
    releaseUrl = new URL(serverUrl);
  } catch {
    throw new Error("iOS release build stopped: the mobile app URL is invalid.");
  }

  if (
    releaseUrl.protocol !== "https:" ||
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(releaseUrl.hostname)
  ) {
    throw new Error("iOS release build stopped: the app URL must be a public HTTPS address.");
  }

  if (releaseUrl.hostname.toLowerCase() === "new2-git-main-sss22.vercel.app") {
    throw new Error(
      "iOS release build stopped: IOS_APP_URL must use the dedicated iOS app endpoint, not the main website.",
    );
  }
}

const config: CapacitorConfig = {
  appId: "cloud.baytialkhass.app",
  appName: "عقار البطين",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
