import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, dt as Building2, nt as CirclePlus } from "../_libs/lucide-react.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { n as useMyOffice } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { a as LISTING_TYPES, o as PROPERTY_KINDS } from "./constants-Bvy1nlDs.mjs";
import { a as usePropertyList, i as useFavorites, n as PropertyCard } from "./properties-B1QAcK-Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties.index-BR8mtpXs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AllPropertiesPage() {
	const [filters, setFilters] = (0, import_react.useState)({ sort: "newest" });
	const { data: properties, isLoading } = usePropertyList(filters, 60);
	const { favoriteIds, toggleFavorite } = useFavorites();
	const { data: membership } = useMyOffice();
	const canAdd = !!membership?.office;
	function setKind(kind) {
		setFilters((f) => ({
			...f,
			kind: f.kind === kind ? null : kind
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl font-extrabold",
							children: "جميع العقارات"
						}), canAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/office/properties/new",
							className: "ms-auto flex items-center gap-1.5 rounded-full bg-terracotta px-3.5 py-2 text-xs font-bold text-background",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlus, { className: "size-4" }), " إضافة عقار"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 overflow-x-auto pb-1",
						children: [LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilters((f) => ({
								...f,
								listing: f.listing === l.value ? null : l.value
							})),
							className: "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 " + (filters.listing === l.value ? "bg-forest text-background ring-forest" : "bg-surface ring-line"),
							children: l.label
						}, l.value)), PROPERTY_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setKind(k.value),
							className: "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 " + (filters.kind === k.value ? "bg-forest text-background ring-forest" : "bg-surface ring-line"),
							children: k.label
						}, k.value))]
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid place-items-center py-16",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
					}) : properties?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [properties.length, " عقار"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: properties.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
							property: p,
							isFavorite: favoriteIds.has(p.id),
							onToggleFavorite: toggleFavorite
						}, p.id))
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: Building2,
						title: "لا توجد عقارات مطابقة",
						description: "جرّب تغيير الفلاتر أو العودة لاحقًا."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { AllPropertiesPage as component };
