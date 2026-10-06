import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as Heart } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { i as useFavorites, n as PropertyCard, r as PropertyCardSkeleton, t as PROPERTY_SELECT } from "./properties-B1QAcK-Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/favorites-DPwZhmJD.js
var import_jsx_runtime = require_jsx_runtime();
function FavoritesPage() {
	const { userId } = useAuth();
	const { favoriteIds, toggleFavorite } = useFavorites();
	const { data, isLoading } = useQuery({
		queryKey: ["favorites", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("favorites").select(`property_id, properties(${PROPERTY_SELECT})`).order("created_at", { ascending: false });
			if (error) throw error;
			return (data ?? []).map((r) => r.properties).filter(Boolean);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "المفضلة"
				}), !userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Heart,
					title: "سجّل الدخول لحفظ عقاراتك",
					description: "ستتمكن من حفظ العقارات ومتابعة تغير أسعارها.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth/individual",
						className: "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "تسجيل الدخول"
					})
				}) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCardSkeleton, {}) : data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: data.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
						property: p,
						isFavorite: favoriteIds.has(p.id),
						onToggleFavorite: toggleFavorite
					}, p.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Heart,
					title: "لا توجد عقارات محفوظة",
					description: "اضغط على القلب في أي عرض لحفظه هنا."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoritesPage, {})
});
//#endregion
export { SplitComponent as component };
