import { appNowMs } from "@/lib/clock";

export function formatPrice(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function formatArea(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} م²`;
}

/**
 * Normalize the different date shapes the API/database may return into a
 * valid Date. A bad date must never leak "Invalid Date" or NaN into the UI.
 */
export function parseDateValue(value: unknown): Date | null {
  const valid = (date: Date) =>
    Number.isFinite(date.getTime()) ? date : null;

  if (value == null || value === "") return null;
  if (value instanceof Date) return valid(value);

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    // Accept either Unix seconds or JavaScript milliseconds.
    return valid(new Date(Math.abs(value) < 100_000_000_000 ? value * 1000 : value));
  }

  if (typeof value === "string") {
    let raw = value.trim();
    if (!raw) return null;

    // Normalize Arabic-Indic digits in case a legacy record contains them.
    raw = raw.replace(/[٠-٩۰-۹]/g, (digit) => {
      const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
      const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";
      const index = arabicIndic.indexOf(digit);
      return String(index >= 0 ? index : easternArabicIndic.indexOf(digit));
    });

    // Numeric timestamp strings are not consistently parsed by Date.parse.
    if (/^\d{10}$/.test(raw)) return valid(new Date(Number(raw) * 1000));
    if (/^\d{13}$/.test(raw)) return valid(new Date(Number(raw)));
    if (/^\d{16}$/.test(raw)) return valid(new Date(Number(raw) / 1000));
    if (/^\d{19}$/.test(raw)) return valid(new Date(Number(raw) / 1_000_000));

    // Database datetime strings without an explicit zone are treated as UTC,
    // so the browser's configured time zone cannot change the represented time.
    const databaseDate = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/,
    );
    if (databaseDate) {
      const [, year, month, day, hour = "00", minute = "00", second = "00", fraction = "0"] = databaseDate;
      const milliseconds = fraction.slice(0, 3).padEnd(3, "0");
      return valid(
        new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}Z`),
      );
    }

    const parsed = new Date(raw);
    return valid(parsed);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    // MongoDB Extended JSON and numeric wrappers.
    if ("$date" in record) return parseDateValue(record.$date);
    if ("$numberLong" in record) return parseDateValue(record.$numberLong);
    if ("$numberInt" in record) return parseDateValue(record.$numberInt);

    // Firebase-style timestamp shapes, if present in legacy/imported records.
    const seconds = record.seconds ?? record._seconds;
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      const nanos = Number(record.nanoseconds ?? record._nanoseconds ?? 0);
      return valid(new Date(seconds * 1000 + (Number.isFinite(nanos) ? nanos / 1_000_000 : 0)));
    }

    const milliseconds = record.epochMilliseconds ?? record.milliseconds;
    if (typeof milliseconds === "number" && Number.isFinite(milliseconds)) {
      return valid(new Date(milliseconds));
    }
  }

  return null;
}

export function timeAgo(value: unknown) {
  const date = parseDateValue(value);
  if (!date) return "—";

  const diff = appNowMs() - date.getTime();
  // Created-at labels should not claim a future timestamp is "just now".
  // A clock skew or bad stored date is better shown neutrally than as NaN.
  if (diff < -60_000) return "—";
  if (diff < 60_000) return "الآن";

  const m = Math.floor(diff / 60000);
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
  const date = parseDateValue(value);
  if (!date) return "—";

  // All app dates are presented in Saudi Arabia time, never the device time zone.
  return date.toLocaleDateString("ar-SA-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: unknown) {
  const date = parseDateValue(value);
  if (!date) return "—";

  return date.toLocaleString("ar-SA-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}


export function formatTime(value: unknown) {
  const date = parseDateValue(value);
  if (!date) return "—";

  return date.toLocaleTimeString("ar-SA-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
