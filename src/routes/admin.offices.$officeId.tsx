import {
  createFileRoute,
  Link,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "@/lib/role-guard";
import { AdminShell } from "@/components/AdminShell";
import {
  fetchOfficeActivity,
} from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/admin/offices/$officeId",
)({
  head: () => ({
    meta: [
      { title: "بيانات المكتب | إدارة عقار البطين" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]} guestsTo="/auth/admin">
      <AdminShell>
        <OfficeDetails />
      </AdminShell>
    </RoleGuard>
  ),
});

function OfficeDetails() {
  const { officeId } = useParams({
    from: "/admin/offices/$officeId",
  });

  const navigate = useNavigate();
  const qc = useQueryClient();

  const [reason, setReason] = useState("");

  const { data: office, isLoading } = useQuery({
    queryKey: ["admin-office", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id,owner_id,name,manager_name,phone,email,address,commercial_register,license_number,fal_license_number,governorate_id,verification_status,rejection_reason,plan,plan_expires_at,created_at,updated_at,governorates(name_ar)",
        )
        .eq("id", officeId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-office-activity", officeId],
    queryFn: () => fetchOfficeActivity(officeId),
    enabled: !!office,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      status,
    }: {
      status: "verified" | "rejected";
    }) => {
      if (
        status === "rejected" &&
        !reason.trim()
      ) {
        throw new Error(
          "اكتب سبب الرفض قبل التأكيد.",
        );
      }

      const { error } = await supabase
        .from("offices")
        .update({
          verification_status: status,
          rejection_reason:
            status === "rejected"
              ? reason.trim()
              : null,
        })
        .eq("id", officeId);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم تحديث حالة المكتب.");

      setReason("");

      void qc.invalidateQueries({
        queryKey: ["admin-office", officeId],
      });

      void qc.invalidateQueries({
        queryKey: ["admin-office-activity", officeId],
      });

      void qc.invalidateQueries({
        queryKey: ["admin-directory"],
      });

      void qc.invalidateQueries({
        queryKey: ["admin-dashboard-stats"],
      });
    },

    onError: (e) =>
      toast.error(
        e instanceof Error
          ? e.message
          : "تعذر تحديث الحالة.",
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-3xl bg-sand" />
        <div className="h-64 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
        المكتب غير موجود.
      </div>
    );
  }

  const governorate = (
    office.governorates as
      | { name_ar: string }
      | null
      | undefined
  )?.name_ar;

  const status =
    office.verification_status;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/offices"
        className="inline-flex items-center gap-1 text-xs font-bold text-forest"
      >
        <ArrowRight className="size-3.5" />
        العودة للمكاتب
      </Link>

      <section className="rounded-3xl bg-forest p-4 text-background">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-background/15">
            <Building2 className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-extrabold">
              {office.name}
            </h1>

            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {status === "verified" ? (
                <CheckCircle2 className="size-3.5" />
              ) : status === "rejected" ? (
                <XCircle className="size-3.5" />
              ) : (
                <Clock3 className="size-3.5" />
              )}

              {status === "verified"
                ? "موثق"
                : status === "rejected"
                  ? "مرفوض"
                  : "قيد المراجعة"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          بيانات التسجيل
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Info
            label="اسم المكتب"
            value={office.name}
          />

          <Info
            label="اسم المسؤول"
            value={
              office.manager_name || "—"
            }
          />

          <Info
            label="البريد الإلكتروني"
            value={office.email || "—"}
            icon={Mail}
          />

          <Info
            label="رقم الجوال"
            value={office.phone || "—"}
            icon={Phone}
          />

          <Info
            label="المحافظة"
            value={governorate || "—"}
          />

          <Info
            label="السجل التجاري"
            value={
              office.commercial_register ||
              "—"
            }
          />

          <Info
            label="رقم الترخيص"
            value={
              office.license_number || "—"
            }
          />

          <Info
            label="رخصة فال"
            value={
              office.fal_license_number ||
              "—"
            }
          />

          <Info
            label="العنوان"
            value={office.address || "—"}
          />

          <Info
            label="الباقة"
            value={
              office.plan === "pro"
                ? "احترافي"
                : "مجاني"
            }
          />

          <Info
            label="تاريخ التسجيل"
            value={new Date(
              office.created_at,
            ).toLocaleString("ar-SA")}
          />
        </div>

        {office.rejection_reason &&
          status === "rejected" && (
            <div className="mt-3 rounded-xl bg-destructive/5 p-3 text-xs text-destructive">
              <div className="font-bold">
                سبب الرفض
              </div>

              <div className="mt-1 leading-relaxed">
                {office.rejection_reason}
              </div>
            </div>
          )}
      </section>

      <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          نشاط المكتب
        </h2>

        {activity ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric
              label="العقارات"
              value={activity.properties}
            />
            <Metric
              label="المنشورة"
              value={
                activity.publishedProperties
              }
            />
            <Metric
              label="المشاهدات"
              value={activity.views}
            />
            <Metric
              label="طلبات العملاء"
              value={activity.inquiries}
            />
            <Metric
              label="الحجوزات"
              value={activity.bookings}
            />
            <Metric
              label="التقييمات"
              value={activity.reviews}
            />
            <Metric
              label="الموظفين"
              value={activity.staff}
            />
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            جاري تحميل النشاط...
          </div>
        )}
      </section>

      {status !== "verified" && (
        <button
          onClick={() =>
            statusMutation.mutate({
              status: "verified",
            })
          }
          disabled={statusMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
        >
          {statusMutation.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          اعتماد وتوثيق المكتب
        </button>
      )}

      {status !== "rejected" && (
        <div className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="text-xs font-extrabold">
            رفض المكتب
          </div>

          <textarea
            rows={3}
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            placeholder="سبب الرفض..."
            className="w-full rounded-xl bg-background px-3 py-2.5 text-xs outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
          />

          <button
            onClick={() =>
              statusMutation.mutate({
                status: "rejected",
              })
            }
            disabled={
              statusMutation.isPending
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-xs font-bold text-destructive disabled:opacity-50"
          >
            رفض الطلب
          </button>
        </div>
      )}

      {status === "verified" && (
        <div className="rounded-2xl bg-forest-soft p-4 text-center text-xs font-semibold text-forest">
          هذا المكتب معتمد ويمكنه استخدام
          لوحة المكتب.
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Phone;
}) {
  return (
    <div className="rounded-xl bg-sand p-3">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </div>

      <div className="mt-1 break-words text-xs font-semibold">
        {value}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-background p-3 ring-1 ring-line">
      <div className="font-display text-xl font-extrabold">
        {value}
      </div>

      <div className="mt-1 text-[10px] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
