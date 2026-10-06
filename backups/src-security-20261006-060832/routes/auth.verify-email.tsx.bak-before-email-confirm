import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({
    meta: [
      { title: "تأكيد البريد الإلكتروني | عقار البطين" },
      {
        name: "description",
        content: "افتح رسالة التحقق المُرسلة إلى بريدك الإلكتروني لتفعيل حسابك في عقار البطين.",
      },
      { property: "og:title", content: "تأكيد البريد الإلكتروني | عقار البطين" },
      {
        property: "og:description",
        content: "تفعيل الحساب عبر رسالة تحقق تُرسل إلى بريدك الإلكتروني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

function errorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");
  const m = raw.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many") || m.includes("429"))
    return "محاولات كثيرة خلال وقت قصير، انتظر قليلًا ثم أعد المحاولة.";
  if (m.includes("already confirmed")) return "تم تأكيد البريد مسبقًا، سجّل دخولك الآن.";
  return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingEmail | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resends, setResends] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_EMAIL_KEY);
    if (!raw) {
      navigate({ to: "/auth/individual" });
      return;
    }
    const parsed = JSON.parse(raw) as PendingEmail;
    setPending(parsed);
    const elapsed = Math.floor((Date.now() - parsed.sentAt) / 1000);
    setCooldown(Math.max(0, 60 - elapsed));
  }, [navigate]);

  useEffect(() => {
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function resend() {
    if (!pending || cooldown > 0 || resends >= MAX_RESENDS) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pending.email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const next = { ...pending, sentAt: Date.now() };
      localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify(next));
      setPending(next);
      setResends((r) => r + 1);
      setCooldown(60);
      toast.success("أعدنا إرسال رسالة التحقق إلى بريدك");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Link
        to={pending?.role === "office" ? "/auth/office" : "/auth/individual"}
        className="flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line"
      >
        <ArrowRight className="size-4" />
      </Link>

      <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-sand text-forest">
        <MailCheck className="size-6" />
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold">أكّد بريدك الإلكتروني</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        أرسلنا رسالة تحقق إلى{" "}
        <span dir="ltr" className="font-semibold text-foreground">
          {pending?.email ?? ""}
        </span>
        . افتح الرسالة واضغط على رابط التفعيل لتفعيل حسابك، ثم عد إلى التطبيق لتسجيل الدخول.
      </p>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => void resend()}
          disabled={busy || cooldown > 0 || resends >= MAX_RESENDS}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {resends >= MAX_RESENDS
            ? "تجاوزت الحد المسموح لإعادة الإرسال"
            : cooldown > 0
              ? `إعادة الإرسال بعد ${cooldown} ثانية`
              : "إعادة إرسال رسالة التحقق"}
        </button>

        <Link
          to={pending?.role === "office" ? "/auth/office" : "/auth/individual"}
          className="block w-full rounded-2xl bg-surface py-3.5 text-center text-sm font-bold ring-1 ring-line"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        لن يتم تفعيل الحساب أو تسجيل الدخول قبل تأكيد البريد الإلكتروني.
      </p>
    </div>
  );
}
