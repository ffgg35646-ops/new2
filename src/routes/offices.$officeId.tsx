import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Clock,
  FileCheck2,
  MapPin,
  Phone,
  Bell,
  Share2,
  Star,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { effectivePlan } from "@/lib/plans";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { PropertyCard } from "@/components/PropertyCard";
import { PROPERTY_SELECT, useFavorites } from "@/lib/properties";
import { LISTING_TYPES } from "@/lib/constants";
import { shareLink, whatsappHref } from "@/lib/office";
import { useAuth } from "@/lib/auth";
import { useFollowState, useSetOfficeNotifications, useToggleFollow } from "@/lib/follows";
import { cn } from "@/lib/utils";
import { getCurrentPosition, googleMapsUrl } from "@/lib/location";
import { formatDateTime, parseDateValue } from "@/lib/format";

import type { PropertyCardData } from "@/components/PropertyCard";

export const Route = createFileRoute("/offices/$officeId")({
  head: () => ({
    meta: [
      { title: "ملف المكتب العقاري | عقار البطين" },
      { name: "description", content: "تعرّف على المكتب العقاري وترخيصه وعروضه وتقييمات عملائه." },
      { property: "og:title", content: "ملف المكتب العقاري | عقار البطين" },
      {
        property: "og:description",
        content: "عروض المكتب وتقييماته وحالة توثيقه على منصة عقار البطين.",
      },
    ],
  }),
  component: OfficePage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-center text-sm text-destructive">{error instanceof Error ? error.message : String(error)}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-center text-sm">المكتب غير موجود</div>,
});

function OfficePage() {
  const { officeId } = useParams({ from: "/offices/$officeId" });
  const [listing, setListing] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { userId } = useAuth();
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const { data: followState } = useFollowState(officeId);
  const isFollowing = followState?.following ?? false;
  const notifyOn = followState?.notify ?? false;
  const setNotify = useSetOfficeNotifications();
  const toggleFollow = useToggleFollow();

  const { data: office, isLoading } = useQuery({
    queryKey: ["office", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id,name,logo_url,plan,plan_expires_at,verification_status,address,phone,whatsapp,description,working_hours,license_number,fal_license_number,rating_avg,reviews_count,experience_years,latitude,longitude,updated_at,package_id,completed_requests_count,is_pro_current,verification_badge,governorates(name_ar)",
        )
        .eq("id", officeId)
        .eq("is_deleted", false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["office-properties", officeId, listing],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("office_id", officeId)
        .eq("is_published", true)
        .eq("is_deleted", false);
      if (listing) q = q.eq("listing", listing as never);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PropertyCardData[];
    },
  });

  const { data: totalCount } = useQuery({
    queryKey: ["office-properties-count", officeId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("office_id", officeId)
        .eq("is_published", true)
        .eq("is_deleted", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: followersCount } = useQuery({
    queryKey: ["office-followers-count", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("user_id")
        .eq("office_id", officeId);
      if (error) throw error;
      return new Set(
        (data ?? [])
          .map((row) => (row as { user_id?: string | null }).user_id)
          .filter((id): id is string => !!id),
      ).size;
    },
  });

  const { data: latestProperty } = useQuery({
    queryKey: ["office-latest-property", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("created_at")
        .eq("office_id", officeId)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function calculateDistance() {
    if (
      !office?.latitude ||
      !office?.longitude
    ) {
      toast.error("موقع المكتب غير مضاف");
      return;
    }

    setDistanceLoading(true);

    try {
      const current = await getCurrentPosition();

      const toRad = (value: number) => (value * Math.PI) / 180;
      const earthRadius = 6371;

      const dLat = toRad(office.latitude - current.lat);
      const dLng = toRad(office.longitude - current.lng);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(current.lat)) *
          Math.cos(toRad(office.latitude)) *
          Math.sin(dLng / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      setDistance(earthRadius * c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر حساب المسافة");
    } finally {
      setDistanceLoading(false);
    }
  }

  const { data: staff } = useQuery({
    queryKey: ["office-public-staff", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_staff")
        .select("id,name,job_title,phone")
        .eq("office_id", officeId)
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["office-reviews", officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_reviews")
        .select("id,rating,comment,created_at")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function onShare() {
    const url = `${window.location.origin}/offices/${officeId}`;
    const res = await shareLink(office?.name ?? "مكتب عقاري", url);
    if (res === "copied") toast.success("تم نسخ رابط المكتب");
    if (res === "failed") toast.error("تعذّر مشاركة الرابط، انسخه من شريط العنوان");
  }

  async function onToggleFollow() {
    if (!userId) {
      toast.error("سجّل الدخول لمتابعة المكتب");
      return;
    }

    try {
      const nowFollowing = await toggleFollow.mutateAsync({
        officeId,
        following: !!isFollowing,
      });

      if (nowFollowing) {
        // Following an office also enables its notifications, represented by the bell on this button.
        if (!notifyOn) {
          await setNotify.mutateAsync({ officeId, notify: true });
        }
        toast.success(
          notifyOn
            ? "تمت متابعة المكتب"
            : "تمت متابعة المكتب وتفعيل إشعاراته",
        );
      } else {
        toast.success("تم إلغاء المتابعة");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذرت متابعة المكتب");
    }
  }

  const isPro = office?.is_pro_current === true;
  const verified = office?.verification_badge === true;

  const activityDates = office
    ? [office.updated_at, latestProperty?.created_at ?? null]
        .map((value) => parseDateValue(value)?.getTime())
        .filter((value): value is number => Number.isFinite(value))
    : [];
  const lastActivity = activityDates.length
    ? new Date(Math.max(...activityDates))
    : null;
  const lastActivityLabel = lastActivity ? formatDateTime(lastActivity) : "—";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/offices" className="grid size-9 place-items-center rounded-full bg-sand">
          <ArrowRight className="size-4" />
        </Link>
        <span className="font-display font-bold">ملف المكتب</span>
      </header>

      <main className="flex-1 space-y-5 px-4 pb-10">
        {isLoading ? (
          <ListSkeleton />
        ) : !office || (
          office.verification_status !== "verified" &&
          office.is_pro_current !== true
        ) ? (
          <EmptyState icon={BadgeCheck} title="المكتب غير موجود" />
        ) : (
          <>
            <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
              <div className="flex items-center gap-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-forest-soft font-display text-2xl font-extrabold text-forest">
                  {office.logo_url ? (
                    <img
                      src={office.logo_url}
                      alt={office.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    office.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="truncate font-display text-lg font-extrabold">{office.name}</h1>
                    {verified && <BadgeCheck className="size-4 shrink-0 text-forest" />}
                    {isPro && (
                      <span className="shrink-0 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
                        احترافي
                      </span>
                    )}
                  </div>
                  {verified && (
                    <span className="mt-1 inline-block rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
                      موثق
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                  <Star className="size-3.5 fill-terracotta text-terracotta" />
                  <span className="font-bold">{Number(office.rating_avg ?? 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({office.reviews_count ?? 0} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                  <Building2 className="size-3.5 text-forest" />
                  <span className="font-bold">{totalCount ?? 0}</span>
                  <span className="text-muted-foreground">عقار معروض</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-forest transition hover:bg-forest-soft"
              >
                <span>{moreOpen ? "عرض أقل" : "عرض المزيد"}</span>
                <ChevronDown className={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
              </button>

              {moreOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                    <Building2 className="size-3.5 text-forest" />
                    <span className="font-bold">{office.experience_years ?? 0}</span>
                    <span className="text-muted-foreground">سنوات خبرة</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                    <UserPlus className="size-3.5 text-forest" />
                    <span className="font-bold">{followersCount ?? 0}</span>
                    <span className="text-muted-foreground">متابع</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                    <Clock className="size-3.5 text-forest" />
                    <span className="text-muted-foreground">آخر نشاط:</span>
                    <span className="font-bold">{lastActivityLabel}</span>
                  </div>
                  {(office.license_number || office.fal_license_number) && (
                    <div className="col-span-2 flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line">
                      <FileCheck2 className="size-3.5 text-forest" />
                      <span className="text-muted-foreground">رقم الترخيص:</span>
                      <span className="font-mono font-bold">
                        {office.fal_license_number || office.license_number}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {office.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {office.description}
                </p>
              )}

              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {office.working_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {office.working_hours}
                  </div>
                )}
                {(office.address || office.governorates) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {[(office.governorates as { name_ar: string } | null)?.name_ar, office.address]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}

                {office.latitude != null && office.longitude != null && (
                  <div className="mt-2 flex gap-2">
                    <a
                      href={googleMapsUrl(office.latitude, office.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-xl bg-forest-soft py-2 text-center text-xs font-bold text-forest"
                    >
                      فتح الموقع على الخريطة
                    </a>

                    <button
                      onClick={() => void calculateDistance()}
                      disabled={distanceLoading}
                      className="flex-1 rounded-xl bg-sand py-2 text-xs font-bold ring-1 ring-line disabled:opacity-60"
                    >
                      {distanceLoading
                        ? "جاري الحساب..."
                        : distance != null
                          ? `${distance.toFixed(1)} كم`
                          : "احسب المسافة"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-[40px_40px_40px_minmax(0,1fr)] items-center gap-2">
                {office.phone ? (
                  <a
                    href={`tel:${office.phone}`}
                    title="اتصال بالمكتب"
                    aria-label="اتصال بالمكتب"
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest text-background transition hover:opacity-90"
                  >
                    <Phone className="size-5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    title="رقم الهاتف غير متاح"
                    aria-label="رقم الهاتف غير متاح"
                    disabled
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-muted-foreground opacity-60"
                  >
                    <Phone className="size-5" />
                  </button>
                )}
                {(office.whatsapp || office.phone) ? (
                  <a
                    href={whatsappHref(
                      (office.whatsapp || office.phone)!,
                      `مرحبًا ${office.name}، لدي استفسار عن عروضكم العقارية.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    title="مراسلة واتساب"
                    aria-label="مراسلة واتساب"
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest transition hover:opacity-90"
                  >
                    <WhatsAppIcon className="size-5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    title="واتساب غير متاح"
                    aria-label="واتساب غير متاح"
                    disabled
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-muted-foreground opacity-60"
                  >
                    <WhatsAppIcon className="size-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void onShare()}
                  title="مشاركة ملف المكتب"
                  aria-label="مشاركة ملف المكتب"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-foreground ring-1 ring-line transition hover:bg-background"
                >
                  <Share2 className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={onToggleFollow}
                  disabled={toggleFollow.isPending || setNotify.isPending}
                  aria-pressed={!!isFollowing}
                  className={cn(
                    "flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition disabled:opacity-60",
                    isFollowing
                      ? "bg-forest-soft text-forest ring-1 ring-forest/30"
                      : "bg-terracotta text-background",
                  )}
                >
                  {isFollowing ? (
                    <>
                      <Check className="size-4 shrink-0" />
                      <span>متابَع</span>
                      {notifyOn && <Bell className="size-4 shrink-0" />}
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4 shrink-0" />
                      <span>متابعة</span>
                    </>
                  )}
                </button>

              </div>

              
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-extrabold">عروض المكتب</h2>
              <div className="flex gap-2">
                <Chip active={!listing} onClick={() => setListing(null)} label="الكل" />
                {LISTING_TYPES.map((l) => (
                  <Chip
                    key={l.value}
                    active={listing === l.value}
                    onClick={() => setListing(l.value)}
                    label={l.label}
                  />
                ))}
              </div>
              {properties?.length ? (
                <div className="space-y-3">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isFavorite={favoriteIds.has(p.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد عروض مطابقة حاليًا.</p>
              )}
            </section>

            {!!staff?.length && (
              <section className="space-y-2">
                <h2 className="font-display text-lg font-extrabold">المسوّقون العقاريون</h2>
                {staff.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl bg-surface p-3.5 ring-1 ring-line"
                  >
                    <div>
                      <div className="text-sm font-bold">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.job_title ?? "مسوّق عقاري"}
                      </div>
                    </div>
                    {s.phone && (
                      <a href={`tel:${s.phone}`} className="text-xs font-semibold text-terracotta">
                        اتصال
                      </a>
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-lg font-extrabold">آراء العملاء</h2>
              <ReviewForm officeId={officeId} />
              {reviews?.length ? (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                    <div className="flex items-center gap-1 text-xs font-bold text-terracotta">
                      <Star className="size-3.5 fill-terracotta" /> {r.rating}
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا توجد تقييمات بعد — كن أول من يقيّم هذا المكتب.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="WhatsApp"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#25D366"
        d="M16.02 2.5a13.3 13.3 0 0 0-11.4 20.17L2.8 29.2l6.7-1.75A13.3 13.3 0 1 0 16.02 2.5Z"
      />
      <path
        fill="#FFFFFF"
        d="M23.57 19.46c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.68s1.16 3.11 1.32 3.32c.16.22 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.13-.3-.21-.62-.37Z"
      />
      <path
        fill="#FFFFFF"
        d="M16.03 5.05a10.7 10.7 0 0 0-9.15 16.25l.26.42-1.08 3.95 4.05-1.06.4.24a10.7 10.7 0 1 0 5.52-19.8Zm0 19.4c-1.7 0-3.37-.45-4.82-1.3l-.35-.2-2.4.63.64-2.34-.23-.38a8.08 8.08 0 1 1 7.16 3.59Z"
      />
    </svg>
  );
}

function ReviewForm({ officeId }: { officeId: string }) {
  const { userId, isOffice } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: mine } = useQuery({
    queryKey: ["my-office-review", officeId, userId],
    enabled: !!userId && !isOffice,
    queryFn: async () => {
      const { data } = await supabase
        .from("office_reviews")
        .select("rating,comment")
        .eq("office_id", officeId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (data && !loaded) {
        setRating(data.rating);
        setComment(data.comment ?? "");
        setLoaded(true);
      }
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لتقييم المكتب");
      if (rating < 1) throw new Error("اختر عدد النجوم أولًا");
      const { error } = await supabase.rpc(
        "submit_office_review" as never,
        {
          _office_id: officeId,
          _rating: rating,
          _comment: comment.trim() || null,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(mine ? "تم تحديث تقييمك" : "شكرًا! تم نشر تقييمك");
      void qc.invalidateQueries({ queryKey: ["office-reviews", officeId] });
      void qc.invalidateQueries({ queryKey: ["office", officeId] });
      void qc.invalidateQueries({ queryKey: ["my-office-review", officeId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال التقييم"),
  });

  if (!userId) {
    return (
      <Link
        to="/auth/individual"
        className="block rounded-2xl bg-sand p-3 text-center text-xs font-semibold text-forest"
      >
        سجّل الدخول لتقييم هذا المكتب
      </Link>
    );
  }
  if (isOffice) return null;

  return (
    <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
      <div className="text-xs font-semibold text-muted-foreground">
        {mine ? "عدّل تقييمك" : "قيّم تجربتك مع هذا المكتب"}
      </div>
      <div className="mt-2 flex flex-row-reverse justify-end gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} نجوم`} className="p-0.5">
            <Star
              className={cn(
                "size-6",
                n <= rating ? "fill-terracotta text-terracotta" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="اكتب رأيك (اختياري)…"
        className="mt-2 w-full rounded-xl bg-sand px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest"
      />
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="mt-2 w-full rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:opacity-60"
      >
        {mine ? "تحديث التقييم" : "إرسال التقييم"}
      </button>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line",
      )}
    >
      {label}
    </button>
  );
}
