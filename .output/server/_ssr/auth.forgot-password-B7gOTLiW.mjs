import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, R as KeyRound, vt as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.forgot-password-B7gOTLiW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_SENDS = 5;
function ForgotPasswordPage() {
	const [email, setEmail] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [sent, setSent] = (0, import_react.useState)(false);
	const [sends, setSends] = (0, import_react.useState)(0);
	const [cooldown, setCooldown] = (0, import_react.useState)(0);
	const timer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		timer.current = setInterval(() => setCooldown((c) => c <= 1 ? 0 : c - 1), 1e3);
		return () => {
			if (timer.current) clearInterval(timer.current);
		};
	}, []);
	async function submit() {
		if (cooldown > 0 || sends >= MAX_SENDS) return;
		setBusy(true);
		try {
			if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("صيغة البريد الإلكتروني غير صحيحة.");
			const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
			if (error) throw error;
			setSent(true);
			setSends((s) => s + 1);
			setCooldown(60);
			toast.success("إذا كان البريد مسجلًا لدينا فستصلك رسالة إعادة التعيين");
		} catch (e) {
			const raw = e instanceof Error ? e.message : String(e);
			toast.error(/rate limit|too many/i.test(raw) ? "محاولات كثيرة خلال وقت قصير، انتظر قليلًا ثم أعد المحاولة." : raw);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth/individual",
				className: "flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex size-12 items-center justify-center rounded-2xl bg-sand text-forest",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-2xl font-extrabold",
				children: "نسيت كلمة المرور؟"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
				children: "أدخل بريدك الإلكتروني المسجّل وسنرسل لك رسالة تتيح لك إنشاء كلمة مرور جديدة."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "البريد الإلكتروني"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "email",
							value: email,
							placeholder: "you@example.com",
							onChange: (e) => setEmail(e.target.value),
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void submit(),
						disabled: busy || cooldown > 0 || sends >= MAX_SENDS,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), sends >= MAX_SENDS ? "تجاوزت الحد المسموح للمحاولات" : cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : sent ? "إعادة إرسال الرسالة" : "إرسال رابط إعادة التعيين"]
					}),
					sent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-2xl bg-sand p-3 text-xs leading-relaxed text-forest",
						children: "تحقق من بريدك الإلكتروني (وصندوق الرسائل غير المرغوبة). الرابط صالح لفترة محدودة ويُستخدم مرة واحدة فقط."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground",
				children: "لأمانك لا نكشف ما إذا كان البريد مسجلًا في النظام أم لا."
			})
		]
	});
}
//#endregion
export { ForgotPasswordPage as component };
