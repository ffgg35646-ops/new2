import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { C as useRouter, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, p as useLocation, v as createFileRoute, x as useNavigate, y as createRootRouteWithContext } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$35 } from "./admin-D0iopKQ7.mjs";
import { t as Route$36 } from "./chats-BwhXhj08.mjs";
import { t as Route$37 } from "./office.pay-DKCjVXxA.mjs";
import { t as Route$38 } from "./office.payresult-BoTQj4aT.mjs";
import { t as Route$39 } from "./office.properties._propertyId.edit-97j5rmad.mjs";
import { t as Route$40 } from "./office.subscription-ByOodPJC.mjs";
import { t as Route$41 } from "./properties._propertyId-BBXCoXrJ.mjs";
import { t as experimental_createQueryPersister } from "../_libs/@tanstack/query-persist-client-core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router--T5pNQqw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var storage = typeof window !== "undefined" ? window.localStorage : void 0;
var appQueryPersister = experimental_createQueryPersister({
	storage,
	prefix: "aqar-batin-query-v1",
	maxAge: 864e5,
	refetchOnRestore: true
});
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var styles_default = "/assets/styles-iTn552eV.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
async function registerPush(userId) {
	let PushNotifications;
	try {
		({PushNotifications} = await import("../_libs/capacitor__push-notifications.mjs").then((n) => n.t));
	} catch {
		return;
	}
	if (!(typeof window.Capacitor?.isNativePlatform === "function" && window.Capacitor.isNativePlatform())) return;
	try {
		if ((await PushNotifications.requestPermissions()).receive !== "granted") return;
		await PushNotifications.register();
		PushNotifications.addListener("registration", (token) => {
			supabase.from("device_tokens").upsert({
				user_id: userId,
				token: token.value,
				platform: "android"
			}, { onConflict: "token" });
		});
		PushNotifications.addListener("registrationError", (err) => {
			console.warn("[push] registration error", err);
		});
	} catch (e) {
		console.warn("[push] setup failed", e);
	}
}
var COOKIE_NAME = "aqar_device_id";
function ensureDeviceCookie() {
	if (typeof document === "undefined") return "";
	const existing = document.cookie.split("; ").find((row) => row.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];
	if (existing) return existing;
	const value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
	return value;
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-7xl font-extrabold text-forest",
					children: "٤٠٤"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold",
					children: "الصفحة غير موجودة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "الصفحة التي تبحث عنها غير متاحة أو تم نقلها."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-2xl bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "العودة للرئيسية"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-bold",
					children: "تعذّر تحميل الصفحة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "حدث خطأ غير متوقع. جرّب التحديث أو العودة للرئيسية."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-2xl bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "إعادة المحاولة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "rounded-2xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold",
						children: "الرئيسية"
					})]
				})
			]
		})
	});
}
var Route$34 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "عقار البطين | عقارات المزاحمية وضرما" },
			{
				name: "description",
				content: "منصة عقارية لمحافظتي المزاحمية وضرما: عقارات، مكاتب موثقة، وطلبات عقارية."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/logo.jpg",
				type: "image/jpeg"
			},
			{
				rel: "apple-touch-icon",
				href: "/logo.jpg"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
var themeScript = `try{var t=localStorage.getItem('ofoq-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ar",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: themeScript } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function PushRegistrar() {
	const { userId } = useAuth();
	(0, import_react.useEffect)(() => {
		if (userId) registerPush(userId);
	}, [userId]);
	return null;
}
function OfficeApprovalGate({ children }) {
	const location = useLocation();
	const navigate = useNavigate();
	const { isOffice, officeVerificationStatus, isLoading, isFetching } = useAuth();
	const isOfficePage = location.pathname === "/office" || location.pathname.startsWith("/office/");
	const isStatusPage = location.pathname === "/office/status";
	const settled = !isLoading && !isFetching;
	(0, import_react.useEffect)(() => {
		if (settled && isOffice && isOfficePage && !isStatusPage && officeVerificationStatus !== "verified") navigate({
			to: "/office/status",
			replace: true
		});
	}, [
		settled,
		isOffice,
		isOfficePage,
		isStatusPage,
		officeVerificationStatus,
		navigate
	]);
	if (settled && isOffice && isOfficePage && !isStatusPage && officeVerificationStatus !== "verified") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm text-muted-foreground",
			children: "جارٍ فتح حالة حساب المكتب..."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function RootComponent() {
	const { queryClient } = Route$34.useRouteContext();
	(0, import_react.useEffect)(() => {
		ensureDeviceCookie();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PushRegistrar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeApprovalGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
				position: "top-center",
				dir: "rtl"
			})
		]
	});
}
var $$splitComponentImporter$33 = () => import("./routes-BHlkRjBP.mjs");
var Route$33 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "عقار البطين | عقارات المزاحمية وضرما" },
		{
			name: "description",
			content: "منصة عقارية محلية لعرض وطلب العقارات في المزاحمية وضرما — مكاتب موثقة، طلبات مباشرة، وحجز معاينة."
		},
		{
			property: "og:title",
			content: "عقار البطين | عقارات المزاحمية وضرما"
		},
		{
			property: "og:description",
			content: "ابحث عن أرضك أو بيتك في محافظتك، وتواصل مع مكاتب عقارية موثقة."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./account-Dk1Z_Nnw.mjs");
var Route$32 = createFileRoute("/account")({
	head: () => ({ meta: [
		{ title: "حسابي | عقار البطين" },
		{
			name: "description",
			content: "بياناتك، حجوزات المعاينة، والمكاتب التي تتابعها."
		},
		{
			property: "og:title",
			content: "حسابي | عقار البطين"
		},
		{
			property: "og:description",
			content: "إدارة حسابك وحجوزاتك في عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
var $$splitComponentImporter$31 = () => import("./extras-DxV8N1mO.mjs");
var Route$31 = createFileRoute("/extras")({
	head: () => ({ meta: [
		{ title: "الإضافات | عقار البطين" },
		{
			name: "description",
			content: "المميزات والخدمات الإضافية في عقار البطين: إشعارات المكاتب، المفضلة، الطلبات، الدردشة، والباقات."
		},
		{
			property: "og:title",
			content: "الإضافات | عقار البطين"
		},
		{
			property: "og:description",
			content: "كل الخدمات الإضافية المرتبطة بحسابك وعقاراتك في مكان واحد."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./favorites-DPwZhmJD.mjs");
var Route$30 = createFileRoute("/favorites")({
	head: () => ({ meta: [
		{ title: "المفضلة | عقار البطين" },
		{
			name: "description",
			content: "العقارات التي حفظتها للرجوع إليها لاحقًا."
		},
		{
			property: "og:title",
			content: "المفضلة | عقار البطين"
		},
		{
			property: "og:description",
			content: "احفظ العقارات وقارن بينها في أي وقت."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./home-XPG6l3tn.mjs");
var Route$29 = createFileRoute("/home")({
	head: () => ({ meta: [
		{ title: "أحدث العقارات | عقار البطين" },
		{
			name: "description",
			content: "تصفح أحدث الأراضي والفلل والشقق المعروضة من مكاتب عقارية في محافظتك."
		},
		{
			property: "og:title",
			content: "أحدث العقارات | عقار البطين"
		},
		{
			property: "og:description",
			content: "عروض محدثة يوميًا من المكاتب العقارية المحلية."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./notifications-DVu62K5f.mjs");
var Route$28 = createFileRoute("/notifications")({
	head: () => ({ meta: [
		{ title: "الإشعارات | عقار البطين" },
		{
			name: "description",
			content: "تنبيهات العروض الجديدة وحالة حجوزاتك وطلباتك."
		},
		{
			property: "og:title",
			content: "الإشعارات | عقار البطين"
		},
		{
			property: "og:description",
			content: "تابع كل جديد يخص عقاراتك وطلباتك."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./plans-B0t-ZIsc.mjs");
var Route$27 = createFileRoute("/plans")({
	head: () => ({ meta: [
		{ title: "الباقات | عقار البطين" },
		{
			name: "description",
			content: "الباقات المتاحة للمكاتب العقارية ومميزاتها وأسعارها."
		},
		{
			property: "og:title",
			content: "الباقات | عقار البطين"
		},
		{
			property: "og:description",
			content: "الباقات المتاحة للمكاتب العقارية."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./request-txD-ddnV.mjs");
var Route$26 = createFileRoute("/request")({
	head: () => ({ meta: [
		{ title: "اطلب عقارًا | عقار البطين" },
		{
			name: "description",
			content: "انشر طلبك العقاري ودع المكاتب الموثقة ترسل لك عروضًا مناسبة لميزانيتك."
		},
		{
			property: "og:title",
			content: "اطلب عقارًا | عقار البطين"
		},
		{
			property: "og:description",
			content: "اكتب مواصفات العقار المطلوب وتصلك العروض."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./search-BVPqhUfC.mjs");
var Route$25 = createFileRoute("/search")({
	head: () => ({ meta: [
		{ title: "البحث عن عقار | عقار البطين" },
		{
			name: "description",
			content: "ابحث بالحي والسعر والمساحة ونوع العقار داخل المزاحمية وضرما."
		},
		{
			property: "og:title",
			content: "البحث عن عقار | عقار البطين"
		},
		{
			property: "og:description",
			content: "فلاتر دقيقة للوصول للعقار المناسب بسرعة."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./admin.individuals-BKIi8NL-.mjs");
var Route$24 = createFileRoute("/admin/individuals")({
	head: () => ({ meta: [{ title: "الأفراد | إدارة عقار البطين" }, {
		name: "description",
		content: "إدارة حسابات الأفراد المسجلين في عقار البطين."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./admin.notifications-DNRN7xeg.mjs");
var Route$23 = createFileRoute("/admin/notifications")({
	head: () => ({ meta: [{ title: "إشعارات المستخدمين | لوحة الإدارة" }, {
		name: "description",
		content: "إرسال إشعارات جماعية أو لمستخدمين ومكاتب محددة."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./admin.offices-DI7MFUJy.mjs");
var Route$22 = createFileRoute("/admin/offices")({
	head: () => ({ meta: [{ title: "المكاتب | إدارة عقار البطين" }, {
		name: "description",
		content: "إدارة ومراجعة المكاتب العقارية المسجلة."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./admin.payments-BwipcYkl.mjs");
var Route$21 = createFileRoute("/admin/payments")({
	head: () => ({ meta: [{ title: "المدفوعات | إدارة عقار البطين" }, {
		name: "description",
		content: "إدارة إعدادات بوابة الدفع ومراجعة عمليات الدفع."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./admin_.login-DneITrwX.mjs");
var Route$20 = createFileRoute("/admin_/login")({
	head: () => ({ meta: [{ title: "دخول الإدارة | عقار البطين" }, {
		name: "description",
		content: "تسجيل الدخول إلى لوحة إدارة عقار البطين."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./auth.admin-BKXIOzNB.mjs");
var Route$19 = createFileRoute("/auth/admin")({
	head: () => ({ meta: [{ title: "دخول الإدارة | عقار البطين" }, {
		name: "description",
		content: "تسجيل دخول المشرف إلى لوحة إدارة عقار البطين."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./auth.confirm-BwVoFmpD.mjs");
var Route$18 = createFileRoute("/auth/confirm")({
	head: () => ({ meta: [{ title: "تفعيل حسابك | عقار البطين" }, {
		name: "description",
		content: "تأكيد بريدك الإلكتروني وتفعيل حسابك في عقار البطين."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./auth.forgot-password-B7gOTLiW.mjs");
var Route$17 = createFileRoute("/auth/forgot-password")({
	head: () => ({ meta: [
		{ title: "نسيت كلمة المرور | عقار البطين" },
		{
			name: "description",
			content: "استعد الوصول إلى حسابك في عقار البطين عبر رسالة إعادة تعيين كلمة المرور."
		},
		{
			property: "og:title",
			content: "نسيت كلمة المرور | عقار البطين"
		},
		{
			property: "og:description",
			content: "إعادة تعيين كلمة المرور عبر بريدك الإلكتروني."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./auth.individual-ZEgeXA-i.mjs");
var Route$16 = createFileRoute("/auth/individual")({
	head: () => ({ meta: [
		{ title: "دخول الأفراد | عقار البطين" },
		{
			name: "description",
			content: "سجّل دخولك كفرد لتصفح العقارات وحفظ المفضلة وطلب عقار."
		},
		{
			property: "og:title",
			content: "دخول الأفراد | عقار البطين"
		},
		{
			property: "og:description",
			content: "دخول سريع برقم الجوال أو البريد الإلكتروني."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./auth.office-VigUiqCj.mjs");
var Route$15 = createFileRoute("/auth/office")({
	head: () => ({ meta: [
		{ title: "دخول المكاتب العقارية | عقار البطين" },
		{
			name: "description",
			content: "سجّل مكتبك العقاري لإدارة العقارات والطلبات وحجوزات المعاينة."
		},
		{
			property: "og:title",
			content: "دخول المكاتب العقارية | عقار البطين"
		},
		{
			property: "og:description",
			content: "حساب مجاني لمكتبك العقاري في عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./auth.reset-password-BEfG8ztG.mjs");
var Route$14 = createFileRoute("/auth/reset-password")({
	head: () => ({ meta: [
		{ title: "كلمة مرور جديدة | عقار البطين" },
		{
			name: "description",
			content: "أنشئ كلمة مرور جديدة لحسابك في عقار البطين بعد التحقق من بريدك الإلكتروني."
		},
		{
			property: "og:title",
			content: "كلمة مرور جديدة | عقار البطين"
		},
		{
			property: "og:description",
			content: "إنشاء كلمة مرور جديدة وتأكيدها بأمان."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./auth.verify-email-uyX4FYyZ.mjs");
var Route$13 = createFileRoute("/auth/verify-email")({
	head: () => ({ meta: [{ title: "تفعيل حسابك | عقار البطين" }, {
		name: "description",
		content: "افتح رسالة التفعيل المرسلة إلى بريدك الإلكتروني لتأكيد حسابك."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./office.index-FwpL18Vy.mjs");
var Route$12 = createFileRoute("/office/")({
	head: () => ({ meta: [
		{ title: "لوحة المكتب | عقار البطين" },
		{
			name: "description",
			content: "إحصائيات مكتبك وإعلاناتك النشطة وطلبات العملاء الجديدة."
		},
		{
			property: "og:title",
			content: "لوحة المكتب | عقار البطين"
		},
		{
			property: "og:description",
			content: "لوحة تحكم المكاتب العقارية في عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./office.chat-DBfiZpZz.mjs");
var Route$11 = createFileRoute("/office/chat")({
	head: () => ({ meta: [
		{ title: "الدردشة مع العملاء | عقار البطين" },
		{
			name: "description",
			content: "محادثات مكتبك العقاري مع العملاء داخل عقار البطين، مرتبطة بالعقار الذي استفسر عنه كل عميل."
		},
		{
			property: "og:title",
			content: "الدردشة مع العملاء | عقار البطين"
		},
		{
			property: "og:description",
			content: "سجل المحادثات والعملاء لمكتبك العقاري ضمن الباقة الاحترافية."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./office.profile-3ODYlA-4.mjs");
var Route$10 = createFileRoute("/office/profile")({
	head: () => ({ meta: [
		{ title: "ملف المكتب | عقار البطين" },
		{
			name: "description",
			content: "بيانات مكتبك العقاري وترخيص فال وساعات العمل وطرق التواصل."
		},
		{
			property: "og:title",
			content: "ملف المكتب | عقار البطين"
		},
		{
			property: "og:description",
			content: "ملف وإعدادات المكتب العقاري في عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./office.requests-PZnxj-XZ.mjs");
var Route$9 = createFileRoute("/office/requests")({
	head: () => ({ meta: [
		{ title: "الطلبات | عقار البطين" },
		{
			name: "description",
			content: "طلبات العملاء على عقارات مكتبك وطلبات البحث العامة وعروضك المرسلة."
		},
		{
			property: "og:title",
			content: "الطلبات | عقار البطين"
		},
		{
			property: "og:description",
			content: "صندوق طلبات المكاتب العقارية في عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./office.status-9fxoFEFh.mjs");
var Route$8 = createFileRoute("/office/status")({
	head: () => ({ meta: [{ title: "حالة حساب المكتب | عقار البطين" }, {
		name: "description",
		content: "تابع حالة طلب تسجيل مكتبك العقاري."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./offices.index-BW_mfM0k.mjs");
var Route$7 = createFileRoute("/offices/")({
	head: () => ({ meta: [
		{ title: "المكاتب العقارية الموثقة | عقار البطين" },
		{
			name: "description",
			content: "استعرض المكاتب العقارية الموثقة في المزاحمية وضرما وتواصل معها مباشرة."
		},
		{
			property: "og:title",
			content: "المكاتب العقارية الموثقة | عقار البطين"
		},
		{
			property: "og:description",
			content: "مكاتب موثقة بتقييمات حقيقية وعروض محدثة."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitNotFoundComponentImporter$1 = () => import("./offices._officeId-B2I8F5zq.mjs");
var $$splitErrorComponentImporter$1 = () => import("./offices._officeId-BbALAQGr.mjs");
var $$splitComponentImporter$6 = () => import("./offices._officeId-Dc1EkgxR.mjs");
var Route$6 = createFileRoute("/offices/$officeId")({
	head: () => ({ meta: [
		{ title: "ملف المكتب العقاري | عقار البطين" },
		{
			name: "description",
			content: "تعرّف على المكتب العقاري وترخيصه وعروضه وتقييمات عملائه."
		},
		{
			property: "og:title",
			content: "ملف المكتب العقاري | عقار البطين"
		},
		{
			property: "og:description",
			content: "عروض المكتب وتقييماته وحالة توثيقه على منصة عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter$1, "errorComponent"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent")
});
var $$splitNotFoundComponentImporter = () => import("./offices.following-Dc5LM67O.mjs");
var $$splitErrorComponentImporter = () => import("./offices.following-C_Hi_HaE.mjs");
var $$splitComponentImporter$5 = () => import("./offices.following-H_KIwJ4o.mjs");
var Route$5 = createFileRoute("/offices/following")({
	head: () => ({ meta: [
		{ title: "المكاتب المتابَعة | عقار البطين" },
		{
			name: "description",
			content: "قائمة المكاتب العقارية التي تتابعها مع تقييمها وعدد عقاراتها وموقعها."
		},
		{
			property: "og:title",
			content: "المكاتب المتابَعة | عقار البطين"
		},
		{
			property: "og:description",
			content: "تابع مكاتبك العقارية المفضّلة واستعرض عروضها."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$4 = () => import("./properties.index-BR8mtpXs.mjs");
var Route$4 = createFileRoute("/properties/")({
	head: () => ({ meta: [
		{ title: "جميع العقارات | عقار البطين" },
		{
			name: "description",
			content: "تصفّح جميع العقارات المعروضة في عقار البطين: أراضٍ وشقق وفلل ومحلات للبيع والإيجار مع كامل التفاصيل والصور."
		},
		{
			property: "og:title",
			content: "جميع العقارات | عقار البطين"
		},
		{
			property: "og:description",
			content: "كل العقارات المضافة في التطبيق في مكان واحد مع إمكانية الفلترة والبحث."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./admin.individuals._userId-AaG-4HFF.mjs");
var Route$3 = createFileRoute("/admin/individuals/$userId")({
	head: () => ({ meta: [{ title: "بيانات الفرد | إدارة عقار البطين" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./admin.offices._officeId-ZzQMkq-S.mjs");
var Route$2 = createFileRoute("/admin/offices/$officeId")({
	head: () => ({ meta: [{ title: "بيانات المكتب | إدارة عقار البطين" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./office.properties.index-C9u3sgBL.mjs");
var Route$1 = createFileRoute("/office/properties/")({
	head: () => ({ meta: [
		{ title: "إدارة العروض | عقار البطين" },
		{
			name: "description",
			content: "أضف وعدّل واحذف عروضك العقارية وتحكم في نشرها."
		},
		{
			property: "og:title",
			content: "إدارة العروض | عقار البطين"
		},
		{
			property: "og:description",
			content: "لوحة إدارة عروض المكتب العقاري."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./office.properties.new-DKMIxi4H.mjs");
var Route = createFileRoute("/office/properties/new")({
	head: () => ({ meta: [
		{ title: "إضافة عرض عقاري | عقار البطين" },
		{
			name: "description",
			content: "أضف عرضًا عقاريًا جديدًا بالصور والمواصفات الكاملة."
		},
		{
			property: "og:title",
			content: "إضافة عرض عقاري | عقار البطين"
		},
		{
			property: "og:description",
			content: "نموذج إضافة عرض عقاري للمكاتب."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$33.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$34
});
var AccountRoute = Route$32.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$34
});
var AdminRoute = Route$35.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$34
});
var ChatsRoute = Route$36.update({
	id: "/chats",
	path: "/chats",
	getParentRoute: () => Route$34
});
var ExtrasRoute = Route$31.update({
	id: "/extras",
	path: "/extras",
	getParentRoute: () => Route$34
});
var FavoritesRoute = Route$30.update({
	id: "/favorites",
	path: "/favorites",
	getParentRoute: () => Route$34
});
var HomeRoute = Route$29.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => Route$34
});
var NotificationsRoute = Route$28.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$34
});
var PlansRoute = Route$27.update({
	id: "/plans",
	path: "/plans",
	getParentRoute: () => Route$34
});
var RequestRoute = Route$26.update({
	id: "/request",
	path: "/request",
	getParentRoute: () => Route$34
});
var SearchRoute = Route$25.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$34
});
var AdminIndividualsRoute = Route$24.update({
	id: "/individuals",
	path: "/individuals",
	getParentRoute: () => AdminRoute
});
var AdminNotificationsRoute = Route$23.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AdminRoute
});
var AdminOfficesRoute = Route$22.update({
	id: "/offices",
	path: "/offices",
	getParentRoute: () => AdminRoute
});
var AdminPaymentsRoute = Route$21.update({
	id: "/payments",
	path: "/payments",
	getParentRoute: () => AdminRoute
});
var AdminLoginRoute = Route$20.update({
	id: "/admin_/login",
	path: "/admin/login",
	getParentRoute: () => Route$34
});
var AuthAdminRoute = Route$19.update({
	id: "/auth/admin",
	path: "/auth/admin",
	getParentRoute: () => Route$34
});
var AuthConfirmRoute = Route$18.update({
	id: "/auth/confirm",
	path: "/auth/confirm",
	getParentRoute: () => Route$34
});
var AuthForgotPasswordRoute = Route$17.update({
	id: "/auth/forgot-password",
	path: "/auth/forgot-password",
	getParentRoute: () => Route$34
});
var AuthIndividualRoute = Route$16.update({
	id: "/auth/individual",
	path: "/auth/individual",
	getParentRoute: () => Route$34
});
var AuthOfficeRoute = Route$15.update({
	id: "/auth/office",
	path: "/auth/office",
	getParentRoute: () => Route$34
});
var AuthResetPasswordRoute = Route$14.update({
	id: "/auth/reset-password",
	path: "/auth/reset-password",
	getParentRoute: () => Route$34
});
var AuthVerifyEmailRoute = Route$13.update({
	id: "/auth/verify-email",
	path: "/auth/verify-email",
	getParentRoute: () => Route$34
});
var OfficeIndexRoute = Route$12.update({
	id: "/office/",
	path: "/office/",
	getParentRoute: () => Route$34
});
var OfficeChatRoute = Route$11.update({
	id: "/office/chat",
	path: "/office/chat",
	getParentRoute: () => Route$34
});
var OfficePayRoute = Route$37.update({
	id: "/office/pay",
	path: "/office/pay",
	getParentRoute: () => Route$34
});
var OfficePayresultRoute = Route$38.update({
	id: "/office/payresult",
	path: "/office/payresult",
	getParentRoute: () => Route$34
});
var OfficeProfileRoute = Route$10.update({
	id: "/office/profile",
	path: "/office/profile",
	getParentRoute: () => Route$34
});
var OfficeRequestsRoute = Route$9.update({
	id: "/office/requests",
	path: "/office/requests",
	getParentRoute: () => Route$34
});
var OfficeStatusRoute = Route$8.update({
	id: "/office/status",
	path: "/office/status",
	getParentRoute: () => Route$34
});
var OfficeSubscriptionRoute = Route$40.update({
	id: "/office/subscription",
	path: "/office/subscription",
	getParentRoute: () => Route$34
});
var OfficesIndexRoute = Route$7.update({
	id: "/offices/",
	path: "/offices/",
	getParentRoute: () => Route$34
});
var OfficesOfficeIdRoute = Route$6.update({
	id: "/offices/$officeId",
	path: "/offices/$officeId",
	getParentRoute: () => Route$34
});
var OfficesFollowingRoute = Route$5.update({
	id: "/offices/following",
	path: "/offices/following",
	getParentRoute: () => Route$34
});
var PropertiesIndexRoute = Route$4.update({
	id: "/properties/",
	path: "/properties/",
	getParentRoute: () => Route$34
});
var PropertiesPropertyIdRoute = Route$41.update({
	id: "/properties/$propertyId",
	path: "/properties/$propertyId",
	getParentRoute: () => Route$34
});
var AdminIndividualsUserIdRoute = Route$3.update({
	id: "/$userId",
	path: "/$userId",
	getParentRoute: () => AdminIndividualsRoute
});
var AdminOfficesOfficeIdRoute = Route$2.update({
	id: "/$officeId",
	path: "/$officeId",
	getParentRoute: () => AdminOfficesRoute
});
var OfficePropertiesIndexRoute = Route$1.update({
	id: "/office/properties/",
	path: "/office/properties/",
	getParentRoute: () => Route$34
});
var OfficePropertiesNewRoute = Route.update({
	id: "/office/properties/new",
	path: "/office/properties/new",
	getParentRoute: () => Route$34
});
var OfficePropertiesPropertyIdEditRoute = Route$39.update({
	id: "/office/properties/$propertyId/edit",
	path: "/office/properties/$propertyId/edit",
	getParentRoute: () => Route$34
});
var AdminIndividualsRouteChildren = { AdminIndividualsUserIdRoute };
var AdminIndividualsRouteWithChildren = AdminIndividualsRoute._addFileChildren(AdminIndividualsRouteChildren);
var AdminOfficesRouteChildren = { AdminOfficesOfficeIdRoute };
var AdminRouteChildren = {
	AdminIndividualsRoute: AdminIndividualsRouteWithChildren,
	AdminNotificationsRoute,
	AdminOfficesRoute: AdminOfficesRoute._addFileChildren(AdminOfficesRouteChildren),
	AdminPaymentsRoute
};
var rootRouteChildren = {
	IndexRoute,
	AccountRoute,
	AdminRoute: AdminRoute._addFileChildren(AdminRouteChildren),
	ChatsRoute,
	ExtrasRoute,
	FavoritesRoute,
	HomeRoute,
	NotificationsRoute,
	PlansRoute,
	RequestRoute,
	SearchRoute,
	AdminLoginRoute,
	AuthAdminRoute,
	AuthConfirmRoute,
	AuthForgotPasswordRoute,
	AuthIndividualRoute,
	AuthOfficeRoute,
	AuthResetPasswordRoute,
	AuthVerifyEmailRoute,
	OfficeChatRoute,
	OfficePayRoute,
	OfficePayresultRoute,
	OfficeProfileRoute,
	OfficeRequestsRoute,
	OfficeStatusRoute,
	OfficeSubscriptionRoute,
	OfficesOfficeIdRoute,
	OfficesFollowingRoute,
	PropertiesPropertyIdRoute,
	OfficeIndexRoute,
	OfficesIndexRoute,
	PropertiesIndexRoute,
	OfficePropertiesNewRoute,
	OfficePropertiesIndexRoute,
	OfficePropertiesPropertyIdEditRoute
};
var routeTree = Route$34._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 12e4,
		gcTime: 864e5,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		retry: 1,
		persister: appQueryPersister.persisterFn
	} } });
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
