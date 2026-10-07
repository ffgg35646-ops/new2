import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/change-email")({
  head: () => ({
    meta: [
      { title: "تغيير البريد الإلكتروني | عقار البطين" },
      {
        name: "description",
        content: "تأكيد طلب تغيير البريد الإلكتروني ثم إرسال رابط إلى البريد الجديد.",
      },
    ],
  }),
  component: ChangeEmailPage,
});

function ChangeEmailPage() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [ready, setReady] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "جاري التحقق من رابط الأمان...",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyCurrentEmailLink() {
      if (started.current) return;
      started.current = true;

      try {
        const code = new URLSearchParams(window.location.search).get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;
        }

        let user = null;

        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getUser();

          if (data.user) {
            user = data.user;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!user) {
          throw new Error("الرابط غير صالح أو انتهت صلاحيته.");
        }

        if (!user.email_confirmed_at) {
          throw new Error("لم يتم تأكيد البريد الإلكتروني الحالي.");
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        if (!active) return;

        setReady(true);
        setMessage(
          "تم تأكيد طلب تغيير البريد. من فضلك ضع البريد الإلكتروني الجديد.",
        );
      } catch (e) {
        if (!active) return;

        setError(
          e instanceof Error
            ? e.message
            : "تعذر التحقق من رابط الأمان.",
        );
      }
    }

    const { data: subscription } =
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          void verifyCurrentEmailLink();
        }
      });

    void verifyCurrentEmailLink();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function sendNewEmail() {
    const email = newEmail.trim().toLowerCase();

    if (!email) {
      toast.error("اكتب البريد الإلكتروني الجديد.");
      return;
    }

    setBusy(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser(
        { email },
        {
          emailRedirectTo:
            window.location.origin + "/auth/confirm",
        },
      );

      if (updateError) throw updateError;

      toast.success("تم إرسال رابط التفعيل إلى البريد الجديد.");
      setNewEmail("");
      setMessage(
        "افتح البريد الجديد واضغط على رابط التفعيل لإكمال تغيير البريد.",
      );
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      if (/rate limit|too many|429/i.test(raw)) {
        toast.error("تعذر إرسال رابط التفعيل الآن. حاول مرة أخرى بعد قليل.");
      } else {
        toast.error(raw || "تعذر إرسال رابط التفعيل.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <XCircle className="size-12 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          تعذر تغيير البريد
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/account", replace: true })}
          className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
        >
          العودة إلى حسابي
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5">
      <div className="w-full rounded-3xl bg-background p-5 shadow-2xl ring-1 ring-line">
        {!ready ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 className="size-10 animate-spin text-forest" />
            <p className="mt-4 text-sm text-muted-foreground">{message}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
                <Mail className="size-5" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-lg font-extrabold">
                  تغيير البريد الإلكتروني
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/account", replace: true })}
                aria-label="إغلاق"
                className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  البريد الإلكتروني الجديد
                </span>
                <input
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="new@example.com"
                  className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
                />
              </label>

              <button
                type="button"
                onClick={() => void sendNewEmail()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                إرسال
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
