
const COOKIE_NAME = "aqar_device_id";

export function ensureDeviceCookie() {
  if (typeof document === "undefined") return "";

  const existing = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (existing) return existing;

  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(value)}; ` +
    `Max-Age=31536000; Path=/; SameSite=Lax`;

  return value;
}
