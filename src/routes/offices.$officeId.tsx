import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  FileCheck2,
  MapPin,
  MessageCircle,
  Phone,
  Bell,
  BellOff,
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
import { LISTING_TYPES, VERIFICATION_STATUS } from "@/lib/constants";
import { shareLink, whatsappHref } from "@/lib/office";
import { useAuth } from "@/lib/auth";
import { useFollowState, useSetOfficeNotifications, useToggleFollow } from "@/lib/follows";
import { cn } from "@/lib/utils";
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
    <div className="p-6 text-center text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-center text-sm">المكتب غير موجود</div>,
});

function OfficePage() {
  const { officeId } = useParams({ from: "/offices/$officeId" });
  const [listing, setListing] = useState<string | null>(null);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { userId } = useAuth();
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
          "id,name,logo_url,plan,plan_expires_at,verification_status,address,phone,whatsapp,description,working_hours,license_number,fal_license_number,rating_avg,reviews_count,governorates(name_ar)",
        )
        .eq("id", officeId)
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

  function onToggleFollow() {
    if (!userId) {
      toast.error("سجّل الدخول لمتابعة المكتب");
      return;
    }
    toggleFollow.mutate(
      { officeId, following: !!isFollowing },
      {
        onSuccess: (nowFollowing) =>
          toast.success(nowFollowing ? "تمت متابعة المكتب" : "تم إلغاء المتابعة"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  const verified = office?.verification_status === "verified";
  const isPro = effectivePlan(office) === "pro";

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
        ) : !office ? (
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
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      verified ? "bg-forest-soft text-forest" : "bg-sand text-muted-foreground",
                    )}
                  >
                    {VERIFICATION_STATUS[office.verification_status] ?? "قيد المراجعة"}
                  </span>
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
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {office.phone ? (
                  <a
                    href={`tel:${office.phone}`}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-forest py-3 text-xs font-bold text-background"
                  >
                    <Phone className="size-4" /> اتصال
                  </a>
                ) : (
                  <span className="rounded-2xl bg-sand py-3 text-center text-xs text-muted-foreground">
                    لا يوجد رقم
                  </span>
                )}
                {(office.whatsapp || office.phone) && (
                  <a
                    href={whatsappHref(
                      (office.whatsapp || office.phone)!,
                      `مرحبًا ${office.name}، لدي استفسار عن عروضكم العقارية.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-forest-soft py-3 text-xs font-bold text-forest"
                  >
                    <MessageCircle className="size-4" /> واتساب
                  </a>
                )}
                <button
                  onClick={() => void onShare()}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-sand py-3 text-xs font-bold"
                >
                  <Share2 className="size-4" /> مشاركة
                </button>
              </div>

              <button
                onClick={onToggleFollow}
                disabled={toggleFollow.isPending}
                aria-pressed={!!isFollowing}
                className={cn(
                  "mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition disabled:opacity-60",
                  isFollowing
                    ? "bg-forest-soft text-forest ring-1 ring-forest/30"
                    : "bg-terracotta text-background",
                )}
              >
                {isFollowing ? (
                  <>
                    <Check className="size-4" /> متابَع
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" /> متابعة
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  setNotify.mutate(
                    { officeId, notify: !notifyOn },
                    {
                      onSuccess: (on) =>
                        toast.success(
                          on ? "تم تفعيل إشعارات هذا المكتب" : "تم إيقاف إشعارات هذا المكتب",
                        ),
                      onError: (e) => toast.error((e as Error).message),
                    },
                  )
                }
                disabled={setNotify.isPending}
                aria-pressed={notifyOn}
                className={cn(
                  "mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition disabled:opacity-60",
                  notifyOn
                    ? "bg-forest-soft text-forest ring-1 ring-forest/30"
                    : "bg-sand text-foreground ring-1 ring-line",
                )}
              >
                {notifyOn ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                {notifyOn ? "إشعارات هذا المكتب مفعّلة" : "تفعيل إشعارات هذا المكتب"}
              </button>

              <p className="mt-1.5 text-center text-[10px] leading-relaxed text-muted-foreground">
                عند التفعيل ستصلك إشعارات بالعقارات الجديدة والعروض والتحديثات المهمة من هذا المكتب.
              </p>
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
      const { error } = await supabase
        .from("office_reviews")
        .upsert(
          { office_id: officeId, user_id: userId, rating, comment: comment.trim() || null },
          { onConflict: "office_id,user_id" },
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
