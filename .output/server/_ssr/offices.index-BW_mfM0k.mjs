import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { dt as Building2 } from "../_libs/lucide-react.mjs";
import { r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { t as effectivePlan } from "./plans-CricE-8e.mjs";
import { t as OfficeCard } from "./OfficeCard-CHyJVpjQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offices.index-BW_mfM0k.js
var import_jsx_runtime = require_jsx_runtime();
function OfficesPage() {
	const { governorateId } = useSelectedGovernorate();
	const { data, isLoading } = useQuery({
		queryKey: ["offices", governorateId],
		enabled: !!governorateId,
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,name,logo_url,verification_status,updated_at,plan,plan_expires_at,rating_avg,properties(count)").eq("governorate_id", governorateId).eq("is_deleted", false).eq("verification_status", "verified").order("updated_at", { ascending: false });
			if (error) throw error;
			return (data ?? []).map((o) => ({
				...o,
				properties_count: Array.isArray(o.properties) && o.properties.length > 0 ? Number(o.properties[0].count ?? 0) : 0
			})).sort((a, b) => (effectivePlan(b) === "pro" ? 1 : 0) - (effectivePlan(a) === "pro" ? 1 : 0));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "المكاتب العقارية"
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2.5",
					children: data.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeCard, { office: o }, o.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Building2,
					title: "لا توجد مكاتب في هذه المحافظة",
					description: "جرّب تغيير المحافظة من الأعلى."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { OfficesPage as component };
