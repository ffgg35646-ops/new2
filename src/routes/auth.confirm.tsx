import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    "جاري تجهيز تأكيد البريد الإلكتروني...",
  );

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token_hash");
    const type = params.get("type");

    if (token) {
      if (type !== "email") {
        setState("error");
        setMessage("رابط تفعيل البريد غير صالح.");
        return;
      }

      setTokenHash(token);
      setState("waiting");
      setMessage(
        "اضغط الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل الحساب.",
      );
      return;
    }

    setState("error");
    setMessage(
      "رابط التفعيل غير مكتمل. اطلب رسالة تفعيل جديدة من صفحة تسجيل الدخول.",
    );
  }, []);

  async function finishAccount(userId: string) {
    const raw = localStorage.getItem(PENDING_KEY);

    if (raw) {
      const payload = JSON.parse(raw);

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

    const [{ data: roles }, { data: office }] = await Promise.all([
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

    const role =
      office?.id || roles?.some((x) => x.role === "office")
        ? "office"
        : "individual";

    setState("success");

    if (role === "office") {
      setMessage(
        "تم تأكيد البريد الإلكتروني بنجاح. حساب المكتب الآن قيد مراجعة الإدارة.",
      );

      setTimeout(() => {
        navigate({
          to: "/office/status",
          replace: true,
        });
      }, 1200);
    } else {
      setMessage(
        "تم تأكيد البريد الإلكتروني وإنشاء حسابك بنجاح.",
      );

      setTimeout(() => {
        navigate({
          to: "/home",
          replace: true,
        });
      }, 1200);
    }
  }

  async function confirmEmail() {
    if (!tokenHash || busy) return;

    setBusy(true);
    setState("loading");
    setMessage("جاري تأكيد البريد الإلكتروني...");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });

      if (error) {
        throw new Error(
          `Supabase: ${error.message} (${error.code ?? "no-code"})`,
        );
      }

      const user = data.user;
      const session = data.session;

      if (!user) {
        throw new Error(
          "Supabase أكد العملية لكن لم يُرجع بيانات المستخدم.",
        );
      }

      if (!user.email_confirmed_at) {
        throw new Error(
          "تمت العملية لكن البريد ما زال غير مؤكد في بيانات المستخدم.",
        );
      }

      if (!session) {
        throw new Error(
          "Supabase أكد البريد لكنه لم يُرجع جلسة تسجيل دخول.",
        );
      }

      const { error: sessionError } =
        await supabase.auth.setSession(session);

      if (sessionError) {
        throw new Error(
          `تم تأكيد البريد لكن فشل حفظ الجلسة: ${sessionError.message}`,
        );
      }

      const { data: currentSession } =
        await supabase.auth.getSession();

      if (!currentSession.session?.user) {
        throw new Error(
          "تم تأكيد البريد لكن الجلسة لم تُحفظ في المتصفح.",
        );
      }

      setTokenHash(null);

      await finishAccount(user.id);
    } catch (error) {
      console.error("[CONFIRM EMAIL ERROR]", error);

      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر تفعيل الحساب.",
      );
    } finally {
      setBusy(false);
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
          onClick={() => void confirmEmail()}
          disabled={busy}
          className="mt-6 rounded-2xl bg-forest px-7 py-3.5 text-sm font-bold text-background disabled:opacity-60"
        >
          {busy
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
