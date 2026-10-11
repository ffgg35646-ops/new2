import type { CapacitorConfig } from "@capacitor/cli";
import { loadEnv } from "vite";

const isReleaseBuild = process.env["CAPACITOR_BUILD_TARGET"] === "release";
const env = loadEnv(isReleaseBuild ? "production" : "development", process.cwd(), "");

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

// Keep local live-reload behavior for development, but never ship the LAN IP
// into an App Store build. Release builds must explicitly resolve to HTTPS.
const serverUrl = isReleaseBuild
  ? explicitServerUrl || publicAppUrl
  : explicitServerUrl || "http://192.168.100.10:8080";

if (isReleaseBuild) {
  if (!serverUrl) {
    throw new Error(
      "iOS release build stopped: set CAPACITOR_SERVER_URL (or VITE_PUBLIC_APP_URL) to the deployed HTTPS app URL.",
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
