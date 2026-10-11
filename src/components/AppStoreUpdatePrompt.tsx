import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { Capacitor } from "@capacitor/core";
import { ArrowUpRight, Check, Loader2, X } from "lucide-react";

type StoreVersion = {
  published: true;
  version: string;
  storeUrl: string;
  releaseNotes?: string | null;
} | {
  published: false;
};

function compareVersions(left: string, right: string) {
  const toParts = (value: string) => {
    const match = value.trim().match(/^\d+(?:\.\d+){0,3}/);
    if (!match) return null;
    return match[0].split(".").map((part) => Number.parseInt(part, 10));
  };
  const a = toParts(left);
  const b = toParts(right);
  if (!a || !b) return 0;

  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

export function AppStoreUpdatePrompt() {
  const [currentVersion, setCurrentVersion] = useState("");
  const [storeVersion, setStoreVersion] = useState<Extract<StoreVersion, { published: true }> | null>(null);
  const [openingStore, setOpeningStore] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    let active = true;
    let checkInProgress = false;
    let appStateListener: { remove: () => Promise<void> } | undefined;
    let initialTimer: number | undefined;

    const checkForUpdate = async () => {
      if (!active || checkInProgress) return;
      checkInProgress = true;
      try {
        const appInfo = await App.getInfo();
        if (!active || !appInfo.version) return;
        setCurrentVersion(appInfo.version);

        const dismissedVersion = localStorage.getItem("aqar-dismissed-ios-store-version");
        const backendOrigin = String(import.meta.env.VITE_PUBLIC_APP_URL ?? "").trim();
        const endpoint = new URL(
          "/api/app-store-version",
          backendOrigin || window.location.origin,
        );
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;

        const info = (await response.json()) as StoreVersion;
        if (
          !active ||
          !info.published ||
          !info.version ||
          !info.storeUrl ||
          !info.storeUrl.startsWith("https://apps.apple.com/") ||
          compareVersions(info.version, appInfo.version) <= 0 ||
          dismissedVersion === info.version
        ) {
          return;
        }

        setStoreVersion(info);
      } catch {
        // Updates are helpful but never required for starting or using the app.
      } finally {
        checkInProgress = false;
      }
    };

    initialTimer = window.setTimeout(() => void checkForUpdate(), 1800);
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void checkForUpdate();
    }).then((listener) => {
      if (active) appStateListener = listener;
      else void listener.remove();
    }).catch(() => {});

    return () => {
      active = false;
      if (initialTimer !== undefined) window.clearTimeout(initialTimer);
      if (appStateListener) void appStateListener.remove();
    };
  }, []);

  if (!storeVersion) return null;

  const releaseNotes = storeVersion.releaseNotes?.trim();

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="يتوفر تحديث جديد للتطبيق"
      className="fixed inset-x-3 z-[120] mx-auto max-w-lg rounded-3xl border border-line bg-background p-4 shadow-2xl"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
          <ArrowUpRight className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-extrabold">يتوفر تحديث جديد لعقار البطين</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            نسختك الحالية {currentVersion}، والنسخة الجديدة {storeVersion.version}. حدّث من App Store للاستفادة من التحسينات.
          </p>
          {releaseNotes && (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
              {releaseNotes.slice(0, 260)}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={openingStore}
              onClick={async () => {
                setOpeningStore(true);
                try {
                  await AppLauncher.openUrl({ url: storeVersion.storeUrl });
                } catch {
                  // A failed App Store handoff should not block the current app.
                  window.open(storeVersion.storeUrl, "_blank", "noopener,noreferrer");
                } finally {
                  setOpeningStore(false);
                }
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-background disabled:opacity-60"
            >
              {openingStore ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}
              تحديث الآن
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("aqar-dismissed-ios-store-version", storeVersion.version);
                setStoreVersion(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-surface px-3 py-3 text-xs font-semibold ring-1 ring-line"
              aria-label="لاحقًا"
            >
              <X className="size-4" /> لاحقًا
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
