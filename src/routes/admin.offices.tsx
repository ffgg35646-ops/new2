import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock3,
  Loader2,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { RoleGuard } from "@/lib/role-guard";
import { AdminShell } from "@/components/AdminShell";
import {
  isTodaySaudi,
  useAdminDirectory,
  useOfficeActivity,
  type AdminOffice,
} from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/offices")({
  head: () => ({
    meta: [
      { title: "المكاتب | إدارة عقار البطين" },
      {
        name: "description",
        content:
          "إدارة ومراجعة المكاتب العقارية المسجلة.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]} guestsTo="/auth/admin">
      <AdminShell>
        <OfficesAdminPage />
      </AdminShell>
    </RoleGuard>
  ),
});

function OfficesAdminPage() {
  const { data, isLoading, isFetching } =
    useAdminDirectory();

  const offices = data?.offices ?? [];
  const pending = offices.filter(
    (o) => o.verification_status === "pending",
  ).length;

  const ordered = [...offices].sort((a, b) => {
    const ap =
      a.verification_status === "pending" ? 0 : 1;
    const bp =
      b.verification_status === "pending" ? 0 : 1;

    if (ap !== bp) return ap - bp;

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-forest p-4 text-background">
        <div className="grid grid-cols-3 gap-2">
          <TopStat
            label="المكاتب"
            value={
              isLoading ? "—" : offices.length
            }
          />

          <TopStat
            label="قيد المراجعة"
            value={isLoading ? "—" : pending}
          />

          <TopStat
            label="موثقة"
            value={
              isLoading
                ? "—"
                : offices.filter(
                    (o) =>
                      o.verification_status ===
                      "verified",
                  ).length
            }
          />
        </div>

        {isFetching && !isLoading && (
          <div className="mt-2 text-[10px] opacity-70">
            تحديث البيانات في الخلفية...
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-sand"
            />
          ))}
        </div>
      ) : ordered.length ? (
        <div className="space-y-2.5">
          {ordered.map((office) => (
            <OfficeRow
              key={office.id}
              office={office}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
          لا توجد مكاتب مسجلة.
        </div>
      )}
    </div>
  );
}

function OfficeRow({
  office,
}: {
  office: AdminOffice;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const { data: activity, isLoading } =
    useOfficeActivity(
      office.id,
      expanded,
    );

  const qc = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({
      status,
      rejectionReason,
    }: {
      status: "verified" | "rejected";
      rejectionReason?: string | null;
    }) => {
      if (
        status === "rejected" &&
        !rejectionReason?.trim()
      ) {
        throw new Error("اكتب سبب الرفض.");
      }

      const { error } = await supabase
        .from("offices")
        .update({
          verification_status: status,
          rejection_reason:
            status === "rejected"
              ? rejectionReason?.trim() || null
              : null,
        })
        .eq("id", office.id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(
        "تم تحديث حالة المكتب.",
      );

      setRejecting(false);
      setReason("");

      void qc.invalidateQueries({
        queryKey: ["admin-directory"],
      });

      void qc.invalidateQueries({
        queryKey: ["admin-dashboard-stats"],
      });
    },

    onError: (e) => {
      toast.error(
        e instanceof Error
          ? e.message
          : "تعذر تحديث المكتب.",
      );
    },
  });

  const statusIcon =
    office.verification_status ===
    "verified"
      ? CheckCircle2
      : office.verification_status ===
          "rejected"
        ? XCircle
        : Clock3;

  const StatusIcon = statusIcon;

  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
      <div
        className="flex cursor-pointer items-center gap-3 p-3.5"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
          <Building2 className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">
              {office.name}
            </span>

            {isTodaySaudi(
              office.created_at,
            ) && (
              <span className="rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold text-background">
                جديد
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <StatusIcon
              className={cn(
                "size-3.5",
                office.verification_status ===
                  "verified"
                  ? "text-forest"
                  : office.verification_status ===
                      "rejected"
                    ? "text-destructive"
                    : "text-terracotta",
              )}
            />

            <span className="text-[11px] text-muted-foreground">
              {office.verification_status ===
              "verified"
                ? "موثق"
                : office.verification_status ===
                    "rejected"
                  ? "مرفوض"
                  : "قيد المراجعة"}
            </span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="size-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground" />
        )}
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-line bg-background/50 p-3.5">
          <div className="grid grid-cols-2 gap-2">
            <Info
              label="اسم المسؤول"
              value={
                office.manager_name || "—"
              }
            />

            <Info
              label="المحافظة"
              value={
                office.governorate_name || "—"
              }
            />

            <Info
              label="رقم الجوال"
              value={office.phone || "—"}
              icon={Phone}
            />

            <Info
              label="البريد"
              value={office.email || "—"}
              icon={Mail}
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
              label="تاريخ التسجيل"
              value={new Date(
                office.created_at,
              ).toLocaleString("ar-SA")}
            />

            <Info
              label="الباقة"
              value={
                office.plan === "pro"
                  ? "احترافي"
                  : "مجاني"
              }
            />
          </div>

          {office.rejection_reason &&
            office.verification_status ===
              "rejected" && (
              <div className="rounded-xl bg-destructive/5 p-3 text-xs text-destructive">
                <div className="font-bold">
                  سبب الرفض
                </div>
                <div className="mt-1 leading-relaxed">
                  {office.rejection_reason}
                </div>
              </div>
            )}

          <div>
            <div className="mb-2 text-xs font-extrabold">
              نشاط المكتب
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                جاري تحميل النشاط...
              </div>
            ) : activity ? (
              <div className="grid grid-cols-2 gap-2">
                <Metric
                  label="إجمالي العقارات"
                  value={activity.properties}
                />
                <Metric
                  label="العقارات المنشورة"
                  value={activity.publishedProperties}
                />
                <Metric
                  label="مشاهدات العقارات"
                  value={activity.views}
                />
                <Metric
                  label="طلبات العملاء"
                  value={activity.inquiries}
                />
                <Metric
                  label="حجوزات المعاينة"
                  value={activity.bookings}
                />
                <Metric
                  label="التقييمات"
                  value={activity.reviews}
                />
                <Metric
                  label="الموظفون"
                  value={activity.staff}
                />
              </div>
            ) : null}
          </div>

          {rejecting && (
            <div className="space-y-2 rounded-xl bg-sand p-3">
              <div className="text-xs font-bold">
                سبب الرفض
              </div>

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                rows={3}
                placeholder="اكتب سبب رفض الطلب..."
                className="w-full rounded-xl bg-background px-3 py-2.5 text-xs outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
              />

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    statusMutation.mutate({
                      status: "rejected",
                      rejectionReason: reason,
                    })
                  }
                  disabled={
                    statusMutation.isPending
                  }
                  className="flex-1 rounded-xl bg-destructive/10 py-2.5 text-xs font-bold text-destructive disabled:opacity-50"
                >
                  تأكيد الرفض
                </button>

                <button
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  className="flex-1 rounded-xl bg-surface py-2.5 text-xs font-bold ring-1 ring-line"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {office.verification_status !==
              "verified" && (
              <button
                onClick={() =>
                  statusMutation.mutate({
                    status: "verified",
                  })
                }
                disabled={
                  statusMutation.isPending
                }
                className="flex-1 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
              >
                اعتماد المكتب
              </button>
            )}

            {office.verification_status !==
              "rejected" && (
              <button
                onClick={() => {
                  setRejecting(true);
                  setReason("");
                }}
                className="flex-1 rounded-xl bg-destructive/10 py-2.5 text-xs font-bold text-destructive"
              >
                رفض
              </button>
            )}

            <Link
              to="/admin/offices/$officeId"
              params={{ officeId: office.id }}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand"
              title="فتح التفاصيل"
            >
              <ChevronLeft className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function TopStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-background/10 p-3 text-center">
      <div className="font-display text-xl font-extrabold">
        {value}
      </div>

      <div className="mt-1 text-[10px] opacity-80">
        {label}
      </div>
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
    <div className="rounded-xl bg-surface p-3 ring-1 ring-line">
      <div className="font-display text-lg font-extrabold">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
