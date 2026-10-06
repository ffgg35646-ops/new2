import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, rt as CircleCheck, tt as CircleX } from "../_libs/lucide-react.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as Route } from "./office.payresult-C2jpJVGq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.payresult-BG6NLe4p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResultPage() {
	const { id, resourcePath } = Route.useSearch();
	const qc = useQueryClient();
	const [state, setState] = (0, import_react.useState)("checking");
	const [message, setMessage] = (0, import_react.useState)("");
	const done = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (done.current) return;
		done.current = true;
		const checkoutId = id || resourcePath?.split("/")[3]?.split("?")[0];
		if (!checkoutId) {
			setState("failed");
			setMessage("لم نستلم بيانات العملية");
			return;
		}
		const url = `${{
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_fwVdtjR8yHCVJuCuSj5eIw_DCWTQON-",
			"VITE_SUPABASE_URL": "https://locnmaskgbpvlmslprns.supabase.co"
		}["VITE_SUPABASE_URL"]}/functions/v1/payment-status`;
		const apikey = {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_fwVdtjR8yHCVJuCuSj5eIw_DCWTQON-",
			"VITE_SUPABASE_URL": "https://locnmaskgbpvlmslprns.supabase.co"
		}["VITE_SUPABASE_PUBLISHABLE_KEY"];
		async function checkOnce(timeoutMs) {
			const ctrl = new AbortController();
			const t = setTimeout(() => ctrl.abort(), timeoutMs);
			try {
				return await (await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey
					},
					body: JSON.stringify({ checkoutId }),
					signal: ctrl.signal
				})).json();
			} finally {
				clearTimeout(t);
			}
		}
		(async () => {
			for (let attempt = 1; attempt <= 3; attempt++) try {
				const data = await checkOnce(12e3);
				if (data?.success) {
					setState("success");
					setMessage("تم استلام دفعتك وتفعيل الباقة الاحترافية 🎉");
					qc.invalidateQueries();
				} else {
					setState("failed");
					setMessage(data?.description || "لم تكتمل عملية الدفع");
				}
				return;
			} catch {
				if (attempt === 3) {
					setState("failed");
					setMessage("تعذّر تأكيد النتيجة الآن. إذا خُصم المبلغ فسيُفعّل اشتراكك — راجع صفحة «الباقة والاشتراك».");
				}
			}
		})();
	}, [
		id,
		resourcePath,
		qc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-md place-items-center px-4 py-16 text-center",
			children: [
				state === "checking" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-forest" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "جارٍ التحقق من الدفع…"
				})] }),
				state === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-16 text-forest" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-xl font-extrabold",
						children: "تم الدفع بنجاح"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/office/subscription",
						className: "mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
						children: "عرض باقتي"
					})
				] }),
				state === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-16 text-terracotta" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-xl font-extrabold",
						children: "لم يكتمل الدفع"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/office/pay",
						className: "mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
						children: "إعادة المحاولة"
					})
				] })
			]
		})]
	});
}
//#endregion
export { ResultPage as component };
