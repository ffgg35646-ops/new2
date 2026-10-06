import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as Crown, c as Star, f as ShieldCheck } from "../_libs/lucide-react.mjs";
import { i as timeAgo } from "./format-B7MVuK_u.mjs";
import { t as effectivePlan } from "./plans-CricE-8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/OfficeCard-CHyJVpjQ.js
var import_jsx_runtime = require_jsx_runtime();
function OfficeCard({ office }) {
	const isPro = effectivePlan(office) === "pro";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line animate-rise-in",
		children: [
			office.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: office.logo_url,
				alt: office.name,
				className: "size-11 rounded-xl object-cover",
				loading: "lazy"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid size-11 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest",
				children: office.name.trim().charAt(0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate font-display text-sm font-bold",
							children: office.name
						}),
						office.verification_status === "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 shrink-0 text-forest" }),
						isPro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex shrink-0 items-center gap-1 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-3" }), " احترافي"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-0.5 flex items-center gap-1 text-xs text-muted-foreground",
					children: [
						(office.rating_avg ?? office.rating) != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-terracotta text-terracotta" }),
							Number(office.rating_avg ?? office.rating ?? 0).toFixed(1),
							" ·",
							" "
						] }) : null,
						office.properties_count ?? 0,
						" عقارًا · ",
						timeAgo(office.updated_at)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/offices/$officeId",
				params: { officeId: office.id },
				className: "ms-auto shrink-0 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-background",
				children: "دخول المكتب"
			})
		]
	});
}
//#endregion
export { OfficeCard as t };
