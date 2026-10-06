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
  plan?: string | null;
  plan_expires_at?: string | null;
};

export function OfficeCard({ office }: { office: OfficeCardData }) {
  const isPro = effectivePlan(office) === "pro";
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
          {office.verification_status === "verified" && (
            <ShieldCheck className="size-4 shrink-0 text-forest" />
          )}
          {isPro && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
              <Crown className="size-3" /> احترافي
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {office.rating ? (
            <>
              <Star className="size-3 fill-terracotta text-terracotta" />
              {office.rating.toFixed(1)} ·{" "}
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
        عرض
      </Link>
    </div>
  );
}
