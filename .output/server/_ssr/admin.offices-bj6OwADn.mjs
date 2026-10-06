import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Mail, F as LoaderCircle, Q as Clock3, S as Phone, dt as Building2, it as ChevronUp, ot as ChevronLeft, rt as CircleCheck, st as ChevronDown, tt as CircleX } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAdminDirectory, i as isTodaySaudi, s as useOfficeActivity, t as AdminShell } from "./AdminShell-DpZf1xeQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.offices-bj6OwADn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OfficesAdminPage() {
	const { data, isLoading, isFetching } = useAdminDirectory();
	const offices = data?.offices ?? [];
	const pending = offices.filter((o) => o.verification_status === "pending").length;
	const ordered = [...offices].sort((a, b) => {
		const ap = a.verification_status === "pending" ? 0 : 1;
		const bp = b.verification_status === "pending" ? 0 : 1;
		if (ap !== bp) return ap - bp;
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-3xl bg-forest p-4 text-background",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopStat, {
						label: "المكاتب",
						value: isLoading ? "—" : offices.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopStat, {
						label: "قيد المراجعة",
						value: isLoading ? "—" : pending
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopStat, {
						label: "موثقة",
						value: isLoading ? "—" : offices.filter((o) => o.verification_status === "verified").length
					})
				]
			}), isFetching && !isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-[10px] opacity-70",
				children: "تحديث البيانات في الخلفية..."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2.5",
			children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-2xl bg-sand" }, i))
		}) : ordered.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2.5",
			children: ordered.map((office) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeRow, { office }, office.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
			children: "لا توجد مكاتب مسجلة."
		})]
	});
}
function OfficeRow({ office }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [rejecting, setRejecting] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("");
	const { data: activity, isLoading } = useOfficeActivity(office.id, expanded);
	const qc = useQueryClient();
	const statusMutation = useMutation({
		mutationFn: async ({ status, rejectionReason }) => {
			if (status === "rejected" && !rejectionReason?.trim()) throw new Error("اكتب سبب الرفض.");
			const { error } = await supabase.from("offices").update({
				verification_status: status,
				rejection_reason: status === "rejected" ? rejectionReason?.trim() || null : null
			}).eq("id", office.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة المكتب.");
			setRejecting(false);
			setReason("");
			qc.invalidateQueries({ queryKey: ["admin-directory"] });
			qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
		},
		onError: (e) => {
			toast.error(e instanceof Error ? e.message : "تعذر تحديث المكتب.");
		}
	});
	const StatusIcon = office.verification_status === "verified" ? CircleCheck : office.verification_status === "rejected" ? CircleX : Clock3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-2xl bg-surface ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex cursor-pointer items-center gap-3 p-3.5",
			onClick: () => setExpanded((v) => !v),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-11 shrink-0 place-items-center rounded-xl bg-terracotta-soft text-terracotta",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-sm font-bold",
							children: office.name
						}), isTodaySaudi(office.created_at) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold text-background",
							children: "جديد"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: cn("size-3.5", office.verification_status === "verified" ? "text-forest" : office.verification_status === "rejected" ? "text-destructive" : "text-terracotta") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-muted-foreground",
							children: office.verification_status === "verified" ? "موثق" : office.verification_status === "rejected" ? "مرفوض" : "قيد المراجعة"
						})]
					})]
				}),
				expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-5 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-5 text-muted-foreground" })
			]
		}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 border-t border-line bg-background/50 p-3.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "اسم المسؤول",
							value: office.manager_name || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "المحافظة",
							value: office.governorate_name || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "رقم الجوال",
							value: office.phone || "—",
							icon: Phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "البريد",
							value: office.email || "—",
							icon: Mail
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
							label: "تاريخ التسجيل",
							value: new Date(office.created_at).toLocaleString("ar-SA")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "الباقة",
							value: office.plan === "pro" ? "احترافي" : "مجاني"
						})
					]
				}),
				office.rejection_reason && office.verification_status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-destructive/5 p-3 text-xs text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold",
						children: "سبب الرفض"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 leading-relaxed",
						children: office.rejection_reason
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 text-xs font-extrabold",
					children: "نشاط المكتب"
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "جاري تحميل النشاط..."]
				}) : activity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "إجمالي العقارات",
							value: activity.properties
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "العقارات المنشورة",
							value: activity.publishedProperties
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "مشاهدات العقارات",
							value: activity.views
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "طلبات العملاء",
							value: activity.inquiries
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "حجوزات المعاينة",
							value: activity.bookings
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "التقييمات",
							value: activity.reviews
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "الموظفون",
							value: activity.staff
						})
					]
				}) : null] }),
				rejecting && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 rounded-xl bg-sand p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-bold",
							children: "سبب الرفض"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: reason,
							onChange: (e) => setReason(e.target.value),
							rows: 3,
							placeholder: "اكتب سبب رفض الطلب...",
							className: "w-full rounded-xl bg-background px-3 py-2.5 text-xs outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => statusMutation.mutate({
									status: "rejected",
									rejectionReason: reason
								}),
								disabled: statusMutation.isPending,
								className: "flex-1 rounded-xl bg-destructive/10 py-2.5 text-xs font-bold text-destructive disabled:opacity-50",
								children: "تأكيد الرفض"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setRejecting(false);
									setReason("");
								},
								className: "flex-1 rounded-xl bg-surface py-2.5 text-xs font-bold ring-1 ring-line",
								children: "إلغاء"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						office.verification_status !== "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => statusMutation.mutate({ status: "verified" }),
							disabled: statusMutation.isPending,
							className: "flex-1 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50",
							children: "اعتماد المكتب"
						}),
						office.verification_status !== "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setRejecting(true);
								setReason("");
							},
							className: "flex-1 rounded-xl bg-destructive/10 py-2.5 text-xs font-bold text-destructive",
							children: "رفض"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/admin/offices/$officeId",
							params: { officeId: office.id },
							className: "grid size-10 shrink-0 place-items-center rounded-xl bg-sand",
							title: "فتح التفاصيل",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
						})
					]
				})
			]
		})]
	});
}
function TopStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-background/10 p-3 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-xl font-extrabold",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-[10px] opacity-80",
			children: label
		})]
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
		className: "rounded-xl bg-surface p-3 ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-lg font-extrabold",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 text-[10px] text-muted-foreground",
			children: label
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/auth/admin",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficesAdminPage, {}) })
});
//#endregion
export { SplitComponent as component };
