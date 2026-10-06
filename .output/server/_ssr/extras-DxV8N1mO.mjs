import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as ClipboardList, E as MessageSquare, J as Crown, V as Heart, dt as Building2, ft as Bell, l as Sparkles, ot as ChevronLeft, y as QrCode } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as PRO_LOCK_MESSAGE, r as ProLockDialog, t as CHAT_LOCK_MESSAGE } from "./ProLock-DPJbMXDq.mjs";
import { r as useMyPlan } from "./plans-CricE-8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/extras-DxV8N1mO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ExtrasPage() {
	const { isPro } = useMyPlan();
	const [lock, setLock] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-5 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "الإضافات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "خدمات ومميزات إضافية مرتبطة بحسابك وعقاراتك."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "px-1 font-display text-sm font-extrabold",
								children: "متاحة لك"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/chats",
								icon: MessageSquare,
								label: "محادثاتي مع المكاتب"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/offices/following",
								icon: Bell,
								label: "إشعارات المكاتب التي أتابعها"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/properties",
								icon: Building2,
								label: "جميع العقارات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/favorites",
								icon: Heart,
								label: "المفضلة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/request",
								icon: ClipboardList,
								label: "طلباتي العقارية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								to: "/plans",
								icon: Sparkles,
								label: "الباقات"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "px-1 font-display text-sm font-extrabold",
								children: ["مميزات الباقة الاحترافية ", !isPro && "🔒"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockRow, {
								icon: MessageSquare,
								label: "الدردشة المباشرة مع العملاء",
								to: "/office/chat",
								locked: !isPro,
								onLocked: () => setLock(CHAT_LOCK_MESSAGE)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockRow, {
								icon: QrCode,
								label: "QR Code للمكتب والعقارات",
								to: "/office/profile",
								locked: !isPro,
								onLocked: () => setLock(PRO_LOCK_MESSAGE)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockRow, {
								icon: Crown,
								label: "لوحة إحصائيات متقدمة",
								to: "/office",
								locked: !isPro,
								onLocked: () => setLock(PRO_LOCK_MESSAGE)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProLockDialog, {
						open: lock !== null,
						onClose: () => setLock(null),
						message: lock ?? "هذه الميزة متاحة ضمن باقة تتضمنها. اختر الباقة المناسبة للاستفادة منها."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Row({ to, icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[18px] text-terracotta" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "ms-auto size-4 text-muted-foreground" })
		]
	});
}
function LockRow({ to, icon: Icon, label, locked, onLocked }) {
	if (!locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
		to,
		icon: Icon,
		label
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: onLocked,
		className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[18px] text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ms-auto text-sm",
				children: "🔒"
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: [
		"individual",
		"office",
		"admin"
	],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtrasPage, {})
});
//#endregion
export { SplitComponent as component };
