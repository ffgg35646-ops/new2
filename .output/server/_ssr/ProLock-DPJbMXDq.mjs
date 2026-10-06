import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as Crown, t as X } from "../_libs/lucide-react.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var PRO_LOCK_MESSAGE = "هذه الميزة متاحة ضمن باقة تتضمنها. اختر الباقة المناسبة للاستفادة منها.";
var CHAT_LOCK_MESSAGE = "الدردشة متاحة ضمن باقة تتضمن ميزة الدردشة. اختر الباقة المناسبة لبدء المحادثات مع العملاء.";
function ProLockDialog({ open, onClose, message = PRO_LOCK_MESSAGE, ctaLabel = "عرض الباقات والاشتراك" }) {
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "dialog",
		"aria-modal": "true",
		className: "fixed inset-0 z-50 grid place-items-end bg-foreground/40 p-0 sm:place-items-center sm:p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-t-3xl bg-surface p-5 ring-1 ring-line sm:rounded-3xl",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-terracotta-soft text-terracotta",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-1 text-sm leading-relaxed",
							children: message
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							"aria-label": "إغلاق",
							className: "ms-auto text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/office/subscription",
					onClick: onClose,
					className: "mt-5 block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background",
					children: ctaLabel
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "mt-2 w-full rounded-2xl bg-sand py-3 text-center text-xs font-semibold text-muted-foreground",
					children: "لاحقًا"
				})
			]
		})
	});
}
//#endregion
export { PRO_LOCK_MESSAGE as n, ProLockDialog as r, CHAT_LOCK_MESSAGE as t };
