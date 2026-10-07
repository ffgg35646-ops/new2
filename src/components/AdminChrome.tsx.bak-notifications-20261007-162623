import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Bell,
  Building2,
  Flag,
  Headphones,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Users,
  X,
  ShieldCheck,
  FileText,
  CreditCard,
} from "lucide-react";
import { useLocation } from "@tanstack/react-router";

const items = [
  { label: "الرئيسية", href: "/admin", icon: LayoutDashboard },
  { label: "المكاتب", href: "/admin/offices", icon: Building2 },
  { label: "الأفراد", href: "/admin/individuals", icon: Users },
  { label: "الباقات", href: "/admin?tab=plans", icon: Package },
  { label: "المحافظات والأحياء", href: "/admin?tab=geo", icon: MapPin },
  { label: "البلاغات", href: "/admin?tab=reports", icon: Flag },
  { label: "الدعم", href: "/admin?tab=support", icon: Headphones },
  { label: "إدارة الإشعارات", href: "/admin/notifications", icon: Bell },
  { label: "المدفوعات", href: "/admin/payments", icon: CreditCard },
  { label: "سياسة الخصوصية", href: "/admin?tab=privacy", icon: ShieldCheck },
  { label: "شروط الاستخدام", href: "/admin?tab=terms", icon: FileText },
] as const;

export function AdminChrome() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const qc = useQueryClient();

  const { data: unread = 0 } = useQuery({
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
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["unread-notifications", userId],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const search = location.search as Record<string, unknown>;
  const tab = typeof search.tab === "string" ? search.tab : null;

  function isActive(href: string) {
    if (href === "/admin") {
      return location.pathname === "/admin" && !tab;
    }

    if (href.startsWith("/admin?")) {
      const query = new URLSearchParams(href.split("?")[1] ?? "");
      const wantedTab = query.get("tab");
      return location.pathname === "/admin" && tab === wantedTab;
    }

    return (
      location.pathname === href ||
      location.pathname.startsWith(`${href}/`)
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح قائمة الإدارة"
            className="grid size-9 place-items-center rounded-xl bg-surface ring-1 ring-line"
          >
            <Menu className="size-5" />
          </button>

          <div className="font-display text-sm font-extrabold">
            لوحة الإدارة
          </div>

          <a
            href="/admin/notifications"
            aria-label="الإشعارات"
            className="relative ms-auto grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
          >
            <Bell className="size-[18px] text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -left-1 grid min-w-5 h-5 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </a>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/35"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={
          "fixed inset-y-0 right-0 z-[60] w-[290px] max-w-[86vw] border-l border-line bg-background shadow-2xl transition-transform duration-200 " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        dir="rtl"
        aria-label="قائمة إدارة الأدمن"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <div className="font-display text-base font-extrabold">
            أقسام الإدارة
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق قائمة الإدارة"
            className="grid size-9 place-items-center rounded-xl bg-surface ring-1 ring-line"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="space-y-1.5 p-3">
          {items.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition " +
                  (active
                    ? "bg-forest text-background"
                    : "bg-surface text-foreground ring-1 ring-line")
                }
              >
                <Icon className="size-[18px] shrink-0" />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
