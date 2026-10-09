import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { OfficeCard } from "@/components/OfficeCard";
import { useSelectedGovernorate } from "@/lib/governorate";
import { effectivePlan } from "@/lib/plans";

export const Route = createFileRoute("/offices/")({
  head: () => ({
    meta: [
      { title: "المكاتب العقارية الموثقة | عقار البطين" },
      {
        name: "description",
        content: "استعرض المكاتب العقارية الموثقة في المزاحمية وضرما وتواصل معها مباشرة.",
      },
      { property: "og:title", content: "المكاتب العقارية الموثقة | عقار البطين" },
      { property: "og:description", content: "مكاتب موثقة بتقييمات حقيقية وعروض محدثة." },
    ],
  }),
  component: OfficesPage,
});

function OfficesPage() {
  const { governorateId } = useSelectedGovernorate();

  const { data, isLoading } = useQuery({
    queryKey: ["offices", governorateId],
    enabled: !!governorateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id,name,logo_url,verification_status,updated_at,plan,plan_expires_at,rating_avg,reviews_count,package_id,completed_requests_count,is_pro_current,verification_badge,properties(count)",
        )
        .eq("governorate_id", governorateId!)
        .eq("is_deleted", false)
        .eq("verification_status", "verified")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const offices = (data ?? []).map((o) => ({
        ...o,
        properties_count:
          Array.isArray(o.properties) && o.properties.length > 0
            ? Number((o.properties[0] as { count?: number }).count ?? 0)
            : 0,
      }));

      return offices.sort((a, b) => {
        const aPro = effectivePlan(a) === "pro";
        const bPro = effectivePlan(b) === "pro";
        const aVerified = aPro && Number(a.completed_requests_count ?? 0) >= 10;
        const bVerified = bPro && Number(b.completed_requests_count ?? 0) >= 10;
        return Number(bVerified) - Number(aVerified) || Number(bPro) - Number(aPro);
      });
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader />
      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">المكاتب العقارية</h1>
        {isLoading ? (
          <ListSkeleton />
        ) : data?.length ? (
          <div className="space-y-2.5">
            {data.map((o) => (
              <OfficeCard key={o.id} office={o} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="لا توجد مكاتب في هذه المحافظة"
            description="جرّب تغيير المحافظة من الأعلى."
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
