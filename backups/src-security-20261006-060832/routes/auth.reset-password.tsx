import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "كلمة مرور جديدة | عقار البطين" },
      {
        name: "description",
        content: "أنشئ كلمة مرور جديدة لحسابك في عقار البطين بعد التحقق من بريدك الإلكتروني.",
      },
      { property: "og:title", content: "كلمة مرور جديدة | عقار البطين" },
      { property: "og:description", content: "إنشاء كلمة مرور جديدة وتأكيدها بأمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setValid(true);
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValid(!!data.session);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    setBusy(true);
    try {
      if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      if (password !== confirm) throw new Error("كلمتا المرور غير متطابقتين.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success("تم تحديث كلمة المرور بنجاح");
      navigate({ to: "/home" });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      toast.error(
        /pwned|compromised/i.test(raw)
          ? "كلمة المرور ضعيفة ومسرّبة سابقًا، اختر كلمة مرور أقوى."
          : /should be at least/i.test(raw)
            ? "كلمة المرور قصيرة جدًا."
            : /same.*password/i.test(raw)
              ? "كلمة المرور الجديدة مطابقة للقديمة، اختر كلمة أخرى."
              : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
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
        <LockKeyhole className="size-6" />
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold">كلمة مرور جديدة</h1>

      {!valid ? (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا لإعادة تعيين كلمة المرور.
          </p>
          <Link
            to="/auth/forgot-password"
            className="mt-6 block w-full rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background"
          >
            طلب رابط جديد
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            أدخل كلمة المرور الجديدة وأكّدها. ستتمكن بعدها من الدخول بها مباشرة.
          </p>
          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                كلمة المرور الجديدة
              </span>
              <input
                dir="ltr"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                تأكيد كلمة المرور
              </span>
              <input
                dir="ltr"
                type="password"
                value={confirm}
                placeholder="••••••••"
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
              />
            </label>
            <button
              onClick={() => void submit()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              حفظ كلمة المرور
            </button>
          </div>
        </>
      )}

      <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        الحد الأدنى 8 أحرف. ننصح بمزيج من الأحرف والأرقام والرموز.
      </p>
    </div>
  );
}
