import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useMyOffice, useNewInquiriesCount } from "@/lib/office";
import {
  Building2,
  ClipboardList,
  Heart,
  Home,
  LayoutGrid,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { to: string; label: string; icon: LucideIcon; primary?: boolean };

const individualItems: Item[] = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/properties", label: "العقارات", icon: Building2 },
  { to: "/request", label: "اطلب", icon: PlusCircle, primary: true },
  { to: "/account", label: "حسابي", icon: User },
];

const officeItems: Item[] = [
  { to: "/office", label: "الرئيسية", icon: LayoutGrid },
  { to: "/office/properties", label: "عقاراتي", icon: Building2 },
  { to: "/office/properties/new", label: "إضافة", icon: PlusCircle, primary: true },
  { to: "/office/chat", label: "الدردشة", icon: MessageSquare },
  { to: "/office/requests", label: "الطلبات", icon: ClipboardList },
  { to: "/office/profile", label: "الحساب", icon: User },
];

export function BottomNav({
  variant,
  fixed = false,
}: {
  variant?: "individual" | "office";
  fixed?: boolean;
}) {
  const { isOffice } = useAuth();
  const resolved = variant ?? (isOffice ? "office" : "individual");
  const items = resolved === "office" ? officeItems : individualItems;
  const { data: membership } = useMyOffice();
  const { data: newRequests = 0 } = useNewInquiriesCount(
    resolved === "office" ? membership?.office?.id : null,
  );

  return (
    <nav
      className={
        fixed
          ? "fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-md auto-cols-fr grid-flow-col gap-1 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur"
          : "sticky bottom-0 z-30 grid auto-cols-fr grid-flow-col gap-1 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur"
      }
    >
      {items.map((item) => {
        const Icon = item.icon;
        if (item.primary) {
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-1.5 -mt-4"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-terracotta text-background ring-4 ring-background">
                <Icon className="size-6" />
              </span>
              <span className="text-[11px] font-semibold text-terracotta">{item.label}</span>
            </Link>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-1.5 text-muted-foreground"
            activeProps={{ className: "text-forest [&_span]:font-semibold" }}
            activeOptions={{ exact: item.to === "/office" || item.to === "/home" }}
          >
            <span className="relative">
              <Icon className="size-5" />
              {item.to === "/office/requests" && newRequests > 0 && (
                <span className="absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                  {newRequests}
                </span>
              )}
            </span>
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
