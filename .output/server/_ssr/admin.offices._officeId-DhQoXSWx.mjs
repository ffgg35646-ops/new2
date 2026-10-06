import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { S as useParams, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Mail, F as LoaderCircle, Q as Clock3, S as Phone, dt as Building2, rt as CircleCheck, tt as CircleX, vt as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as fetchOfficeActivity, t as AdminShell } from "./AdminShell-DpZf1xeQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.offices._officeId-DhQoXSWx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OfficeDetails() {
	const { officeId } = useParams({ from: "/admin/offices/$officeId" });
	useNavigate();
	const qc = useQueryClient();
	const [reason, setReason] = (0, import_react.useState)("");
	const { data: office, isLoading } = useQuery({
		queryKey: ["admin-office", officeId],
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,owner_id,name,manager_name,phone,email,address,commercial_register,license_number,fal_license_number,governorate_id,verification_status,rejection_reason,plan,plan_expires_at,created_at,updated_at,governorates(name_ar)").eq("id", officeId).maybeSingle();
			if (error) throw error;
			return data;
		},
		staleTime: 6e4,
		refetchOnWindowFocus: false
	});
	const { data: activity } = useQuery({
		queryKey: ["admin-office-activity", officeId],
		queryFn: () => fetchOfficeActivity(officeId),
		enabled: !!office,
		staleTime: 6e4,
		refetchOnWindowFocus: false
	});
	const statusMutation = useMutation({
		mutationFn: async ({ status }) => {
			if (status === "rejected" && !reason.trim()) throw new Error("اكتب سبب الرفض قبل التأكيد.");
			const { error } = await supabase.from("offices").update({
				verification_status: status,
				rejection_reason: status === "rejected" ? reason.trim() : null
			}).eq("id", officeId);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة المكتب.");
			setReason("");
			qc.invalidateQueries({ queryKey: ["admin-office", officeId] });
			qc.invalidateQueries({ queryKey: ["admin-office-activity", officeId] });
			qc.invalidateQueries({ queryKey: ["admin-directory"] });
			qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر تحديث الحالة.")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 animate-pulse rounded-3xl bg-sand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-2xl bg-sand" })]
	});
	if (!office) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
		children: "المكتب غير موجود."
	});
	const governorate = office.governorates?.name_ar;
	const status = office.verification_status;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/admin/offices",
				className: "inline-flex items-center gap-1 text-xs font-bold text-forest",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" }), "العودة للمكاتب"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-3xl bg-forest p-4 text-background",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-14 place-items-center rounded-2xl bg-background/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-7" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate font-display text-xl font-extrabold",
							children: office.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex items-center gap-1.5 text-xs",
							children: [status === "verified" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }) : status === "rejected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5" }), status === "verified" ? "موثق" : status === "rejected" ? "مرفوض" : "قيد المراجعة"]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-sm font-extrabold",
						children: "بيانات التسجيل"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "اسم المكتب",
								value: office.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "اسم المسؤول",
								value: office.manager_name || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "البريد الإلكتروني",
								value: office.email || "—",
								icon: Mail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "رقم الجوال",
								value: office.phone || "—",
								icon: Phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "المحافظة",
								value: governorate || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "السجل التجاري",
								value: office.commercial_register || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "رقم الترخيص",
								value: office.license_number || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "رخصة فال",
								value: office.fal_license_number || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "العنوان",
								value: office.address || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "الباقة",
								value: office.plan === "pro" ? "احترافي" : "مجاني"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								label: "تاريخ التسجيل",
								value: new Date(office.created_at).toLocaleString("ar-SA")
							})
						]
					}),
					office.rejection_reason && status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 rounded-xl bg-destructive/5 p-3 text-xs text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-bold",
							children: "سبب الرفض"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 leading-relaxed",
							children: office.rejection_reason
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: "نشاط المكتب"
				}), activity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "العقارات",
							value: activity.properties
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "المنشورة",
							value: activity.publishedProperties
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "المشاهدات",
							value: activity.views
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "طلبات العملاء",
							value: activity.inquiries
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "الحجوزات",
							value: activity.bookings
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "التقييمات",
							value: activity.reviews
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "الموظفين",
							value: activity.staff
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "جاري تحميل النشاط..."]
				})]
			}),
			status !== "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => statusMutation.mutate({ status: "verified" }),
				disabled: statusMutation.isPending,
				className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50",
				children: [statusMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "اعتماد وتوثيق المكتب"]
			}),
			status !== "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-extrabold",
						children: "رفض المكتب"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						rows: 3,
						value: reason,
						onChange: (e) => setReason(e.target.value),
						placeholder: "سبب الرفض...",
						className: "w-full rounded-xl bg-background px-3 py-2.5 text-xs outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => statusMutation.mutate({ status: "rejected" }),
						disabled: statusMutation.isPending,
						className: "flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-xs font-bold text-destructive disabled:opacity-50",
						children: "رفض الطلب"
					})
				]
			}),
			status === "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl bg-forest-soft p-4 text-center text-xs font-semibold text-forest",
				children: "هذا المكتب معتمد ويمكنه استخدام لوحة المكتب."
			})
		]
	});
}
function Info({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-sand p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1 text-[10px] text-muted-foreground",
			children: [Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 break-words text-xs font-semibold",
			children: value
		})]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-background p-3 ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-xl font-extrabold",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-[10px] text-muted-foreground",
			children: label
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/auth/admin",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeDetails, {}) })
});
//#endregion
export { SplitComponent as component };
