import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home as HomeIcon, ChevronLeft, Building2, House, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PropertyCard, PropertyCardSkeleton } from "@/components/PropertyCard";
import { PropertyPagination } from "@/components/PropertyPagination";
import { OfficeCard, type OfficeCardData } from "@/components/OfficeCard";
import { EmptyState } from "@/components/EmptyState";
import { GovernorateBanner } from "@/components/GovernorateBanner";
import { LISTING_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useSelectedGovernorate } from "@/lib/governorate";
import { useFavorites, usePaginatedPropertyList } from "@/lib/properties";
import { parseDateValue } from "@/lib/format";

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
  const [page, setPage] = useState(1);
  const { favoriteIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    setPage(1);
  }, [governorateId, kind, listing]);

  const { data: propertyPage, isLoading } = usePaginatedPropertyList({
    governorateId,
    kind,
    listing,
  }, page, 10);
  const properties = propertyPage?.items ?? [];

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
          (parseDateValue(b.updated_at)?.getTime() ?? 0) - (parseDateValue(a.updated_at)?.getTime() ?? 0),
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

      <main className="flex-1 space-y-6 overflow-x-clip px-4 py-4">
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

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold">
              عقارات {governorate?.name_ar ?? ""}
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {LISTING_TYPES.map((l) => (
              <button
                key={l.value}
                onClick={() => setListing((current) => current === l.value ? null : l.value)}
                className={
                  "shrink-0 rounded-full border border-black/30 px-3.5 py-1.5 text-xs font-semibold transition " +
                  (listing === l.value
                    ? "bg-forest text-background"
                    : "bg-surface text-foreground hover:bg-sand")
                }
              >
                {l.label}
              </button>
            ))}
            {PROPERTY_KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind((current) => current === k.value ? null : k.value)}
                className={
                  "shrink-0 rounded-full border border-black/30 px-3.5 py-1.5 text-xs font-semibold transition " +
                  (kind === k.value
                    ? "bg-forest text-background"
                    : "bg-surface text-foreground hover:bg-sand")
                }
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{propertyPage?.totalCount ?? 0} عقار</span>
            <Link to="/search" className="shrink-0 text-xs font-semibold text-terracotta">
              بحث متقدم
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <PropertyCardSkeleton compact />
              <PropertyCardSkeleton compact />
            </div>
          ) : properties.length ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {properties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    isFavorite={favoriteIds.has(p.id)}
                    onToggleFavorite={toggleFavorite}
                    compact
                  />
                ))}
              </div>
              <PropertyPagination
                page={page}
                pageCount={propertyPage?.totalPages ?? 0}
                onPageChange={setPage}
              />
            </>
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
    <div className="rounded-2xl bg-surface px-2.5 py-3 text-center ring-1 ring-line">
      <div className="mx-auto grid size-8 place-items-center rounded-xl bg-forest-soft text-forest">
        <Icon className="size-4" />
      </div>
      <div className="mt-1.5 font-display text-base font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

