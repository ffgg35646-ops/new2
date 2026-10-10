import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "المدفوعات | إدارة عقار البطين" },
      {
        name: "description",
        content: "إدارة إعدادات بوابة الدفع ومراجعة عمليات الدفع.",
      },
    ],
  }),

  component: PaymentsPage,
});

type GatewaySettings = {
  id: number;
  currency: string;
  ignore_descriptor_validation: boolean;
  updated_at: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_brand: string | null;
  result_code: string | null;
  result_description: string | null;
  merchant_transaction_id: string;
  gateway_transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
  offices?: { name: string } | null;
  package_catalog?: { name: string } | null;
};

function statusLabel(status: string) {
  if (status === "success") return "ناجحة";
  if (status === "pending") return "قيد المعالجة";
  if (status === "verification_error") return "تعذّر التحقق";
  if (status === "cancelled") return "ملغاة";
  return "فاشلة";
}

function statusClass(status: string) {
  if (status === "success") {
    return "bg-forest-soft text-forest";
  }

  if (status === "pending" || status === "verification_error") {
    return "bg-amber-500/10 text-amber-700";
  }

  if (status === "cancelled") {
    return "bg-sand text-muted-foreground";
  }

  return "bg-destructive/10 text-destructive";
}

function PaymentsPage() {
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_gateway_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      return data as GatewaySettings | null;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-payment-transactions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_transactions")
        .select(`
          id,
          amount,
          currency,
          status,
          payment_brand,
          result_code,
          result_description,
          merchant_transaction_id,
          gateway_transaction_id,
          created_at,
          paid_at,
          offices(name),
          package_catalog(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },

    refetchInterval: 60_000,
  });

  const [currency, setCurrency] = useState("SAR");
  const [ignoreDescriptor, setIgnoreDescriptor] = useState(true);

  const current = settingsQuery.data;

  if (
    current &&
    currency === "SAR" &&
    ignoreDescriptor === true
  ) {
    setCurrency(current.currency ?? "SAR");
    setIgnoreDescriptor(
      Boolean(current.ignore_descriptor_validation),
    );
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("payment_gateway_settings")
        .update({
          currency: currency.trim().toUpperCase(),
          ignore_descriptor_validation: ignoreDescriptor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم حفظ إعدادات بوابة الدفع");
      void qc.invalidateQueries({
        queryKey: ["admin-payment-settings"],
      });
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر حفظ الإعدادات",
      );
    },
  });

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-3xl bg-forest p-5 text-background">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-background/15">
            <CreditCard className="size-5" />
          </div>

          <div>
            <h1 className="font-display text-xl font-extrabold">
              المدفوعات
            </h1>

            <p className="mt-1 text-xs opacity-80">
              إعدادات التاجر وسجل عمليات الدفع الفعلية.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-base font-extrabold">
          إعدادات التاجر
        </h2>

        <div className="mt-4 space-y-3">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="العملة"
            dir="ltr"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <label className="flex items-center gap-2 rounded-2xl bg-sand p-3 text-sm">
            <input
              type="checkbox"
              checked={ignoreDescriptor}
              onChange={(e) =>
                setIgnoreDescriptor(e.target.checked)
              }
            />

            Merchant.data['ignoreDescriptorValidation']
          </label>

          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || settingsQuery.isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50"
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            حفظ إعدادات الدفع
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold">
            سجل المدفوعات
          </h2>

          <span className="text-xs text-muted-foreground">
            {paymentsQuery.data?.length ?? 0} عملية
          </span>
        </div>

        {paymentsQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-2xl bg-surface p-8 text-sm text-muted-foreground ring-1 ring-line">
            <Loader2 className="me-2 size-4 animate-spin" />
            جاري تحميل المدفوعات...
          </div>
        ) : paymentsQuery.isError ? (
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            تعذّر تحميل سجل المدفوعات.
          </div>
        ) : !paymentsQuery.data?.length ? (
          <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
            لا توجد عمليات دفع حتى الآن.
          </div>
        ) : (
          paymentsQuery.data.map((payment) => (
            <article
              key={payment.id}
              className="rounded-3xl bg-surface p-4 ring-1 ring-line"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-sm font-extrabold">
                    {payment.package_catalog?.name ?? "باقة"}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {payment.offices?.name ?? "مكتب"}
                  </div>
                </div>

                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                    statusClass(payment.status)
                  }
                >
                  {statusLabel(payment.status)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Info
                  label="المبلغ"
                  value={`${Number(payment.amount).toLocaleString("ar-SA")} ${payment.currency}`}
                />

                <Info
                  label="البطاقة"
                  value={payment.payment_brand || "—"}
                />

                <Info
                  label="رقم العملية"
                  value={payment.merchant_transaction_id}
                />

                <Info
                  label="Gateway ID"
                  value={payment.gateway_transaction_id || "—"}
                />

                <Info
                  label="كود النتيجة"
                  value={payment.result_code || "—"}
                />

                <Info
                  label="التاريخ"
                  value={new Date(
                    payment.created_at,
                  ).toLocaleString("ar-SA")}
                />
              </div>

              {payment.result_description && (
                <div className="mt-3 rounded-2xl bg-sand p-3 text-xs leading-6 text-muted-foreground">
                  {payment.result_description}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-sand p-3">
      <div className="text-[10px] text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 break-all text-xs font-bold">
        {value}
      </div>
    </div>
  );
}
