import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
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

  const [state, setState] = useState<
    "loading" | "waiting" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState(
    "جاري تجهيز تأكيد البريد الإلكتروني..."
  );

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const tokenFlowRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function setup() {
      try {
        const params = new URLSearchParams(window.location.search);

        const hashToken = params.get("token_hash");
        const hashType = params.get("type");

        if (hashToken) {
          tokenFlowRef.current = true;

          if (hashType !== "email") {
            throw new Error("رابط تفعيل البريد غير صالح.");
          }

          if (!active) return;

          /*
           * لا نتحقق من token_hash هنا.
           * مجرد فتح الصفحة يجب ألا يستهلك الرابط.
           */
          setTokenHash(hashToken);
          setState("waiting");
          setMessage(
            "رابط تفعيل بريدك الإلكتروني جاهز. اضغط الزر أدناه لإتمام التفعيل."
          );
          return;
        }

        /*
         * الرابط القديم الذي يعيد access_token في الـhash
         * يترك لـSupabase التعامل معه بشكل طبيعي.
         */
        const hash = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );

        const hashError =
          hash.get("error_description") ||
          hash.get("error");

        if (hashError) {
          throw new Error(hashError);
        }

        const { data } = await supabase.auth.getSession();

        if (!active) return;

        if (data.session) {
          await finishConfirmation();
          return;
        }

        setState("error");
        setMessage("تعذر العثور على جلسة تأكيد صالحة.");
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
          !tokenFlowRef.current &&
          (event === "SIGNED_IN" || event === "USER_UPDATED")
        ) {
          void finishConfirmation();
        }
      });

    async function finishConfirmation(userOverride?: import("@supabase/supabase-js").User) {
      try {
        const user =
          userOverride ?? (await supabase.auth.getUser()).data.user;

        if (!user) {
          throw new Error(
            "تعذر إنشاء جلسة بعد تفعيل البريد.",
          );
        }

        if (!user.email_confirmed_at) {
          throw new Error(
            "لم يتم تأكيد البريد الإلكتروني بعد.",
          );
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        const raw = localStorage.getItem(PENDING_KEY);
        const pendingEmail =
          localStorage.getItem(PENDING_EMAIL_KEY);

        let role: "individual" | "office" = "individual";

        if (raw) {
          const payload = JSON.parse(raw) as {
            _role?: "individual" | "office";
            _full_name?: string;
            _governorate_id?: string;
            _phone?: string;
            _office?: unknown;
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

        if (!raw) {
          const [{ data: roles }, { data: office }] =
            await Promise.all([
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id),

              supabase
                .from("offices")
                .select("id")
                .eq("owner_id", user.id)
                .maybeSingle(),
            ]);

          if (
            office?.id ||
            roles?.some((item) => item.role === "office")
          ) {
            role = "office";
          } else {
            role = "individual";
          }
        }

        if (!active) return;

        setState("success");

        if (role === "office") {
          setMessage(
            "تم تأكيد بريدك الإلكتروني. طلب المكتب الآن قيد مراجعة الإدارة.",
          );

          window.setTimeout(() => {
            navigate({
              to: "/office/status",
              replace: true,
            });
          }, 1200);
        } else {
          setMessage(
            "تم تأكيد بريدك الإلكتروني وإنشاء حسابك بنجاح.",
          );

          window.setTimeout(() => {
            navigate({
              to: "/home",
              replace: true,
            });
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

    void setup();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  async function confirmToken() {
    if (!tokenHash || confirming) return;

    setConfirming(true);
    setState("loading");
    setMessage("جاري تأكيد بريدك الإلكتروني...");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("تم تأكيد البريد لكن تعذر استعادة الحساب.");
      }

      if (!data.user.email_confirmed_at) {
        throw new Error("لم يتم تأكيد البريد الإلكتروني بعد.");
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setTokenHash(null);
      await finishConfirmation(data.user);
    } catch (e) {
      setState("error");
      setMessage(
        e instanceof Error
          ? e.message
          : "تعذر تفعيل الحساب.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5">
      {state === "loading" && (
        <Loader2 className="size-12 animate-spin text-forest" />
      )}

      {state === "waiting" && (
        <MailCheck className="size-14 text-forest" />
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
            : state === "waiting"
              ? "تأكيد البريد الإلكتروني"
              : "تفعيل حسابك"}
      </h1>

      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>

      {state === "waiting" && tokenHash && (
        <button
          type="button"
          onClick={() => void confirmToken()}
          disabled={confirming}
          className="mt-6 rounded-2xl bg-forest px-7 py-3.5 text-sm font-bold text-background disabled:opacity-60"
        >
          {confirming
            ? "جاري التفعيل..."
            : "تأكيد البريد الإلكتروني"}
        </button>
      )}

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

