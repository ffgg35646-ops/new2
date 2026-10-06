import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _t as Building2, f as ShieldCheck, l as Sparkles, r as User } from "../_libs/lucide-react.mjs";
import { t as BrandLogo } from "./BrandLogo-C2Qe8Agl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BHlkRjBP.js
var import_jsx_runtime = require_jsx_runtime();
function Welcome() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { size: 64 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-display text-2xl font-extrabold",
						children: "عقار البطين"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "وجهتك الأولى للعقار"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-8 font-display text-3xl leading-tight font-extrabold",
				children: [
					"ابدأ رحلتك العقارية",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-terracotta",
						children: "من محافظتك"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: "منصة محلية تجمع عروض المكاتب العقارية في المزاحمية وضرما، مع طلبات مباشرة وحجز معاينة وتقييمات موثوقة."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
					icon: ShieldCheck,
					text: "مكاتب عقارية موثقة ومراجعة من الإدارة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
					icon: Sparkles,
					text: "اطلب عقارك ودع المكاتب تعرض عليك"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto space-y-3 pt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/auth/individual",
						className: "flex items-center justify-center gap-2 rounded-2xl bg-forest py-4 font-display font-bold text-background",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-5" }), "دخول كفرد"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/auth/office",
						className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-4 font-display font-bold ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5 text-terracotta" }), "دخول كمكتب عقاري"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/home",
						className: "block py-2 text-center text-sm text-muted-foreground underline underline-offset-4",
						children: "تصفح بدون تسجيل"
					})
				]
			})
		]
	});
}
function Feature({ icon: Icon, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-9 place-items-center rounded-xl bg-forest-soft text-forest",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[18px]" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm",
			children: text
		})]
	});
}
//#endregion
export { Welcome as component };
