import type { CapacitorConfig } from "@capacitor/cli";
import { loadEnv } from "vite";

const projectEnv = loadEnv("production", process.cwd(), "");
// The iOS wrapper needs the hosted TanStack server functions. Without a URL,
// a native build loads only the bundled frontend and auth/API requests hit the
// local WebView origin instead of the production server.
const serverUrl = String(
  process.env["CAPACITOR_SERVER_URL"] ||
    projectEnv["CAPACITOR_SERVER_URL"] ||
    process.env["VITE_PUBLIC_APP_URL"] ||
    projectEnv["VITE_PUBLIC_APP_URL"] ||
    "https://new2-sand-rho.vercel.app",
).trim();

if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
  throw new Error("CAPACITOR_SERVER_URL or VITE_PUBLIC_APP_URL must start with http:// or https://");
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
