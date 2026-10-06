import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "ufuq.pending-signup";
const PENDING_EMAIL_KEY = "ufuq.pending-email";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "تفعيل حسابك | عقار البطين" },
      {
        name: "description",
        content: "تأكيد بريدك الإلكتروني وتفعيل حسابك في عقار البطين.",
      },
    ],
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const started = useRef(false);

  const [state, setState] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState(
    "جاري تأكيد بريدك الإلكتروني..."
  );

  useEffect(() => {
    let active = true;

    async function finish() {
      if (started.current) return;
      started.current = true;

      try {
        const hash = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );

        const hashError =
          hash.get("error_description") ||
          hash.get("error");

        if (hashError) {
          throw new Error(hashError);
        }

        const code = new URLSearchParams(
          window.location.search,
        ).get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        }

        let user = null;

        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getUser();

          if (data.user) {
            user = data.user;
            break;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 300),
          );
        }

        if (!user) {
          throw new Error(
            "تعذر إنشاء جلسة بعد تفعيل البريد. افتح الرابط من نفس الجهاز الذي أنشأت منه الحساب.",
          );
        }

        if (!user.email_confirmed_at) {
          throw new Error(
            "لم يتم تأكيد البريد الإلكتروني بعد.",
          );
        }

        // The implicit auth flow returns credentials in the URL hash.
        // Supabase has already consumed them by this point, so remove them
        // immediately from the address bar before showing the success state.
        window.history.replaceState({}, document.title, window.location.pathname);

        const raw = localStorage.getItem(PENDING_KEY);
        const pendingEmail =
          localStorage.getItem(PENDING_EMAIL_KEY);

        let role: "individual" | "office" = "individual";

        if (raw) {
          const payload = JSON.parse(raw) as {
            _role?: "individual" | "office";
          };

          role =
            payload._role === "office"
              ? "office"
              : "individual";

          const { error } = await supabase.rpc(
            "complete_signup",
            payload as never,
          );

          if (error) throw error;

          localStorage.removeItem(PENDING_KEY);
        } else if (pendingEmail) {
          const pending = JSON.parse(pendingEmail) as {
            role?: "individual" | "office";
          };

          role =
            pending.role === "office"
              ? "office"
              : "individual";
        }

        localStorage.removeItem(PENDING_EMAIL_KEY);

        if (!active) return;

        setState("success");

        if (role === "office") {
          setMessage(
            "تم تأكيد بريدك الإلكتروني. طلب المكتب الآن قيد مراجعة الإدارة.",
          );

          setTimeout(() => {
            navigate({ to: "/office/status", replace: true });
          }, 1200);
        } else {
          setMessage(
            "تم تأكيد بريدك الإلكتروني وإنشاء حسابك بنجاح.",
          );

          setTimeout(() => {
            navigate({ to: "/home", replace: true });
          }, 1200);
        }
      } catch (e) {
        if (!active) return;

        setState("error");
        setMessage(
          e instanceof Error
            ? e.message
            : "تعذر تفعيل الحساب.",
        );
      }
    }

    const { data: subscription } =
      supabase.auth.onAuthStateChange((event) => {
        if (
          event === "SIGNED_IN" ||
          event === "USER_UPDATED"
        ) {
          void finish();
        }
      });

    void finish();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5">
      {state === "loading" && (
        <Loader2 className="size-12 animate-spin text-forest" />
      )}

      {state === "success" && (
        <CheckCircle2 className="size-14 text-forest" />
      )}

      {state === "error" && (
        <XCircle className="size-14 text-destructive" />
      )}

      <h1 className="mt-5 text-center font-display text-2xl font-extrabold">
        {state === "error"
          ? "تعذر تفعيل حسابك"
          : state === "success"
            ? "تم تفعيل حسابك"
            : "تفعيل حسابك"}
      </h1>

      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>

      {state === "error" && (
        <Link
          to="/auth/individual"
          className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
        >
          العودة لتسجيل الدخول
        </Link>
      )}
    </div>
  );
}
