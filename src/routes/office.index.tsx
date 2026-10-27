import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Crown,
  Eye,
  Heart,
  Home,
  ArrowLeft,
  MapPin,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { BOOKING_STATUS, inquiryTypeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
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
  const [showFavorites, setShowFavorites] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["office-stats", office?.id],
    enabled: !!office?.id,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const [props, bookings, inquiries] = await Promise.all([
        supabase
          .from("properties")
          .select("id,title,views_count,favorites_count,is_published")
          .eq("office_id", office!.id)
          .eq("is_deleted", false),
        supabase
          .from("viewing_bookings")
          .select("id,visit_date,visit_time,status,properties(title,cover_url)")
          .eq("office_id", office!.id)
          .order("visit_date", { ascending: false })
          .limit(5),
        supabase
          .from("property_inquiries")
          .select("id,type,status,contact_name,created_at,properties(title)")
          .eq("office_id", office!.id)
          .in("status", ["new", "accepted"])
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const rows = props.data ?? [];
      return {
        total: rows.length,
        published: rows.filter((r) => r.is_published).length,
        views: rows.reduce((a, r) => a + (r.views_count ?? 0), 0),
        favorites: rows.reduce((a, r) => a + (r.favorites_count ?? 0), 0),
        properties: rows,
        bookings: bookings.data ?? [],
        inquiries: inquiries.data ?? [],
      };
    },
  });

  const { data: savedPeople = [], isLoading: savedPeopleLoading, error: savedPeopleError } = useQuery({
    queryKey: ["office-property-favorites", office?.id],
    enabled: !!office?.id && showFavorites,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("office_property_favorites" as never);
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as unknown as Array<{
        user_name: string;
        property_name: string;
      }>;
    },
  });

  if (membership && !office) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background md:max-w-3xl lg:max-w-5xl">
        <AppHeader showSearch={false} />
        <main className="flex-1 px-4 py-10">
          <EmptyState
            icon={Building2}
            title="هذه اللوحة للمكاتب العقارية"
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background md:max-w-3xl lg:max-w-5xl">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-5 px-4 py-4">
        <section className="relative isolate min-h-[164px] overflow-hidden rounded-3xl p-5 text-white" style={{ backgroundColor: "#17633F", color: "#FFFFFF" }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 156 126"
            className="pointer-events-none absolute bottom-0 left-1 h-[126px] w-[156px] text-white opacity-25"
            fill="none"
          >
            <path d="M4 122V67L28 53L52 67V122M22 122V82H36V122" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M48 122V36L72 20L96 36V122M61 53H68M78 53H85M61 69H68M78 69H85M61 85H68M78 85H85" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M91 122V61L112 48L133 61V122M104 76H110M118 76H124M104 92H110M118 92H124" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M0 122H151" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M107 22C107 12 115 5 124 5S141 12 141 22C141 34 124 46 124 46S107 34 107 22Z" fill="currentColor" fillOpacity=".22" stroke="currentColor" strokeWidth="2" />
            <circle cx="124" cy="21" r="5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="relative z-10 text-right">
            <div className="text-sm opacity-90">مرحبًا بك</div>
            <div className="mt-1 font-display text-xl font-extrabold">{office?.name}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <Link
            to="/office/properties"
            className="rounded-2xl bg-surface p-3 text-center ring-1 ring-line transition hover:ring-2 hover:ring-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            aria-label="عرض العقارات النشطة وإدارة العقارات"
          >
            <Home className="mx-auto size-4 text-forest" />
            <div className="mt-1 font-display text-lg font-extrabold">{stats?.published ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">العقارات النشطة</div>
            <div className="mt-1 text-[10px] font-semibold text-forest">عرض عقاراتي</div>
          </Link>
          <Stat icon={ClipboardList} label="الطلبات" value={newRequests} onClick={() => setShowRequests(true)} />
          <Stat icon={Eye} label="المشاهدات" value={stats?.views ?? 0} onClick={() => setShowViews(true)} />
          <Stat icon={Heart} label="عمليات الحفظ" value={stats?.favorites ?? 0} onClick={() => setShowFavorites(true)} />
        </section>

        <Link
          to="/office/subscription"
          className="flex items-center justify-between rounded-2xl bg-surface p-3.5 ring-1 ring-line"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Crown className="size-4 text-forest" /> الباقة والاشتراك
          </span>
          <span className="text-xs text-muted-foreground">
            {expired
              ? "انتهى الاشتراك — ترقية"
              : propertyLimit == null
                ? `تجديد ${expiresAt ? formatDate(expiresAt) : ""}`
                : propertyLimit == null ? `${stats?.total ?? 0} عقار` : `${stats?.total ?? 0}/${propertyLimit} عقارات`}
          </span>
        </Link>

        <Link
          to="/office/properties"
          className="group relative isolate flex min-h-[90px] w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#F9FCFA] via-[#F2FAF4] to-[#EAF6ED] px-4 py-3 text-forest ring-1 ring-[#D8EBDD] shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 440 132"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full"
            fill="none"
          >
            <rect width="440" height="132" fill="#F5FBF6" fillOpacity=".5" />
            <path d="M0 20L74 0H130L99 35L0 55Z" fill="#DDEFE2" fillOpacity=".6" />
            <path d="M255 0H345L315 32L264 42L230 19Z" fill="#D7EBD9" fillOpacity=".6" />
            <path d="M354 132L391 94L440 82V132Z" fill="#DCEFE0" fillOpacity=".8" />
            <path d="M-18 94C45 65 74 74 119 41S208 4 255 24S333 82 458 35" stroke="#D9E5DC" strokeWidth="12" strokeLinecap="round" />
            <path d="M-18 94C45 65 74 74 119 41S208 4 255 24S333 82 458 35" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
            <path d="M58 -12C70 28 107 52 153 65S227 91 246 146" stroke="#D9E5DC" strokeWidth="10" strokeLinecap="round" />
            <path d="M58 -12C70 28 107 52 153 65S227 91 246 146" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
            <path d="M304 -12C282 22 294 54 326 77S372 104 386 145" stroke="#D9E5DC" strokeWidth="10" strokeLinecap="round" />
            <path d="M304 -12C282 22 294 54 326 77S372 104 386 145" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
            <path d="M-10 119L42 93L79 103L103 132M151 -5L178 24L207 16M355 11L386 43L434 49M236 106L269 83L294 88M397 113L423 99" stroke="#BBD9C4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="195" cy="36" r="3" fill="#A9D0B3" />
            <circle cx="331" cy="91" r="2.5" fill="#A9D0B3" />
            <circle cx="78" cy="78" r="2.5" fill="#A9D0B3" />

            <g stroke="#39885B" strokeWidth="1.7" strokeLinejoin="round">
              <path d="M12 93L43 70L74 93V122H12Z" fill="#D7EEDC" />
              <path d="M4 94L43 65L82 94" strokeLinecap="round" fill="none" />
              <rect x="25" y="97" width="13" height="25" rx="1" fill="#F7FCF8" />
              <rect x="48" y="98" width="13" height="11" rx="1" fill="#A7D8B7" />
              <path d="M95 122V72L120 55L145 72V122Z" fill="#C6E7CF" />
              <rect x="103" y="80" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="117" y="80" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="131" y="80" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="103" y="96" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="117" y="96" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="131" y="96" width="7" height="9" rx="1" fill="#F7FCF8" />
              <rect x="116" y="108" width="9" height="14" rx="1" fill="#F7FCF8" />
            </g>
            <circle cx="378" cy="29" r="24" fill="#DFF0E4" fillOpacity=".96" stroke="#B6D9C0" strokeWidth="1.5" />
            <path d="M359 25C359 14 367 6 378 6S397 14 397 25C397 38 378 53 378 53S359 38 359 25Z" fill="#17633F" />
            <circle cx="378" cy="24" r="6" fill="#F4FAF5" />
          </svg>
          <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-xl border border-white/80 bg-white/90 px-4 py-2 font-display text-base font-extrabold text-forest shadow-md backdrop-blur-sm">
            إدارة العروض
            <span className="grid size-7 place-items-center rounded-full bg-forest/10 transition group-hover:bg-forest/15">
              <ArrowLeft className="size-3.5" />
            </span>
          </div>
        </Link>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">آخر طلبات العملاء</h2>
          {stats?.inquiries.length ? (
            <div className="space-y-2.5">
              {stats.inquiries.map((q) => (
                <Link
                  key={q.id}
                  to="/office/requests"
                  search={{ tab: "accepted", request: undefined }}
                  className="block rounded-2xl bg-surface p-3.5 ring-1 ring-line"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-bold">
                      {(q.properties as { title: string } | null)?.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
                      {inquiryTypeLabel(q.type)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {q.contact_name}
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
              {stats.bookings.map((b) => {
                const property = b.properties as { title: string; cover_url: string | null } | null;
                return (
                  <div key={b.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                    <div className="flex items-start gap-3">
                      {property?.cover_url ? (
                        <img
                          src={property.cover_url}
                          alt={property.title || "صورة العقار"}
                          loading="lazy"
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-sand px-1 text-center text-[10px] text-muted-foreground">
                          لا توجد صورة
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 text-sm font-bold">
                            {property?.title || "عقار"}
                          </span>
                          <span className="shrink-0 rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
                            {BOOKING_STATUS[b.status] ?? "بانتظار الموافقة"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5 shrink-0" /> {formatDate(b.visit_date)} ·{" "}
                          {String(b.visit_time).slice(0, 5)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
          )}
        </section>
      </main>

      {showViews && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation" onClick={() => setShowViews(false)}>
          <section className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-line md:max-w-xl" role="dialog" aria-modal="true" aria-label="تفاصيل مشاهدات العقارات" dir="rtl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-line p-4">
              <div><h2 className="font-display text-base font-extrabold">مشاهدات كل عقار</h2><p className="mt-1 text-xs text-muted-foreground">مرتبة من الأكثر مشاهدة إلى الأقل</p></div>
              <button type="button" onClick={() => setShowViews(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full bg-background ring-1 ring-line"><X className="size-4" /></button>
            </div>
            <div className="overflow-y-auto p-3">
              {stats?.properties?.length ? (
                <ol className="space-y-2">
                  {[...stats.properties].sort((a, b) => Number(b.views_count ?? 0) - Number(a.views_count ?? 0)).map((property, index) => (
                    <li key={property.id} className="flex items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-line">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-soft text-xs font-extrabold text-forest">{index + 1}</span>
                      <span className="min-w-0 flex-1 text-sm font-bold">{property.title || "عقار بدون اسم"}</span>
                      <span className="shrink-0 text-xs font-bold text-forest">{Number(property.views_count ?? 0)} مشاهدة</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="py-6 text-center text-sm text-muted-foreground">لا توجد عقارات لعرض إحصائياتها.</p>}
            </div>
          </section>
        </div>
      )}

      {showRequests && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation" onClick={() => setShowRequests(false)}>
          <section className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-line md:max-w-xl" role="dialog" aria-modal="true" aria-label="تفاصيل طلبات المكتب" dir="rtl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-line p-4">
              <div><h2 className="font-display text-base font-extrabold">تفاصيل الطلبات</h2><p className="mt-1 text-xs text-muted-foreground">عدد الطلبات المستلمة والمقبولة: {newRequests}</p></div>
              <button type="button" onClick={() => setShowRequests(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full bg-background ring-1 ring-line"><X className="size-4" /></button>
            </div>
            <div className="overflow-y-auto p-3">
              {stats?.inquiries?.length ? (
                <ol className="space-y-2">
                  {stats.inquiries.map((request, index) => (
                    <li key={request.id} className="flex items-start gap-3 rounded-2xl bg-background p-3 ring-1 ring-line">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-soft text-xs font-extrabold text-forest">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{(request.properties as { title: string } | null)?.title || "طلب عقاري"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{request.contact_name || "اسم غير متوفر"} · {inquiryTypeLabel(request.type)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p className="py-6 text-center text-sm text-muted-foreground">لا توجد طلبات ظاهرة هنا حاليًا.</p>}
              <Link to="/office/requests" search={{ tab: "accepted", request: undefined }} onClick={() => setShowRequests(false)} className="mt-3 block rounded-2xl bg-forest py-3 text-center text-sm font-bold text-background">عرض كل الطلبات</Link>
            </div>
          </section>
        </div>
      )}

      {showFavorites && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setShowFavorites(false)}
        >
          <section
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-line md:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-label="الأشخاص الذين حفظوا عروض المكتب"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line p-4">
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold">{office?.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">اسم العقار واسم الشخص الذي حفظه</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFavorites(false)}
                aria-label="إغلاق"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              {savedPeopleLoading ? (
                <div className="grid place-items-center py-8">
                  <span className="text-sm text-muted-foreground">جارٍ التحميل...</span>
                </div>
              ) : savedPeopleError ? (
                <p role="alert" className="py-4 text-center text-xs text-forest">
                  تعذّر تحميل الأسماء.
                </p>
              ) : savedPeople.length ? (
                <ul className="space-y-2">
                  {savedPeople.map((person, index) => (
                    <li
                      key={person.user_name + "-" + index}
                      className="space-y-3 rounded-2xl bg-background p-3 ring-1 ring-line transition hover:ring-forest/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                          <Building2 className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold text-muted-foreground">العقار المحفوظ</div>
                          <div className="mt-1 break-words text-sm font-extrabold leading-5 text-foreground">
                            {person.property_name}
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center gap-2 rounded-xl bg-forest-soft/60 px-3 py-2.5">
                        <Heart className="size-4 shrink-0 fill-forest text-forest" />
                        <span className="min-w-0 flex-1 break-words text-sm font-extrabold text-foreground">
                          {person.user_name}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">لا توجد عمليات حفظ لعقارات المكتب حتى الآن.</p>
              )}
            </div>
          </section>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const classes = "rounded-2xl bg-surface p-3 text-center ring-1 ring-line transition" +
    (onClick ? " cursor-pointer hover:ring-2 hover:ring-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" : "");

  const content = (
    <>
      <Icon className="mx-auto size-4 text-forest" />
      <div className="mt-1 font-display text-lg font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {onClick && <div className="mt-1 text-[10px] font-semibold text-forest">عرض التفاصيل</div>}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={classes} aria-haspopup="dialog">
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}
