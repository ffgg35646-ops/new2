import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as LoaderCircle, N as MailCheck, wt as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.verify-email-uyX4FYyZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PENDING_EMAIL_KEY = "ufuq.pending-email";
var MAX_RESENDS = 5;
function VerifyEmailPage() {
	const navigate = useNavigate();
	const [pending, setPending] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [cooldown, setCooldown] = (0, import_react.useState)(0);
	const [resends, setResends] = (0, import_react.useState)(0);
	const timer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const raw = localStorage.getItem(PENDING_EMAIL_KEY);
		if (!raw) {
			navigate({ to: "/auth/individual" });
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			setPending(parsed);
			const elapsed = Math.floor((Date.now() - parsed.sentAt) / 1e3);
			setCooldown(Math.max(0, 60 - elapsed));
		} catch {
			navigate({ to: "/auth/individual" });
		}
	}, [navigate]);
	(0, import_react.useEffect)(() => {
		timer.current = setInterval(() => {
			setCooldown((c) => c <= 1 ? 0 : c - 1);
		}, 1e3);
		return () => {
			if (timer.current) clearInterval(timer.current);
		};
	}, []);
	async function resend() {
		if (!pending || cooldown > 0 || resends >= MAX_RESENDS) return;
		setBusy(true);
		try {
			const { error } = await supabase.auth.resend({
				type: "signup",
				email: pending.email,
				options: { emailRedirectTo: `${window.location.origin}/auth/confirm` }
			});
			if (error) throw error;
			const next = {
				...pending,
				sentAt: Date.now()
			};
			localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify(next));
			setPending(next);
			setResends((r) => r + 1);
			setCooldown(60);
			toast.success("أعدنا إرسال رسالة تفعيل الحساب.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذر إعادة إرسال رسالة التفعيل.");
		} finally {
			setBusy(false);
		}
	}
	const loginRoute = pending?.role === "office" ? "/auth/office" : "/auth/individual";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: loginRoute,
				className: "flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex size-12 items-center justify-center rounded-2xl bg-sand text-forest",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailCheck, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-2xl font-extrabold",
				children: "فعّل حسابك"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted-foreground",
				children: "أرسلنا رابط تفعيل إلى:"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				dir: "ltr",
				className: "mt-1 text-sm font-bold text-foreground",
				children: pending?.email ?? ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: [
					"افتح الرسالة واضغط على رابط التفعيل. الرابط سينقلك تلقائيًا إلى صفحة ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "تفعيل حسابك" }),
					"."
				]
			}),
			pending?.role === "office" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 rounded-2xl bg-sand p-3.5 text-xs leading-relaxed text-muted-foreground",
				children: [
					"بعد تأكيد البريد الإلكتروني، سيبقى حساب المكتب",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: " قيد المراجعة" }),
					" حتى توافق الإدارة."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => void resend(),
					disabled: busy || cooldown > 0 || resends >= MAX_RESENDS,
					className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), resends >= MAX_RESENDS ? "تجاوزت الحد المسموح لإعادة الإرسال" : cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال رسالة التفعيل"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: loginRoute,
					className: "block w-full rounded-2xl bg-surface py-3.5 text-center text-sm font-bold ring-1 ring-line",
					children: "العودة لتسجيل الدخول"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground",
				children: "لا يمكن استخدام حساب المكتب قبل موافقة الإدارة."
			})
		]
	});
}
//#endregion
export { VerifyEmailPage as component };
