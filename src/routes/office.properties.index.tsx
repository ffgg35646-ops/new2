import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Eye,
  EyeOff,
  Home,
  MapPin,
  MoreHorizontal,
  QrCode,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { QrDialog } from "@/components/QrDialog";
import { useAuth } from "@/lib/auth";
import { useMyOffice } from "@/lib/office";
import { kindLabel, listingLabel, stateLabel } from "@/lib/constants";
import { formatArea, formatPrice } from "@/lib/format";
import { useMyPlan } from "@/lib/plans";
import { getPublicAppUrl, PUBLIC_APP_URL_HELP } from "@/lib/public-app-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/office/properties/")({
  head: () => ({
    meta: [
      { title: "عقاراتي | عقار البطين" },
      { name: "description", content: "إدارة عقارات مكتبك ومتابعة حالة النشر." },
      { property: "og:title", content: "عقاراتي | عقار البطين" },
      { property: "og:description", content: "قائمة عقارات المكتب وإدارتها." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeProperties />
    </RoleGuard>
  ),
});

type PropertiesTab = "all" | "sale" | "rent" | "paused";

function timeAgo(value: string | null | undefined) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days < 7) return "منذ " + days + " أيام";
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "منذ أسبوع";
  if (weeks < 5) return "منذ " + weeks + " أسابيع";
  const months = Math.floor(days / 30);
  if (months <= 1) return "منذ شهر";
  return "منذ " + months + " أشهر";
}

function OfficeProperties() {
  const { userId } = useAuth();
  const { data: membership } = useMyOffice();
  const qc = useQueryClient();
  const { featuredLimit } = useMyPlan();
  const officeId = membership?.office?.id ?? null;
  const canFeature = featuredLimit > 0;
  const [qrFor, setQrFor] = useState<{ id: string; title: string; url: string } | null>(null);
  const [deleteFor, setDeleteFor] = useState<{ id: string; title: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<PropertiesTab>("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["office-my-properties", userId, officeId],
    enabled: !!userId && !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id,property_number,title,price,area,kind,listing,state,neighborhood,cover_url,is_published,is_featured,views_count,created_at",
        )
        .eq("office_id", officeId!)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const properties = data ?? [];
  const counts = {
    all: properties.length,
    sale: properties.filter((p) => p.listing === "sale").length,
    rent: properties.filter((p) => p.listing === "rent").length,
    paused: properties.filter((p) => !p.is_published).length,
  };

  const visibleProperties = properties
    .filter((property) => {
      const query = searchText.trim().toLocaleLowerCase("ar");
      const matchesSearch =
        !query ||
        [
          property.title,
          property.property_number,
          property.neighborhood,
          kindLabel(property.kind),
          listingLabel(property.listing),
          stateLabel(property.state),
        ].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(query));

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "sale" && property.listing === "sale") ||
        (activeTab === "rent" && property.listing === "rent") ||
        (activeTab === "paused" && !property.is_published);

      return matchesSearch && matchesTab && (!featuredOnly || property.is_featured);
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime() || 0;
      const bTime = new Date(b.created_at ?? 0).getTime() || 0;
      return newestFirst ? bTime - aTime : aTime - bTime;
    });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ is_featured: next })
        .eq("id", id);
      if (error) {
        if (error.message.includes("featured_requires_pro"))
          throw new Error("التمييز ميزة احترافية — رقِّ باقتك أولًا.");
        if (error.message.includes("featured_limit_reached"))
          throw new Error("يمكنك تمييز 3 عقارات كحد أقصى. ألغِ تمييز عقار أولًا.");
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.next ? "تم تمييز العرض ⭐" : "أُلغي تمييز العرض");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تغيير التمييز"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ is_published: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة العقار");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: () => toast.error("تعذّر تحديث حالة النشر"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleteFor(null);
      toast.success("تم حذف العرض");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: () => toast.error("تعذّر حذف العرض"),
  });

  const tabs: { key: PropertiesTab; label: string; count: number }[] = [
    { key: "all", label: "الكل", count: counts.all },
    { key: "sale", label: "للبيع", count: counts.sale },
    { key: "rent", label: "للإيجار", count: counts.rent },
    { key: "paused", label: "موقوفة", count: counts.paused },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background" dir="rtl">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4 pb-7">
        <header className="space-y-1">
          <h1 className="font-display text-xl font-extrabold">عقاراتي</h1>
          <p className="text-xs leading-5 text-muted-foreground">إدارة ومتابعة عقارات مكتبك</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition " +
                  (selected
                    ? "border-forest bg-forest text-background"
                    : "border-line bg-surface text-muted-foreground hover:border-forest/40")
                }
                aria-pressed={selected}
              >
                {tab.label}
                <span className={selected ? "text-background/80" : "text-muted-foreground"}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="ابحث في عقاراتك ..."
              aria-label="ابحث في عقارات المكتب"
              className="w-full rounded-xl border border-line bg-surface py-3 pr-10 pl-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNewestFirst((current) => !current)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:border-forest/40"
              aria-label={newestFirst ? "ترتيب من الأحدث إلى الأقدم" : "ترتيب من الأقدم إلى الأحدث"}
            >
              {newestFirst ? <ArrowDownWideNarrow className="size-4" /> : <ArrowUpWideNarrow className="size-4" />}
              {newestFirst ? "الأحدث أولًا" : "الأقدم أولًا"}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition " +
                (showFilters || featuredOnly
                  ? "border-forest bg-forest/5 text-forest"
                  : "border-line bg-surface text-muted-foreground hover:border-forest/40")
              }
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="size-4" />
              تصفية
            </button>
          </div>
          {showFilters && (
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(event) => setFeaturedOnly(event.target.checked)}
                  className="size-4 accent-forest"
                />
                العقارات المميزة فقط
              </label>
              <button
                type="button"
                onClick={() => {
                  setFeaturedOnly(false);
                  setActiveTab("all");
                  setSearchText("");
                }}
                className="text-xs font-semibold text-muted-foreground underline underline-offset-2"
              >
                مسح التصفية
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : visibleProperties.length ? (
          <div className="space-y-3">
            {visibleProperties.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface p-3 shadow-sm">
                <div className="flex gap-3">
                  <Link
                    to="/properties/$propertyId"
                    params={{ propertyId: p.id }}
                    className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                    aria-label={"فتح " + p.title}
                  >
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center">
                        <Home className="size-7 text-muted-foreground" />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <Link
                        to="/properties/$propertyId"
                        params={{ propertyId: p.id }}
                        className="min-w-0 flex-1 font-display text-sm font-extrabold leading-5 hover:text-forest"
                      >
                        <span className="line-clamp-2">{p.title || "عقار بدون عنوان"}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground"
                            aria-label={"خيارات العقار: " + p.title}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" sideOffset={6} className="w-52">
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!canFeature && !p.is_featured) {
                                toast.error("التمييز ميزة احترافية — رقِّ باقتك لإبراز عقاراتك.");
                                return;
                              }
                              toggleFeatured.mutate({ id: p.id, next: !p.is_featured });
                            }}
                            disabled={toggleFeatured.isPending}
                          >
                            <Star className={"size-4 " + (p.is_featured ? "fill-current text-forest" : "")} />
                            {p.is_featured ? "إلغاء التمييز" : "تمييز العرض"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => togglePublish.mutate({ id: p.id, next: !p.is_published })}
                            disabled={togglePublish.isPending}
                          >
                            {p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            {p.is_published ? "إيقاف العقار" : "تفعيل العقار"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!canFeature) {
                                toast.error("رمز QR ميزة احترافية — رقِّ باقتك.");
                                return;
                              }
                              if (!p.is_published) {
                                toast.error("انشر العقار أولًا لإنشاء رمز QR صالح للمشاركة.");
                                return;
                              }
                              const url = getPublicAppUrl("/properties/" + p.id);
                              if (!url) {
                                toast.error(PUBLIC_APP_URL_HELP);
                                return;
                              }
                              setQrFor({ id: p.id, title: p.title, url });
                            }}
                          >
                            <QrCode className="size-4" />
                            رمز QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteFor({ id: p.id, title: p.title })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            حذف العقار
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{p.neighborhood || "الموقع غير محدد"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {kindLabel(p.kind)} · {listingLabel(p.listing)}{p.property_number ? " · " + p.property_number : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-sm font-extrabold text-forest">{formatPrice(p.price)} ر.س</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs font-semibold text-muted-foreground">{formatArea(p.area)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      to="/properties/$propertyId"
                      params={{ propertyId: p.id }}
                      className="flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-bold text-background transition hover:opacity-90"
                    >
                      <Eye className="size-4" />
                      إدارة العقار
                    </Link>
                    {p.is_featured && (
                      <span className="flex items-center gap-1 rounded-lg bg-forest/10 px-2 py-2 text-[10px] font-bold text-forest">
                        <Star className="size-3 fill-current" />
                        مميز
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold " +
                      (p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
                    }>
                      <span className={"size-1.5 rounded-full " + (p.is_published ? "bg-emerald-600" : "bg-amber-500")} />
                      {p.is_published ? "منشور" : "موقوف"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(p.created_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-10">
            <EmptyState
              icon={Home}
              title={searchText.trim() || activeTab !== "all" || featuredOnly ? "لا توجد عقارات مطابقة" : "لا توجد عقارات بعد"}
            />
          </div>
        )}
      </main>

      {deleteFor && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4"
          role="presentation"
          onClick={() => !remove.isPending && setDeleteFor(null)}
        >
          <section
            className="w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl ring-1 ring-line"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
            aria-describedby="delete-property-description"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="size-6" />
            </div>
            <h2 id="delete-property-title" className="mt-3 text-center font-display text-lg font-extrabold">
              تأكيد حذف العقار
            </h2>
            <p id="delete-property-description" className="mt-2 text-center text-sm leading-6 text-muted-foreground">
              هل أنت متأكد أنك تريد حذف «{deleteFor.title}»؟ سيُزال العقار من قائمة عروضك.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteFor(null)}
                disabled={remove.isPending}
                className="rounded-xl bg-sand py-3 text-sm font-bold disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(deleteFor.id)}
                disabled={remove.isPending}
                className="rounded-xl bg-destructive py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {remove.isPending ? "جارٍ الحذف..." : "نعم، احذف العقار"}
              </button>
            </div>
          </section>
        </div>
      )}

      {qrFor && (
        <QrDialog
          open={!!qrFor}
          onClose={() => setQrFor(null)}
          value={qrFor.url}
          title={qrFor.title}
          subtitle="امسح الرمز لفتح صفحة العقار"
          fileName={"qr-" + qrFor.title}
        />
      )}

      <BottomNav />
    </div>
  );
}
