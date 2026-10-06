import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as KeyRound, H as House, _t as Building2, dt as ChevronLeft } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { a as LISTING_TYPES, s as QUICK_KINDS } from "./constants-Bvy1nlDs.mjs";
import { a as usePropertyList, i as useFavorites, n as PropertyCard, r as PropertyCardSkeleton } from "./properties-B1QAcK-Q.mjs";
import { t as OfficeCard } from "./OfficeCard-CHyJVpjQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-XPG6l3tn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GovernorateBanner({ governorate }) {
	if (!governorate?.banner_url) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		"aria-label": "إعلان ترحيبي",
		className: "overflow-hidden rounded-3xl bg-surface ring-1 ring-line",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: governorate.banner_url,
			alt: `عقار البطين — العقار في ${governorate.name_ar}`,
			loading: "eager",
			decoding: "async",
			className: "block h-auto w-full object-contain"
		}, governorate.banner_url)
	});
}
function HomePage() {
	const { governorateId, governorate } = useSelectedGovernorate();
	const [kind, setKind] = (0, import_react.useState)(null);
	const [listing, setListing] = (0, import_react.useState)(null);
	const { favoriteIds, toggleFavorite } = useFavorites();
	const { data: properties, isLoading } = usePropertyList({
		governorateId,
		kind,
		listing
	});
	const { data: offices } = useQuery({
		queryKey: ["home-offices", governorateId],
		enabled: !!governorateId,
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,name,logo_url,verification_status,updated_at,plan,plan_expires_at,rating_avg,properties(count)").eq("governorate_id", governorateId).eq("verification_status", "verified").order("updated_at", { ascending: false }).limit(4);
			if (error) throw error;
			return (data ?? []).map((o) => ({
				...o,
				properties_count: Array.isArray(o.properties) && o.properties.length > 0 ? Number(o.properties[0].count ?? 0) : 0
			}));
		}
	});
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["home-stats", governorateId],
		enabled: !!governorateId,
		staleTime: 6e4,
		queryFn: async () => {
			const [officesRes, saleRes, rentRes] = await Promise.all([
				supabase.from("offices").select("id", {
					count: "exact",
					head: true
				}).eq("governorate_id", governorateId).eq("verification_status", "verified").eq("is_deleted", false),
				supabase.from("properties").select("id", {
					count: "exact",
					head: true
				}).eq("governorate_id", governorateId).eq("listing", "sale").eq("is_published", true).eq("is_deleted", false),
				supabase.from("properties").select("id", {
					count: "exact",
					head: true
				}).eq("governorate_id", governorateId).eq("listing", "rent").eq("is_published", true).eq("is_deleted", false)
			]);
			if (officesRes.error) throw officesRes.error;
			if (saleRes.error) throw saleRes.error;
			if (rentRes.error) throw rentRes.error;
			return {
				offices: officesRes.count ?? 0,
				sale: saleRes.count ?? 0,
				rent: rentRes.count ?? 0
			};
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-6 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GovernorateBanner, { governorate }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-3 gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
								icon: Building2,
								label: "مكاتب",
								value: statsLoading ? "—" : String(stats?.offices ?? 0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
								icon: House,
								label: "عقارات بيع",
								value: statsLoading ? "—" : String(stats?.sale ?? 0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
								icon: KeyRound,
								label: "عقارات إيجار",
								value: statsLoading ? "—" : String(stats?.rent ?? 0)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: !kind,
							onClick: () => setKind(null),
							label: "الكل"
						}), QUICK_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: kind === k.value,
							onClick: () => setKind(k.value),
							label: k.plural
						}, k.value))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: !listing,
							onClick: () => setListing(null),
							label: "الكل",
							small: true
						}), LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: listing === l.value,
							onClick: () => setListing(l.value),
							label: l.label,
							small: true
						}, l.value))]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "font-display text-lg font-extrabold",
								children: ["عقارات ", governorate?.name_ar ?? ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/search",
								className: "text-xs text-terracotta",
								children: "بحث متقدم"
							})]
						}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCardSkeleton, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCardSkeleton, {})]
						}) : properties?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: properties.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
								property: p,
								isFavorite: favoriteIds.has(p.id),
								onToggleFavorite: toggleFavorite
							}, p.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							icon: House,
							title: "لا توجد عقارات مطابقة",
							description: "جرّب تغيير نوع العقار أو المحافظة، أو انشر طلبك ليصلك عرض من المكاتب.",
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/request",
								className: "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background",
								children: "اطلب عقارًا"
							})
						})]
					}),
					!!offices?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-extrabold",
								children: "مكاتب موثقة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/offices",
								className: "flex items-center text-xs text-terracotta",
								children: ["عرض الكل ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-3.5" })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: offices.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeCard, { office: o }, o.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function StatCard({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface px-2.5 py-3 text-center ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid size-8 place-items-center rounded-xl bg-forest-soft text-forest",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 font-display text-base font-extrabold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] text-muted-foreground",
				children: label
			})
		]
	});
}
function Chip({ label, active, onClick, small }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("shrink-0 rounded-full px-4 font-semibold transition", small ? "py-1.5 text-xs" : "py-2 text-sm", active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line"),
		children: label
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomePage, {})
});
//#endregion
export { SplitComponent as component };
