import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as LoaderCircle, f as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { a as usePackages } from "./plans-CricE-8e.mjs";
import { t as Route } from "./office.pay-DKCjVXxA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.pay-DHR5pUWN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PayPage() {
	const { package: packageId } = Route.useSearch();
	const { data: packages = [] } = usePackages(true);
	const selected = packages.find((pkg) => pkg.id === packageId) ?? packages.find((pkg) => pkg.code === "pro") ?? null;
	const [error, setError] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const started = (0, import_react.useRef)(false);
	useQuery({
		queryKey: ["pay-package", selected?.id],
		enabled: !!selected,
		queryFn: async () => selected
	});
	(0, import_react.useEffect)(() => {
		if (started.current || !selected) return;
		started.current = true;
		(async () => {
			try {
				const { data: sess } = await supabase.auth.getSession();
				const accessToken = sess.session?.access_token;
				if (!accessToken) throw new Error("سجّل الدخول أولًا");
				const fnUrl = `${{
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
				}["VITE_SUPABASE_URL"]}/functions/v1/payment-checkout`;
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
				const ctrl = new AbortController();
				const to = setTimeout(() => ctrl.abort(), 15e3);
				let data;
				try {
					data = await (await fetch(fnUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							apikey,
							Authorization: `Bearer ${accessToken}`
						},
						body: JSON.stringify({ packageId: selected.id }),
						signal: ctrl.signal
					})).json();
				} finally {
					clearTimeout(to);
				}
				if (!data?.checkoutId) throw new Error(data?.error || "تعذّر بدء عملية الدفع");
				const base = data.baseUrl;
				const resultUrl = `${window.location.origin}/office/payresult`;
				window.wpwlOptions = {
					locale: "ar",
					paymentTarget: "_top",
					requireCvv: true,
					style: "card"
				};
				const form = document.getElementById("hp-form");
				if (form) form.setAttribute("action", resultUrl);
				const script = document.createElement("script");
				script.src = `${base}/v1/paymentWidgets.js?checkoutId=${data.checkoutId}`;
				if (data.integrity) {
					script.integrity = data.integrity;
					script.crossOrigin = "anonymous";
				}
				script.async = true;
				script.onload = () => setReady(true);
				script.onerror = () => setError("تعذّر تحميل نموذج الدفع، حاول مجددًا");
				document.body.appendChild(script);
			} catch (e) {
				setError(e instanceof Error ? e.message : "تعذّر بدء الدفع");
			}
		})();
	}, [selected]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-md space-y-4 px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "الدفع الآمن"
				}),
				selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display font-bold",
								children: selected.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-lg font-extrabold text-forest",
								children: [selected.price.toLocaleString("ar-SA"), " ريال"]
							})]
						}),
						selected.duration_days > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: [
								"مدة الاشتراك: ",
								selected.duration_days,
								" يوم"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex items-center gap-1 text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-forest" }), "دفع مشفّر عبر HyperPay — مدى، فيزا، ماستركارد"]
						})
					]
				}),
				!selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-destructive/10 p-4 text-sm text-destructive",
					children: "الباقة غير موجودة أو غير متاحة حاليًا."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-destructive/10 p-4 text-sm text-destructive",
					children: error
				}) : !ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid place-items-center py-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-forest" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-2 text-xs text-muted-foreground",
						children: "جارٍ تجهيز نموذج الدفع…"
					})]
				}) : null,
				ready && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground",
					children: "اكتب اسم حامل البطاقة بالحروف الإنجليزية كما هو مطبوع على البطاقة."
				}),
				selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					id: "hp-form",
					className: "paymentWidgets rounded-3xl bg-surface p-2 ring-1 ring-line",
					"data-brands": "MADA VISA MASTER"
				})
			]
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayPage, {})
});
//#endregion
export { SplitComponent as component };
