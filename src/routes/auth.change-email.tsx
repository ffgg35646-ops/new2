import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/change-email")({
  head: () => ({
    meta: [{ title: "تغيير البريد الإلكتروني | عقار البطين" }],
  }),
  component: ChangeEmailPage,
});

function ChangeEmailPage() {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    const email = newEmail.trim().toLowerCase();

    if (!email.includes("@")) {
      toast.error("البريد الإلكتروني يجب أن يحتوي على @.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;

      setSent(true);
      toast.success("أرسلنا رمز تأكيد إلى البريد الجديد.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر تغيير البريد.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    const email = newEmail.trim().toLowerCase();
    const code = token.replace(/\D/g, "");

    if (code.length !== 6) {
      toast.error("أدخل رمز التأكيد المكوّن من 6 أرقام.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) throw error;

      toast.success("تم تغيير البريد الإلكتروني بنجاح.");
      navigate({ to: "/account", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "رمز التأكيد غير صحيح.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5">
      <div className="w-full rounded-3xl bg-background p-5 shadow-2xl ring-1 ring-line">
        <button
          type="button"
          onClick={() => navigate({ to: "/account", replace: true })}
          aria-label="العودة"
          className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
        >
          <ArrowRight className="size-5" />
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
            <Mail className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-extrabold">
              تغيير البريد الإلكتروني
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sent ? "أدخل رمز التأكيد المرسل إلى البريد الجديد." : "أدخل البريد الجديد."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              البريد الإلكتروني الجديد
            </span>
            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              type="text"
              dir="ltr"
              autoComplete="email"
              placeholder="new@example.com"
              disabled={sent}
              className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest disabled:opacity-60"
            />
          </label>

          {!sent ? (
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              إرسال رمز التأكيد
            </button>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  رمز التأكيد
                </span>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  dir="ltr"
                  className="w-full rounded-2xl bg-surface px-4 py-4 text-center text-2xl font-extrabold tracking-[0.45em] ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
                />
              </label>

              <button
                type="button"
                onClick={() => void confirmCode()}
                disabled={busy || token.replace(/\D/g, "").length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                تأكيد البريد
              </button>
            </>
          )}
        </div>

        

        <button
          type="button"
          onClick={() => navigate({ to: "/account", replace: true })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3 text-sm font-bold ring-1 ring-line"
        >
          <XCircle className="size-4" />
          إلغاء
        </button>
      </div>
    </div>
  );
}
