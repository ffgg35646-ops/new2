import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth, t as signOut } from "./auth-DfdXUDDw.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Pencil, F as LoaderCircle, J as Crown, M as LogOut, T as Moon, W as FileCheckCorner, dt as Building2, f as ShieldCheck, t as X, y as QrCode } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as useGovernorates } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { n as useMyOffice } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { l as VERIFICATION_STATUS } from "./constants-Bvy1nlDs.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as SupportCenter } from "./SupportCenter-bJ8YAs81.mjs";
import { t as MediaUploader } from "./MediaUploader-_s7o_iau.mjs";
import { r as useMyPlan } from "./plans-CricE-8e.mjs";
import { t as QrDialog } from "./QrDialog-C8Bioagi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.profile-3ODYlA-4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TEXT_FIELDS = [
	["name", "اسم المكتب"],
	["manager_name", "اسم المسؤول"],
	["phone", "رقم الجوال"],
	["whatsapp", "واتساب"],
	["email", "البريد الإلكتروني"],
	["address", "العنوان"],
	["working_hours", "ساعات العمل"],
	["commercial_register", "السجل التجاري"],
	["license_number", "رقم الترخيص العقاري"],
	["fal_license_number", "رقم رخصة فال"]
];
function OfficeProfile() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { userId } = useAuth();
	const { data: membership, isLoading } = useMyOffice();
	const office = membership?.office ?? null;
	const isOwner = membership?.isOwner ?? false;
	const { isPro } = useMyPlan();
	const [showQr, setShowQr] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [dark, setDark] = (0, import_react.useState)(false);
	const [supportOpen, setSupportOpen] = (0, import_react.useState)(false);
	const supportTicketId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("support") : null;
	const { data: governorates = [] } = useGovernorates();
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		manager_name: "",
		phone: "",
		whatsapp: "",
		email: "",
		address: "",
		working_hours: "",
		commercial_register: "",
		license_number: "",
		fal_license_number: "",
		description: "",
		governorate_id: "",
		license_expiry: ""
	});
	const [falDocs, setFalDocs] = (0, import_react.useState)([]);
	const [licenseDocs, setLicenseDocs] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const saved = localStorage.getItem("ofoq-theme") === "dark";
		setDark(saved);
		document.documentElement.classList.toggle("dark", saved);
	}, []);
	function toggleTheme() {
		const next = !dark;
		setDark(next);
		localStorage.setItem("ofoq-theme", next ? "dark" : "light");
		document.documentElement.classList.toggle("dark", next);
	}
	(0, import_react.useEffect)(() => {
		if (!office) return;
		setForm({
			name: office.name ?? "",
			manager_name: office.manager_name ?? "",
			phone: office.phone ?? "",
			whatsapp: office.whatsapp ?? "",
			email: office.email ?? "",
			address: office.address ?? "",
			working_hours: office.working_hours ?? "",
			commercial_register: office.commercial_register ?? "",
			license_number: office.license_number ?? "",
			fal_license_number: office.fal_license_number ?? "",
			description: office.description ?? "",
			governorate_id: office.governorate_id ?? "",
			license_expiry: office.license_expiry ?? ""
		});
		setFalDocs(office.fal_license_url ? [office.fal_license_url] : []);
		setLicenseDocs(office.real_estate_license_url ? [office.real_estate_license_url] : []);
	}, [office]);
	const save = useMutation({
		mutationFn: async () => {
			if (!office) throw new Error("مكتبك غير متاح");
			if (!isOwner) throw new Error("تعديل بيانات المكتب متاح لصاحب المكتب فقط");
			const { error } = await supabase.from("offices").update({
				...form,
				governorate_id: form.governorate_id || null,
				license_expiry: form.license_expiry || null,
				fal_license_url: falDocs[0] ?? null,
				real_estate_license_url: licenseDocs[0] ?? null
			}).eq("id", office.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم حفظ بيانات المكتب");
			setEditing(false);
			qc.invalidateQueries({ queryKey: ["my-office-full"] });
			qc.invalidateQueries({ queryKey: ["office-governorate"] });
			qc.invalidateQueries({ queryKey: ["office"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ البيانات")
	});
	const governorateName = governorates.find((g) => g.id === (office?.governorate_id ?? ""))?.name_ar ?? "—";
	const readRows = [
		["اسم المكتب", office?.name ?? "—"],
		["اسم المسؤول", office?.manager_name || "—"],
		["رقم الجوال", office?.phone || "—"],
		["واتساب", office?.whatsapp || "—"],
		["البريد الإلكتروني", office?.email || "—"],
		["المنطقة", "منطقة الرياض"],
		["المحافظة", governorateName],
		["العنوان", office?.address || "—"],
		["رقم الترخيص العقاري", office?.license_number || "—"],
		["رقم رخصة فال", office?.fal_license_number || "—"],
		["انتهاء الترخيص", office?.license_expiry ? formatDate(office.license_expiry) : "—"],
		["السجل التجاري", office?.commercial_register || "—"],
		["ساعات العمل", office?.working_hours || "—"],
		["نبذة المكتب", office?.description || "—"]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-12 place-items-center overflow-hidden rounded-2xl bg-forest/10 text-forest",
										children: office?.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: office.logo_url,
											alt: "",
											className: "size-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-6" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "truncate font-display text-base font-extrabold",
											children: office?.name ?? "مكتبي العقاري"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1 text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: cn("size-3.5", office?.verification_status === "verified" && "text-forest") }), office ? VERIFICATION_STATUS[office.verification_status] : "—"]
										})]
									}),
									office && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/offices/$officeId",
										params: { officeId: office.id },
										className: "shrink-0 text-xs font-semibold text-terracotta",
										children: "الملف العام"
									})
								]
							}),
							office?.verification_status === "rejected" && office.rejection_reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive",
								children: ["سبب الرفض: ", office.rejection_reason]
							}),
							office?.verification_status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 rounded-xl bg-sand p-2.5 text-xs text-muted-foreground",
								children: "أكمل بيانات الترخيص العقاري ورخصة فال لتسريع توثيق المكتب."
							}),
							office && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									if (!isPro) {
										toast.error("رمز QR ميزة احترافية — رقِّ باقتك لإنشاء رمز مكتبك.");
										return;
									}
									setShowQr(true);
								},
								className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sand py-2.5 text-xs font-bold text-forest",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-4" }),
									" رمز QR للمكتب ",
									!isPro && "🔒"
								]
							})
						]
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-shimmer rounded-2xl bg-sand" }) : editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm font-extrabold",
									children: "تعديل بيانات المكتب"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setEditing(false),
									"aria-label": "إلغاء",
									className: "grid size-7 place-items-center rounded-full bg-sand",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
								})]
							}),
							TEXT_FIELDS.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: form[key],
									onChange: (e) => setForm((f) => ({
										...f,
										[key]: e.target.value
									})),
									className: "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
								})]
							}, key)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "تاريخ انتهاء الترخيص"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: form.license_expiry,
									onChange: (e) => setForm((f) => ({
										...f,
										license_expiry: e.target.value
									})),
									className: "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "المحافظة"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.governorate_id,
									onChange: (e) => setForm((f) => ({
										...f,
										governorate_id: e.target.value
									})),
									className: "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "اختر المحافظة"
									}), governorates.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: g.id,
										children: g.name_ar
									}, g.id))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "نبذة المكتب"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									rows: 4,
									value: form.description,
									onChange: (e) => setForm((f) => ({
										...f,
										description: e.target.value
									})),
									className: "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
								})]
							}),
							userId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 rounded-xl bg-background p-3 ring-1 ring-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-xs font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "size-3.5 text-forest" }), " مستندات التوثيق"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1 block text-[11px] text-muted-foreground",
										children: "صورة الترخيص العقاري"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaUploader, {
										userId,
										folder: "licenses",
										value: licenseDocs,
										onChange: setLicenseDocs,
										label: "ارفع صورة الترخيص العقاري"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1 block text-[11px] text-muted-foreground",
										children: "صورة رخصة فال"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaUploader, {
										userId,
										folder: "licenses",
										value: falDocs,
										onChange: setFalDocs,
										label: "ارفع صورة رخصة فال"
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => save.mutate(),
								disabled: save.isPending,
								className: "flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-60",
								children: [save.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " حفظ البيانات"]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-sm font-extrabold",
								children: "بيانات المكتب"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "divide-y divide-line",
								children: [readRows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "shrink-0 text-xs text-muted-foreground",
										children: label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-left text-xs font-semibold break-words",
										children: value
									})]
								}, label)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs text-muted-foreground",
										children: "حالة التوثيق"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-xs font-semibold",
										children: office ? VERIFICATION_STATUS[office.verification_status] : "—"
									})]
								})]
							}),
							(office?.fal_license_url || office?.real_estate_license_url) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [office?.real_estate_license_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: office.real_estate_license_url,
									target: "_blank",
									rel: "noreferrer",
									className: "flex-1 rounded-xl bg-sand py-2 text-center text-xs font-semibold",
									children: "الترخيص العقاري"
								}), office?.fal_license_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: office.fal_license_url,
									target: "_blank",
									rel: "noreferrer",
									className: "flex-1 rounded-xl bg-sand py-2 text-center text-xs font-semibold",
									children: "رخصة فال"
								})]
							}),
							isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setEditing(true),
								className: "flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-bold text-background",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), " تعديل بيانات المكتب"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-xl bg-sand p-2.5 text-[11px] text-muted-foreground",
								children: "تعديل بيانات المكتب متاح لصاحب المكتب فقط."
							})
						]
					}),
					isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/office/subscription",
						className: "flex items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-4 text-terracotta" }), " الباقة والاشتراك"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-terracotta",
							children: "إدارة"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSupportOpen(true),
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-surface p-4 text-sm font-semibold ring-1 ring-line",
						children: "تواصل مع الدعم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: toggleTheme,
						className: "flex w-full items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4 text-terracotta" }), " الوضع الليلي"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: dark ? "مفعّل" : "معطّل"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: async () => {
							await signOut();
							navigate({
								to: "/",
								replace: true
							});
						},
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " تسجيل الخروج"]
					})
				]
			}),
			office && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrDialog, {
				open: showQr,
				onClose: () => setShowQr(false),
				value: `${typeof window !== "undefined" ? window.location.origin : ""}/offices/${office.id}`,
				title: office.name,
				subtitle: "امسح الرمز لفتح صفحة المكتب",
				fileName: `qr-${office.name}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupportCenter, {
				open: supportOpen || !!supportTicketId,
				initialTicketId: supportTicketId,
				onClose: () => setSupportOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeProfile, {})
});
//#endregion
export { SplitComponent as component };
