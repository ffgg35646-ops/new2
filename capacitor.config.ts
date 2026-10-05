import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cloud.baytialkhass.app",
  appName: "عقار البطين",
  webDir: "www",
  server: {
    url: "http://192.168.100.10:8080",
    cleartext: true,
  },
};

export default config;
