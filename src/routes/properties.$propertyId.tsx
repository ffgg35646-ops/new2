import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Compass,
  Flag,
  Heart,
  Loader2,
  MapPin,
  Maximize,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { PropertyCardData } from "@/components/PropertyCard";
import { PROPERTY_SELECT, useFavorites } from "@/lib/properties";
import { formatArea, formatPrice, timeAgo } from "@/lib/format";
import {
  INQUIRY_TYPES,
  kindLabel,
  listingLabel,
  rentPeriodLabel,
  stateLabel,
} from "@/lib/constants";
import { notifyWhatsApp } from "@/lib/notify-whatsapp";
import { googleMapsUrl } from "@/lib/location";
import { shareLink } from "@/lib/office";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

const REPORT_REASONS = [
  "معلومات غير صحيحة",
  "العقار غير متوفر",
  "سعر مضلّل",
  "صور غير حقيقية",
  "محتوى غير لائق",
  "احتيال أو نصب",
];

export const Route = createFileRoute("/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "تفاصيل العقار | عقار البطين" },
      {
        name: "description",
        content: "صور ومواصفات العقار وبيانات المكتب العقاري وطرق التواصل.",
      },
      { property: "og:title", content: "تفاصيل العقار | عقار البطين" },
      { property: "og:description", content: "كل تفاصيل العرض في صفحة واحدة." },
    ],
  }),
  component: PropertyDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-sm">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center text-sm">العقار غير موجود</div>,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { userId, profile, session, isOffice } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [inquiryType, setInquiryType] = useState<string>(INQUIRY_TYPES[0].value);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const countedViewRef = useRef<string | null>(null);

  const { data, isLoading, error: propertyError } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      let propertyResult = await supabase
        .from("properties")
        .select("*")
        .eq("_id", propertyId)
        .maybeSingle();

      if (propertyResult.error) throw propertyResult.error;

      if (!propertyResult.data) {
        propertyResult = await supabase
          .from("properties")
          .select("*")
          .eq("property_number", propertyId)
          .maybeSingle();
        if (propertyResult.error) throw propertyResult.error;
      }

      return propertyResult.data;
    },
  });

  const { data: officeData } = useQuery({
    queryKey: ["property-office", data?.office_id],
    enabled: !!data?.office_id,
    queryFn: async () => {
      const { data: result, error } = await supabase
        .from("offices")
        .select("id,name,logo_url,phone,whatsapp,working_hours,license_number,verification_status,rating_avg,reviews_count")
        .eq("id", data!.office_id)
        .maybeSingle();
      if (error) throw error;
      return result;
    },
    staleTime: 60_000,
  });

  const { data: propertyImages = [] } = useQuery({
    queryKey: ["property-images", data?.id],
    enabled: !!data?.id,
    queryFn: async () => {
      const { data: result, error } = await supabase
        .from("property_images")
        .select("id,url,sort_order")
        .eq("property_id", data!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return result ?? [];
    },
    staleTime: 60_000,
  });

  const { data: governorateData } = useQuery({
    queryKey: ["property-governorate", data?.governorate_id],
    enabled: !!data?.governorate_id,
    queryFn: async () => {
      const { data: result, error } = await supabase
        .from("governorates")
        .select("id,name_ar")
        .eq("id", data!.governorate_id)
        .maybeSingle();
      if (error) throw error;
      return result;
    },
    staleTime: 300_000,
  });

  const { data: agentData } = useQuery({
    queryKey: ["property-agent", data?.office_id],
    enabled: !!data?.office_id,
    queryFn: async () => {
      const { data: result, error } = await supabase
        .from("office_staff")
        .select("id,name,job_title,phone")
        .eq("office_id", data!.office_id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return result;
    },
    staleTime: 60_000,
  });

  const { data: similar } = useQuery({
    queryKey: ["similar-properties", propertyId, data?.office_id],
    enabled: !!data?.id && !!data?.office_id,
    queryFn: async () => {
      // Fetch a small pool for a fast response, then choose four at random.
      const { data: rows, error } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("office_id", data!.office_id)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .neq("id", data!.id)
        .order("created_at", { ascending: false })
        .limit(32);
      if (error) throw error;

      const candidates = (rows ?? []) as unknown as PropertyCardData[];
      for (let i = candidates.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const current = candidates[i]!;
        candidates[i] = candidates[j]!;
        candidates[j] = current;
      }
      return candidates.slice(0, 4);
    },
  });

  useEffect(() => {
    if (!data?.id) return;

    if (!isOffice && userId && countedViewRef.current !== data.id) {
      countedViewRef.current = data.id;
      void supabase
        .from("property_views")
        .insert({ property_id: data.id, user_id: userId })
        .then(({ error }) => {
          if (error) {
            countedViewRef.current = null;
            console.warn("[property-detail] view count failed", error);
            return;
          }

          void qc.invalidateQueries({ queryKey: ["property", propertyId] });
          void qc.invalidateQueries({ queryKey: ["office-stats"] });
        });
    }

    if (typeof window !== "undefined" && window.location.hash === "#property-inquiry") {
      window.setTimeout(() => {
        document.getElementById("property-inquiry")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
  }, [data?.id, userId, isOffice, qc, propertyId]);

  const inquire = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لإرسال الطلب");
      const { data: row, error } = await supabase
        .from("property_inquiries")
        .insert({
          // Fall back to the route key for legacy property rows that only have a property number.
          // The server resolves this to the canonical database id before saving the inquiry.
          property_id: data!.id ?? propertyId,
          office_id: data!.office_id,
          user_id: userId,
          type: inquiryType,
          contact_name: profile?.full_name || "عميل",
          contact_phone: profile?.phone?.trim() || "",
          message: inquiryMessage.trim() || null,
          status: "new",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (row) {
        notifyWhatsApp("inquiry_created", row.id);

        const { error: notifyError } = await supabase.rpc(
          "notify_new_property_inquiry" as never,
          { _inquiry_id: row.id } as never,
        );

        if (notifyError) {
          console.warn(
            "[property-detail] office inquiry notification failed",
            notifyError,
          );
        }
      }
    },
    onSuccess: () => {
      toast.success("تم قبول طلبك تلقائيًا، ويمكنك التواصل مع المكتب عبر الدردشة");
      setInquiryMessage("");
      qc.invalidateQueries({ queryKey: ["office-inquiries"] });
      qc.invalidateQueries({ queryKey: ["new-inquiries-count"] });
    },
    onError: (e) => {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" &&
              e !== null &&
              "message" in e &&
              typeof e.message === "string"
            ? e.message
            : "تعذّر إرسال الطلب";
      toast.error(message);
    },
  });

  const startChat = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لبدء المحادثة");
      const officeId = data!.office_id;

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("office_id", officeId)
        .limit(1)
        .maybeSingle();
      if (existing) return existing.id;

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, office_id: officeId, property_id: data!.id })
        .select("id")
        .single();
      if (error) throw new Error("تعذّر بدء المحادثة");
      return created.id;
    },
    onSuccess: (id) => void navigate({
      to: "/chats",
      search: { c: id, office: data?.office_id },
    }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر بدء المحادثة"),
  });

  const report = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول للإبلاغ");
      if (!reportReason) throw new Error("اختر سبب البلاغ");
      const { error } = await supabase.from("reports").insert({
        reporter_id: userId,
        property_id: propertyId,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال البلاغ للإدارة");
      setShowReport(false);
      setReportReason("");
      setReportDetails("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الإرسال"),
  });

  if (isLoading) {
    return <div className="mx-auto h-screen w-full max-w-md animate-shimmer bg-sand md:max-w-5xl" />;
  }
  if (propertyError) {
    return (
      <div className="p-8 text-center text-sm">
        تعذّر تحميل العقار.
        <div className="mt-1 text-xs text-muted-foreground">
          {propertyError instanceof Error ? propertyError.message : "خطأ غير معروف"}
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-8 text-center text-sm">العقار غير موجود</div>;

  const images = [
    ...(data.cover_url ? [{ id: "cover", url: data.cover_url }] : []),
    ...(propertyImages as { id: string; url: string }[]),
  ];
  const office = officeData as {
    id: string;
    name: string;
    logo_url: string | null;
    phone: string | null;
    whatsapp: string | null;
    working_hours: string | null;
    license_number: string | null;
    verification_status: string;
    rating_avg: number | string;
    reviews_count: number;
  } | null;
  const agent = agentData as {
    id: string;
    name: string;
    job_title: string | null;
    phone: string | null;
  } | null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28 md:max-w-5xl">
      <AppHeader showSearch={false} />
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {images.length ? (
            images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="aspect-[4/3] w-full shrink-0 snap-center overflow-hidden"
                aria-label="عرض الصورة بالحجم الكامل"
              >
                <img
                  src={img.url}
                  alt={data.title}
                  className="h-full w-full object-fill"
                />
              </button>
            ))
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center bg-sand text-sm text-muted-foreground">
              لا توجد صور
            </div>
          )}
        </div>
        <span className="absolute left-4 top-4 z-10 rounded-full bg-terracotta px-3 py-1.5 text-xs font-bold text-white">
          {listingLabel(data.listing)}
        </span>
        <button
          onClick={() => navigate({ to: isOffice ? "/office" : "/home" })}
          aria-label="رجوع للرئيسية"
          className="absolute top-4 right-4 mt-11 grid size-9 place-items-center rounded-full bg-background/90 ring-1 ring-line"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <main className="flex-1 space-y-5 px-4 py-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-display text-xl leading-tight font-extrabold">{data.title}</h1>
            <div className="shrink-0 text-left font-display text-xl font-extrabold text-forest">
              {formatPrice(data.price)} <span className="text-sm">ر.س</span>
              {data.listing === "rent" && (
                <span className="block text-xs font-bold text-muted-foreground">
                  / {rentPeriodLabel(data.rent_period)}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {data.neighborhood} · {governorateData?.name_ar || "—"} ·{" "}
            {timeAgo(data.created_at)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{data.property_number}</span> · {stateLabel(data.state)} ·{" "}
            {data.views_count} مشاهدة · {images.length} صورة
          </div>
        </div>

        {!isOffice ? (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <Spec
                icon={Compass}
                label="الواجهة"
                value={data.facing ? formatFacing(data.facing) : "الواجهة غير محددة"}
              />
              <Spec icon={Maximize} label="المساحة" value={formatArea(data.area)} />
              <Spec icon={Compass} label="نوع العقار" value={kindLabel(data.kind)} />
            </div>

            <div className="flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleFavorite(data.id)}
                aria-label={favoriteIds.has(data.id) ? "إزالة من المحفوظات" : "حفظ العقار"}
                className="flex min-h-[58px] w-[calc(33.333%_-_0.25rem)] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-surface p-2 text-center ring-1 ring-line"
              >
                <Heart
                  className={cn(
                    "size-4",
                    favoriteIds.has(data.id) ? "fill-terracotta text-terracotta" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-bold">
                  {favoriteIds.has(data.id) ? "محفوظ" : "حفظ العقار"}
                </span>
              </button>

              {data.latitude != null && data.longitude != null ? (
                <a
                  href={googleMapsUrl(data.latitude, data.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[58px] w-[calc(33.333%_-_0.25rem)] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-forest-soft p-2 text-center font-display font-bold text-forest"
                >
                  <MapPin className="size-4" />
                  <span className="text-xs">الموقع على الخريطة</span>
                </a>
              ) : (
                <div className="flex min-h-[58px] w-[calc(33.333%_-_0.25rem)] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-surface p-2 text-center text-muted-foreground ring-1 ring-line">
                  <MapPin className="size-4" />
                  <span className="text-xs">الموقع غير محدد</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Spec icon={Maximize} label="المساحة" value={formatArea(data.area)} />
            <Spec icon={Compass} label="نوع العقار" value={kindLabel(data.kind)} />
          </div>
        )}

        {!isOffice && userId && (
          <button
            type="button"
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
            className="flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-terracotta p-3 text-center text-white disabled:opacity-60"
          >
            {startChat.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            <span className="text-sm font-bold">الدردشة</span>
          </button>
        )}

        {data.description && (
          <section>
            <h2 className="font-display text-base font-bold">الوصف</h2>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {data.description}
            </p>
          </section>
        )}

        {office && (
          <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
            <div className="flex items-center gap-3">
              {office.logo_url ? (
                <img src={office.logo_url} alt="" className="size-11 rounded-xl object-cover" />
              ) : (
                <div className="grid size-11 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest">
                  {office.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-display text-sm font-bold">
                  {office.name}
                  {office.verification_status === "verified" && (
                    <ShieldCheck className="size-4 text-forest" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {Number(office.rating_avg) > 0
                    ? `تقييم ${Number(office.rating_avg).toFixed(1)} (${office.reviews_count})`
                    : "بدون تقييمات"}
                  {office.license_number ? ` · ترخيص ${office.license_number}` : ""}
                </div>
                {office.working_hours && (
                  <div className="text-[11px] text-muted-foreground">{office.working_hours}</div>
                )}
                <Link
                  to="/offices/$officeId"
                  params={{ officeId: office.id }}
                  className="text-xs text-terracotta"
                >
                  عرض صفحة المكتب
                </Link>
              </div>
            </div>

            {agent && (
              <div className="rounded-2xl bg-background p-3 text-xs ring-1 ring-line">
                <div className="font-semibold">المسوّق المسؤول: {agent.name}</div>
                <div className="text-muted-foreground">
                  {agent.job_title || "مسوّق عقاري"}
                  {agent.phone ? ` · ${agent.phone}` : ""}
                </div>
              </div>
            )}
          </section>
        )}

        <section id="property-inquiry" className="scroll-mt-24 space-y-2.5 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Send className="size-4 text-terracotta" /> إرسال طلب للمكتب
          </h2>
          <div className="flex flex-wrap gap-2">
            {INQUIRY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setInquiryType(t.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  inquiryType === t.value
                    ? "bg-forest text-background"
                    : "bg-background text-muted-foreground ring-1 ring-line",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
            placeholder="اكتب تفاصيل طلبك (اختياري)"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
          <button
            onClick={() => inquire.mutate()}
            disabled={inquire.isPending}
            className="w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            إرسال الطلب
          </button>
        </section>

        {!!similar?.length && (
          <section className="space-y-3">
            <h2 className="font-display text-base font-bold">عقارات أخرى من نفس المكتب</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  to="/properties/$propertyId"
                  params={{ propertyId: p.id }}
                  className="min-w-0 overflow-hidden rounded-2xl bg-surface ring-1 ring-line transition active:scale-[0.99]"
                >
                  <div className="relative">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center bg-sand text-[10px] text-muted-foreground">
                        لا توجد صورة
                      </div>
                    )}
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-semibold text-foreground">
                      {listingLabel(p.listing)}
                    </span>
                  </div>
                  <div className="min-w-0 p-2">
                    <div className="truncate font-display text-sm font-extrabold text-forest">
                      {formatPrice(p.price)} <span className="text-[9px] font-bold">ر.س</span>
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold">{p.title}</div>
                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                      {p.neighborhood}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                      {formatArea(p.area)} · {kindLabel(p.kind)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <button
          onClick={async () => {
            const res = await shareLink(data.title, window.location.href);
            if (res === "copied") toast.success("تم نسخ رابط العقار");
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-sand py-3 text-sm font-semibold"
        >
          <Share2 className="size-4" /> مشاركة العقار
        </button>

        {showReport ? (
          <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
            <div className="text-xs font-semibold text-muted-foreground">سبب البلاغ</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold transition " +
                    (reportReason === reason
                      ? "bg-forest text-background"
                      : "bg-sand text-muted-foreground")
                  }
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={2}
              placeholder="تفاصيل إضافية (اختياري)…"
              className="mt-2 w-full rounded-xl bg-sand px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => report.mutate()}
                disabled={report.isPending}
                className="flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background disabled:opacity-60"
              >
                إرسال البلاغ
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-xl bg-sand py-2 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!userId) {
                toast.error("سجّل الدخول للإبلاغ");
                return;
              }
              setShowReport(true);
            }}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground"
          >
            <Flag className="size-3.5" /> الإبلاغ عن هذا العرض
          </button>
        )}
      </main>

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="عرض صورة العقار"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white"
            aria-label="إغلاق الصورة"
          >
            <X className="size-5" />
          </button>

          <img
            src={images[lightboxIndex].url}
            alt={data.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-full object-contain"
          />

          <div className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {!isOffice && (
        <div className="fixed bottom-0 z-30 mx-auto flex w-full max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:max-w-5xl md:rounded-t-2xl md:border-x">
          {userId ? (
            <button
              type="button"
              onClick={() =>
                document.getElementById("property-inquiry")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-white"
            >
              <Send className="size-4" />
              إرسال طلب
            </button>
          ) : (
            <Link
              to="/auth/individual"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
            >
              <MessageCircle className="size-4" /> سجّل الدخول للتواصل
            </Link>
          )}
        </div>
      )}

      <BottomNav variant={isOffice ? "office" : "individual"} fixed />
    </div>
  );
}

function formatFacing(value: string): string {
  return value
    .replace(/[,_|]+/g, " / ")
    .replace(/\bnorth[\s-]?east\b/gi, "شمال شرقي")
    .replace(/\bnorth[\s-]?west\b/gi, "شمال غربي")
    .replace(/\bsouth[\s-]?east\b/gi, "جنوب شرقي")
    .replace(/\bsouth[\s-]?west\b/gi, "جنوب غربي")
    .replace(/\bnorth\b/gi, "شمال")
    .replace(/\bsouth\b/gi, "جنوب")
    .replace(/\beast\b/gi, "شرق")
    .replace(/\bwest\b/gi, "غرب")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/(شمال|جنوب|شرق|غرب)\s+(?=(شمال|جنوب|شرق|غرب)(?:\s|$))/g, "$1 / ")
    .trim();
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Maximize;
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-[58px] rounded-xl bg-surface p-2 text-center ring-1 ring-line">
      <div className="flex items-center justify-center gap-1 text-[9px] font-semibold text-muted-foreground">
        <Icon className="size-3 shrink-0 text-terracotta" />
        <span>{label}</span>
      </div>
      <div className="mt-1 text-[13px] font-bold">{value}</div>
    </div>
  );
}
