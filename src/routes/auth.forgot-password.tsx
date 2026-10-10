import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "نسيت كلمة المرور | عقار البطين" },
      {
        name: "description",
        content: "استعد الوصول إلى حسابك في عقار البطين عبر رسالة إعادة تعيين كلمة المرور.",
      },
      { property: "og:title", content: "نسيت كلمة المرور | عقار البطين" },
      { property: "og:description", content: "إعادة تعيين كلمة المرور عبر بريدك الإلكتروني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

const MAX_SENDS = 5;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [sends, setSends] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function submit() {
    if (cooldown > 0 || sends >= MAX_SENDS) return;
    setBusy(true);
    try {
      if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        throw new Error("صيغة البريد الإلكتروني غير صحيحة.");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      setSends((s) => s + 1);
      setCooldown(60);
      toast.success("إذا كان البريد مسجلًا لدينا فستصلك رسالة إعادة التعيين");
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      toast.error(
        /rate limit|too many/i.test(raw)
          ? "محاولات كثيرة خلال وقت قصير، انتظر قليلًا ثم أعد المحاولة."
          : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Link
        to="/auth/individual"
        className="flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line"
      >
        <ArrowRight className="size-4" />
      </Link>

      <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-sand text-forest">
        <KeyRound className="size-6" />
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold">نسيت كلمة المرور؟</h1>
      

      <div className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            البريد الإلكتروني
          </span>
          <input
            dir="ltr"
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          onClick={() => void submit()}
          disabled={busy || cooldown > 0 || sends >= MAX_SENDS}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {sends >= MAX_SENDS
            ? "تجاوزت الحد المسموح للمحاولات"
            : cooldown > 0
              ? `إعادة الإرسال بعد ${cooldown} ثانية`
              : sent
                ? "إعادة إرسال الرسالة"
                : "إرسال رابط إعادة التعيين"}
        </button>

        {sent && (
          <p className="rounded-2xl bg-sand p-3 text-xs leading-relaxed text-forest">
            تحقق من بريدك الإلكتروني (وصندوق الرسائل غير المرغوبة). الرابط صالح لفترة محدودة
            ويُستخدم مرة واحدة فقط.
          </p>
        )}
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        لأمانك لا نكشف ما إذا كان البريد مسجلًا في النظام أم لا.
      </p>
    </div>
  );
}
