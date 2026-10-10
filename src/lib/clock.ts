let serverClockOffsetMs = 0;
let hasServerClock = false;

/** Current epoch corrected against the application server when available. */
export function appNowMs() {
  return Date.now() + (hasServerClock ? serverClockOffsetMs : 0);
}

export function appNow() {
  return new Date(appNowMs());
}

/**
 * Synchronize the browser/VM clock against the server. Midpoint sampling
 * reduces the impact of network latency. Failures safely keep the local clock.
 */
export async function syncServerClock(): Promise<boolean> {
  const requestStartedAt = Date.now();

  try {
    const response = await fetch("/api/time", {
      method: "GET",
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });

    const responseReceivedAt = Date.now();
    if (!response.ok) return false;

    const payload = (await response.json()) as { now?: unknown };
    const serverNow = Number(payload?.now);
    if (!Number.isFinite(serverNow) || serverNow <= 0) return false;

    const browserMidpoint = requestStartedAt +
      (responseReceivedAt - requestStartedAt) / 2;

    serverClockOffsetMs = serverNow - browserMidpoint;
    hasServerClock = true;
    return true;
  } catch {
    return false;
  }
}

export function isServerClockSynced() {
  return hasServerClock;
}
