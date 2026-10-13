import { Link } from "@tanstack/react-router";
import { Bell, BellOff, Check, Crown, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFollowState, useSetOfficeNotifications } from "@/lib/follows";
import { toast } from "sonner";

export type OfficeCardData = {
  id: string;
  name: string;
  logo_url: string | null;
  verification_status: string;
  updated_at: string;
  properties_count?: number;
  rating?: number | null;
  rating_avg?: number | null;
  reviews_count?: number | null;
  plan?: string | null;
  plan_expires_at?: string | null;
  completed_requests_count?: number;
  is_pro_current?: boolean;
  verification_badge?: boolean;
};

export function OfficeCard({ office }: { office: OfficeCardData }) {
  const { userId, isOffice, isAdmin } = useAuth();
  const { data: followState } = useFollowState(office.id);
  const notifyOn = followState?.notify ?? false;
  const setNotifications = useSetOfficeNotifications();
  const isPro = office.is_pro_current === true;
  const isVerified = office.verification_badge === true;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line animate-rise-in">
      {office.logo_url ? (
        <img
          src={office.logo_url}
          alt={office.name}
          className="size-11 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid size-11 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest">
          {office.name.trim().charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-sm font-bold">{office.name}</span>
          {isVerified && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-forest-soft px-1.5 py-0.5 text-[10px] font-bold text-forest">
              <ShieldCheck className="size-3" /> موثق
            </span>
          )}
          {isPro && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
              <Crown className="size-3" /> احترافي
            </span>
          )}
        </div>
      </div>
      {!isOffice && !isAdmin && (
        <Link
          to="/chats"
          search={{ c: undefined, office: office.id }}
          aria-label={"فتح محادثة مع " + office.name}
          title={"شات مع " + office.name}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-soft text-forest ring-1 ring-forest/20 transition hover:bg-forest hover:text-background"
        >
          <MessageSquare className="size-4" />
        </Link>
      )}
      <button
        type="button"
        onClick={() => {
          if (!userId) {
            toast.error("سجّل الدخول لتفعيل إشعارات المكاتب");
            return;
          }
          if (isOffice || isAdmin) {
            toast.error("إشعارات متابعة المكاتب متاحة لحساب الفردي");
            return;
          }
          setNotifications.mutate(
            { officeId: office.id, notify: !notifyOn },
            {
              onSuccess: (enabled) =>
                toast.success(
                  enabled
                    ? `ستصلك إشعارات العروض الجديدة من ${office.name}`
                    : `تم إيقاف إشعارات ${office.name}`,
                ),
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "تعذّر تحديث الإشعارات"),
            },
          );
        }}
        disabled={setNotifications.isPending}
        aria-label={notifyOn ? `إيقاف إشعارات ${office.name}` : `تفعيل إشعارات ${office.name}`}
        aria-pressed={notifyOn}
        title={notifyOn ? "إشعارات المكتب مفعّلة" : "تفعيل إشعارات المكتب"}
        className={[
          "grid size-9 shrink-0 place-items-center rounded-full ring-1 transition",
          notifyOn
            ? "bg-forest-soft text-forest ring-forest/30"
            : "bg-background text-muted-foreground ring-line hover:bg-sand",
          setNotifications.isPending ? "opacity-50" : "",
        ].join(" ")}
      >
        {notifyOn ? (
          <span className="relative grid place-items-center">
            <Bell className="size-4" />
            <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-forest text-background ring-2 ring-surface">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          </span>
        ) : (
          <BellOff className="size-4" />
        )}
      </button>
      <Link
        to="/offices/$officeId"
        params={{ officeId: office.id }}
        className="ms-auto shrink-0 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-background"
      >
        دخول المكتب
      </Link>
    </div>
  );
}
