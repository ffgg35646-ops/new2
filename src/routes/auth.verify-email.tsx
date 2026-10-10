import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({
    meta: [
      { title: "تفعيل حسابك | عقار البطين" },
      {
        name: "description",
        content:
          "افتح رسالة التفعيل المرسلة إلى بريدك الإلكتروني لتأكيد حسابك.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

const PENDING_EMAIL_KEY = "ufuq.pending-email";
const RESEND_STATE_KEY = "ufuq.email-send-state";
const LEGACY_RESEND_STATE_KEY = "ufuq.email-resend-state";
const MAX_RESENDS = 15;
const PAUSE_MS = 5 * 60 * 1000;

type PendingEmail = {
  email: string;
  role: "individual" | "office";
  sentAt: number;
};

type ResendState = {
  email: string;
  count: number;
  pausedUntil: number;
};

type StoredResendStates = Record<
  string,
  {
    count: number;
    pausedUntil: number;
  }
>;

function normalizePendingEmail(email: string) {
  return email.trim().toLowerCase();
}

function getResendState(email: string): ResendState {
  const normalizedEmail = normalizePendingEmail(email);
  const empty = {
    email: normalizedEmail,
    count: 0,
    pausedUntil: 0,
  };

  const raw =
    localStorage.getItem(RESEND_STATE_KEY) ??
    localStorage.getItem(LEGACY_RESEND_STATE_KEY);
  if (!raw) return empty;

  try {
    let parsed = JSON.parse(raw) as
      | StoredResendStates
      | Partial<ResendState>;

    // Migrate the old single-email format without losing its counter.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "email" in parsed &&
      typeof parsed.email === "string"
    ) {
      const old = parsed as Partial<ResendState>;
      const oldEmail = normalizePendingEmail(old.email ?? "");
      const migrated: StoredResendStates = {
        [oldEmail]: {
          count:
            typeof old.count === "number" && old.count >= 0
              ? Math.min(old.count, MAX_RESENDS)
              : 0,
          pausedUntil:
            typeof old.pausedUntil === "number" && old.pausedUntil > 0
              ? old.pausedUntil
              : 0,
        },
      };
      localStorage.setItem(
        RESEND_STATE_KEY,
        JSON.stringify(migrated),
      );
      parsed = migrated;
    }

    const states = parsed as StoredResendStates;
    const state = states[normalizedEmail];
    if (!state) return empty;

    const count =
      typeof state.count === "number" && state.count >= 0
        ? Math.min(state.count, MAX_RESENDS)
        : 0;

    const pausedUntil =
      typeof state.pausedUntil === "number" && state.pausedUntil > 0
        ? state.pausedUntil
        : 0;

    if (pausedUntil > 0 && pausedUntil <= Date.now()) {
      const reset = {
        ...states,
        [normalizedEmail]: { count: 0, pausedUntil: 0 },
      };
      localStorage.setItem(
        RESEND_STATE_KEY,
        JSON.stringify(reset),
      );
      return empty;
    }

    return {
      email: normalizedEmail,
      count,
      pausedUntil,
    };
  } catch {
    return empty;
  }
}

function saveResendState(state: ResendState) {
  const normalizedEmail = normalizePendingEmail(state.email);
  const raw = localStorage.getItem(RESEND_STATE_KEY);

  let states: StoredResendStates = {};

  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (
      parsed &&
      typeof parsed === "object" &&
      !("email" in parsed)
    ) {
      states = parsed as StoredResendStates;
    }
  } catch {
    states = {};
  }

  states[normalizedEmail] = {
    count: Math.min(Math.max(state.count, 0), MAX_RESENDS),
    pausedUntil:
      state.pausedUntil > 0 ? state.pausedUntil : 0,
  };

  localStorage.setItem(
    RESEND_STATE_KEY,
    JSON.stringify(states),
  );
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0
    ? minutes + " دقيقة و " + rest + " ثانية"
    : rest + " ثانية";
}

function VerifyEmailPage() {
  const navigate = useNavigate();

  const [pending, setPending] =
    useState<PendingEmail | null>(null);

  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [resends, setResends] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const loginRoute =
    pending?.role === "office"
      ? "/auth/office"
      : "/auth/individual";

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function confirmToken() {
    if (!pending || busy) return;

    const cleanToken = token.replace(/\D/g, "").slice(0, 6);

    if (cleanToken.length !== 6) {
      toast.error("أدخل رمز التأكيد المكوّن من 6 أرقام.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pending.email,
        token: cleanToken,
        type: "email",
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("تم تأكيد الرمز لكن لم يتم العثور على المستخدم.");
      }

      const raw = localStorage.getItem("ufuq.pending-signup");
      if (raw) {
        const payload = JSON.parse(raw) as Record<string, unknown>;
        const { error: signupError } = await supabase.rpc(
          "complete_signup",
          payload as never,
        );

        if (signupError) throw signupError;
      }

      localStorage.removeItem("ufuq.pending-signup");
      localStorage.removeItem(PENDING_EMAIL_KEY);

      toast.success(
        pending.role === "office"
          ? "تم تأكيد البريد، وحساب المكتب قيد مراجعة الإدارة."
          : "تم تأكيد البريد وإنشاء الحساب بنجاح.",
      );

      navigate({
        to: pending.role === "office" ? "/office/status" : "/home",
        replace: true,
      });
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message?: unknown }).message ?? "")
            : String(e ?? "");

      toast.error(message || "تعذر إكمال تفعيل الحساب.");
    } finally {
      setBusy(false);
    }
  }


  useEffect(() => {
    const raw = localStorage.getItem(PENDING_EMAIL_KEY);

    if (!raw) {
      navigate({ to: "/auth/individual" });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PendingEmail;
      const state = getResendState(parsed.email);

      setPending(parsed);
      setResends(state.count);
      setPausedUntil(state.pausedUntil);
      saveResendState(state);
    } catch {
      navigate({ to: "/auth/individual" });
    }
  }, [navigate]);

  useEffect(() => {
    timer.current = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (pausedUntil > 0 && current >= pausedUntil && pending) {
        const reset = {
          email: pending.email,
          count: 0,
          pausedUntil: 0,
        };

        saveResendState(reset);
        setResends(0);
        setPausedUntil(0);
      }
    }, 1000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pausedUntil, pending]);

  async function resend() {
    if (!pending) return;

    const current = Date.now();

    if (pausedUntil > current) return;

    if (pausedUntil > 0) {
      const reset = {
        email: pending.email,
        count: 0,
        pausedUntil: 0,
      };

      saveResendState(reset);
      setResends(0);
      setPausedUntil(0);
    }

    if (resends >= MAX_RESENDS) {
      const pause = {
        email: pending.email,
        count: MAX_RESENDS,
        pausedUntil: current + PAUSE_MS,
      };

      saveResendState(pause);
      setPausedUntil(pause.pausedUntil);
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pending.email,
      });

      if (error) throw error;

      const nextCount = resends + 1;
      const next =
        nextCount >= MAX_RESENDS
          ? {
              email: pending.email,
              count: MAX_RESENDS,
              pausedUntil: Date.now() + PAUSE_MS,
            }
          : {
              email: pending.email,
              count: nextCount,
              pausedUntil: 0,
            };

      const updatedPending = {
        ...pending,
        sentAt: Date.now(),
      };

      saveResendState(next);
      localStorage.setItem(
        PENDING_EMAIL_KEY,
        JSON.stringify(updatedPending),
      );

      setPending(updatedPending);
      setResends(next.count);
      setPausedUntil(next.pausedUntil);

      toast.success(
        next.pausedUntil > 0
          ? "تم إرسال الرسالة. تم إيقاف إعادة الإرسال مؤقتًا لمدة 5 دقائق."
          : "أعدنا إرسال رسالة تفعيل الحساب.",
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "تعذر إعادة إرسال رسالة التفعيل.";

      if (/rate limit|too many|429/i.test(message)) {
        toast.error(
          "خدمة البريد نفسها تمنع الإرسال مؤقتًا. هذا الحد من مزود البريد، وليس من زر إعادة الإرسال.",
        );
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Link
        to={loginRoute}
        className="flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line"
      >
        <ArrowRight className="size-4" />
      </Link>

      <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-sand text-forest">
        <MailCheck className="size-6" />
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold">
        فعّل حسابك
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        أرسلنا رمز تأكيد إلى:
      </p>

      <p
        dir="ltr"
        className="mt-1 text-sm font-bold text-foreground"
      >
        {pending?.email ?? ""}
      </p>

      

      <div className="mt-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            رمز التأكيد
          </span>
          <input
            value={token}
            onChange={(e) =>
              setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            dir="ltr"
            className="w-full rounded-2xl bg-surface px-4 py-4 text-center text-2xl font-extrabold tracking-[0.45em] ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          onClick={() => void confirmToken()}
          disabled={busy || token.replace(/\D/g, "").length !== 6}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          تأكيد البريد الإلكتروني
        </button>
      </div>

      

      <div className="mt-6 space-y-3">
        <button
          onClick={() => void resend()}
          disabled={busy || pausedUntil > now || resends >= MAX_RESENDS}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && (
            <Loader2 className="size-4 animate-spin" />
          )}

          {pausedUntil > now
            ? "تم إيقاف الإرسال مؤقتًا — " + formatRemaining(Math.ceil((pausedUntil - now) / 1000))
            : resends >= MAX_RESENDS
              ? "سيُستأنف الإرسال بعد 5 دقائق"
              : "إعادة إرسال رسالة التفعيل"}
        </button>

        <Link
          to={loginRoute}
          className="block w-full rounded-2xl bg-surface py-3.5 text-center text-sm font-bold ring-1 ring-line"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        لا يمكن استخدام حساب المكتب قبل موافقة الإدارة.
      </p>
    </div>
  );
}
