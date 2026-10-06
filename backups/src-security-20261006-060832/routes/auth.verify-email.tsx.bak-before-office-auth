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
const MAX_RESENDS = 5;

type PendingEmail = {
  email: string;
  role: "individual" | "office";
  sentAt: number;
};

function VerifyEmailPage() {
  const navigate = useNavigate();

  const [pending, setPending] =
    useState<PendingEmail | null>(null);

  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resends, setResends] = useState(0);

  const timer = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    const raw =
      localStorage.getItem(PENDING_EMAIL_KEY);

    if (!raw) {
      navigate({ to: "/auth/individual" });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PendingEmail;

      setPending(parsed);

      const elapsed = Math.floor(
        (Date.now() - parsed.sentAt) / 1000,
      );

      setCooldown(Math.max(0, 60 - elapsed));
    } catch {
      navigate({ to: "/auth/individual" });
    }
  }, [navigate]);

  useEffect(() => {
    timer.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);

  async function resend() {
    if (
      !pending ||
      cooldown > 0 ||
      resends >= MAX_RESENDS
    ) {
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pending.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) throw error;

      const next = {
        ...pending,
        sentAt: Date.now(),
      };

      localStorage.setItem(
        PENDING_EMAIL_KEY,
        JSON.stringify(next),
      );

      setPending(next);
      setResends((r) => r + 1);
      setCooldown(60);

      toast.success(
        "أعدنا إرسال رسالة تفعيل الحساب.",
      );
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "تعذر إعادة إرسال رسالة التفعيل.",
      );
    } finally {
      setBusy(false);
    }
  }

  const loginRoute =
    pending?.role === "office"
      ? "/auth/office"
      : "/auth/individual";

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
        أرسلنا رابط تفعيل إلى:
      </p>

      <p
        dir="ltr"
        className="mt-1 text-sm font-bold text-foreground"
      >
        {pending?.email ?? ""}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        افتح الرسالة واضغط على رابط التفعيل. الرابط
        سينقلك تلقائيًا إلى صفحة <strong>تفعيل حسابك</strong>.
      </p>

      {pending?.role === "office" && (
        <div className="mt-5 rounded-2xl bg-sand p-3.5 text-xs leading-relaxed text-muted-foreground">
          بعد تأكيد البريد الإلكتروني، سيبقى حساب المكتب
          <strong> قيد المراجعة</strong> حتى توافق الإدارة.
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={() => void resend()}
          disabled={
            busy ||
            cooldown > 0 ||
            resends >= MAX_RESENDS
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && (
            <Loader2 className="size-4 animate-spin" />
          )}

          {resends >= MAX_RESENDS
            ? "تجاوزت الحد المسموح لإعادة الإرسال"
            : cooldown > 0
              ? `إعادة الإرسال بعد ${cooldown} ثانية`
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
