import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { V as Heart, f as ShieldCheck, lt as Camera } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { f as kindLabel, m as rentPeriodLabel, p as listingLabel } from "./constants-Bvy1nlDs.mjs";
import { i as timeAgo, r as formatPrice, t as formatArea } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { a as stringType, i as objectType, n as enumType, r as numberType, t as booleanType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bgf1Vp0y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties-B1QAcK-Q.js
var import_jsx_runtime = require_jsx_runtime();
function PriceLine({ price, listing, rentPeriod, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className,
		children: [
			formatPrice(price),
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-bold",
				children: "ر.س"
			}),
			listing === "rent" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-bold text-muted-foreground",
				children: [
					" ",
					"/ ",
					rentPeriodLabel(rentPeriod)
				]
			})
		]
	});
}
function PropertyCard({ property, isFavorite, onToggleFavorite }) {
	const photos = Math.max(property.images_count ?? 0, property.cover_url ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-3xl bg-surface ring-1 ring-line animate-rise-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/properties/$propertyId",
					params: { propertyId: property.property_number },
					children: property.cover_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: property.cover_url,
						alt: property.title,
						loading: "lazy",
						className: "aspect-[16/10] w-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid aspect-[16/10] w-full place-items-center bg-sand text-xs text-muted-foreground",
						children: "لا توجد صورة"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute top-3 right-3 flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-semibold text-background",
						children: listingLabel(property.listing)
					}), property.is_featured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-forest px-2.5 py-1 text-[10px] font-semibold text-background",
						children: "مميز"
					})]
				}),
				!!photos && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3" }),
						" ",
						photos
					]
				}),
				onToggleFavorite && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "حفظ في المفضلة",
					onClick: () => onToggleFavorite(property.id),
					className: "absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-surface/90 ring-1 ring-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-4", isFavorite ? "fill-terracotta text-terracotta" : "text-muted-foreground") })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/properties/$propertyId",
			params: { propertyId: property.property_number },
			className: "block p-3.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceLine, {
						price: property.price,
						listing: property.listing,
						rentPeriod: property.rent_period,
						className: "font-display text-lg leading-tight font-extrabold"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-muted-foreground",
						children: kindLabel(property.kind)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 text-sm",
					children: [
						property.neighborhood,
						" · ",
						property.governorates?.name_ar ?? ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatArea(property.area) }),
						property.created_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", timeAgo(property.created_at)] }),
						property.offices?.verification_status === "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-forest",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5" }), " مكتب موثق"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-[11px] text-muted-foreground",
						children: property.offices?.name ?? ""
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-[10px] text-muted-foreground",
						children: property.property_number
					})]
				})
			]
		})]
	});
}
function PropertyCardSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-3xl bg-surface ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-[16/10] w-full animate-shimmer bg-sand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2 p-3.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-32 animate-shimmer rounded bg-sand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-40 animate-shimmer rounded bg-sand" })]
		})]
	});
}
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
var getCachedPublicProperties = createServerFn({ method: "POST" }).inputValidator((value) => filtersSchema.parse(value)).handler(createSsrRpc("a2fbf8e7adf20964c7d3c58b05df09c46765ee6f80a8bf93a3ee7ddf73a273cf"));
var PROPERTY_SELECT = "id,property_number,title,price,area,kind,listing,neighborhood,cover_url,is_featured,created_at,rent_period,images_count,governorates(name_ar),offices(name,verification_status)";
function usePropertyList(filters, limit = 30) {
	return useQuery({
		queryKey: [
			"properties",
			filters,
			limit
		],
		queryFn: async () => {
			return await getCachedPublicProperties({
				...filters,
				limit
			}) ?? [];
		}
	});
}
function useFavorites() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const ids = useQuery({
		queryKey: ["favorite-ids", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("favorites").select("property_id");
			if (error) throw error;
			return new Set((data ?? []).map((r) => r.property_id));
		}
	});
	const toggle = useMutation({
		mutationFn: async (propertyId) => {
			if (!userId) throw new Error("سجّل الدخول لحفظ العقار في المفضلة");
			if (ids.data?.has(propertyId)) {
				const { error } = await supabase.from("favorites").delete().eq("property_id", propertyId).eq("user_id", userId);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("favorites").insert({
					property_id: propertyId,
					user_id: userId
				});
				if (error) throw error;
			}
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر التنفيذ"),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["favorite-ids"] });
			qc.invalidateQueries({ queryKey: ["favorites"] });
		}
	});
	return {
		favoriteIds: ids.data ?? /* @__PURE__ */ new Set(),
		toggleFavorite: (id) => toggle.mutate(id)
	};
}
//#endregion
export { usePropertyList as a, useFavorites as i, PropertyCard as n, PropertyCardSkeleton as r, PROPERTY_SELECT as t };
