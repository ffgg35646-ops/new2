import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth, t as signOut } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as LogOut, _t as Building2, ct as CircleCheck, ot as CircleX, rt as Clock3, y as RefreshCw } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.status-9fxoFEFh.js
var import_jsx_runtime = require_jsx_runtime();
function OfficeStatusPage() {
	const qc = useQueryClient();
	const { session, isOffice, officeVerificationStatus, officeRejectionReason, isLoading, isFetching } = useAuth();
	async function refresh() {
		await qc.invalidateQueries({ queryKey: ["session"] });
	}
	async function logout() {
		await signOut();
		await qc.invalidateQueries({ queryKey: ["session"] });
	}
	if (isLoading || isFetching) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-6 animate-spin text-forest" })
	});
	if (!session || !isOffice) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-12 text-forest" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-2xl font-extrabold",
				children: "حساب مكتب عقاري"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "سجّل دخولك بحساب المكتب لمتابعة حالة الطلب."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth/office",
				className: "mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
				children: "تسجيل دخول المكتب"
			})
		]
	});
	if (officeVerificationStatus === "verified") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-14 text-forest" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-5 font-display text-2xl font-extrabold",
				children: "تم اعتماد حساب المكتب"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: "حساب المكتب موثق الآن ويمكنك استخدام لوحة المكتب وإدارة العقارات والطلبات."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/office",
				className: "mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
				children: "دخول لوحة المكتب"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void logout(),
				className: "mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "تسجيل الخروج"]
			})
		]
	});
	if (officeVerificationStatus === "rejected") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-14 text-destructive" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-5 font-display text-2xl font-extrabold",
				children: "تم رفض طلب المكتب"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: "لا يمكنك استخدام حساب المكتب حاليًا."
			}),
			officeRejectionReason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 w-full rounded-2xl bg-destructive/5 p-4 text-right ring-1 ring-destructive/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs font-bold text-destructive",
					children: "سبب الرفض"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-sm leading-relaxed",
					children: officeRejectionReason
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void refresh(),
				className: "mt-6 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "تحديث الحالة"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void logout(),
				className: "mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "تسجيل الخروج"]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-14 text-terracotta" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-5 font-display text-2xl font-extrabold",
				children: "طلبك قيد المراجعة"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: "تم استلام بيانات المكتب وتأكيد بريدك الإلكتروني. الإدارة ستراجع بيانات المكتب ثم توافق أو ترفض الطلب."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 w-full rounded-2xl bg-sand p-4 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-bold",
					children: "لا يمكنك استخدام لوحة المكتب الآن"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-xs leading-relaxed text-muted-foreground",
					children: "بعد اعتماد الحساب ستتمكن من الدخول وإدارة العقارات والطلبات من لوحة المكتب."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void refresh(),
				className: "mt-6 flex items-center gap-2 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "تحديث حالة الطلب"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void logout(),
				className: "mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "تسجيل الخروج"]
			})
		]
	});
}
//#endregion
export { OfficeStatusPage as component };
