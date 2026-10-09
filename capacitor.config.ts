import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = String(
  process.env["CAPACITOR_SERVER_URL"] ?? "http://192.168.100.10:8080",
).trim();

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
