import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BedDouble,
  Bath,
  CalendarDays,
  Compass,
  Flag,
  Heart,
  Loader2,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  Ruler,
  Send,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { PROPERTY_SELECT, useFavorites } from "@/lib/properties";
import { formatArea, formatDate, formatPrice, timeAgo } from "@/lib/format";
import {
  INQUIRY_TYPES,
  kindLabel,
  listingLabel,
  rentPeriodLabel,
  stateLabel,
} from "@/lib/constants";
import { notifyWhatsApp } from "@/lib/notify-whatsapp";
import { googleMapsUrl } from "@/lib/location";
import { shareLink, whatsappHref } from "@/lib/office";
import { cn } from "@/lib/utils";

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
        content: "صور ومواصفات العقار وبيانات المكتب العقاري وحجز موعد معاينة.",
      },
      { property: "og:title", content: "تفاصيل العقار | عقار البطين" },
      { property: "og:description", content: "كل تفاصيل العرض في صفحة واحدة." },
    ],
  }),
  component: PropertyDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-sm">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center text-sm">العقار غير موجود</div>,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { userId, profile, isOffice } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [bookingDate, setBookingDate] = useState("");
  const [inquiryType, setInquiryType] = useState<string>(INQUIRY_TYPES[0].value);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const fields =
        "*, governorates(name_ar), offices(id,name,logo_url,phone,whatsapp,working_hours,license_number,verification_status,rating_avg,reviews_count), property_images(id,url,sort_order), agent:office_staff(id,name,job_title,phone)";

      const byId = await supabase
        .from("properties")
        .select(fields)
        .eq("id", propertyId)
        .maybeSingle();

      if (byId.error) throw byId.error;
      if (byId.data) return byId.data;

      const byNumber = await supabase
        .from("properties")
        .select(fields)
        .eq("property_number", propertyId)
        .maybeSingle();

      if (byNumber.error) throw byNumber.error;
      return byNumber.data;
    },
  });

  const { data: similar } = useQuery({
    queryKey: ["similar-properties", propertyId, data?.kind, data?.governorate_id],
    enabled: !!data?.id,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("office_id", data!.office_id)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .neq("id", data!.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (rows ?? []) as unknown as PropertyCardData[];
    },
  });

  useEffect(() => {
    if (!data?.id) return;
    void supabase.from("property_views").insert({ property_id: data.id, user_id: userId ?? null });
  }, [data?.id, userId]);

  const book = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لحجز معاينة");
      if (!bookingDate) throw new Error("اختر تاريخ ووقت المعاينة");
      const { data: row, error } = await supabase
        .from("viewing_bookings")
        .insert({
          property_id: data!.id,
          user_id: userId,
          office_id: data!.office_id,
          visit_date: bookingDate.slice(0, 10),
          visit_time: bookingDate.slice(11, 16),
        })
        .select("id")
        .single();
      if (error) throw error;
      if (row) notifyWhatsApp("booking_created", row.id);
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب المعاينة للمكتب");
      setBookingDate("");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الحجز"),
  });

  const inquire = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لإرسال الطلب");
      const phone = (inquiryPhone || profile?.phone || "").trim();
      if (!phone) throw new Error("أضف رقم جوال للتواصل");
      const { data: row, error } = await supabase
        .from("property_inquiries")
        .insert({
          property_id: data!.id,
          office_id: data!.office_id,
          user_id: userId,
          type: inquiryType,
          contact_name: profile?.full_name || "عميل",
          contact_phone: phone,
          message: inquiryMessage.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (row) notifyWhatsApp("inquiry_created", row.id);
    },
    onSuccess: () => {
      toast.success("تم إرسال طلبك للمكتب");
      setInquiryMessage("");
      qc.invalidateQueries({ queryKey: ["office-inquiries"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال الطلب"),
  });

  const startChat = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لبدء المحادثة");
      const officeId = data!.office_id;

      const { data: plan } = await supabase.rpc("office_effective_plan", {
        _office_id: officeId,
      });
      if (plan !== "pro") {
        throw new Error("الدردشة غير متاحة لهذا المكتب — تواصل عبر الاتصال أو واتساب");
      }

      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("office_id", officeId)
        .eq("property_id", data!.id)
        .limit(1)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return existing.id;

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, office_id: officeId, property_id: data!.id })
        .select("id")
        .single();
      if (error) throw new Error("تعذّر بدء المحادثة");
      return created.id;
    },
    onSuccess: (id) => void navigate({ to: "/chats", search: { c: id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر بدء المحادثة"),
  });

  const report = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول للإبلاغ");
      if (!reportReason) throw new Error("اختر سبب البلاغ");
      const { error } = await supabase.from("reports").insert({
        reporter_id: userId,
        property_id: data.id,
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
    return <div className="mx-auto h-screen w-full max-w-md animate-shimmer bg-sand" />;
  }
  if (!data) return <div className="p-8 text-center text-sm">العقار غير موجود</div>;

  const images = [
    ...(data.cover_url ? [{ id: "cover", url: data.cover_url }] : []),
    ...((data.property_images ?? []) as { id: string; url: string }[]),
  ];
  const office = data.offices as {
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
  const agent = data.agent as {
    id: string;
    name: string;
    job_title: string | null;
    phone: string | null;
  } | null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28">
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {images.length ? (
            images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="w-full shrink-0 snap-center"
                aria-label="عرض الصورة بالحجم الكامل"
              >
                <img
                  src={img.url}
                  alt={data.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center bg-sand text-sm text-muted-foreground">
              لا توجد صور
            </div>
          )}
        </div>
        <button
          onClick={() => navigate({ to: "/home" })}
          aria-label="رجوع"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-background/90 ring-1 ring-line"
        >
          <ArrowRight className="size-4" />
        </button>
        <button
          onClick={() => toggleFavorite(data.id)}
          aria-label="المفضلة"
          className="absolute top-4 left-4 grid size-9 place-items-center rounded-full bg-background/90 ring-1 ring-line"
        >
          <Heart
            className={cn(
              "size-4",
              favoriteIds.has(data.id) ? "fill-terracotta text-terracotta" : "",
            )}
          />
        </button>
      </div>

      <main className="flex-1 space-y-5 px-4 py-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-xl leading-tight font-extrabold">{data.title}</h1>
            <span className="shrink-0 rounded-full bg-terracotta-soft px-2.5 py-1 text-[11px] font-semibold text-terracotta">
              {listingLabel(data.listing)}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {data.neighborhood} · {(data.governorates as { name_ar: string } | null)?.name_ar} ·{" "}
            {timeAgo(data.created_at)}
          </div>
          <div className="mt-3 font-display text-2xl font-extrabold text-forest">
            {formatPrice(data.price)} <span className="text-base">ر.س</span>
            {data.listing === "rent" && (
              <span className="text-sm font-bold text-muted-foreground">
                {" "}
                / {rentPeriodLabel(data.rent_period)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{data.property_number}</span> · {stateLabel(data.state)} ·{" "}
            {data.views_count} مشاهدة · {images.length} صورة · أُضيف {formatDate(data.created_at)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Spec icon={Maximize} label="المساحة" value={formatArea(data.area)} />
          <Spec icon={Compass} label="النوع" value={kindLabel(data.kind)} />
          {["villa", "apartment"].includes(data.kind) && data.rooms != null && (
            <Spec icon={BedDouble} label="الغرف" value={String(data.rooms)} />
          )}
          {["villa", "apartment"].includes(data.kind) && data.bathrooms != null && (
            <Spec icon={Bath} label="دورات المياه" value={String(data.bathrooms)} />
          )}
          {data.street_width != null && (
            <Spec icon={Ruler} label="عرض الشارع" value={`${data.street_width} م`} />
          )}
          {data.facing && <Spec icon={Compass} label="الواجهة" value={data.facing} />}
          {data.age_years != null && (
            <Spec
              icon={CalendarDays}
              label="عمر العقار"
              value={`${data.age_years} سنة`}
            />
          )}
        </div>

        {data.latitude != null && data.longitude != null && (
          <a
            href={googleMapsUrl(data.latitude, data.longitude)}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-soft py-3.5 font-display font-bold text-forest"
          >
            <MapPin className="size-4" /> الموقع على الخريطة
          </a>
        )}

        {data.video_url && (
          <section className="space-y-2">
            <h2 className="font-display text-base font-bold">فيديو العقار</h2>
            <div className="overflow-hidden rounded-3xl bg-black ring-1 ring-line">
              <video
                src={data.video_url}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              />
            </div>
          </section>
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

        <section className="space-y-2.5 rounded-3xl bg-surface p-4 ring-1 ring-line">
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
          <input
            value={inquiryPhone || profile?.phone || ""}
            onChange={(e) => setInquiryPhone(e.target.value)}
            placeholder="رقم الجوال للتواصل"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
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
            className="w-full rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            إرسال الطلب
          </button>
        </section>

        <section className="space-y-2.5 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <CalendarDays className="size-4 text-terracotta" /> حجز معاينة
          </h2>
          <input
            type="datetime-local"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
          <button
            onClick={() => book.mutate()}
            disabled={book.isPending}
            className="w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            إرسال طلب المعاينة
          </button>
        </section>

        {!!similar?.length && (
          <section className="space-y-3">
            <h2 className="font-display text-base font-bold">عقارات أخرى من نفس المكتب</h2>
            <div className="space-y-3">
              {similar.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={toggleFavorite}
                />
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

      <div className="fixed bottom-0 z-30 mx-auto flex w-full max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        {userId ? (
          <>
            {!isOffice && (
              <button
                onClick={() => startChat.mutate()}
                disabled={startChat.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60"
              >
                {startChat.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                مراسلة
              </button>
            )}
            {office?.phone && (
              <a
                href={`tel:${office.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
              >
                <Phone className="size-4" /> اتصال
              </a>
            )}
            {(office?.whatsapp || office?.phone) && (
              <a
                href={whatsappHref(
                  office.whatsapp || office.phone!,
                  `مرحبًا، لدي استفسار عن العقار ${data.property_number}`,
                )}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sand py-3.5 font-display font-bold"
              >
                <MessageCircle className="size-4" /> واتساب
              </a>
            )}
          </>
        ) : (
          <Link
            to="/auth/individual"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
          >
            <Phone className="size-4" /> سجّل الدخول للتواصل
          </Link>
        )}
      </div>
    </div>
  );
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
    <div className="rounded-2xl bg-surface p-3 text-center ring-1 ring-line">
      <Icon className="mx-auto size-4 text-terracotta" />
      <div className="mt-1.5 text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
