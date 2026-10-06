import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle, ct as Check, t as X, vt as ArrowRight } from "../_libs/lucide-react.mjs";
import { r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { a as stringType, i as objectType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bgf1Vp0y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthForm-DFPhEz1V.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var resolveEmailForPhone = createServerFn({ method: "POST" }).inputValidator((data) => objectType({ phone: stringType().min(6).max(20) }).parse(data)).handler(createSsrRpc("84b9114139086ebb3cdd27a8da06f636e06f3c42ad5ca0a18ddcc4ec4b9adff7"));
var DEFAULT_CONTENT = {
	privacy_policy: "سياسة الخصوصية\n\nسيتم عرض سياسة الخصوصية هنا.",
	terms_of_use: "شروط الاستخدام\n\nسيتم عرض شروط الاستخدام هنا."
};
function LegalPolicyModal({ open, policyKey, title, onClose, onAccept }) {
	const { data, isLoading } = useQuery({
		queryKey: ["legal-policy", policyKey],
		enabled: open,
		queryFn: async () => {
			const { data, error } = await supabase.from("app_content").select("content").eq("key", policyKey).maybeSingle();
			if (error) throw error;
			return data?.content || DEFAULT_CONTENT[policyKey];
		}
	});
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[100] flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-extrabold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "إغلاق",
					className: "grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-h-0 flex-1 overflow-y-auto px-5 py-5",
				children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid min-h-[50vh] place-items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-forest" })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
					className: "whitespace-pre-wrap text-sm leading-8",
					children: data || DEFAULT_CONTENT[policyKey]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-line bg-background px-5 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onAccept,
					className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "أوافق وأتابع"]
				})
			})
		]
	});
}
var PENDING_KEY = "ufuq.pending-signup";
var PENDING_EMAIL_KEY = "ufuq.pending-email";
function normalizePhone(raw) {
	const digits = raw.replace(/[^\d]/g, "");
	if (digits.startsWith("966")) return `+${digits}`;
	if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
	if (digits.startsWith("5")) return `+966${digits}`;
	return `+${digits}`;
}
function isValidSaudiPhone(raw) {
	return /^\+9665\d{8}$/.test(normalizePhone(raw));
}
function authErrorMessage(e) {
	const raw = e instanceof Error ? e.message : String(e ?? "");
	const m = raw.toLowerCase();
	if (m.includes("unsupported phone provider") || m.includes("sms provider")) return "خدمة الرسائل النصية غير مفعّلة بعد. استخدم التسجيل بالبريد الإلكتروني مؤقتًا.";
	if (m.includes("office_commercial_register_required")) return "رقم السجل التجاري مطلوب لحساب المكتب.";
	if (m.includes("office_license_required")) return "رقم الترخيص مطلوب لحساب المكتب.";
	if (m.includes("user already registered") || m.includes("already been registered")) return "البريد الإلكتروني مسجل مسبقًا";
	if (m.includes("phone") && m.includes("already")) return "رقم الجوال مستخدم مسبقًا. سجّل الدخول بهذا الرقم.";
	if (m.includes("password should be at least")) return "كلمة المرور قصيرة جدًا — الحد الأدنى 6 أحرف.";
	if (m.includes("pwned") || m.includes("compromised")) return "كلمة المرور ضعيفة ومسرّبة في اختراقات سابقة، اختر كلمة مرور أقوى.";
	if (m.includes("invalid login credentials")) return "البريد أو كلمة المرور غير صحيحة.";
	if (m.includes("email not confirmed")) return "لم يتم تأكيد البريد بعد. افتح رسالة التحقق في بريدك أولًا.";
	if (m.includes("invalid otp") || m.includes("token has expired") || m.includes("expired")) return "رمز التحقق غير صحيح أو منتهي الصلاحية.";
	if (m.includes("rate limit") || m.includes("too many")) return "محاولات كثيرة خلال وقت قصير، انتظر قليلًا ثم أعد المحاولة.";
	if (m.includes("unable to validate email") || m.includes("invalid email")) return "صيغة البريد الإلكتروني غير صحيحة.";
	return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}
function AuthForm({ role, plan = "free", startAsRegister = false }) {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { governorates } = useSelectedGovernorate();
	const [mode, setMode] = (0, import_react.useState)("phone");
	const [phase, setPhase] = (0, import_react.useState)("input");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [otp, setOtp] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [officeName, setOfficeName] = (0, import_react.useState)("");
	const [officeAddress, setOfficeAddress] = (0, import_react.useState)("");
	const [licenseNumber, setLicenseNumber] = (0, import_react.useState)("");
	const [commercialRegister, setCommercialRegister] = (0, import_react.useState)("");
	const [govId, setGovId] = (0, import_react.useState)("");
	const [isRegister, setIsRegister] = (0, import_react.useState)(startAsRegister);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [privacyAccepted, setPrivacyAccepted] = (0, import_react.useState)(false);
	const [termsAccepted, setTermsAccepted] = (0, import_react.useState)(false);
	const [privacyOpen, setPrivacyOpen] = (0, import_react.useState)(false);
	const [termsOpen, setTermsOpen] = (0, import_react.useState)(false);
	const [cooldown, setCooldown] = (0, import_react.useState)(0);
	const timer = (0, import_react.useRef)(null);
	const destination = role === "office" ? "/office" : "/home";
	const selectedGov = govId || governorates[0]?.id || "";
	(0, import_react.useEffect)(() => {
		return () => {
			if (timer.current) clearInterval(timer.current);
		};
	}, []);
	function startCooldown() {
		setCooldown(60);
		if (timer.current) clearInterval(timer.current);
		timer.current = setInterval(() => {
			setCooldown((c) => {
				if (c <= 1 && timer.current) clearInterval(timer.current);
				return c <= 1 ? 0 : c - 1;
			});
		}, 1e3);
	}
	function validateRegisterFields() {
		if (!fullName.trim()) throw new Error("الرجاء إدخال الاسم الكامل.");
		if (!selectedGov) throw new Error("الرجاء اختيار المحافظة.");
		if (role === "office") {
			if (!officeName.trim()) throw new Error("الرجاء إدخال اسم المكتب.");
			if (!commercialRegister.trim()) throw new Error("الرجاء إدخال رقم السجل التجاري.");
			if (!licenseNumber.trim()) throw new Error("الرجاء إدخال رقم الترخيص.");
		}
	}
	function signupPayload() {
		return {
			_role: role,
			_full_name: fullName.trim(),
			_phone: phone ? normalizePhone(phone) : "",
			_governorate_id: selectedGov,
			_office: role === "office" ? {
				name: officeName.trim() || fullName.trim(),
				manager_name: fullName.trim(),
				address: officeAddress.trim() || null,
				license_number: licenseNumber.trim() || null,
				commercial_register: commercialRegister.trim() || null,
				plan
			} : null
		};
	}
	async function finishSignup(payload) {
		const { error } = await supabase.rpc("complete_signup", payload ?? signupPayload());
		if (error) throw error;
	}
	async function applyPendingSignup(userId) {
		const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
		if (roles && roles.length > 0) return;
		const raw = localStorage.getItem(PENDING_KEY);
		if (!raw) return;
		try {
			await finishSignup(JSON.parse(raw));
		} finally {
			localStorage.removeItem(PENDING_KEY);
		}
	}
	async function afterAuth(register) {
		if (register) {
			await finishSignup();
			localStorage.removeItem(PENDING_KEY);
		} else {
			const { data } = await supabase.auth.getUser();
			if (data.user) await applyPendingSignup(data.user.id);
		}
		await qc.invalidateQueries();
		toast.success(register ? "تم إنشاء الحساب" : "تم تسجيل الدخول");
		navigate({ to: destination });
	}
	async function sendOtp() {
		setBusy(true);
		try {
			if (isRegister && (!privacyAccepted || !termsAccepted)) throw new Error("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام أولًا.");
			if (!isValidSaudiPhone(phone)) throw new Error("رقم جوال سعودي غير صحيح. مثال: 05XXXXXXXX");
			if (isRegister) validateRegisterFields();
			const p = normalizePhone(phone);
			const { error } = await supabase.auth.signInWithOtp({
				phone: p,
				options: { shouldCreateUser: isRegister }
			});
			if (error) throw error;
			setPhase("otp");
			startCooldown();
			toast.success("أرسلنا رمز التحقق إلى واتساب جوالك");
		} catch (e) {
			const msg = authErrorMessage(e);
			if (!isRegister && /signups not allowed|not found/i.test(String(e))) toast.error("لا يوجد حساب بهذا الرقم، أنشئ حسابًا جديدًا.");
			else toast.error(msg);
		} finally {
			setBusy(false);
		}
	}
	async function verifyOtp() {
		setBusy(true);
		try {
			if (!/^\d{6}$/.test(otp)) throw new Error("رمز التحقق يجب أن يكون 6 أرقام.");
			const { error } = await supabase.auth.verifyOtp({
				phone: normalizePhone(phone),
				token: otp,
				type: "sms"
			});
			if (error) throw error;
			await afterAuth(isRegister);
		} catch (e) {
			toast.error(authErrorMessage(e));
		} finally {
			setBusy(false);
		}
	}
	async function emailSubmit() {
		setBusy(true);
		try {
			if (isRegister && (!privacyAccepted || !termsAccepted)) throw new Error("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام أولًا.");
			if (!email.trim() || !password) throw new Error("الرجاء إدخال البريد وكلمة المرور.");
			if (isRegister) {
				if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
				validateRegisterFields();
				const { data, error } = await supabase.auth.signUp({
					email: email.trim(),
					password,
					options: {
						data: { full_name: fullName.trim() },
						emailRedirectTo: window.location.origin
					}
				});
				if (error) throw error;
				if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("البريد الإلكتروني مسجل مسبقًا");
				localStorage.setItem(PENDING_KEY, JSON.stringify(signupPayload()));
				localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify({
					email: email.trim(),
					role,
					sentAt: Date.now()
				}));
				if (data.session) await supabase.auth.signOut();
				toast.success("أرسلنا رسالة التحقق إلى بريدك الإلكتروني");
				navigate({ to: "/auth/verify-email" });
				return;
			}
			const { error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (error) throw error;
			await afterAuth(false);
		} catch (e) {
			toast.error(authErrorMessage(e));
		} finally {
			setBusy(false);
		}
	}
	async function loginWithPhonePassword() {
		setBusy(true);
		try {
			const { email: resolved } = await resolveEmailForPhone({ data: { phone: normalizePhone(phone) } });
			if (!resolved) throw new Error("لا يوجد حساب بهذا الرقم");
			const { error } = await supabase.auth.signInWithPassword({
				email: resolved,
				password
			});
			if (error) throw error;
			await afterAuth(false);
		} catch (e) {
			toast.error(authErrorMessage(e));
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-8 font-display text-2xl font-extrabold",
				children: role === "office" ? "حساب مكتب عقاري" : "حساب فرد"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-sm text-muted-foreground",
				children: isRegister ? "أنشئ حسابك للبدء" : "سجّل دخولك للمتابعة"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-sand p-1",
				children: ["phone", "email"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setMode(m);
						setPhase("input");
					},
					className: cn("rounded-xl py-2.5 text-sm font-semibold transition", mode === m ? "bg-surface text-forest shadow-sm" : "text-muted-foreground"),
					children: m === "phone" ? "الجوال" : "البريد"
				}, m))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-3",
				children: [
					isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: role === "office" ? "اسم المسؤول" : "الاسم الكامل",
						value: fullName,
						onChange: setFullName,
						placeholder: "مثال: محمد العتيبي"
					}),
					isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "المحافظة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: selectedGov,
							onChange: (e) => setGovId(e.target.value),
							className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest",
							children: governorates.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: g.id,
								children: g.name_ar
							}, g.id))
						})]
					}),
					isRegister && role === "office" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "اسم المكتب",
							value: officeName,
							onChange: setOfficeName,
							placeholder: "مثال: مكتب عقار البطين"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "عنوان المكتب (اختياري)",
							value: officeAddress,
							onChange: setOfficeAddress,
							placeholder: "الحي، الشارع"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "رقم الترخيص (فال) *",
							value: licenseNumber,
							onChange: setLicenseNumber,
							placeholder: "رقم فال",
							dir: "ltr"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "السجل التجاري *",
							value: commercialRegister,
							onChange: setCommercialRegister,
							placeholder: "10xxxxxxxx",
							dir: "ltr"
						})
					] }),
					mode === "phone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "رقم الجوال",
						value: phone,
						onChange: setPhone,
						placeholder: "05xxxxxxxx",
						type: "tel",
						dir: "ltr"
					}), phase === "otp" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "رمز التحقق",
							value: otp,
							onChange: (v) => setOtp(v.replace(/\D/g, "").slice(0, 6)),
							placeholder: "______",
							type: "text",
							dir: "ltr"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primary, {
							busy,
							onClick: verifyOtp,
							children: "تأكيد الرمز"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => void (cooldown === 0 && sendOtp()),
							disabled: busy || cooldown > 0,
							className: "w-full py-2 text-xs text-forest disabled:text-muted-foreground",
							children: cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال الرمز"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPhase("input"),
							className: "w-full py-2 text-xs text-muted-foreground",
							children: "تعديل الرقم"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primary, {
						busy,
						disabled: isRegister && (!privacyAccepted || !termsAccepted),
						onClick: sendOtp,
						children: "إرسال رمز التحقق"
					}), !isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "أو كلمة المرور",
						value: password,
						onChange: setPassword,
						placeholder: "••••••••",
						type: "password",
						dir: "ltr"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void loginWithPhonePassword(),
						disabled: busy || disabled,
						className: "w-full rounded-2xl bg-surface py-3.5 text-sm font-bold ring-1 ring-line",
						children: "دخول بكلمة المرور"
					})] })] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "البريد الإلكتروني",
							value: email,
							onChange: setEmail,
							placeholder: "you@example.com",
							type: "email",
							dir: "ltr"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "كلمة المرور",
							value: password,
							onChange: setPassword,
							placeholder: "••••••••",
							type: "password",
							dir: "ltr"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primary, {
							busy,
							disabled: isRegister && (!privacyAccepted || !termsAccepted),
							onClick: emailSubmit,
							children: isRegister ? "إنشاء الحساب" : "تسجيل الدخول"
						}),
						!isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth/forgot-password",
							className: "block w-full py-2 text-center text-xs font-semibold text-forest",
							children: "نسيت كلمة المرور؟"
						})
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setIsRegister((v) => {
					const next = !v;
					if (next) {
						setPrivacyAccepted(false);
						setTermsAccepted(false);
					}
					setPrivacyOpen(false);
					setTermsOpen(false);
					return next;
				}),
				className: "mt-6 text-center text-sm text-forest underline underline-offset-4",
				children: isRegister ? "لدي حساب بالفعل" : "ليس لدي حساب — تسجيل جديد"
			}),
			isRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-auto pt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2 text-xs leading-6 text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: privacyAccepted && termsAccepted,
						onChange: (e) => {
							const checked = e.target.checked;
							setPrivacyAccepted(checked);
							setTermsAccepted(checked);
						},
						className: "mt-1 size-4 shrink-0 accent-forest"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"أوافق على",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTermsOpen(true),
							className: "font-bold text-forest underline underline-offset-4",
							children: "شروط الاستخدام"
						}),
						" ",
						"و",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setPrivacyOpen(true),
							className: "font-bold text-forest underline underline-offset-4",
							children: "سياسة الخصوصية"
						})
					] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPolicyModal, {
				open: privacyOpen,
				policyKey: "privacy_policy",
				title: "سياسة الخصوصية",
				onClose: () => setPrivacyOpen(false),
				onAccept: () => {
					setPrivacyAccepted(true);
					setPrivacyOpen(false);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPolicyModal, {
				open: termsOpen,
				policyKey: "terms_of_use",
				title: "شروط الاستخدام",
				onClose: () => setTermsOpen(false),
				onAccept: () => {
					setTermsAccepted(true);
					setTermsOpen(false);
				}
			})
		]
	});
}
function Field({ label, value, onChange, placeholder, type = "text", dir }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type,
			dir,
			value,
			placeholder,
			onChange: (e) => onChange(e.target.value),
			className: "w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
		})]
	});
}
function Primary({ busy, disabled = false, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => void onClick(),
		disabled: busy,
		className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
		children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), children]
	});
}
//#endregion
export { AuthForm as t };
