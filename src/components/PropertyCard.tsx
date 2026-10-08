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
    verification_status: string;
    plan?: string | null;
    plan_expires_at?: string | null;
    completed_requests_count?: number;
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
}: {
  property: PropertyCardData;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  const { isOffice } = useAuth();
  const photos = Math.max(property.images_count ?? 0, property.cover_url ? 1 : 0);
  const officeIsPro =
    property.offices?.plan === "pro" &&
    (!property.offices.plan_expires_at ||
      new Date(property.offices.plan_expires_at).getTime() > Date.now());
  const officeIsVerified =
    officeIsPro && Number(property.offices?.completed_requests_count ?? 0) >= 10;

  return (
    <article className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line animate-rise-in">
      <div className="relative">
        <Link to="/properties/$propertyId" params={{ propertyId: property.id }}>
          {property.cover_url ? (
            <img
              src={property.cover_url}
              alt={property.title}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center bg-sand text-xs text-muted-foreground">
              لا توجد صورة
            </div>
          )}
        </Link>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-semibold text-background">
            {listingLabel(property.listing)}
          </span>
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

      <Link
        to="/properties/$propertyId"
        params={{ propertyId: property.id }}
        className="block p-3.5"
      >
        <div className="flex items-start justify-between gap-2">
          <PriceLine
            price={property.price}
            listing={property.listing}
            rentPeriod={property.rent_period}
            className="font-display text-lg leading-tight font-extrabold"
          />
          <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {kindLabel(property.kind)}
          </span>
        </div>

        <div className="mt-1 text-sm">
          {property.neighborhood} · {property.governorates?.name_ar ?? ""}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{formatArea(property.area)}</span>
          {property.created_at && <span>· {timeAgo(property.created_at)}</span>}
          {officeIsVerified && (
            <span className="flex items-center gap-1 text-forest">
              <ShieldCheck className="size-3.5" /> مكتب موثق
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="truncate text-[11px] text-muted-foreground">
            {property.offices?.name ?? ""}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {property.property_number}
          </span>
        </div>
      </Link>

      <div className="relative z-20 flex gap-2 border-t border-line bg-surface p-3 pointer-events-auto">
        <a
          href={`/properties/${encodeURIComponent(property.id)}`}
          className="relative z-20 flex-1 cursor-pointer rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background"
        >
          عرض التفاصيل
        </a>
        {!isOffice && (
          <a
            href={`/properties/${encodeURIComponent(property.id)}#property-inquiry`}
            className="relative z-20 flex-1 cursor-pointer rounded-xl bg-terracotta-soft py-2.5 text-center text-xs font-bold text-terracotta"
          >
            إرسال طلب
          </a>
        )}
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      <div className="aspect-[16/10] w-full animate-shimmer bg-sand" />
      <div className="space-y-2 p-3.5">
        <div className="h-5 w-32 animate-shimmer rounded bg-sand" />
        <div className="h-4 w-40 animate-shimmer rounded bg-sand" />
      </div>
    </div>
  );
}
