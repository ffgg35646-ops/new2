import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, f as ShieldCheck, vt as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.admin-BKXIOzNB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminLoginPage() {
	const navigate = useNavigate();
	const { session, isAdmin, isLoading } = useAuth();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!isLoading && session && isAdmin) navigate({
			to: "/admin",
			replace: true
		});
	}, [
		isLoading,
		session,
		isAdmin,
		navigate
	]);
	async function login() {
		setBusy(true);
		try {
			if (!email.trim() || !password) throw new Error("أدخل البريد الإلكتروني وكلمة المرور.");
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (error) throw error;
			if (!data.user) throw new Error("تعذر تسجيل الدخول.");
			const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
			if (roleError) throw roleError;
			if (!(roles ?? []).some((r) => r.role === "admin")) {
				await supabase.auth.signOut();
				throw new Error("هذا الحساب ليس لديه صلاحية دخول لوحة الإدارة.");
			}
			toast.success("تم تسجيل دخول الإدارة");
			navigate({
				to: "/admin",
				replace: true
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذر تسجيل دخول الإدارة.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-16 place-items-center rounded-3xl bg-forest text-background",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-8" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-extrabold",
					children: "دخول الإدارة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "لوحة التحكم الخاصة بالمشرفين."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "البريد الإلكتروني"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							dir: "ltr",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "admin@example.com",
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "كلمة المرور"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							dir: "ltr",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "••••••••",
							onKeyDown: (e) => {
								if (e.key === "Enter") login();
							},
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void login(),
						disabled: busy,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "دخول لوحة الإدارة"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth/forgot-password",
						className: "block py-2 text-center text-xs font-semibold text-forest",
						children: "نسيت كلمة المرور؟"
					})
				]
			})
		]
	});
}
//#endregion
export { AdminLoginPage as component };
