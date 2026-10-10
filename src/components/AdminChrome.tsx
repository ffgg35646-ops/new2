import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  Package,
  Headphones,
  LayoutDashboard,
  MapPin,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";

const items = [
  { label: "الرئيسية", href: "/admin", to: "/admin", search: { tab: "dashboard" }, icon: LayoutDashboard },
  { label: "المكاتب", href: "/admin/offices", to: "/admin/offices", search: { tab: "dashboard" }, icon: Building2 },
  { label: "الباقات", href: "/admin?tab=plans", to: "/admin", search: { tab: "plans" }, icon: Package },
  { label: "الأفراد", href: "/admin/individuals", to: "/admin/individuals", search: { tab: "dashboard" }, icon: Users },
  { label: "المحافظات والأحياء", href: "/admin?tab=geo", to: "/admin", search: { tab: "geo" }, icon: MapPin },
  { label: "الدعم", href: "/admin?tab=support", to: "/admin", search: { tab: "support" }, icon: Headphones },
  { label: "الإشعارات", href: "/admin/notifications", to: "/admin/notifications", search: { tab: "dashboard" }, icon: Bell },
  { label: "المدفوعات", href: "/admin/payments", to: "/admin/payments", search: { tab: "dashboard" }, icon: CreditCard },
  { label: "الخصوصية", href: "/admin?tab=privacy", to: "/admin", search: { tab: "privacy" }, icon: ShieldCheck },
  { label: "الشروط", href: "/admin?tab=terms", to: "/admin", search: { tab: "terms" }, icon: FileText },
] as const;

function activeItem(
  pathname: string,
  search: Record<string, unknown>,
  href: string,
) {
  const tab =
    typeof search.tab === "string"
      ? search.tab
      : null;

  if (href === "/admin") {
    return pathname === "/admin" && !tab;
  }

  if (href.startsWith("/admin?")) {
    const wanted =
      new URLSearchParams(
        href.split("?")[1] ?? "",
      ).get("tab");

    return pathname === "/admin" && tab === wanted;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function Navigation({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const location = useLocation();

  const search =
    location.search as Record<string, unknown>;

  return (
    <nav className="space-y-1.5">
      {items.map(
        ({
          label,
          href,
          to,
          search: navSearch,
          icon: Icon,
        }) => {
          const active = activeItem(
            location.pathname,
            search,
            href,
          );

          return (
            <Link
              key={href}
              to={to as never}
              search={navSearch as never}
              preload="intent"
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-2xl px-3.5 py-3",
                "text-sm font-bold transition-colors",
                active
                  ? "bg-forest text-background"
                  : "text-foreground hover:bg-sand",
              ].join(" ")}
            >
              <Icon className="size-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          );
        },
      )}
    </nav>
  );
}

function AdminNotificationBell() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const inbox = useQuery({
    queryKey: ["admin-notification-preview", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,type,link,is_read,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const unread = useQuery({
    queryKey: ["unread-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("is_read", false);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-notification-bell-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["unread-notifications", userId] });
          void qc.invalidateQueries({ queryKey: ["admin-notification-preview", userId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  async function openNotification(n: NonNullable<typeof inbox.data>[number]) {
    setOpen(false);

    if (!n.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id)
        .eq("user_id", userId!);

      if (error) {
        // Keep the notification accessible even if marking it read fails.
        toast.error("تعذر تحديث حالة الإشعار");
      } else {
        void qc.invalidateQueries({ queryKey: ["unread-notifications", userId] });
        void qc.invalidateQueries({ queryKey: ["admin-notification-preview", userId] });
      }
    }

    if (n.link) router.history.push(n.link);
  }

  return (
    <div className="relative ms-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line hover:bg-sand"
        aria-label={`الإشعارات${(unread.data ?? 0) > 0 ? `، ${unread.data} غير مقروء` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-[18px] text-muted-foreground" />
        {(unread.data ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[10px] font-extrabold text-background">
            {(unread.data ?? 0) > 99 ? "99+" : unread.data}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="إغلاق قائمة الإشعارات"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            dir="rtl"
            aria-label="قائمة الإشعارات"
            className="absolute left-0 top-[calc(100%+12px)] z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-line"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <h2 className="font-display text-base font-extrabold">الإشعارات</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {(unread.data ?? 0) > 0 ? `لديك ${unread.data} إشعار غير مقروء` : "أحدث تحديثات حسابك"}
                </p>
              </div>
              {(unread.data ?? 0) > 0 && (
                <span className="rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold text-background">
                  {unread.data} جديد
                </span>
              )}
            </div>

            <div className="max-h-[min(65vh,440px)] overflow-y-auto">
              {inbox.isLoading ? (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">جارٍ تحميل الإشعارات...</div>
              ) : inbox.isError ? (
                <div className="px-4 py-8 text-center text-xs text-destructive">تعذر تحميل الإشعارات.</div>
              ) : inbox.data?.length ? (
                inbox.data.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void openNotification(n)}
                    className={`flex w-full gap-3 border-b border-line px-4 py-3.5 text-right transition hover:bg-sand ${n.is_read ? "bg-surface" : "bg-forest-soft/60"}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line">
                      <Bell className="size-4 text-forest" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold leading-5">{n.title}</span>
                        {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-terracotta" />}
                      </span>
                      {n.body && (
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{n.body}</span>
                      )}
                      <span className="mt-1.5 block text-[10px] text-muted-foreground">
                        {String(n.created_at ?? "").replace("T", " ").slice(0, 16)}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto size-7 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">لا توجد إشعارات حتى الآن</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.history.push("/admin/notifications");
              }}
              className="w-full bg-background px-4 py-3.5 text-center text-xs font-extrabold text-forest hover:bg-sand"
            >
              عرض كل الإشعارات
            </button>
          </section>
        </>
      )}
    </div>
  );
}
export function AdminChrome({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background"
    >
      {/* DESKTOP */}
      <div className="hidden min-h-screen lg:flex">
        {/* SIDEBAR */}
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-l border-line bg-background">
          <div className="flex h-full flex-col">
            <div className="border-b border-line px-5 py-5">
              <div className="font-display text-lg font-extrabold">
                إدارة عقار البطين
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground">
                لوحة الإدارة
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <Navigation />
            </div>

            <div className="border-t border-line p-4">
              <div className="rounded-2xl bg-sand p-3 text-center text-[10px] font-semibold text-muted-foreground">
                لوحة التحكم
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center px-6">
              <div>
                <div className="font-display text-base font-extrabold">
                  لوحة الإدارة
                </div>

                <div className="text-[10px] text-muted-foreground">
                  إدارة عقار البطين
                </div>
              </div>

              <AdminNotificationBell />
            </div>
          </header>

          <main className="min-w-0 px-6 py-6">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE */}
      <div className="min-h-screen lg:hidden">
        <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-xl bg-surface ring-1 ring-line"
              aria-label="فتح القائمة"
            >
              <Menu className="size-5" />
            </button>

            <div className="font-display text-sm font-extrabold">
              لوحة الإدارة
            </div>

            <AdminNotificationBell />
          </div>
        </header>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/35"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 right-0 z-[60] w-[290px]",
            "max-w-[86vw] bg-background shadow-2xl",
            "transition-transform duration-200",
            mobileOpen
              ? "translate-x-0"
              : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <div className="font-display font-extrabold">
              أقسام الإدارة
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid size-9 place-items-center rounded-xl bg-surface ring-1 ring-line"
              aria-label="إغلاق القائمة"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-3">
            <Navigation
              onNavigate={() =>
                setMobileOpen(false)
              }
            />
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
