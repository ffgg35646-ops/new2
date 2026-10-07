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
  const startedRef = useRef(false);

  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const [message, setMessage] = useState(
    "جاري تفعيل حسابك تلقائيًا...",
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void confirmAccount();
  }, []);

  async function finishAccount(
    userId: string,
    userMetadata: Record<string, unknown>,
  ) {
    const raw = localStorage.getItem(PENDING_KEY);
    let payload: Record<string, unknown> | null = null;

    if (raw) {
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        localStorage.removeItem(PENDING_KEY);
      }
    }

    if (!payload) {
      const fromMetadata = userMetadata.signup_payload;

      if (
        fromMetadata &&
        typeof fromMetadata === "object" &&
        !Array.isArray(fromMetadata)
      ) {
        payload = fromMetadata as Record<string, unknown>;
      }
    }

    if (!payload) {
      throw new Error(
        "تم تأكيد البريد، لكن بيانات إنشاء الحساب غير متاحة. سجّل الدخول لإكمال الحساب.",
      );
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
        "تم تفعيل حسابك بنجاح. حساب المكتب الآن قيد مراجعة الإدارة.",
      );

      setTimeout(() => {
        navigate({
          to: "/office/status",
          replace: true,
        });
      }, 1200);
    } else {
      setMessage("تم تفعيل حسابك بنجاح.");

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

      // Supabase processes the #access_token/#refresh_token
      // from the email link and restores the session.
      let { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      let session = data.session;

      // Backward-compatible fallback for token_hash links.
      if (!session) {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (tokenHash && type === "email") {
          const otpResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (otpResult.error) throw otpResult.error;

          session = otpResult.data.session;
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
          "تم فتح الرابط، لكن البريد لم يظهر كمؤكد. اطلب رسالة تفعيل جديدة.",
        );
      }

      await finishAccount(
        user.id,
        (user.user_metadata as Record<string, unknown>) ?? {},
      );
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
