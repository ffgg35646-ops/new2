import { Link } from "@tanstack/react-router";
import { Crown, ShieldCheck, Star } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { effectivePlan } from "@/lib/plans";

export type OfficeCardData = {
  id: string;
  name: string;
  logo_url: string | null;
  verification_status: string;
  updated_at: string;
  properties_count?: number;
  rating?: number | null;
  rating_avg?: number | null;
  plan?: string | null;
  plan_expires_at?: string | null;
  completed_requests_count?: number;
};

export function OfficeCard({ office }: { office: OfficeCardData }) {
  const isPro = effectivePlan(office) === "pro";
  const isVerified = isPro && Number(office.completed_requests_count ?? 0) >= 10;
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
      <div className="min-w-0">
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
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {(office.rating_avg ?? office.rating) != null ? (
            <>
              <Star className="size-3 fill-terracotta text-terracotta" />
              {Number(office.rating_avg ?? office.rating ?? 0).toFixed(1)} ·{" "}
            </>
          ) : null}
          {office.properties_count ?? 0} عقارًا · {timeAgo(office.updated_at)}
        </div>
      </div>
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
