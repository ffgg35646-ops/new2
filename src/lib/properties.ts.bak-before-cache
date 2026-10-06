import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { PropertyCardData } from "@/components/PropertyCard";

export const PROPERTY_SELECT =
  "id,property_number,title,price,area,kind,listing,neighborhood,cover_url,is_featured,created_at,rent_period,images_count,governorates(name_ar),offices(name,verification_status)";

export type PropertyFilters = {
  governorateId?: string | null;
  kind?: string | null;
  listing?: string | null;
  neighborhood?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  rooms?: number | null;
  search?: string | null;
  featuredOnly?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc";
};

export function usePropertyList(filters: PropertyFilters, limit = 30) {
  return useQuery({
    queryKey: ["properties", filters, limit],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("is_published", true)
        .eq("is_deleted", false);

      if (filters.governorateId) q = q.eq("governorate_id", filters.governorateId);
      if (filters.kind) q = q.eq("kind", filters.kind as never);
      if (filters.listing) q = q.eq("listing", filters.listing as never);
      if (filters.neighborhood) q = q.eq("neighborhood", filters.neighborhood);
      if (filters.minPrice) q = q.gte("price", filters.minPrice);
      if (filters.maxPrice) q = q.lte("price", filters.maxPrice);
      if (filters.minArea) q = q.gte("area", filters.minArea);
      if (filters.maxArea) q = q.lte("area", filters.maxArea);
      if (filters.rooms) q = q.gte("rooms", filters.rooms);
      if (filters.featuredOnly) q = q.eq("is_featured", true);
      if (filters.search)
        q = q.or(`title.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`);

      if (filters.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (filters.sort === "price_desc") q = q.order("price", { ascending: false });
      else if (filters.sort === "area_desc") q = q.order("area", { ascending: false });
      else
        q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

      const { data, error } = await q.limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as PropertyCardData[];
    },
  });
}

export function useFavorites() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const ids = useQuery({
    queryKey: ["favorite-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("property_id");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.property_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!userId) throw new Error("سجّل الدخول لحفظ العقار في المفضلة");
      if (ids.data?.has(propertyId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("property_id", propertyId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ property_id: propertyId, user_id: userId });
        if (error) throw error;
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر التنفيذ"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return {
    favoriteIds: ids.data ?? new Set<string>(),
    toggleFavorite: (id: string) => toggle.mutate(id),
  };
}
