import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: "كلمة مرور جديدة | عقار البطين" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email, token } = Route.useSearch();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !token) {
      toast.error("رابط إعادة التعيين غير صالح.");
      return;
    }

    if (password.length < 8) {
      toast.error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }

    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resetPassword(email, token, password);
      if (error) throw error;

      toast.success("تم تحديث كلمة المرور بنجاح.");
      navigate({ to: "/auth/individual", replace: true });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "تعذر تحديث كلمة المرور.",
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
        <LockKeyhole className="size-6" />
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold">
        كلمة مرور جديدة
      </h1>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        أدخل كلمة المرور الجديدة ثم احفظها.
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
    </div>
  );
}
