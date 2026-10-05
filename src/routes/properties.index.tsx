import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { PropertyCard } from "@/components/PropertyCard";
import { LISTING_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useMyOffice } from "@/lib/office";
import { useFavorites, usePropertyList, type PropertyFilters } from "@/lib/properties";

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "جميع العقارات | عقار البطين" },
      {
        name: "description",
        content:
          "تصفّح جميع العقارات المعروضة في عقار البطين: أراضٍ وشقق وفلل ومحلات للبيع والإيجار مع كامل التفاصيل والصور.",
      },
      { property: "og:title", content: "جميع العقارات | عقار البطين" },
      {
        property: "og:description",
        content: "كل العقارات المضافة في التطبيق في مكان واحد مع إمكانية الفلترة والبحث.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AllPropertiesPage,
});

function AllPropertiesPage() {
  const [filters, setFilters] = useState<PropertyFilters>({ sort: "newest" });
  const { data: properties, isLoading } = usePropertyList(filters, 60);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { data: membership } = useMyOffice();

  const canAdd = !!membership?.office;

  function setKind(kind: string | null) {
    setFilters((f) => ({ ...f, kind: f.kind === kind ? null : kind }));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader />

      <main className="flex-1 space-y-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-extrabold">جميع العقارات</h1>
          {canAdd && (
            <Link
              to="/office/properties/new"
              className="ms-auto flex items-center gap-1.5 rounded-full bg-terracotta px-3.5 py-2 text-xs font-bold text-background"
            >
              <PlusCircle className="size-4" /> إضافة عقار
            </Link>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {LISTING_TYPES.map((l) => (
            <button
              key={l.value}
              onClick={() =>
                setFilters((f) => ({ ...f, listing: f.listing === l.value ? null : l.value }))
              }
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 " +
                (filters.listing === l.value
                  ? "bg-forest text-background ring-forest"
                  : "bg-surface ring-line")
              }
            >
              {l.label}
            </button>
          ))}
          {PROPERTY_KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 " +
                (filters.kind === k.value
                  ? "bg-forest text-background ring-forest"
                  : "bg-surface ring-line")
              }
            >
              {k.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : properties?.length ? (
          <>
            <p className="text-xs text-muted-foreground">{properties.length} عقار</p>
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
          </>
        ) : (
          <EmptyState
            icon={Building2}
            title="لا توجد عقارات مطابقة"
            description="جرّب تغيير الفلاتر أو العودة لاحقًا."
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
