import {
  createFileRoute,
  Link,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  User,
  UserRoundX,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchIndividualActivity,
  isTodaySaudi,
} from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute(
  "/admin/individuals/$userId",
)({
  head: () => ({
    meta: [
      { title: "بيانات الفرد | إدارة عقار البطين" },
    ],
  }),
  component: IndividualDetails,
});

function IndividualDetails() {
  const { userId } = useParams({
    from: "/admin/individuals/$userId",
  });

  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-individual", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,phone,email,governorate_id,created_at,governorates(name_ar)",
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: activity,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ["admin-individual-activity", userId],
    queryFn: () => fetchIndividualActivity(userId),
    enabled: !!data,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  async function deleteUser() {
    if (!data) return;

    const ok = window.confirm(
      `هل أنت متأكد من حذف حساب "${data.full_name}" نهائيًا؟`,
    );

    if (!ok) return;

    const { error } = await supabase.rpc(
      "admin_delete_user" as never,
      { _user_id: userId } as never,
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("تم حذف الحساب.");

    await qc.invalidateQueries({
      queryKey: ["admin-directory"],
    });

    await qc.invalidateQueries({
      queryKey: ["admin-dashboard-stats"],
    });

    navigate({
      to: "/admin/individuals",
      replace: true,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-3xl bg-sand" />
        <div className="h-56 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
        الحساب غير موجود.
      </div>
    );
  }

  const governorate = (
    data.governorates as
      | { name_ar: string }
      | null
      | undefined
  )?.name_ar;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/individuals"
        className="inline-flex items-center gap-1 text-xs font-bold text-forest"
      >
        <ArrowRight className="size-3.5" />
        العودة للأفراد
      </Link>

      <section className="rounded-3xl bg-forest p-4 text-background">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-background/15">
            <User className="size-7" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-extrabold">
              {data.full_name}
            </h1>

            <div className="mt-1 text-xs opacity-80">
              فرد
              {isTodaySaudi(data.created_at)
                ? " · تسجيل اليوم"
                : ""}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          بيانات التسجيل
        </h2>

        <div className="mt-3 space-y-2">
          <Row
            label="الاسم"
            value={data.full_name}
          />
          <Row
            label="البريد الإلكتروني"
            value={data.email || "—"}
            icon={Mail}
          />
          <Row
            label="رقم الجوال"
            value={data.phone || "—"}
            icon={Phone}
          />
          <Row
            label="المحافظة"
            value={governorate || "—"}
          />
          <Row
            label="تاريخ التسجيل"
            value={formatDateTime(data.created_at)}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          نشاط الفرد
        </h2>

        {activityLoading ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            جاري تحميل النشاط...
          </div>
        ) : activity ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
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
      </section>

      <button
        onClick={() => void deleteUser()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5 text-sm font-bold text-destructive"
      >
        <UserRoundX className="size-4" />
        حذف حساب الفرد
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-sand p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>

      <span className="break-all text-left text-xs font-bold">
        {value}
      </span>
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
