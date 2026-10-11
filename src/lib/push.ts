import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

export async function registerPush(userId: string) {
  let PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return;
  }

  if (!Capacitor.isNativePlatform()) return;
  const platform = Capacitor.getPlatform();
  if (platform !== "ios" && platform !== "android") return;

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      void supabase
        .from("device_tokens")
        .upsert(
          { user_id: userId, token: token.value, platform },
          { onConflict: "token" },
        );
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] registration error", err);
    });
  } catch (e) {
    console.warn("[push] setup failed", e);
  }
}
