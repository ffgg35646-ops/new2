import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BellOff,
  Building2,
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { useFollowedOffices, useSetOfficeNotifications, useToggleFollow } from "@/lib/follows";

export const Route = createFileRoute("/offices/following")({
  head: () => ({
    meta: [
      { title: "المكاتب المتابَعة | عقار البطين" },
      {
        name: "description",
        content: "قائمة المكاتب العقارية التي تتابعها مع تقييمها وعدد عقاراتها وموقعها.",
      },
      { property: "og:title", content: "المكاتب المتابَعة | عقار البطين" },
      { property: "og:description", content: "تابع مكاتبك العقارية المفضّلة واستعرض عروضها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FollowingPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-center text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-center text-sm">الصفحة غير موجودة</div>,
});

function FollowingPage() {
  const { userId } = useAuth();
  const { data: offices, isLoading } = useFollowedOffices();
  const toggle = useToggleFollow();
  const setNotify = useSetOfficeNotifications();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/account" className="grid size-9 place-items-center rounded-full bg-sand">
          <ArrowRight className="size-4" />
        </Link>
        <h1 className="font-display font-bold">المكاتب التي أتابعها · إشعارات المكاتب</h1>
      </header>

      <main className="flex-1 space-y-3 px-4">
        {!userId ? (
          <EmptyState
            icon={Heart}
            title="سجّل الدخول لعرض متابعاتك"
            action={
              <Link
                to="/auth/individual"
                className="rounded-2xl bg-forest px-5 py-2.5 text-sm font-bold text-background"
              >
                تسجيل الدخول
              </Link>
            }
          />
        ) : isLoading ? (
          <ListSkeleton />
        ) : !offices?.length ? (
          <EmptyState
            icon={Building2}
            title="لا تتابع أي مكتب حتى الآن"
            description="تابع المكاتب العقارية لمتابعة عروضها الجديدة."
            action={
              <Link
                to="/offices"
                className="rounded-2xl bg-forest px-5 py-2.5 text-sm font-bold text-background"
              >
                استعراض المكاتب
              </Link>
            }
          />
        ) : (
          offices.map((o) => (
            <article key={o.id} className="rounded-3xl bg-surface p-3.5 ring-1 ring-line">
              <div className="flex items-center gap-3">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-forest-soft font-display text-xl font-extrabold text-forest">
                  {o.logo_url ? (
                    <img
                      src={o.logo_url}
                      alt={o.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    o.name.trim().charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate font-display text-sm font-extrabold">{o.name}</h2>
                    {o.verification_status === "verified" && (
                      <BadgeCheck className="size-4 shrink-0 text-forest" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-terracotta text-terracotta" />
                      <span className="font-bold text-foreground">
                        {Number(o.rating_avg ?? 0).toFixed(1)}
                      </span>
                      ({o.reviews_count ?? 0})
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3 text-forest" />
                      {o.properties_count} عقار
                    </span>
                    {(o.governorates?.name_ar || o.address) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {[o.governorates?.name_ar, o.address].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setNotify.mutate(
                    { officeId: o.id, notify: !o.notify },
                    {
                      onSuccess: (on) =>
                        toast.success(on ? "تم تفعيل إشعارات المكتب" : "تم إيقاف إشعارات المكتب"),
                      onError: (e) => toast.error((e as Error).message),
                    },
                  )
                }
                disabled={setNotify.isPending}
                aria-pressed={o.notify}
                className={
                  "mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold disabled:opacity-60 " +
                  (o.notify
                    ? "bg-forest-soft text-forest ring-1 ring-forest/30"
                    : "bg-sand text-muted-foreground")
                }
              >
                {o.notify ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                {o.notify ? "الإشعارات مفعّلة" : "الإشعارات موقوفة"}
              </button>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/offices/$officeId"
                  params={{ officeId: o.id }}
                  className="rounded-2xl bg-forest py-2.5 text-center text-xs font-bold text-background"
                >
                  صفحة المكتب
                </Link>
                <button
                  disabled={toggle.isPending}
                  onClick={() => {
                    toggle.mutate(
                      { officeId: o.id, following: true },
                      {
                        onSuccess: () => toast.success("تم إلغاء المتابعة"),
                        onError: (e) => toast.error((e as Error).message),
                      },
                    );
                  }}
                  className="rounded-2xl bg-sand py-2.5 text-center text-xs font-bold disabled:opacity-60"
                >
                  إلغاء المتابعة
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
