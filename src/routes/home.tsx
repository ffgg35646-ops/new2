import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home as HomeIcon, ChevronLeft, Building2, House, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PropertyCard, PropertyCardSkeleton } from "@/components/PropertyCard";
import { OfficeCard, type OfficeCardData } from "@/components/OfficeCard";
import { EmptyState } from "@/components/EmptyState";
import { GovernorateBanner } from "@/components/GovernorateBanner";
import { QUICK_KINDS, LISTING_TYPES } from "@/lib/constants";
import { useSelectedGovernorate } from "@/lib/governorate";
import { useFavorites, usePropertyList } from "@/lib/properties";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "أحدث العقارات | عقار البطين" },
      {
        name: "description",
        content: "تصفح أحدث الأراضي والفلل والشقق المعروضة من مكاتب عقارية في محافظتك.",
      },
      { property: "og:title", content: "أحدث العقارات | عقار البطين" },
      { property: "og:description", content: "عروض محدثة يوميًا من المكاتب العقارية المحلية." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <HomePage />
    </RoleGuard>
  ),
});

function HomePage() {
  const { governorateId, governorate } = useSelectedGovernorate();
  const [kind, setKind] = useState<string | null>(null);
  const [listing, setListing] = useState<string | null>(null);
  const { favoriteIds, toggleFavorite } = useFavorites();

  const { data: properties, isLoading } = usePropertyList({
    governorateId,
    kind,
    listing,
  });

  const { data: offices } = useQuery({
    queryKey: ["home-offices", governorateId],
    enabled: !!governorateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id,name,logo_url,verification_status,updated_at,plan,plan_expires_at,rating_avg,reviews_count,package_id,completed_requests_count,is_pro_current,verification_badge,properties(count)",
        )
        .eq("governorate_id", governorateId!)
        .eq("verification_status", "verified")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const offices = ((data ?? []).map((o) => ({
        ...o,
        properties_count:
          Array.isArray(o.properties) && o.properties.length > 0
            ? Number((o.properties[0] as { count?: number }).count ?? 0)
            : 0,
      })) as OfficeCardData[]);

      return offices
        .sort((a, b) =>
          Number(b.is_pro_current === true) - Number(a.is_pro_current === true) ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 4);
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["home-stats", governorateId],
    enabled: !!governorateId,
    staleTime: 60_000,
    queryFn: async () => {
      const [officesRes, saleRes, rentRes] = await Promise.all([
        supabase
          .from("offices")
          .select("id", { count: "exact", head: true })
          .eq("governorate_id", governorateId!)
          .eq("verification_status", "verified")
          .eq("is_deleted", false),

        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("governorate_id", governorateId!)
          .eq("listing", "sale")
          .eq("is_published", true)
          .eq("is_deleted", false),

        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("governorate_id", governorateId!)
          .eq("listing", "rent")
          .eq("is_published", true)
          .eq("is_deleted", false),
      ]);

      if (officesRes.error) throw officesRes.error;
      if (saleRes.error) throw saleRes.error;
      if (rentRes.error) throw rentRes.error;

      return {
        offices: officesRes.count ?? 0,
        sale: saleRes.count ?? 0,
        rent: rentRes.count ?? 0,
      };
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader />

      <main className="flex-1 space-y-6 px-4 py-4">
        <GovernorateBanner governorate={governorate} />

        <section className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={Building2}
            label="مكاتب"
            value={statsLoading ? "—" : String(stats?.offices ?? 0)}
          />
          <StatCard
            icon={House}
            label="عقارات بيع"
            value={statsLoading ? "—" : String(stats?.sale ?? 0)}
          />
          <StatCard
            icon={KeyRound}
            label="عقارات إيجار"
            value={statsLoading ? "—" : String(stats?.rent ?? 0)}
          />
        </section>

        <section>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={!kind} onClick={() => setKind(null)} label="الكل" />
            {QUICK_KINDS.map((k) => (
              <Chip
                key={k.value}
                active={kind === k.value}
                onClick={() => setKind(k.value)}
                label={k.plural}
              />
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Chip active={!listing} onClick={() => setListing(null)} label="الكل" small />
            {LISTING_TYPES.map((l) => (
              <Chip
                key={l.value}
                active={listing === l.value}
                onClick={() => setListing(l.value)}
                label={l.label}
                small
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold">
              عقارات {governorate?.name_ar ?? ""}
            </h2>
            <Link to="/search" className="text-xs text-terracotta">
              بحث متقدم
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
          ) : properties?.length ? (
            <div className="space-y-3">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={HomeIcon}
              title="لا توجد عقارات مطابقة"
              action={
                <Link
                  to="/request"
                  search={{ request: undefined }}
                  className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
                >
                  اطلب عقارًا
                </Link>
              }
            />
          )}
        </section>

        {!!offices?.length && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-extrabold">مكاتب موثقة</h2>
              <Link to="/offices" className="flex items-center text-xs text-terracotta">
                عرض الكل <ChevronLeft className="size-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {offices.map((o) => (
                <OfficeCard key={o.id} office={o} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface px-2.5 py-3 text-center ring-1 ring-line shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mx-auto grid size-8 place-items-center rounded-xl bg-forest-soft text-forest">
        <Icon className="size-4" />
      </div>
      <div className="mt-1.5 font-display text-base font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 font-semibold transition active:scale-[0.98]",
        small ? "py-1.5 text-xs" : "py-2 text-sm",
        active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line",
      )}
    >
      {label}
    </button>
  );
}
