import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Loader2,
  Mail,
  Phone,
  User,
  UserRoundX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "@/lib/role-guard";
import { AdminShell } from "@/components/AdminShell";
import {
  isTodaySaudi,
  useAdminDirectory,
  useIndividualActivity,
  type AdminIndividual,
} from "@/lib/admin";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/individuals")({
  head: () => ({
    meta: [
      { title: "الأفراد | إدارة عقار البطين" },
      {
        name: "description",
        content:
          "إدارة حسابات الأفراد المسجلين في عقار البطين.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]} guestsTo="/auth/admin">
      <AdminShell>
        <IndividualsPage />
      </AdminShell>
    </RoleGuard>
  ),
});

function IndividualsPage() {
  const { data, isLoading, isFetching } =
    useAdminDirectory();

  const individuals = data?.individuals ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-forest p-4 text-background">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">
              إجمالي الأفراد
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold">
              {isLoading ? "—" : individuals.length}
            </div>
          </div>

          <div className="text-left">
            <div className="text-xs opacity-80">
              جدد اليوم
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold">
              {isLoading
                ? "—"
                : individuals.filter((u) =>
                    isTodaySaudi(u.created_at),
                  ).length}
            </div>
          </div>
        </div>

        {isFetching && !isLoading && (
          <div className="mt-2 text-[10px] opacity-70">
            تحديث البيانات في الخلفية...
          </div>
        )}
      </section>

      {isLoading ? (
        <ListSkeleton />
      ) : individuals.length ? (
        <div className="space-y-2.5">
          {individuals.map((user) => (
            <IndividualRow
              key={user.id}
              user={user}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
          لا يوجد أفراد مسجلون حاليًا.
        </div>
      )}
    </div>
  );
}

function IndividualRow({
  user,
}: {
  user: AdminIndividual;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: activity, isLoading } =
    useIndividualActivity(
      user.id,
      expanded,
    );

  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  async function deleteUser() {
    const ok = window.confirm(
      `هل أنت متأكد من حذف حساب "${user.full_name}" نهائيًا؟`,
    );

    if (!ok) return;

    setDeleting(true);

    try {
      const { error } = await supabase.rpc(
        "admin_delete_user" as never,
        { _user_id: user.id } as never,
      );

      if (error) throw error;

      toast.success("تم حذف حساب الفرد.");

      await qc.invalidateQueries({
        queryKey: ["admin-directory"],
      });

      await qc.invalidateQueries({
        queryKey: ["admin-dashboard-stats"],
      });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "تعذر حذف الحساب.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
      <div
        className="flex cursor-pointer items-center gap-3 p-3.5"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
          <User className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">
              {user.full_name}
            </span>

            {isTodaySaudi(user.created_at) && (
              <span className="shrink-0 rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold text-background">
                جديد
              </span>
            )}
          </div>

          <div
            dir="ltr"
            className="mt-0.5 truncate text-[11px] text-muted-foreground"
          >
            {user.email || user.phone || "بدون بيانات اتصال"}
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
              label="تاريخ التسجيل"
              value={new Date(
                user.created_at,
              ).toLocaleString("ar-SA")}
            />

            <Info
              label="المحافظة"
              value={user.governorate_name || "—"}
            />

            <Info
              label="الجوال"
              value={user.phone || "—"}
              icon={Phone}
            />

            <Info
              label="البريد"
              value={user.email || "—"}
              icon={Mail}
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold">
              نشاط الحساب
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                جاري جلب النشاط...
              </div>
            ) : activity ? (
              <div className="grid grid-cols-2 gap-2">
                <Metric
                  label="مشاهدات العقارات"
                  value={activity.propertyViews}
                />
                <Metric
                  label="العقارات المحفوظة"
                  value={activity.favorites}
                />
                <Metric
                  label="الطلبات العقارية"
                  value={activity.propertyRequests}
                />
                <Metric
                  label="حجوزات المعاينة"
                  value={activity.bookings}
                />
                <Metric
                  label="تقييمات المكاتب"
                  value={activity.officeReviews}
                />
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Link
              to="/admin/individuals/$userId"
              params={{ userId: user.id }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background"
            >
              فتح التفاصيل
              <ChevronLeft className="size-3.5" />
            </Link>

            <button
              onClick={() => void deleteUser()}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserRoundX className="size-3.5" />
              )}
              حذف
            </button>
          </div>
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
      <div className="text-[10px] text-muted-foreground">
        {Icon && (
          <Icon className="mb-1 inline-block size-3.5" />
        )}{" "}
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

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl bg-sand"
        />
      ))}
    </div>
  );
}
