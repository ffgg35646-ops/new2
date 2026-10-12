import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = String(process.env["CAPACITOR_SERVER_URL"] ?? "").trim();

if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
  throw new Error("CAPACITOR_SERVER_URL must start with http:// or https://");
}

const config: CapacitorConfig = {
  appId: "cloud.baytialkhass.app",
  appName: "عقار البطين",
  webDir: "www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
