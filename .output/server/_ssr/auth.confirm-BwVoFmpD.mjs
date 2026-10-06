import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, rt as CircleCheck, tt as CircleX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.confirm-BwVoFmpD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PENDING_KEY = "ufuq.pending-signup";
var PENDING_EMAIL_KEY = "ufuq.pending-email";
function ConfirmEmailPage() {
	const navigate = useNavigate();
	const started = (0, import_react.useRef)(false);
	const [state, setState] = (0, import_react.useState)("loading");
	const [message, setMessage] = (0, import_react.useState)("جاري تأكيد بريدك الإلكتروني...");
	(0, import_react.useEffect)(() => {
		let active = true;
		async function finish() {
			if (started.current) return;
			started.current = true;
			try {
				const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
				const hashError = hash.get("error_description") || hash.get("error");
				if (hashError) throw new Error(hashError);
				const code = new URLSearchParams(window.location.search).get("code");
				if (code) {
					const { error } = await supabase.auth.exchangeCodeForSession(code);
					if (error) throw error;
				}
				let user = null;
				for (let i = 0; i < 10; i++) {
					const { data } = await supabase.auth.getUser();
					if (data.user) {
						user = data.user;
						break;
					}
					await new Promise((resolve) => setTimeout(resolve, 300));
				}
				if (!user) throw new Error("تعذر إنشاء جلسة بعد تفعيل البريد. افتح الرابط من نفس الجهاز الذي أنشأت منه الحساب.");
				if (!user.email_confirmed_at) throw new Error("لم يتم تأكيد البريد الإلكتروني بعد.");
				const raw = localStorage.getItem(PENDING_KEY);
				const pendingEmail = localStorage.getItem(PENDING_EMAIL_KEY);
				let role = "individual";
				if (raw) {
					const payload = JSON.parse(raw);
					role = payload._role === "office" ? "office" : "individual";
					const { error } = await supabase.rpc("complete_signup", payload);
					if (error) throw error;
					localStorage.removeItem(PENDING_KEY);
				} else if (pendingEmail) role = JSON.parse(pendingEmail).role === "office" ? "office" : "individual";
				localStorage.removeItem(PENDING_EMAIL_KEY);
				if (!active) return;
				setState("success");
				if (role === "office") {
					setMessage("تم تأكيد بريدك الإلكتروني. طلب المكتب الآن قيد مراجعة الإدارة.");
					setTimeout(() => {
						navigate({
							to: "/office/status",
							replace: true
						});
					}, 1200);
				} else {
					setMessage("تم تأكيد بريدك الإلكتروني وإنشاء حسابك بنجاح.");
					setTimeout(() => {
						navigate({
							to: "/home",
							replace: true
						});
					}, 1200);
				}
			} catch (e) {
				if (!active) return;
				setState("error");
				setMessage(e instanceof Error ? e.message : "تعذر تفعيل الحساب.");
			}
		}
		const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "USER_UPDATED") finish();
		});
		finish();
		return () => {
			active = false;
			subscription.subscription.unsubscribe();
		};
	}, [navigate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5",
		children: [
			state === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-12 animate-spin text-forest" }),
			state === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-14 text-forest" }),
			state === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-14 text-destructive" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-5 text-center font-display text-2xl font-extrabold",
				children: state === "error" ? "تعذر تفعيل حسابك" : state === "success" ? "تم تفعيل حسابك" : "تفعيل حسابك"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-center text-sm leading-relaxed text-muted-foreground",
				children: message
			}),
			state === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth/individual",
				className: "mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background",
				children: "العودة لتسجيل الدخول"
			})
		]
	});
}
//#endregion
export { ConfirmEmailPage as component };
