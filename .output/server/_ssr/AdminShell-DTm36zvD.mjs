import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link, p as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as LoaderCircle, _t as Building2, dt as ChevronLeft, h as Search, n as Users, t as X, z as LayoutDashboard } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as useAdminDirectory } from "./admin-BJPhbrtH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AdminShell-DTm36zvD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
export { AdminShell as t };
