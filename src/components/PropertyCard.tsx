import { Link } from "@tanstack/react-router";
import { Camera, Heart, ShieldCheck } from "lucide-react";
import { formatArea, formatPrice, timeAgo } from "@/lib/format";
import { kindLabel, listingLabel, rentPeriodLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export type PropertyCardData = {
  id: string;
  property_number: string;
  title: string;
  price: number | string;
  area: number | string;
  kind: string;
  listing: string;
  neighborhood: string;
  cover_url: string | null;
  is_featured: boolean;
  created_at?: string | null;
  rent_period?: string | null;
  images_count?: number | null;
  governorates?: { name_ar: string } | null;
  offices?: {
    name: string;
    logo_url?: string | null;
    verification_status: string;
    plan?: string | null;
    plan_expires_at?: string | null;
    completed_requests_count?: number;
    is_pro_current?: boolean;
    verification_badge?: boolean;
  } | null;
};

export function PriceLine({
  price,
  listing,
  rentPeriod,
  className,
}: {
  price: number | string;
  listing: string;
  rentPeriod?: string | null | undefined;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatPrice(price)} <span className="text-sm font-bold">ر.س</span>
      {listing === "rent" && (
        <span className="text-xs font-bold text-muted-foreground">
          {" "}
          / {rentPeriodLabel(rentPeriod)}
        </span>
      )}
    </span>
  );
}

export function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
  compact = false,
}: {
  property: PropertyCardData;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}) {
  const { isOffice } = useAuth();
  const photos = Math.max(property.images_count ?? 0, property.cover_url ? 1 : 0);
  const officeIsVerified = property.offices?.verification_badge === true;

  return (
    <article className={cn("overflow-hidden bg-surface ring-1 ring-line animate-rise-in", compact ? "rounded-2xl" : "rounded-3xl")}>
      <div className="relative">
        <Link to="/properties/$propertyId" params={{ propertyId: property.id }}>
          {property.cover_url ? (
            <img
              src={property.cover_url}
              alt={property.title}
              loading="lazy"
              className={cn("w-full object-cover", compact ? "aspect-[4/3]" : "aspect-[16/10]")}
            />
          ) : (
            <div className={cn("grid w-full place-items-center bg-sand text-xs text-muted-foreground", compact ? "aspect-[4/3]" : "aspect-[16/10]")}>
              لا توجد صورة
            </div>
          )}
        </Link>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {!compact && (
            <span className="rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-semibold text-background">
              {listingLabel(property.listing)}
            </span>
          )}
          {property.is_featured && (
            <span className="rounded-full bg-forest px-2.5 py-1 text-[10px] font-semibold text-background">
              مميز
            </span>
          )}
        </div>

        {!!photos && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <Camera className="size-3" /> {photos}
          </span>
        )}

        {onToggleFavorite && (
          <button
            aria-label="حفظ في المفضلة"
            onClick={() => onToggleFavorite(property.id)}
            className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-surface/90 ring-1 ring-line"
          >
            <Heart
              className={cn(
                "size-4",
                isFavorite ? "fill-terracotta text-terracotta" : "text-muted-foreground",
              )}
            />
          </button>
        )}
      </div>

      {compact && (
        <div className="px-2 pt-1 text-left text-[9px] leading-none text-muted-foreground">
          {formatArea(property.area)}
        </div>
      )}

      <Link
        to="/properties/$propertyId"
        params={{ propertyId: property.id }}
        className={cn("block", compact ? "p-2" : "p-3.5")}
      >
        {compact ? (
          <>
            <span className="inline-flex rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-semibold text-background">
              {listingLabel(property.listing)}
            </span>
            <div className="mt-1 line-clamp-2 text-xs font-bold leading-snug">
              {property.title || kindLabel(property.kind)}
            </div>
            <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {property.neighborhood} · {property.governorates?.name_ar ?? ""}
            </div>
            <PriceLine
              price={property.price}
              listing={property.listing}
              rentPeriod={property.rent_period}
              className="mt-2 block font-display text-sm font-extrabold leading-tight"
            />
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <PriceLine
                price={property.price}
                listing={property.listing}
                rentPeriod={property.rent_period}
                className="font-display text-lg font-extrabold leading-tight"
              />
              <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {kindLabel(property.kind)}
              </span>
            </div>

            <div className="mt-1 text-sm">
              {property.neighborhood} · {property.governorates?.name_ar ?? ""}
            </div>
          </>
        )}

        <div className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          {!compact && <span>{formatArea(property.area)}</span>}
          {property.created_at && (
            <span>{!compact ? "· " : ""}{timeAgo(property.created_at)}</span>
          )}
          {officeIsVerified && (
            <span className="flex items-center gap-1 text-forest">
              <ShieldCheck className="size-3.5" /> مكتب موثق
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {property.offices?.logo_url ? (
              <img src={property.offices.logo_url} alt="" loading="lazy" className="size-6 shrink-0 rounded-full object-cover ring-1 ring-line" />
            ) : (
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest-soft text-[10px] font-extrabold text-forest">
                {(property.offices?.name ?? "م").trim().charAt(0)}
              </span>
            )}
            <span className="truncate text-[11px] text-muted-foreground">{property.offices?.name ?? ""}</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {property.property_number}
          </span>
        </div>
      </Link>

    </article>
  );
}

export function PropertyCardSkeleton({ compact = false }: { compact?: boolean } = {}) {
  return (
    <div className={cn("overflow-hidden bg-surface ring-1 ring-line", compact ? "rounded-2xl" : "rounded-3xl")}>
      <div className={cn("w-full animate-shimmer bg-sand", compact ? "aspect-[4/3]" : "aspect-[16/10]")} />
      <div className={cn("space-y-2", compact ? "p-2" : "p-3.5")}>
        <div className={cn("animate-shimmer rounded bg-sand", compact ? "h-4 w-3/4" : "h-5 w-32")} />
        <div className={cn("animate-shimmer rounded bg-sand", compact ? "h-3 w-1/2" : "h-4 w-40")} />
      </div>
    </div>
  );
}
