import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { g as SearchX, t as X, u as SlidersHorizontal } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as useNeighborhoods, r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { a as LISTING_TYPES, o as PROPERTY_KINDS } from "./constants-Bvy1nlDs.mjs";
import { a as usePropertyList, i as useFavorites, n as PropertyCard, r as PropertyCardSkeleton } from "./properties-B1QAcK-Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-BVPqhUfC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SearchPage() {
	const { governorateId } = useSelectedGovernorate();
	const { data: neighborhoods = [] } = useNeighborhoods(governorateId);
	const { favoriteIds, toggleFavorite } = useFavorites();
	const [showFilters, setShowFilters] = (0, import_react.useState)(true);
	const [term, setTerm] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)(null);
	const [listing, setListing] = (0, import_react.useState)(null);
	const [neighborhood, setNeighborhood] = (0, import_react.useState)(null);
	const [minPrice, setMinPrice] = (0, import_react.useState)("");
	const [maxPrice, setMaxPrice] = (0, import_react.useState)("");
	const [minArea, setMinArea] = (0, import_react.useState)("");
	const [maxArea, setMaxArea] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("newest");
	const hasActiveFilters = !!term || !!kind || !!listing || !!neighborhood || !!minPrice || !!maxPrice || !!minArea || !!maxArea || sort !== "newest";
	function clearFilters() {
		setTerm("");
		setKind(null);
		setListing(null);
		setNeighborhood(null);
		setMinPrice("");
		setMaxPrice("");
		setMinArea("");
		setMaxArea("");
		setSort("newest");
	}
	const { data: results, isLoading } = usePropertyList({
		governorateId,
		kind,
		listing,
		neighborhood,
		search: term || null,
		minPrice: minPrice ? Number(minPrice) : null,
		maxPrice: maxPrice ? Number(maxPrice) : null,
		minArea: minArea ? Number(minArea) : null,
		maxArea: maxArea ? Number(maxArea) : null,
		sort
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: term,
							onChange: (e) => setTerm(e.target.value),
							placeholder: "ابحث بالحي أو عنوان العرض…",
							className: "w-full rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowFilters((v) => !v),
							"aria-label": "الفلاتر",
							className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-surface ring-1 ring-line",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-[18px] text-terracotta" })
						})]
					}),
					showFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
								label: "نوع العقار",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: !kind,
									onClick: () => setKind(null),
									label: "الكل"
								}), PROPERTY_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: kind === k.value,
									onClick: () => setKind(k.value),
									label: k.label
								}, k.value))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
								label: "نوع العرض",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: !listing,
									onClick: () => setListing(null),
									label: "الكل"
								}), LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: listing === l.value,
									onClick: () => setListing(l.value),
									label: l.label
								}, l.value))]
							}),
							!!neighborhoods.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
								label: "الحي",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: !neighborhood,
									onClick: () => setNeighborhood(null),
									label: "كل الأحياء"
								}), neighborhoods.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: neighborhood === n.name_ar,
									onClick: () => setNeighborhood(n.name_ar),
									label: n.name_ar
								}, n.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
										label: "أقل سعر",
										value: minPrice,
										onChange: setMinPrice
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
										label: "أعلى سعر",
										value: maxPrice,
										onChange: setMaxPrice
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
										label: "أقل مساحة",
										value: minArea,
										onChange: setMinArea
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
										label: "أعلى مساحة",
										value: maxArea,
										onChange: setMaxArea
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
								label: "الترتيب",
								children: [
									["newest", "الأحدث"],
									["price_asc", "الأقل سعرًا"],
									["price_desc", "الأعلى سعرًا"],
									["area_desc", "الأكبر مساحة"]
								].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: sort === value,
									onClick: () => setSort(value),
									label
								}, value))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: [results?.length ?? 0, " نتيجة"]
						}), hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: clearFilters,
							className: "flex items-center gap-1 text-xs font-semibold text-terracotta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), " مسح كل الفلاتر"]
						})]
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCardSkeleton, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCardSkeleton, {})]
					}) : results?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: results.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
							property: p,
							isFavorite: favoriteIds.has(p.id),
							onToggleFavorite: toggleFavorite
						}, p.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: SearchX,
						title: "لا توجد نتائج",
						description: "وسّع نطاق البحث أو أزل بعض الفلاتر."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Group({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-1.5 text-xs font-semibold text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children
	})] });
}
function Pill({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", active ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
		children: label
	});
}
function NumberField({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			inputMode: "numeric",
			value,
			onChange: (e) => onChange(e.target.value),
			className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchPage, {})
});
//#endregion
export { SplitComponent as component };
