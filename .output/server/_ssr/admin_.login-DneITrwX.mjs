import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as LoaderCircle, f as ShieldCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin_.login-DneITrwX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminLoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit() {
		if (!email.trim() || !password) {
			toast.error("أدخل البريد الإلكتروني وكلمة المرور.");
			return;
		}
		setBusy(true);
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (error) throw error;
			if (!data.user) throw new Error("تعذر الحصول على بيانات الحساب.");
			const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
			if (rolesError) throw rolesError;
			if (!(roles ?? []).some((row) => row.role === "admin")) {
				await supabase.auth.signOut();
				throw new Error("هذا الحساب ليس حساب إدارة.");
			}
			toast.success("تم تسجيل دخول الإدارة.");
			navigate({
				to: "/admin",
				replace: true
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذر تسجيل الدخول.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		dir: "rtl",
		className: "grid min-h-screen place-items-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl bg-surface p-6 ring-1 ring-line",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex size-14 items-center justify-center rounded-2xl bg-sand text-forest",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-5 text-center font-display text-2xl font-extrabold",
					children: "دخول الإدارة"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-center text-sm text-muted-foreground",
					children: "هذه الصفحة مخصصة للمشرفين فقط."
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
								onChange: (e) => setEmail(e.target.value),
								placeholder: "admin@example.com",
								autoComplete: "username",
								className: "w-full rounded-2xl bg-background px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
								children: "كلمة المرور"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								dir: "ltr",
								type: "password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: "••••••••",
								autoComplete: "current-password",
								onKeyDown: (e) => {
									if (e.key === "Enter") submit();
								},
								className: "w-full rounded-2xl bg-background px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => void submit(),
							disabled: busy,
							className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
							children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), busy ? "جاري تسجيل الدخول..." : "دخول الإدارة"]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { AdminLoginPage as component };
