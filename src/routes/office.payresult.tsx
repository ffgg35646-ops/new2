import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/office/payresult")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
    resourcePath: typeof search["resourcePath"] === "string" ? search["resourcePath"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "نتيجة الدفع | عقار البطين" }],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id, resourcePath } = Route.useSearch();
  const qc = useQueryClient();
  const [state, setState] = useState<"checking" | "success" | "failed" | "pending" | "verification_error">("checking");
  const [message, setMessage] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const checkoutId = id || resourcePath?.split("/")[3]?.split("?")[0];
    if (!checkoutId) {
      setState("failed");
      setMessage("لم نستلم بيانات العملية");
      return;
    }

    async function checkOnce(timeoutMs: number) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch("/api/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId }),
          signal: ctrl.signal,
        });

        const responseText = await res.text();
        let parsed: {
          success?: boolean;
          description?: string;
          error?: string;
          code?: string;
          gatewayDescription?: string;
          status?: string;
          pending?: boolean;
          verificationError?: boolean;
        };

        try {
          parsed = JSON.parse(responseText) as typeof parsed;
        } catch {
          return {
            success: false,
            pending: false,
            status: "verification_error",
            verificationError: true,
            description: `خدمة التحقق أعادت استجابة غير صالحة (HTTP ${res.status}). لم يتم تأكيد نتيجة البطاقة، ولم يتم تفعيل الباقة.`,
          };
        }

        return {
          ...parsed,
          description:
            parsed.description ??
            parsed.error ??
            (!res.ok
              ? `تعذّر التحقق من الدفع (HTTP ${res.status}). لم يتم تفعيل الباقة.`
              : undefined),
        };
      } finally {
        clearTimeout(t);
      }
    }

    (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const data = await checkOnce(12000);

          if (data?.verificationError || data?.status === "verification_error") {
            setState("verification_error");
            setMessage(
              data.description ||
                data.error ||
                "تعذّر تأكيد نتيجة العملية لدى HyperPay. لم يتم تفعيل الباقة.",
            );
            return;
          }

          if (data?.success) {
            setState("success");
            setMessage("تم استلام دفعتك وتفعيل الباقة الاحترافية لمدة 30 يومًا 🎉");
            void qc.invalidateQueries();
            return;
          }

          if (data?.pending) {
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            setState("pending");
            setMessage(
              data.description ||
                "الدفع ما زال قيد المعالجة. لم يتم تفعيل الباقة حتى تأكيد نجاح العملية.",
            );
            return;
          }

          setState("failed");
          const gatewayCode = data?.code ? ` (كود HyperPay: ${data.code})` : "";
          setMessage(
            (data?.description || data?.error || "لم يكتمل الدفع، ولم يتم تفعيل الباقة.") +
              gatewayCode,
          );
          return;
        } catch {
          if (attempt === 3) {
            setState("failed");
            setMessage(
              "تعذّر تأكيد النتيجة الآن. لا تعِد الدفع قبل مراجعة سجل العملية أو التواصل مع الدعم من صفحة «الباقة والاشتراك».",
            );
          }
        }
      }
    })();
  }, [id, resourcePath, qc]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showSearch={false} />
      <div className="mx-auto grid w-full max-w-md place-items-center px-4 py-16 text-center">
        {state === "checking" && (
          <>
            <Loader2 className="size-10 animate-spin text-forest" />
            <p className="mt-4 text-sm text-muted-foreground">جارٍ التحقق من الدفع…</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="size-16 text-forest" />
            <h1 className="mt-4 font-display text-xl font-extrabold">تم الدفع بنجاح</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Link
              to="/office/subscription"
              className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
            >
              عرض باقتي
            </Link>
          </>
        )}

        {state === "pending" && (
          <>
            <Loader2 className="size-16 text-terracotta" />
            <h1 className="mt-4 font-display text-xl font-extrabold">الدفع قيد التحقق</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Link
              to="/office/subscription"
              className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
            >
              العودة إلى الباقة والاشتراك
            </Link>
          </>
        )}

        {state === "verification_error" && (
          <>
            <XCircle className="size-16 text-terracotta" />
            <h1 className="mt-4 font-display text-xl font-extrabold">تعذّر التحقق من الدفع</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {message}
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              هذه ليست بالضرورة نتيجة رفض من البنك؛ تعذّر تأكيد حالة العملية. لم يتم تفعيل الباقة.
            </p>
            <Link
              to="/office/pay"
              search={{ package: undefined }}
              className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
            >
              بدء محاولة جديدة
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="size-16 text-terracotta" />
            <h1 className="mt-4 font-display text-xl font-extrabold">لم يكتمل الدفع</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {message || "رفضت البوابة العملية أو لم تكتمل."} لم يتم تفعيل الباقة.
            </p>
            <Link
              to="/office/pay"
              search={{ package: undefined }}
              className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
            >
              إعادة المحاولة
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
