
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const filtersSchema = z.object({
  governorateId: z.string().nullable().optional(),
  kind: z.string().nullable().optional(),
  listing: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  minPrice: z.number().nullable().optional(),
  maxPrice: z.number().nullable().optional(),
  minArea: z.number().nullable().optional(),
  maxArea: z.number().nullable().optional(),
  rooms: z.number().nullable().optional(),
  search: z.string().nullable().optional(),
  featuredOnly: z.boolean().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "area_desc"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(30),
});

export const getCachedPublicProperties = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => filtersSchema.parse(value))
  .handler(async ({ data }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { cachedServerData } = await import("@/lib/redis.server");

    const normalized = {
      governorateId: data.governorateId ?? null,
      kind: data.kind ?? null,
      listing: data.listing ?? null,
      neighborhood: data.neighborhood ?? null,
      minPrice: data.minPrice ?? null,
      maxPrice: data.maxPrice ?? null,
      minArea: data.minArea ?? null,
      maxArea: data.maxArea ?? null,
      rooms: data.rooms ?? null,
      search: data.search ?? null,
      featuredOnly: data.featuredOnly ?? false,
      sort: data.sort ?? "newest",
      limit: data.limit,
    };

    const key = `aqar:properties:v1:${Buffer.from(
      JSON.stringify(normalized),
    ).toString("base64url")}`;

    return cachedServerData(key, 30, async () => {
      const select =
        "id,property_number,title,price,area,kind,listing,neighborhood,cover_url,is_featured,created_at,rent_period,images_count,governorates(name_ar),offices(name,verification_status)";

      let q = supabaseAdmin
        .from("properties")
        .select(select)
        .eq("is_published", true)
        .eq("is_deleted", false);

      if (data.governorateId) {
        q = q.eq("governorate_id", data.governorateId);
      }

      if (data.kind) {
        q = q.eq("kind", data.kind as never);
      }

      if (data.listing) {
        q = q.eq("listing", data.listing as never);
      }

      if (data.neighborhood) {
        q = q.eq("neighborhood", data.neighborhood);
      }

      if (data.minPrice != null) {
        q = q.gte("price", data.minPrice);
      }

      if (data.maxPrice != null) {
        q = q.lte("price", data.maxPrice);
      }

      if (data.minArea != null) {
        q = q.gte("area", data.minArea);
      }

      if (data.maxArea != null) {
        q = q.lte("area", data.maxArea);
      }

      if (data.rooms != null) {
        q = q.gte("rooms", data.rooms);
      }

      if (data.featuredOnly) {
        q = q.eq("is_featured", true);
      }

      if (data.search) {
        q = q.or(
          `title.ilike.%${data.search}%,neighborhood.ilike.%${data.search}%`,
        );
      }

      if (data.sort === "price_asc") {
        q = q.order("price", { ascending: true });
      } else if (data.sort === "price_desc") {
        q = q.order("price", { ascending: false });
      } else if (data.sort === "area_desc") {
        q = q.order("area", { ascending: false });
      } else {
        q = q
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data: rows, error } = await q.limit(data.limit);

      if (error) throw error;

      return rows ?? [];
    });
  });
