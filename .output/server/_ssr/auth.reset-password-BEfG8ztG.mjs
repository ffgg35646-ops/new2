import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as LockKeyhole, L as LoaderCircle, wt as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.reset-password-BEfG8ztG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResetPasswordPage() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [ready, setReady] = (0, import_react.useState)(false);
	const [valid, setValid] = (0, import_react.useState)(false);
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let active = true;
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
				setValid(true);
				setReady(true);
			}
		});
		supabase.auth.getSession().then(({ data }) => {
			if (!active) return;
			setValid(!!data.session);
			setReady(true);
		});
		return () => {
			active = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	async function submit() {
		setBusy(true);
		try {
			if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
			if (password !== confirm) throw new Error("كلمتا المرور غير متطابقتين.");
			const { error } = await supabase.auth.updateUser({ password });
			if (error) throw error;
			await qc.invalidateQueries();
			toast.success("تم تحديث كلمة المرور بنجاح");
			navigate({ to: "/home" });
		} catch (e) {
			const raw = e instanceof Error ? e.message : String(e);
			toast.error(/pwned|compromised/i.test(raw) ? "كلمة المرور ضعيفة ومسرّبة سابقًا، اختر كلمة مرور أقوى." : /should be at least/i.test(raw) ? "كلمة المرور قصيرة جدًا." : /same.*password/i.test(raw) ? "كلمة المرور الجديدة مطابقة للقديمة، اختر كلمة أخرى." : raw);
		} finally {
			setBusy(false);
		}
	}
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-forest" })
	});
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
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 font-display text-2xl font-extrabold",
				children: "كلمة مرور جديدة"
			}),
			!valid ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
				children: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا لإعادة تعيين كلمة المرور."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth/forgot-password",
				className: "mt-6 block w-full rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background",
				children: "طلب رابط جديد"
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
				children: "أدخل كلمة المرور الجديدة وأكّدها. ستتمكن بعدها من الدخول بها مباشرة."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "كلمة المرور الجديدة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "password",
							value: password,
							placeholder: "••••••••",
							onChange: (e) => setPassword(e.target.value),
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "تأكيد كلمة المرور"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "password",
							value: confirm,
							placeholder: "••••••••",
							onChange: (e) => setConfirm(e.target.value),
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void submit(),
						disabled: busy,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "حفظ كلمة المرور"]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-auto pt-8 text-center text-[11px] leading-relaxed text-muted-foreground",
				children: "الحد الأدنى 8 أحرف. ننصح بمزيج من الأحرف والأرقام والرموز."
			})
		]
	});
}
//#endregion
export { ResetPasswordPage as component };
