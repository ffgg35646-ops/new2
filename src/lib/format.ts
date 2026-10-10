function parseDate(value: unknown): Date | null {
  let candidate = value;

  if (candidate && typeof candidate === "object" && !(candidate instanceof Date)) {
    const record = candidate as Record<string, unknown>;

    if ("$date" in record) {
      candidate = record["$date"];
    } else if (typeof record["seconds"] === "number") {
      candidate = record["seconds"] * 1000;
    } else if (typeof record["_seconds"] === "number") {
      candidate = record["_seconds"] * 1000;
    } else if ("timestamp" in record) {
      candidate = record["timestamp"];
    } else {
      return null;
    }
  }

  if (candidate instanceof Date) {
    return Number.isFinite(candidate.getTime()) ? candidate : null;
  }

  if (typeof candidate === "number") {
    if (!Number.isFinite(candidate)) return null;
    // Accept epoch seconds and milliseconds, but reject small arbitrary numbers.
    if (Math.abs(candidate) < 100_000_000) return null;
    const date = new Date(Math.abs(candidate) < 100_000_000_000 ? candidate * 1000 : candidate);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof candidate !== "string") return null;
  const normalized = candidate.trim();
  if (!normalized || /^(nan|null|undefined|invalid date)$/i.test(normalized)) {
    return null;
  }

  // Legacy records may contain Unix timestamps as strings rather than ISO dates.
  if (/^-?\d{10,13}$/.test(normalized)) {
    const numeric = Number(normalized);
    const date = new Date(Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatPrice(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function formatArea(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} م²`;
}

export function timeAgo(value: unknown) {
  if (value == null || value === "") return "";
  const date = parseDate(value);
  if (!date) return "—";

  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return "—";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `قبل ${d} يوم`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `قبل ${mo} شهر`;
  return `قبل ${Math.floor(mo / 12)} سنة`;
}

export function formatDate(value: unknown) {
  if (value == null || value === "") return "—";
  const date = parseDate(value);
  if (!date) return "—";

  // All app dates are presented in Saudi Arabia time, never the device time zone.
  try {
    return date.toLocaleDateString("ar-SA-u-nu-latn", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
