import { useState, type ReactNode } from "react";
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
import { Link, useLocation } from "@tanstack/react-router";

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

              <Link
                to="/admin/notifications"
                search={{ tab: "dashboard" }}
                preload="intent"
                className="ms-auto grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line"
                aria-label="الإشعارات"
              >
                <Bell className="size-[18px] text-muted-foreground" />
              </Link>
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

            <Link
              to="/admin/notifications"
              search={{ tab: "dashboard" }}
preload="intent"
              className="ms-auto grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
              aria-label="الإشعارات"
            >
              <Bell className="size-[18px] text-muted-foreground" />
            </Link>
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
