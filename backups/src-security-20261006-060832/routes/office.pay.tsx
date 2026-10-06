import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/office/pay")({
  head: () => ({
    meta: [
      { title: "الدفع | عقار البطين" },
      {
        name: "description",
        content: "إتمام دفع اشتراك الباقة الاحترافية بأمان عبر مدى أو فيزا أو ماستركارد.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <PayPage />
    </RoleGuard>
  ),
});

declare global {
  interface Window {
    wpwlOptions?: unknown;
  }
}

function PayPage() {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const accessToken = sess.session?.access_token;
        if (!accessToken) throw new Error("سجّل الدخول أولًا");

        const fnUrl = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/payment-checkout`;
        const apikey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 15000);
        let data: { checkoutId?: string; integrity?: string; baseUrl?: string; error?: string };
        try {
          const res = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({}),
            signal: ctrl.signal,
          });
          data = await res.json();
        } finally {
          clearTimeout(to);
        }
        if (!data?.checkoutId) {
          throw new Error(data?.error || "تعذّر بدء عملية الدفع");
        }

        const base = data.baseUrl as string;
        const resultUrl = `${window.location.origin}/office/payresult`;

        window.wpwlOptions = {
          locale: "ar",
          paymentTarget: "_top",
          requireCvv: true,
          style: "card",
        };

        const form = document.getElementById("hp-form") as HTMLFormElement | null;
        if (form) form.setAttribute("action", resultUrl);

        const script = document.createElement("script");
        script.src = `${base}/v1/paymentWidgets.js?checkoutId=${data.checkoutId}`;
        if (data.integrity) {
          script.integrity = data.integrity;
          script.crossOrigin = "anonymous";
        }
        script.async = true;
        script.onload = () => setReady(true);
        script.onerror = () => setError("تعذّر تحميل نموذج الدفع، حاول مجددًا");
        document.body.appendChild(script);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر بدء الدفع");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />
      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الدفع الآمن</h1>

        <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold">الباقة الاحترافية — شهر</span>
            <span className="font-display text-lg font-extrabold text-forest">199 ر.س</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-forest" /> دفع مشفّر عبر HyperPay — مدى، فيزا،
            ماستركارد
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        ) : !ready ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-6 animate-spin text-forest" />
            <span className="mt-2 text-xs text-muted-foreground">جارٍ تجهيز نموذج الدفع…</span>
          </div>
        ) : null}

        {ready && (
          <p className="rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground">
            ملاحظة: اكتب <b>اسم حامل البطاقة بالحروف الإنجليزية</b> (٣ أحرف على الأقل) كما هو مطبوع
            على البطاقة.
          </p>
        )}

        <form
          id="hp-form"
          className="paymentWidgets rounded-3xl bg-surface p-2 ring-1 ring-line"
          data-brands="MADA VISA MASTER"
        />
      </div>
    </div>
  );
}
