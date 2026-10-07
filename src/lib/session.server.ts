import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

const SESSION_COOKIE = "aqar-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env["JWT_SECRET"];
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  return secret;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(payload: Record<string, unknown>) {
  const body = encode(payload);
  const signature = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return body + "." + signature;
}

function verify(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  const payload = decode<{ sub?: string; exp?: number }>(body);
  if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function cookieHeader(token: string, maxAge: number) {
  const secure = process.env["NODE_ENV"] === "production";
  return [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function setSession(userId: string) {
  const token = sign({ sub: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  setResponseHeader("Set-Cookie", cookieHeader(token, SESSION_MAX_AGE));
}

export function clearSession() {
  setResponseHeader("Set-Cookie", cookieHeader("", 0));
}

export function getSessionUserId() {
  const raw = getRequestHeader("cookie") ?? "";
  for (const item of raw.split(/;\s*/)) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    const name = item.slice(0, separator);
    const value = item.slice(separator + 1);
    if (name === SESSION_COOKIE && value) return verify(value)?.sub ?? null;
  }
  return null;
}
