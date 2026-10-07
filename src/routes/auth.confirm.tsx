import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MailCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "ufuq.pending-signup";
const PENDING_EMAIL_KEY = "ufuq.pending-email";

type ConfirmState = "loading" | "waiting" | "success" | "error";

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
  const finishingRef = useRef(false);
  const mountedRef = useRef(true);

  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState(
    "جاري تجهيز تأكيد البريد الإلكتروني...",
  );
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function showError(error: unknown, fallback = "تعذر تفعيل الحساب.") {
    console.error("[CONFIRM EMAIL ERROR]", error);
    if (!mountedRef.current) return;

    setState("error");
    setMessage(
      error instanceof Error ? error.message : fallback,
    );
  }

  function cleanConfirmUrl() {
    const cleanUrl =
      window.location.origin +
      window.location.pathname +
      window.location.search;

    const params = new URLSearchParams(window.location.search);
    params.delete("token_hash");
    params.delete("type");
    params.delete("code");

    const query = params.toString();
    const nextUrl =
      window.location.pathname +
      (query ? "?" + query : "");

    window.history.replaceState(
      {},
      document.title,
      nextUrl,
    );
  }

  async function finishAccount(userId: string) {
    const raw = localStorage.getItem(PENDING_KEY);

    if (raw) {
      let payload: Record<string, unknown>;

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        throw new Error(
          "تم تأكيد البريد لكن بيانات التسجيل المحلية تالفة. سجّل الدخول ثم أكمل البيانات.",
        );
      }

      const { error } = await supabase.rpc(
        "complete_signup",
        payload as never,
      );

      if (error) {
        throw new Error(
          "تم تأكيد البريد لكن تعذر إكمال إنشاء الحساب: " +
            error.message,
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
      office?.id || roles?.some((item) => item.role === "office")
        ? "office"
        : "individual";

    if (!mountedRef.current) return;

    setState("success");

    if (role === "office") {
      setMessage(
        "تم تأكيد البريد الإلكتروني بنجاح. حساب المكتب الآن قيد مراجعة الإدارة.",
      );

      window.setTimeout(() => {
        navigate({
          to: "/office/status",
          replace: true,
        });
      }, 1200);
      return;
    }

    setMessage(
      "تم تأكيد البريد الإلكتروني وإنشاء حسابك بنجاح.",
    );

    window.setTimeout(() => {
      navigate({
        to: "/home",
        replace: true,
      });
    }, 1200);
  }

  async function finishCurrentSession() {
    if (finishingRef.current) return;
    finishingRef.current = true;

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      const user = data.user;

      if (!user) {
        throw new Error(
          "تم تأكيد البريد لكن لم يتم إنشاء جلسة تسجيل الدخول.",
        );
      }

      if (!user.email_confirmed_at) {
        throw new Error(
          "تمت العملية لكن البريد ما زال غير مؤكد في بيانات المستخدم.",
        );
      }

      cleanConfirmUrl();
      await finishAccount(user.id);
    } finally {
      finishingRef.current = false;
    }
  }

  useEffect(() => {
    let active = true;

    async function setup() {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const incomingTokenHash = params.get("token_hash");
        const incomingType = params.get("type");

        if (incomingTokenHash) {
          if (incomingType !== "email") {
            throw new Error("رابط تفعيل البريد غير صالح.");
          }

          if (!active) return;

          setTokenHash(incomingTokenHash);
          setState("waiting");
          setMessage(
            "رابط تفعيل بريدك الإلكتروني جاهز. اضغط الزر أدناه لإتمام التفعيل.",
          );
          return;
        }

        const hash = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );

        const hashError =
          hash.get("error_description") || hash.get("error");

        if (hashError) {
          throw new Error(hashError);
        }

        const code = params.get("code");

        if (code) {
          setState("loading");
          setMessage("جاري إكمال تأكيد البريد الإلكتروني...");

          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          cleanConfirmUrl();
          await finishCurrentSession();
          return;
        }

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (accessToken && refreshToken) {
          setState("loading");
          setMessage("جاري إكمال تأكيد البريد الإلكتروني...");

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );

          await finishCurrentSession();
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (!active) return;

        if (data.session) {
          await finishCurrentSession();
          return;
        }

        throw new Error(
          "رابط التفعيل لا يحتوي على رمز تأكيد صالح. اطلب رسالة تفعيل جديدة.",
        );
      } catch (error) {
        if (!active) return;
        showError(error);
      }
    }

    void setup();

    return () => {
      active = false;
    };
  }, [navigate]);

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

      if (error) throw error;

      if (!data.user) {
        throw new Error(
          "Supabase أكد العملية لكن لم يُرجع بيانات المستخدم.",
        );
      }

      if (!data.user.email_confirmed_at) {
        throw new Error(
          "تمت العملية لكن البريد ما زال غير مؤكد في بيانات المستخدم.",
        );
      }

      if (data.session) {
        const { error: sessionError } =
          await supabase.auth.setSession(data.session);

        if (sessionError) throw sessionError;
      }

      const { data: currentSession } =
        await supabase.auth.getSession();

      if (!currentSession.session?.user) {
        throw new Error(
          "تم تأكيد البريد لكن الجلسة لم تُحفظ في المتصفح.",
        );
      }

      setTokenHash(null);
      cleanConfirmUrl();
      await finishAccount(data.user.id);
    } catch (error) {
      showError(error);
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
          {busy ? "جاري التفعيل..." : "تأكيد البريد الإلكتروني"}
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
