import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Home, MoreHorizontal, QrCode, Search, Star, Trash2 } from "lucide-react";
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
      { title: "إدارة العروض | عقار البطين" },
      { name: "description", content: "أضف وعدّل واحذف عروضك العقارية وتحكم في نشرها." },
      { property: "og:title", content: "إدارة العروض | عقار البطين" },
      { property: "og:description", content: "لوحة إدارة عروض المكتب العقاري." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeProperties />
    </RoleGuard>
  ),
});

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
  const [filters, setFilters] = useState({
    rent: false,
    sale: false,
    purchase: false,
    suspended: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["office-my-properties", userId, officeId],
    enabled: !!userId && !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id,property_number,title,price,area,kind,listing,state,neighborhood,cover_url,is_published,is_featured,views_count",
        )
        .eq("office_id", officeId!)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedFilters = Object.values(filters).some(Boolean);
  const visibleProperties = (data ?? []).filter((property) => {
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

    const matchesFilters =
      !selectedFilters ||
      (filters.rent && property.listing === "rent") ||
      (filters.sale && property.listing === "sale") ||
      (filters.purchase && property.state === "sold") ||
      (filters.suspended && !property.is_published);

    return matchesSearch && matchesFilters;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["office-my-properties"] }),
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">عقارات</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="بحث"
            aria-label="بحث في عقارات المكتب"
            className="w-full rounded-xl bg-surface py-3 pr-10 pl-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["rent", "إيجار"],
            ["sale", "بيع"],
            ["purchase", "شراء"],
            ["suspended", "موقوفة"],
          ] as const).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm ring-1 ring-line"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, [key]: event.target.checked }))
                }
                className="size-4 accent-forest"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : visibleProperties.length ? (
          <div className="space-y-2.5">
            {visibleProperties.map((p) => (
              <div key={p.id} className="rounded-2xl bg-surface p-3 ring-1 ring-line">
                <div className="flex gap-3">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      loading="lazy"
                      className="size-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-xl bg-sand">
                      <Home className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-display text-sm font-bold">{p.title}</span>
                      {p.is_featured && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-background">
                          <Star className="size-2.5" /> مميز
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.property_number} · {kindLabel(p.kind)} · {listingLabel(p.listing)} ·{" "}
                      {stateLabel(p.state)}
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-forest">
                      {formatPrice(p.price)} ر.س · {formatArea(p.area)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-line transition hover:text-foreground hover:ring-forest/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                        aria-label={`إدارة العقار: ${p.title}`}
                      >
                        <MoreHorizontal className="size-4" />
                        إدارة العقار
                        <ChevronDown className="size-3.5" />
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
                        <Star className={`size-4 ${p.is_featured ? "fill-current text-forest" : ""}`} />
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
                          const url = getPublicAppUrl(`/properties/${p.id}`);
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
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={p.is_published ? "size-2.5 rounded-full bg-green-500" : "size-2.5 rounded-full bg-yellow-400"} />
                    <span>{p.is_published ? "مفعل" : "موقوف"}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Home}
            title="لا توجد عروض بعد"
            
          />
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
          fileName={`qr-${qrFor.title}`}
        />
      )}
      <BottomNav />
    </div>
  );
}
