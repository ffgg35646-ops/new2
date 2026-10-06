import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff, Home, Plus, QrCode, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { QrDialog } from "@/components/QrDialog";
import { useAuth } from "@/lib/auth";
import { kindLabel, listingLabel, stateLabel } from "@/lib/constants";
import { formatArea, formatPrice } from "@/lib/format";
import { useMyPlan } from "@/lib/plans";

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
  const qc = useQueryClient();
  const { isPro } = useMyPlan();
  const [qrFor, setQrFor] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["office-my-properties", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id,property_number,title,price,area,kind,listing,state,neighborhood,cover_url,is_published,is_featured,views_count",
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
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
      toast.success("تم حذف العرض");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: () => toast.error("تعذّر حذف العرض"),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-extrabold">عروضي</h1>
          <Link
            to="/office/properties/new"
            className="flex items-center gap-1.5 rounded-full bg-terracotta px-3.5 py-2 text-xs font-bold text-background"
          >
            <Plus className="size-3.5" /> إضافة
          </Link>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : data?.length ? (
          <div className="space-y-2.5">
            {data.map((p) => (
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
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!isPro && !p.is_featured) {
                        toast.error("التمييز ميزة احترافية — رقِّ باقتك لإبراز عقاراتك.");
                        return;
                      }
                      toggleFeatured.mutate({ id: p.id, next: !p.is_featured });
                    }}
                    disabled={toggleFeatured.isPending}
                    aria-label={p.is_featured ? "إلغاء التمييز" : "تمييز"}
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-xl " +
                      (p.is_featured
                        ? "bg-forest text-background"
                        : "bg-sand text-muted-foreground")
                    }
                  >
                    <Star className={"size-4 " + (p.is_featured ? "fill-current" : "")} />
                  </button>
                  <button
                    onClick={() => togglePublish.mutate({ id: p.id, next: !p.is_published })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sand py-2 text-xs font-semibold"
                  >
                    {p.is_published ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {p.is_published ? "إخفاء" : "نشر"}
                  </button>
                  <Link
                    to="/office/properties/$propertyId/edit"
                    params={{ propertyId: p.id }}
                    className="flex-1 rounded-xl bg-forest-soft py-2 text-center text-xs font-semibold text-forest"
                  >
                    تعديل
                  </Link>
                  <Link
                    to="/properties/$propertyId"
                    params={{ propertyId: p.id }}
                    className="flex-1 rounded-xl bg-sand py-2 text-center text-xs font-semibold"
                  >
                    معاينة
                  </Link>
                  <button
                    onClick={() => {
                      if (!isPro) {
                        toast.error("رمز QR ميزة احترافية — رقِّ باقتك.");
                        return;
                      }
                      setQrFor({ id: p.id, title: p.title });
                    }}
                    className="grid size-9 place-items-center rounded-xl bg-sand text-forest"
                    aria-label="رمز QR"
                  >
                    <QrCode className="size-4" />
                  </button>
                  <button
                    onClick={() => remove.mutate(p.id)}
                    className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive"
                    aria-label="حذف"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Home}
            title="لا توجد عروض بعد"
            description="ابدأ بإضافة أول عرض عقاري لمكتبك."
          />
        )}
      </main>

      {qrFor && (
        <QrDialog
          open={!!qrFor}
          onClose={() => setQrFor(null)}
          value={`${typeof window !== "undefined" ? window.location.origin : ""}/properties/${qrFor.id}`}
          title={qrFor.title}
          subtitle="امسح الرمز لفتح صفحة العقار"
          fileName={`qr-${qrFor.title}`}
        />
      )}
      <BottomNav />
    </div>
  );
}
