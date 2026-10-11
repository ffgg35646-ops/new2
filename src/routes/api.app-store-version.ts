import { createFileRoute } from "@tanstack/react-router";

const IOS_BUNDLE_ID = "cloud.baytialkhass.app";
const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=1800";

type AppleLookupResult = {
  bundleId?: string;
  version?: string;
  trackViewUrl?: string;
  trackId?: number;
  releaseNotes?: string;
  minimumOsVersion?: string;
};

type AppleLookupResponse = {
  resultCount?: number;
  results?: AppleLookupResult[];
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const Route = createFileRoute("/api/app-store-version")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const url = new URL("https://itunes.apple.com/lookup");
          url.searchParams.set("bundleId", IOS_BUNDLE_ID);
          url.searchParams.set("country", "sa");
          url.searchParams.set("entity", "software");

          const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6000),
          });

          if (!response.ok) {
            console.warn("[app-store-version] Apple lookup returned HTTP", response.status);
            return json({ published: false });
          }

          const payload = (await response.json()) as AppleLookupResponse;
          const app = payload.results?.find(
            (item) => item.bundleId === IOS_BUNDLE_ID,
          );

          if (
            !app ||
            typeof app.version !== "string" ||
            !app.version.trim() ||
            typeof app.trackViewUrl !== "string" ||
            !app.trackViewUrl.startsWith("https://apps.apple.com/")
          ) {
            // An app that has not yet appeared in the Saudi App Store is normal
            // during development and TestFlight; it is not an application error.
            return json({ published: false });
          }

          return json({
            published: true,
            bundleId: IOS_BUNDLE_ID,
            version: app.version.trim(),
            storeUrl: app.trackViewUrl,
            trackId: typeof app.trackId === "number" ? app.trackId : null,
            releaseNotes:
              typeof app.releaseNotes === "string"
                ? app.releaseNotes.slice(0, 1500)
                : null,
            minimumOsVersion:
              typeof app.minimumOsVersion === "string"
                ? app.minimumOsVersion
                : null,
          });
        } catch (error) {
          // The version prompt is advisory. Apple lookup downtime or an
          // unpublished app must never block sign-in or normal app use.
          console.warn(
            "[app-store-version] Apple lookup unavailable:",
            error instanceof Error ? error.message : "unknown error",
          );
          return json({ published: false });
        }
      },
    },
  },
});
