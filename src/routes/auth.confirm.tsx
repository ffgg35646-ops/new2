import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const startedRef = useRef(false);

  const [state, setState] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState(
    "جاري تفعيل حسابك تلقائيًا...",
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void confirmAccount();
  }, []);

  async function finishAccount(userId: string) {
    const raw = localStorage.getItem(PENDING_KEY);

    if (raw) {
      let payload: Record<string, unknown>;

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        throw new Error("بيانات إنشاء الحساب غير صالحة.");
      }

      const { error } = await supabase.rpc(
        "complete_signup",
        payload as never,
      );

      if (error) {
        throw new Error(
          `تم تأكيد البريد لكن تعذر إكمال إنشاء الحساب: ${error.message}`,
        );
      }

      localStorage.removeItem(PENDING_KEY);
    }

    localStorage.removeItem(PENDING_EMAIL_KEY);

    const [rolesRes, officeRes] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),

      supabase
        .from("offices")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle(),
    ]);

    if (rolesRes.error) throw rolesRes.error;
    if (officeRes.error) throw officeRes.error;

    const role =
      officeRes.data?.id ||
      rolesRes.data?.some((x) => x.role === "office")
        ? "office"
        : "individual";

    setState("success");

    if (role === "office") {
      setMessage(
        "تم تفعيل الحساب بنجاح. حساب المكتب الآن قيد مراجعة الإدارة.",
      );

      setTimeout(() => {
        navigate({
          to: "/office/status",
          replace: true,
        });
      }, 1200);
    } else {
      setMessage("تم تفعيل الحساب بنجاح.");

      setTimeout(() => {
        navigate({
          to: "/home",
          replace: true,
        });
      }, 1200);
    }
  }

  async function confirmAccount() {
    try {
      setState("loading");
      setMessage("جاري تفعيل حسابك تلقائيًا...");

      let { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      let session = data.session;

      if (!session) {
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (result.error) throw result.error;

          session = result.data.session;
        }
      }

      if (!session) {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (tokenHash && type === "email") {
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (result.error) throw result.error;

          session = result.data.session;
        }
      }

      if (!session) {
        throw new Error(
          "رابط التفعيل غير صالح أو منتهي. اطلب رسالة تفعيل جديدة.",
        );
      }

      const user = session.user;

      if (!user.email_confirmed_at) {
        throw new Error(
          "تم فتح الرابط، لكن البريد لم يظهر كمؤكد.",
        );
      }

      await finishAccount(user.id);
    } catch (error) {
      console.error("[AUTO CONFIRM EMAIL ERROR]", error);

      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر تفعيل الحساب.",
      );
    }
  }

  return (
    <div
      dir="rtl"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5"
    >
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
