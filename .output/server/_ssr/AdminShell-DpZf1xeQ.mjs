import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link, p as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, L as LayoutDashboard, dt as Building2, h as Search, n as Users, ot as ChevronLeft, t as X } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AdminShell-DpZf1xeQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function sortNewest(rows) {
	return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
async function fetchAdminDirectory() {
	const [rolesRes, profilesRes, officesRes] = await Promise.all([
		supabase.from("user_roles").select("user_id,role,created_at").in("role", ["individual", "office"]),
		supabase.from("profiles").select("id,full_name,phone,email,governorate_id,created_at,governorates(name_ar)").order("created_at", { ascending: false }),
		supabase.from("offices").select("id,owner_id,name,manager_name,phone,email,address,commercial_register,license_number,fal_license_number,governorate_id,verification_status,rejection_reason,plan,plan_expires_at,created_at,updated_at,is_deleted,governorates(name_ar)").eq("is_deleted", false).order("created_at", { ascending: false })
	]);
	if (rolesRes.error) throw rolesRes.error;
	if (profilesRes.error) throw profilesRes.error;
	if (officesRes.error) throw officesRes.error;
	const individualIds = new Set((rolesRes.data ?? []).filter((r) => r.role === "individual").map((r) => r.user_id));
	const profiles = profilesRes.data ?? [];
	const offices = officesRes.data ?? [];
	return {
		individuals: sortNewest(profiles.filter((p) => individualIds.has(p.id)).map((p) => ({
			id: p.id,
			full_name: p.full_name,
			phone: p.phone,
			email: p.email,
			governorate_id: p.governorate_id,
			governorate_name: p.governorates?.name_ar ?? null,
			created_at: p.created_at
		}))),
		offices: sortNewest(offices.map((o) => ({
			id: o.id,
			owner_id: o.owner_id,
			name: o.name,
			manager_name: o.manager_name,
			phone: o.phone,
			email: o.email,
			address: o.address,
			commercial_register: o.commercial_register,
			license_number: o.license_number,
			fal_license_number: o.fal_license_number,
			governorate_id: o.governorate_id,
			governorate_name: o.governorates?.name_ar ?? null,
			verification_status: o.verification_status,
			rejection_reason: o.rejection_reason,
			plan: o.plan,
			plan_expires_at: o.plan_expires_at,
			created_at: o.created_at,
			updated_at: o.updated_at,
			is_deleted: o.is_deleted
		})))
	};
}
function useAdminDirectory() {
	return useQuery({
		queryKey: ["admin-directory"],
		queryFn: fetchAdminDirectory,
		staleTime: 6e4,
		gcTime: 18e5,
		refetchInterval: 6e4,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		retry: 2
	});
}
async function fetchIndividualActivity(userId) {
	const [viewsRes, favoritesRes, requestsRes, bookingsRes, reviewsRes] = await Promise.all([
		supabase.from("property_views").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("favorites").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("property_requests").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("viewing_bookings").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("office_reviews").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId)
	]);
	if (viewsRes.error) throw viewsRes.error;
	if (favoritesRes.error) throw favoritesRes.error;
	if (requestsRes.error) throw requestsRes.error;
	if (bookingsRes.error) throw bookingsRes.error;
	if (reviewsRes.error) throw reviewsRes.error;
	return {
		propertyViews: viewsRes.count ?? 0,
		favorites: favoritesRes.count ?? 0,
		propertyRequests: requestsRes.count ?? 0,
		bookings: bookingsRes.count ?? 0,
		officeReviews: reviewsRes.count ?? 0
	};
}
function useIndividualActivity(userId, enabled = true) {
	return useQuery({
		queryKey: ["admin-individual-activity", userId],
		queryFn: () => fetchIndividualActivity(userId),
		enabled,
		staleTime: 6e4,
		gcTime: 6e5,
		refetchOnWindowFocus: false
	});
}
async function fetchOfficeActivity(officeId) {
	const [propertiesRes, inquiriesRes, bookingsRes, reviewsRes, staffRes] = await Promise.all([
		supabase.from("properties").select("id,is_published,views_count").eq("office_id", officeId).eq("is_deleted", false),
		supabase.from("property_inquiries").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("viewing_bookings").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("office_reviews").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("office_staff").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId).eq("is_active", true)
	]);
	if (propertiesRes.error) throw propertiesRes.error;
	if (inquiriesRes.error) throw inquiriesRes.error;
	if (bookingsRes.error) throw bookingsRes.error;
	if (reviewsRes.error) throw reviewsRes.error;
	if (staffRes.error) throw staffRes.error;
	const props = propertiesRes.data ?? [];
	return {
		properties: props.length,
		publishedProperties: props.filter((p) => p.is_published).length,
		views: props.reduce((sum, p) => sum + (p.views_count ?? 0), 0),
		inquiries: inquiriesRes.count ?? 0,
		bookings: bookingsRes.count ?? 0,
		reviews: reviewsRes.count ?? 0,
		staff: staffRes.count ?? 0
	};
}
function useOfficeActivity(officeId, enabled = true) {
	return useQuery({
		queryKey: ["admin-office-activity", officeId],
		queryFn: () => fetchOfficeActivity(officeId),
		enabled,
		staleTime: 6e4,
		gcTime: 6e5,
		refetchOnWindowFocus: false
	});
}
function isTodaySaudi(date) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Riyadh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
	return formatter.format(new Date(date)) === formatter.format(/* @__PURE__ */ new Date());
}
function normalizeSearch(value) {
	return value.trim().toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي");
}
function AdminShell({ children }) {
	const location = useLocation();
	const [search, setSearch] = (0, import_react.useState)("");
	const { data, isLoading } = useAdminDirectory();
	const normalized = normalizeSearch(search);
	const results = (0, import_react.useMemo)(() => {
		if (!normalized || !data) return [];
		const individuals = data.individuals.filter((u) => {
			return [
				u.full_name,
				u.email ?? "",
				u.phone ?? ""
			].map(normalizeSearch).some((value) => value.startsWith(normalized));
		}).slice(0, 8).map((u) => ({
			type: "individual",
			id: u.id,
			title: u.full_name,
			subtitle: u.email || u.phone || "بدون وسيلة تواصل",
			to: "/admin/individuals/$userId"
		}));
		const offices = data.offices.filter((o) => {
			return [
				o.name,
				o.manager_name ?? "",
				o.email ?? "",
				o.phone ?? "",
				o.commercial_register ?? ""
			].map(normalizeSearch).some((value) => value.startsWith(normalized));
		}).slice(0, 8).map((o) => ({
			type: "office",
			id: o.id,
			title: o.name,
			subtitle: o.manager_name || o.email || o.phone || "مكتب عقاري",
			to: "/admin/offices/$officeId"
		}));
		return [...individuals, ...offices].slice(0, 12);
	}, [data, normalized]);
	const active = (prefix) => location.pathname === prefix || location.pathname.startsWith(prefix + "/");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto min-h-screen w-full max-w-md bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 border-b border-line bg-background/95 px-4 py-3 backdrop-blur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-display text-lg font-extrabold",
						children: "إدارة عقار البطين"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground",
						children: "لوحة الإدارة"
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-3 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "ابحث عن فرد أو مكتب...",
								className: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
							}),
							search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSearch(""),
								className: "grid size-6 place-items-center rounded-full bg-sand",
								"aria-label": "مسح البحث",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					}), !!search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-line",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 p-4 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "جاري تحميل النتائج..."]
						}) : results.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-96 overflow-y-auto p-1.5",
							children: results.map((result) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: result.to,
								params: result.type === "individual" ? { userId: result.id } : { officeId: result.id },
								onClick: () => setSearch(""),
								className: "flex items-center gap-3 rounded-xl p-3 transition hover:bg-sand",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("grid size-9 shrink-0 place-items-center rounded-xl", result.type === "individual" ? "bg-forest-soft text-forest" : "bg-terracotta-soft text-terracotta"),
										children: result.type === "individual" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-sm font-bold",
											children: result.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-[11px] text-muted-foreground",
											children: result.subtitle
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4 text-muted-foreground" })
								]
							}, `${result.type}-${result.id}`))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4 text-center text-xs text-muted-foreground",
							children: "لا توجد نتائج مطابقة."
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "mt-3 flex gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNav, {
							to: "/admin",
							icon: LayoutDashboard,
							label: "الرئيسية",
							active: location.pathname === "/admin"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNav, {
							to: "/admin/individuals",
							icon: Users,
							label: "الأفراد",
							active: active("/admin/individuals")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNav, {
							to: "/admin/offices",
							icon: Building2,
							label: "المكاتب",
							active: active("/admin/offices")
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "px-4 py-4",
			children
		})]
	});
}
function AdminNav({ to, icon: Icon, label, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition", active ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
	});
}
//#endregion
export { useAdminDirectory as a, isTodaySaudi as i, fetchIndividualActivity as n, useIndividualActivity as o, fetchOfficeActivity as r, useOfficeActivity as s, AdminShell as t };
