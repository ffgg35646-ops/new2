import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PropertyCard, PropertyCardSkeleton } from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { LISTING_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useNeighborhoods, useSelectedGovernorate } from "@/lib/governorate";
import { useFavorites, usePropertyList } from "@/lib/properties";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "البحث عن عقار | عقار البطين" },
      {
        name: "description",
        content: "ابحث بالحي والسعر والمساحة ونوع العقار داخل المزاحمية وضرما.",
      },
      { property: "og:title", content: "البحث عن عقار | عقار البطين" },
      { property: "og:description", content: "فلاتر دقيقة للوصول للعقار المناسب بسرعة." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <SearchPage />
    </RoleGuard>
  ),
});

function SearchPage() {
  const { governorateId } = useSelectedGovernorate();
  const { data: neighborhoods = [] } = useNeighborhoods(governorateId);
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [showFilters, setShowFilters] = useState(true);
  const [term, setTerm] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [listing, setListing] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "area_desc">("newest");

  const hasActiveFilters =
    !!term ||
    !!kind ||
    !!listing ||
    !!neighborhood ||
    !!minPrice ||
    !!maxPrice ||
    !!minArea ||
    !!maxArea ||
    sort !== "newest";

  function clearFilters() {
    setTerm("");
    setKind(null);
    setListing(null);
    setNeighborhood(null);
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setSort("newest");
  }

  const { data: results, isLoading } = usePropertyList({
    governorateId,
    kind,
    listing,
    neighborhood,
    search: term || null,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    minArea: minArea ? Number(minArea) : null,
    maxArea: maxArea ? Number(maxArea) : null,
    sort,
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-4 px-4 py-4">
        <div className="flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث بالحي أو عنوان العرض…"
            className="w-full rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-label="الفلاتر"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface ring-1 ring-line"
          >
            <SlidersHorizontal className="size-[18px] text-terracotta" />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
            <Group label="نوع العقار">
              <Pill active={!kind} onClick={() => setKind(null)} label="الكل" />
              {PROPERTY_KINDS.map((k) => (
                <Pill
                  key={k.value}
                  active={kind === k.value}
                  onClick={() => setKind(k.value)}
                  label={k.label}
                />
              ))}
            </Group>

            <Group label="نوع العرض">
              <Pill active={!listing} onClick={() => setListing(null)} label="الكل" />
              {LISTING_TYPES.map((l) => (
                <Pill
                  key={l.value}
                  active={listing === l.value}
                  onClick={() => setListing(l.value)}
                  label={l.label}
                />
              ))}
            </Group>

            {!!neighborhoods.length && (
              <Group label="الحي">
                <Pill
                  active={!neighborhood}
                  onClick={() => setNeighborhood(null)}
                  label="كل الأحياء"
                />
                {neighborhoods.map((n) => (
                  <Pill
                    key={n.id}
                    active={neighborhood === n.name_ar}
                    onClick={() => setNeighborhood(n.name_ar)}
                    label={n.name_ar}
                  />
                ))}
              </Group>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="أقل سعر" value={minPrice} onChange={setMinPrice} />
              <NumberField label="أعلى سعر" value={maxPrice} onChange={setMaxPrice} />
              <NumberField label="أقل مساحة" value={minArea} onChange={setMinArea} />
              <NumberField label="أعلى مساحة" value={maxArea} onChange={setMaxArea} />
            </div>

            <Group label="الترتيب">
              {(
                [
                  ["newest", "الأحدث"],
                  ["price_asc", "الأقل سعرًا"],
                  ["price_desc", "الأعلى سعرًا"],
                  ["area_desc", "الأكبر مساحة"],
                ] as const
              ).map(([value, label]) => (
                <Pill
                  key={value}
                  active={sort === value}
                  onClick={() => setSort(value)}
                  label={label}
                />
              ))}
            </Group>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{results?.length ?? 0} نتيجة</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-terracotta"
            >
              <X className="size-3.5" /> مسح كل الفلاتر
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        ) : results?.length ? (
          <div className="space-y-3">
            {results.map((p) => (
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
            icon={SearchX}
            title="لا توجد نتائج"
            description="وسّع نطاق البحث أو أزل بعض الفلاتر."
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-sand text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
      />
    </label>
  );
}
