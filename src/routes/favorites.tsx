import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  PropertyCard,
  PropertyCardSkeleton,
  type PropertyCardData,
} from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/properties";
import { PROPERTY_SELECT } from "@/lib/properties";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة | عقار البطين" },
      { name: "description", content: "العقارات التي حفظتها للرجوع إليها لاحقًا." },
      { property: "og:title", content: "المفضلة | عقار البطين" },
      { property: "og:description", content: "احفظ العقارات وقارن بينها في أي وقت." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "office", "admin"]}>
      <FavoritesPage />
    </RoleGuard>
  ),
});

function FavoritesPage() {
  const { userId } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(`property_id, properties(${PROPERTY_SELECT})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => r.properties).filter(Boolean) as unknown as PropertyCardData[];
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">المفضلة</h1>

        {!userId ? (
          <EmptyState
            icon={Heart}
            title="سجّل الدخول لحفظ عقاراتك"
            action={
              <Link
                to="/auth/individual"
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
              >
                تسجيل الدخول
              </Link>
            }
          />
        ) : isLoading ? (
          <PropertyCardSkeleton />
        ) : data?.length ? (
          <div className="space-y-3">
            {data.map((p) => (
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
            icon={Heart}
            title="لا توجد عقارات محفوظة"
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
