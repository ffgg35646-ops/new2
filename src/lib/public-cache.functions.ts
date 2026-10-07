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
  sort: z.enum(["newest", "price_asc", "price_desc", "area_desc"]).optional(),
  limit: z.number().int().min(1).max(100).default(30),
});

export const getCachedPublicProperties = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => filtersSchema.parse(value))
  .handler(async ({ data }) => {
    const { getMongoCollection } = await import("@/lib/mongo.server");
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

    const key = "aqar:properties:v2:" + Buffer.from(JSON.stringify(normalized)).toString("base64url");

    return cachedServerData(key, 30, async () => {
      const properties = await getMongoCollection<Record<string, unknown>>("properties");

      const filter: Record<string, unknown> = {
        is_published: true,
        is_deleted: { $ne: true },
      };

      if (data.governorateId) filter.governorate_id = data.governorateId;
      if (data.kind) filter.kind = data.kind;
      if (data.listing) filter.listing = data.listing;
      if (data.neighborhood) filter.neighborhood = data.neighborhood;

      if (data.minPrice != null || data.maxPrice != null) {
        filter.price = {
          ...(data.minPrice != null ? { $gte: data.minPrice } : {}),
          ...(data.maxPrice != null ? { $lte: data.maxPrice } : {}),
        };
      }

      if (data.minArea != null || data.maxArea != null) {
        filter.area = {
          ...(data.minArea != null ? { $gte: data.minArea } : {}),
          ...(data.maxArea != null ? { $lte: data.maxArea } : {}),
        };
      }

      if (data.rooms != null) filter.rooms = { $gte: data.rooms };
      if (data.featuredOnly) filter.is_featured = true;

      if (data.search) {
        filter.$or = [
          { title: { $regex: data.search, $options: "i" } },
          { neighborhood: { $regex: data.search, $options: "i" } },
        ];
      }

      let cursor = properties.find(filter);

      if (data.sort === "price_asc") {
        cursor = cursor.sort("price", 1);
      } else if (data.sort === "price_desc") {
        cursor = cursor.sort("price", -1);
      } else if (data.sort === "area_desc") {
        cursor = cursor.sort("area", -1);
      } else {
        cursor = cursor.sort({ is_featured: -1, created_at: -1 });
      }

      const rows = await cursor.limit(data.limit).toArray();

      return rows.map((row) => {
        const { _id, ...clean } = row;
        void _id;
        return clean;
      });
    });
  });
