import { supabase } from "@/integrations/supabase/client";

export async function registerPush(userId: string) {
  let PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return;
  }

  const isNative =
    typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform === "function" &&
    (
      window as unknown as { Capacitor: { isNativePlatform: () => boolean } }
    ).Capacitor.isNativePlatform();
  if (!isNative) return;

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      void supabase
        .from("device_tokens")
        .upsert(
          { user_id: userId, token: token.value, platform: "android" },
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
