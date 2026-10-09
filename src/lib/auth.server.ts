import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { getMongoCollection } from "./mongo.server";
import { clearSession, getSessionUserId, setSession } from "./session.server";
import { sendPasswordReset, sendVerificationCode } from "./mail.server";

type UserDoc = {
  _id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_confirmed_at: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: "individual" | "office" | "admin" | null;
  verification_code_hash?: string | null;
  verification_expires_at?: Date | null;
  verification_sent_count?: number;
  verification_paused_until?: Date | null;
  verification_attempt_count?: number;
  verification_attempt_paused_until?: Date | null;
  reset_token_hash?: string | null;
  reset_expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type BackendUser = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  user_metadata: { full_name?: string | undefined; phone?: string | null; role?: string | null };
};

export type BackendSession = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: BackendUser;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const hashCode = (value: string) => createHash("sha256").update(value).digest("hex");
const generateCode = () => String(randomInt(100000, 1000000));

function hashPassword(password: string) {
  return new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, 64, (error, derived) => {
      if (error) return reject(error);
      resolve(`scrypt$${salt}$${Buffer.from(derived).toString("hex")}`);
    });
  });
}

function verifyPassword(password: string, stored: string) {
  return new Promise<boolean>((resolve, reject) => {
    const [, salt, expected] = stored.split("$");
    if (!salt || !expected) return resolve(false);

    scrypt(password, salt, 64, (error, derived) => {
      if (error) return reject(error);
      const actual = Buffer.from(derived).toString("hex");
      resolve(actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected)));
    });
  });
}

function toUser(user: UserDoc): BackendUser {
  return {
    id: user._id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    user_metadata: {
      full_name: user.full_name ?? undefined,
      phone: user.phone ?? null,
      role: user.role ?? null,
    },
  };
}

function createSession(user: UserDoc): BackendSession {
  const publicUser = toUser(user);
  return {
    access_token: user._id,
    refresh_token: user._id,
    token_type: "bearer",
    user: publicUser,
  };
}

async function issueVerificationCode(user: UserDoc) {
  const count = user.verification_sent_count ?? 0;
  const pausedUntil = user.verification_paused_until?.getTime() ?? 0;
  const attemptPausedUntil = user.verification_attempt_paused_until?.getTime() ?? 0;
  const now = Date.now();

  if (attemptPausedUntil > now) throw new Error("VERIFY_ATTEMPTS_PAUSED");
  if (pausedUntil > now) throw new Error("EMAIL_SEND_PAUSED");

  const currentCount = pausedUntil > 0 ? 0 : count;

  if (currentCount >= 15) {
    const nextPause = new Date(now + 5 * 60_000);
    await (await getMongoCollection<UserDoc>("users")).updateOne(
      { _id: user._id },
      { $set: { verification_paused_until: nextPause, verification_sent_count: 15, updated_at: new Date() } },
    );
    throw new Error("EMAIL_SEND_PAUSED");
  }

  const code = generateCode();
  await (await getMongoCollection<UserDoc>("users")).updateOne(
    { _id: user._id },
    {
      $set: {
        verification_code_hash: hashCode(code),
        verification_expires_at: new Date(now + 10 * 60_000),
        verification_sent_count: currentCount + 1,
        verification_paused_until: currentCount + 1 >= 15 ? new Date(now + 5 * 60_000) : null,
        updated_at: new Date(),
      },
    },
  );

  await sendVerificationCode(user.email, code);
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string | null;
  role?: "individual" | "office";
}) {
  if (typeof input.email !== "string" || typeof input.password !== "string") {
    throw new Error("بيانات التسجيل غير صالحة.");
  }
  const email = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    throw new Error("صيغة البريد الإلكتروني غير صحيحة.");
  }
  if (input.password.length < 8 || input.password.length > 1024) {
    throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
  }

  // Runtime validation is required: server-function TypeScript casts do not validate requests.
  const requestedRole: "individual" | "office" | null =
    input.role === "office" ? "office" :
    input.role === "individual" ? "individual" : null;

  const users = await getMongoCollection<UserDoc>("users");
  const existing = await users.findOne({ email });

  if (existing?.email_verified) throw new Error("البريد الإلكتروني مسجل مسبقًا");

  if (existing) {
    const passwordHash = await hashPassword(input.password);
    await users.updateOne(
      { _id: existing._id },
      { $set: {
        password_hash: passwordHash,
        full_name: typeof input.fullName === "string" ? input.fullName.slice(0, 160) : existing.full_name ?? null,
        phone: typeof input.phone === "string" ? input.phone.slice(0, 30) : existing.phone ?? null,
        role: requestedRole ?? (
          existing.role === "office" || existing.role === "individual" ? existing.role : null
        ),
        updated_at: new Date(),
      } },
    );
    const fresh = await users.findOne({ _id: existing._id });
    if (!fresh) throw new Error("تعذر تجهيز الحساب.");
    await issueVerificationCode(fresh);
    return { user: toUser(fresh), session: null };
  }

  const now = new Date();
  const user: UserDoc = {
    _id: randomUUID(),
    email,
    password_hash: await hashPassword(input.password),
    email_verified: false,
    email_confirmed_at: null,
    full_name: typeof input.fullName === "string" ? input.fullName.slice(0, 160) : null,
    phone: typeof input.phone === "string" ? input.phone.slice(0, 30) : null,
    role: requestedRole,
    verification_code_hash: null,
    verification_expires_at: null,
    verification_sent_count: 0,
    verification_paused_until: null,
    verification_attempt_count: 0,
    verification_attempt_paused_until: null,
    reset_token_hash: null,
    reset_expires_at: null,
    created_at: now,
    updated_at: now,
  };

  await users.insertOne(user);
  await issueVerificationCode(user);
  return { user: toUser(user), session: null };
}

export async function verifyEmailCode(email: string, code: string) {
  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ email: normalizeEmail(email) });

  if (!user) throw new Error("الحساب غير موجود.");

  const now = Date.now();
  const attemptPausedUntil = user.verification_attempt_paused_until?.getTime() ?? 0;
  if (attemptPausedUntil > now) throw new Error("VERIFY_ATTEMPTS_PAUSED");
  if (!user.verification_code_hash || !user.verification_expires_at) throw new Error("لا يوجد رمز تأكيد صالح.");
  if (user.verification_expires_at.getTime() < now) throw new Error("رمز التأكيد انتهت صلاحيته.");

  if (hashCode(code) !== user.verification_code_hash) {
    await users.updateOne(
      { _id: user._id },
      { $inc: { verification_attempt_count: 1 }, $set: { updated_at: new Date() } },
    );
    const latest = await users.findOne({ _id: user._id });
    if ((latest?.verification_attempt_count ?? 0) >= 5) {
      await users.updateOne(
        { _id: user._id, verification_attempt_count: { $gte: 5 } },
        {
          $set: {
            verification_attempt_count: 0,
            verification_attempt_paused_until: new Date(Date.now() + 5 * 60_000),
            updated_at: new Date(),
          },
        },
      );
      throw new Error("VERIFY_ATTEMPTS_PAUSED");
    }
    throw new Error("رمز التأكيد غير صحيح.");
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        email_verified: true,
        email_confirmed_at: new Date().toISOString(),
        verification_code_hash: null,
        verification_expires_at: null,
        verification_sent_count: 0,
        verification_paused_until: null,
        verification_attempt_count: 0,
        verification_attempt_paused_until: null,
        updated_at: new Date(),
      },
    },
  );

  const fresh = await users.findOne({ _id: user._id });
  if (!fresh) throw new Error("تعذر إنهاء تفعيل الحساب.");
  setSession(fresh._id);
  return { user: toUser(fresh), session: createSession(fresh) };
}

export async function resendVerification(email: string) {
  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ email: normalizeEmail(email) });
  if (!user) throw new Error("الحساب غير موجود.");
  if (user.email_verified) throw new Error("هذا البريد مؤكد بالفعل.");
  await issueVerificationCode(user);
  return { success: true };
}

export async function signIn(email: string, password: string) {
  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ email: normalizeEmail(email) });

  if (!user || !(await verifyPassword(password, user.password_hash))) throw new Error("البريد أو كلمة المرور غير صحيحة.");
  if (!user.email_verified) throw new Error("لم يتم تأكيد البريد بعد. أدخل رمز التحقق أولًا.");

  setSession(user._id);
  return { user: toUser(user), session: createSession(user) };
}

export async function currentUser() {
  const userId = getSessionUserId();
  if (!userId) return null;
  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ _id: userId });
  if (!user || !user.email_verified) return null;
  return user;
}

export async function signOut() {
  clearSession();
  return { success: true };
}

export async function updateCurrentUser(input: { password?: string; email?: string }) {
  const userId = getSessionUserId();
  if (!userId) throw new Error("يجب تسجيل الدخول.");

  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ _id: userId });
  if (!user) throw new Error("الحساب غير موجود.");

  const update: Record<string, unknown> = { updated_at: new Date() };

  if (input.password !== undefined) {
    if (input.password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
    update.password_hash = await hashPassword(input.password);
  }

  if (input.email !== undefined) {
    const nextEmail = normalizeEmail(input.email);
    if (!nextEmail.includes("@")) throw new Error("البريد الإلكتروني يجب أن يحتوي على @.");

    const exists = await users.findOne({ email: nextEmail, _id: { $ne: userId } });
    if (exists) throw new Error("البريد الإلكتروني مستخدم بالفعل.");

    update.email = nextEmail;
    update.email_verified = false;
    update.email_confirmed_at = null;
  }

  await users.updateOne({ _id: userId }, { $set: update });

  if (input.email !== undefined) {
    const fresh = await users.findOne({ _id: userId });
    if (!fresh) throw new Error("تعذر تحديث البريد.");
    await issueVerificationCode(fresh);
  }

  const fresh = await users.findOne({ _id: userId });
  if (!fresh) throw new Error("تعذر تحديث الحساب.");
  return { user: toUser(fresh) };
}

function trustedPasswordResetOrigin(requestedOrigin: string) {
  const configuredOrigins = [
    process.env["PUBLIC_APP_URL"],
    process.env["APP_URL"],
    process.env["VITE_PUBLIC_APP_URL"],
    process.env["VERCEL_PROJECT_PRODUCTION_URL"]
      ? "https://" + process.env["VERCEL_PROJECT_PRODUCTION_URL"]
      : null,
    process.env["VERCEL_URL"] ? "https://" + process.env["VERCEL_URL"] : null,
  ].filter((value): value is string => typeof value === "string" && !!value.trim());

  const allowed = new Set<string>();
  for (const value of configuredOrigins) {
    try {
      allowed.add(new URL(value.startsWith("http") ? value : "https://" + value).origin);
    } catch {
      // Ignore invalid deployment configuration.
    }
  }

  try {
    const candidate = new URL(requestedOrigin).origin;
    if (allowed.has(candidate)) return candidate;

    const localHost = new URL(candidate);
    if (
      process.env["NODE_ENV"] !== "production" &&
      ["localhost", "127.0.0.1"].includes(localHost.hostname) &&
      ["http:", "https:"].includes(localHost.protocol)
    ) return candidate;
  } catch {
    // Fall back to the configured production origin.
  }

  const fallback = [...allowed][0];
  if (!fallback) {
    throw new Error("إعداد رابط الموقع العام غير مكتمل. اضبط PUBLIC_APP_URL في إعدادات النشر.");
  }
  return fallback;
}

export async function requestPasswordReset(email: string, origin: string) {
  const trustedOrigin = trustedPasswordResetOrigin(origin);
  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ email: normalizeEmail(email) });
  if (!user) return { success: true };

  const rawToken = randomBytes(32).toString("hex");

  await users.updateOne(
    { _id: user._id },
    { $set: { reset_token_hash: hashCode(rawToken), reset_expires_at: new Date(Date.now() + 15 * 60_000), updated_at: new Date() } },
  );

  const url = `${trustedOrigin.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;
  await sendPasswordReset(user.email, url);

  return { success: true };
}

export async function resetPassword(email: string, token: string, password: string) {
  if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");

  const users = await getMongoCollection<UserDoc>("users");
  const user = await users.findOne({ email: normalizeEmail(email) });

  if (!user || !user.reset_token_hash || !user.reset_expires_at) throw new Error("رابط إعادة التعيين غير صالح.");
  if (user.reset_expires_at.getTime() < Date.now()) throw new Error("رابط إعادة التعيين انتهت صلاحيته.");
  if (hashCode(token) !== user.reset_token_hash) throw new Error("رابط إعادة التعيين غير صالح.");

  await users.updateOne(
    { _id: user._id },
    { $set: { password_hash: await hashPassword(password), reset_token_hash: null, reset_expires_at: null, updated_at: new Date() } },
  );

  return { success: true };
}
