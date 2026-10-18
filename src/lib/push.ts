import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

type ListenerHandle = { remove: () => Promise<void> };

let activeUserId: string | null = null;
let pendingUserId: string | null = null;
let activeToken: string | null = null;
let registrationGeneration = 0;
let registrationListener: ListenerHandle | null = null;
let registrationErrorListener: ListenerHandle | null = null;

async function removeListeners() {
  const listeners = [registrationListener, registrationErrorListener].filter(
    (listener): listener is ListenerHandle => listener !== null,
  );
  registrationListener = null;
  registrationErrorListener = null;
  await Promise.all(listeners.map(async (listener) => {
    try {
      await listener.remove();
    } catch {
      // A listener may already have been removed by the native bridge.
    }
  }));
}

export async function unregisterPush(userId: string) {
  if (pendingUserId === userId) {
    pendingUserId = null;
    registrationGeneration += 1;
  }
  if (activeUserId !== userId) return;

  const token = activeToken;
  activeUserId = null;
  activeToken = null;
  registrationGeneration += 1;
  await removeListeners();

  // Remove the account association on sign-out so another person using this
  // device does not continue receiving notifications for the previous account.
  if (token) {
    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);
    if (error) console.warn("[push] could not detach token from signed-out account", error);
  }
}

export async function registerPush(userId: string) {
  if (!Capacitor.isNativePlatform()) return;
  if (activeUserId === userId || pendingUserId === userId) return;

  if (activeUserId && activeUserId !== userId) {
    await unregisterPush(activeUserId);
  }

  pendingUserId = userId;
  const generation = ++registrationGeneration;
  let PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications;

  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    if (generation === registrationGeneration) pendingUserId = null;
    return;
  }

  try {
    const existingPermission = await PushNotifications.checkPermissions();
    if (generation !== registrationGeneration) return;
    const permission = existingPermission.receive === "granted"
      ? existingPermission
      : await PushNotifications.requestPermissions();
    if (generation !== registrationGeneration) return;
    if (permission.receive !== "granted") {
      pendingUserId = null;
      return;
    }

    activeUserId = userId;
    pendingUserId = null;

    // Attach listeners before register(): native plugins may emit registration
    // immediately after the APNs/FCM request completes.
    registrationListener = await PushNotifications.addListener("registration", (token) => {
      if (activeUserId !== userId || !token.value) return;
      activeToken = token.value;
      void supabase
        .from("device_tokens")
        .upsert(
          {
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        )
        .then(({ error }) => {
          if (error) console.warn("[push] could not save device token", error);
        });
    });

    registrationErrorListener = await PushNotifications.addListener("registrationError", (err) => {
      if (activeUserId === userId) console.warn("[push] registration error", err);
    });

    if (generation !== registrationGeneration || activeUserId !== userId) {
      await removeListeners();
      return;
    }
    await PushNotifications.register();
  } catch (error) {
    if (generation === registrationGeneration && activeUserId === userId) {
      console.warn("[push] setup failed", error);
    }
  } finally {
    if (pendingUserId === userId) pendingUserId = null;
  }
}
