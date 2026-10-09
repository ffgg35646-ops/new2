import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Crown,
  Eye,
  Heart,
  Home,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { BOOKING_STATUS, inquiryTypeLabel } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { useMyOffice, useNewInquiriesCount } from "@/lib/office";
import { useMyPlan } from "@/lib/plans";

export const Route = createFileRoute("/office/")({
  head: () => ({
    meta: [
      { title: "لوحة المكتب | عقار البطين" },
      { name: "description", content: "إحصائيات مكتبك وإعلاناتك النشطة وطلبات العملاء الجديدة." },
      { property: "og:title", content: "لوحة المكتب | عقار البطين" },
      { property: "og:description", content: "لوحة تحكم المكاتب العقارية في عقار البطين." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeDashboard />
    </RoleGuard>
  ),
});

function OfficeDashboard() {
  const { data: membership } = useMyOffice();
  const office = membership?.office ?? null;
  const isOwner = membership?.isOwner ?? false;
  const { data: newRequests = 0 } = useNewInquiriesCount(office?.id);
  const { package: currentPackage, expired, expiresAt, propertyLimit } = useMyPlan();

  const { data: stats } = useQuery({
    queryKey: ["office-stats", office?.id],
    enabled: !!office?.id,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const [props, bookings, inquiries] = await Promise.all([
        supabase
          .from("properties")
          .select("id,views_count,favorites_count,is_published")
          .eq("office_id", office!.id)
          .eq("is_deleted", false),
        supabase
          .from("viewing_bookings")
          .select("id,visit_date,visit_time,status,properties(title)")
          .eq("office_id", office!.id)
          .order("visit_date", { ascending: false })
          .limit(5),
        supabase
          .from("property_inquiries")
          .select("id,type,status,contact_name,created_at,properties(title)")
          .eq("office_id", office!.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const rows = props.data ?? [];
      return {
        total: rows.length,
        published: rows.filter((r) => r.is_published).length,
        views: rows.reduce((a, r) => a + (r.views_count ?? 0), 0),
        favorites: rows.reduce((a, r) => a + (r.favorites_count ?? 0), 0),
        bookings: bookings.data ?? [],
        inquiries: inquiries.data ?? [],
      };
    },
  });

  if (membership && !office) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
        <AppHeader showSearch={false} />
        <main className="flex-1 px-4 py-10">
          <EmptyState
            icon={Building2}
            title="هذه اللوحة للمكاتب العقارية"
            description="سجّل حساب مكتب عقاري للوصول إلى لوحة التحكم."
            action={
              <Link
                to="/auth/office"
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
              >
                تسجيل مكتب عقاري
              </Link>
            }
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-5 px-4 py-4">
        <section className="rounded-3xl bg-forest p-4 text-background">
          <div className="text-xs opacity-80">مرحبًا بك</div>
          <div className="font-display text-lg font-extrabold">{office?.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-2.5 py-1 text-[11px]">
              <Crown className="size-3.5" />
              {currentPackage?.name ?? "الباقة"}
            </span>
            {!isOwner && (
              <span className="rounded-full bg-background/15 px-2.5 py-1 text-[11px]">
                حساب موظف
              </span>
            )}
          </div>
          <p className="mt-3 text-xs opacity-90">
            {stats?.published ?? 0} إعلان نشط — {newRequests} طلب مستلم/مقبول — {stats?.views ?? 0} مشاهدة
            — {stats?.favorites ?? 0} عملية حفظ
          </p>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <Stat icon={Home} label="نشط" value={stats?.published ?? 0} />
          <Stat icon={ClipboardList} label="طلبات مستلمة ومقبولة" value={newRequests} />
          <Stat icon={Eye} label="مشاهدات" value={stats?.views ?? 0} />
          <Stat icon={Heart} label="حفظ" value={stats?.favorites ?? 0} />
        </section>

        <Link
          to="/office/subscription"
          className="flex items-center justify-between rounded-2xl bg-surface p-3.5 ring-1 ring-line"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Crown className="size-4 text-terracotta" /> الباقة والاشتراك
          </span>
          <span className="text-xs text-muted-foreground">
            {expired
              ? "انتهى الاشتراك — ترقية"
              : propertyLimit == null
                ? `تجديد ${expiresAt ? formatDate(expiresAt) : ""}`
                : propertyLimit == null ? `${stats?.total ?? 0} عقار` : `${stats?.total ?? 0}/${propertyLimit} عقارات`}
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/office/properties/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background"
          >
            <Plus className="size-4" /> إضافة عرض
          </Link>
          <Link
            to="/office/properties"
            className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line"
          >
            إدارة العروض
          </Link>
        </div>

        <Link
          to="/plans"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line"
        >
          الباقات
        </Link>

        {!isOwner && (
          <Link
            to="/office/profile"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line"
          >
            ملف المكتب
          </Link>
        )}

        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">آخر طلبات العملاء</h2>
          {stats?.inquiries.length ? (
            <div className="space-y-2.5">
              {stats.inquiries.map((q) => (
                <Link
                  key={q.id}
                  to="/office/requests"
                  className="block rounded-2xl bg-surface p-3.5 ring-1 ring-line"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-bold">
                      {(q.properties as { title: string } | null)?.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta">
                      {inquiryTypeLabel(q.type)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {q.contact_name} · {timeAgo(q.created_at)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">آخر حجوزات المعاينة</h2>
          {stats?.bookings.length ? (
            <div className="space-y-2.5">
              {stats.bookings.map((b) => (
                <div key={b.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-bold">
                      {(b.properties as { title: string } | null)?.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta">
                      {BOOKING_STATUS[b.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" /> {formatDate(b.visit_date)} ·{" "}
                    {String(b.visit_time).slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center ring-1 ring-line">
      <Icon className="mx-auto size-4 text-terracotta" />
      <div className="mt-1 font-display text-lg font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
