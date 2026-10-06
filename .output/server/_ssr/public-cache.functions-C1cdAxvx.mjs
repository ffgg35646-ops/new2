import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as createServerRpc } from "./createServerRpc-CxD4EZ5P.mjs";
import { a as stringType, i as objectType, n as enumType, r as numberType, t as booleanType } from "../_libs/zod.mjs";
import { Buffer } from "node:buffer";
//#region node_modules/.nitro/vite/services/ssr/assets/public-cache.functions-C1cdAxvx.js
var filtersSchema = objectType({
	governorateId: stringType().nullable().optional(),
	kind: stringType().nullable().optional(),
	listing: stringType().nullable().optional(),
	neighborhood: stringType().nullable().optional(),
	minPrice: numberType().nullable().optional(),
	maxPrice: numberType().nullable().optional(),
	minArea: numberType().nullable().optional(),
	maxArea: numberType().nullable().optional(),
	rooms: numberType().nullable().optional(),
	search: stringType().nullable().optional(),
	featuredOnly: booleanType().optional(),
	sort: enumType([
		"newest",
		"price_asc",
		"price_desc",
		"area_desc"
	]).optional(),
	limit: numberType().int().min(1).max(100).default(30)
});
var getCachedPublicProperties_createServerFn_handler = createServerRpc({
	id: "a2fbf8e7adf20964c7d3c58b05df09c46765ee6f80a8bf93a3ee7ddf73a273cf",
	name: "getCachedPublicProperties",
	filename: "src/lib/public-cache.functions.ts"
}, (opts) => getCachedPublicProperties.__executeServer(opts));
var getCachedPublicProperties = createServerFn({ method: "POST" }).inputValidator((value) => filtersSchema.parse(value)).handler(getCachedPublicProperties_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	const { cachedServerData } = await import("./redis.server-B7d697bv.mjs");
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
		limit: data.limit
	};
	return cachedServerData(`aqar:properties:v1:${Buffer.from(JSON.stringify(normalized)).toString("base64url")}`, 30, async () => {
		let q = supabaseAdmin.from("properties").select("id,property_number,title,price,area,kind,listing,neighborhood,cover_url,is_featured,created_at,rent_period,images_count,governorates(name_ar),offices(name,verification_status)").eq("is_published", true).eq("is_deleted", false);
		if (data.governorateId) q = q.eq("governorate_id", data.governorateId);
		if (data.kind) q = q.eq("kind", data.kind);
		if (data.listing) q = q.eq("listing", data.listing);
		if (data.neighborhood) q = q.eq("neighborhood", data.neighborhood);
		if (data.minPrice != null) q = q.gte("price", data.minPrice);
		if (data.maxPrice != null) q = q.lte("price", data.maxPrice);
		if (data.minArea != null) q = q.gte("area", data.minArea);
		if (data.maxArea != null) q = q.lte("area", data.maxArea);
		if (data.rooms != null) q = q.gte("rooms", data.rooms);
		if (data.featuredOnly) q = q.eq("is_featured", true);
		if (data.search) q = q.or(`title.ilike.%${data.search}%,neighborhood.ilike.%${data.search}%`);
		if (data.sort === "price_asc") q = q.order("price", { ascending: true });
		else if (data.sort === "price_desc") q = q.order("price", { ascending: false });
		else if (data.sort === "area_desc") q = q.order("area", { ascending: false });
		else q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
		const { data: rows, error } = await q.limit(data.limit);
		if (error) throw error;
		return rows ?? [];
	});
});
//#endregion
export { getCachedPublicProperties_createServerFn_handler };
