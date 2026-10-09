const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    PRIVATE_IPV4_RANGES.some((range) => range.test(host))
  );
}

/**
 * Builds a shareable public HTTPS link for QR codes.
 * Native builds connected to a LAN/dev server must set VITE_PUBLIC_APP_URL
 * so exported QR codes never point to a developer's private IP address.
 */
export function getPublicAppUrl(path: string): string | null {
  if (typeof window === "undefined") return null;

  const configuredBase = String(import.meta.env.VITE_PUBLIC_APP_URL ?? "").trim();
  const candidate = configuredBase || window.location.origin;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || isPrivateHost(url.hostname)) return null;

    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    return new URL(normalizedPath, url.origin).toString();
  } catch {
    return null;
  }
}

export const PUBLIC_APP_URL_HELP =
  "رابط الموقع العام غير مضبوط. اضبط VITE_PUBLIC_APP_URL على عنوان الموقع HTTPS قبل إنشاء QR قابل للمسح من أجهزة العملاء.";
