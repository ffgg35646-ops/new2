import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as Lock, ct as Check, l as Sparkles } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { r as ProLockDialog } from "./ProLock-DPJbMXDq.mjs";
import { a as usePackages, r as useMyPlan } from "./plans-CricE-8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plans-B0t-ZIsc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PlansPage() {
	const { isOffice } = useAuth();
	const { data: catalog = [], isLoading } = usePackages(true);
	const { package: currentPackage, isPaid } = useMyPlan();
	const [locked, setLocked] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-2xl space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "الباقات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "الباقات المتاحة للمكاتب العقارية."
					})] }),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-3xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
						children: "جارٍ تحميل الباقات..."
					}) : catalog.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: catalog.map((pkg) => {
							const current = currentPackage?.id === pkg.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "rounded-3xl bg-surface p-4 ring-1 ring-line " + (current ? "ring-2 ring-forest" : ""),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-forest" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-display text-base font-extrabold",
												children: pkg.name
											}),
											current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms-auto rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest",
												children: "باقتك الحالية"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 font-display text-xl font-extrabold text-forest",
										children: pkg.price === 0 ? "مجانًا" : `${pkg.price.toLocaleString("ar-SA")} ريال`
									}),
									pkg.duration_days > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-0.5 text-[11px] text-muted-foreground",
										children: [
											"مدة الاشتراك: ",
											pkg.duration_days,
											" يوم"
										]
									}),
									pkg.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs leading-relaxed text-muted-foreground",
										children: pkg.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 text-[11px] text-muted-foreground",
										children: [
											"العقارات:",
											" ",
											pkg.property_limit == null ? "غير محدودة" : pkg.property_limit,
											" · ",
											"المميزة: ",
											pkg.featured_limit,
											" · ",
											"الدردشة: ",
											pkg.chat_enabled ? "مفعلة" : "غير متاحة",
											" · ",
											"التوثيق: ",
											pkg.verification_included ? "مشمول" : "غير مشمول"
										]
									}),
									pkg.features.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-3 space-y-1.5",
										children: pkg.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2 text-[12px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-3.5 shrink-0 text-forest" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f })]
										}, f))
									}),
									isOffice && !current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: pkg.price > 0 ? "/office/pay" : "/office/subscription",
										search: pkg.price > 0 ? { package: pkg.id } : void 0,
										className: "mt-4 block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background",
										children: pkg.price > 0 ? "الاشتراك في الباقة" : "اختيار الباقة"
									}),
									!isOffice && pkg.price > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setLocked(true),
										className: "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sand py-3 text-xs font-bold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5" }), "باقة مخصصة للمكاتب"]
									})
								]
							}, pkg.id);
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-2xl bg-sand p-4 text-center text-sm text-muted-foreground",
						children: "لا توجد باقات متاحة حاليًا."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProLockDialog, {
						open: locked,
						onClose: () => setLocked(false)
					}),
					isPaid && currentPackage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-2xl bg-sand p-3 text-[11px] text-muted-foreground",
						children: ["باقتك الحالية: ", currentPackage.name]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: [
		"individual",
		"office",
		"admin"
	],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlansPage, {})
});
//#endregion
export { SplitComponent as component };
