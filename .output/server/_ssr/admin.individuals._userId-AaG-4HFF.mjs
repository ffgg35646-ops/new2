import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { S as useParams, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Phone, L as LoaderCircle, M as Mail, a as UserRoundX, r as User, wt as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as isTodaySaudi, t as fetchIndividualActivity } from "./admin-BJPhbrtH.mjs";
import { t as AdminShell } from "./AdminShell-DTm36zvD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.individuals._userId-AaG-4HFF.js
var import_jsx_runtime = require_jsx_runtime();
function IndividualDetails() {
	const { userId } = useParams({ from: "/admin/individuals/$userId" });
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ["admin-individual", userId],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id,full_name,phone,email,governorate_id,created_at,governorates(name_ar)").eq("id", userId).maybeSingle();
			if (error) throw error;
			return data;
		},
		staleTime: 6e4,
		refetchOnWindowFocus: false
	});
	const { data: activity, isLoading: activityLoading } = useQuery({
		queryKey: ["admin-individual-activity", userId],
		queryFn: () => fetchIndividualActivity(userId),
		enabled: !!data,
		staleTime: 6e4,
		refetchOnWindowFocus: false
	});
	async function deleteUser() {
		if (!data) return;
		if (!window.confirm(`هل أنت متأكد من حذف حساب "${data.full_name}" نهائيًا؟`)) return;
		const { error } = await supabase.rpc("admin_delete_user", { _user_id: userId });
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("تم حذف الحساب.");
		await qc.invalidateQueries({ queryKey: ["admin-directory"] });
		await qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
		navigate({
			to: "/admin/individuals",
			replace: true
		});
	}
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-3xl bg-sand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-56 animate-pulse rounded-2xl bg-sand" })]
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
		children: "الحساب غير موجود."
	});
	const governorate = data.governorates?.name_ar;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/admin/individuals",
				className: "inline-flex items-center gap-1 text-xs font-bold text-forest",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" }), "العودة للأفراد"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-3xl bg-forest p-4 text-background",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-14 place-items-center rounded-2xl bg-background/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-7" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate font-display text-xl font-extrabold",
							children: data.full_name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs opacity-80",
							children: ["فرد", isTodaySaudi(data.created_at) ? " · تسجيل اليوم" : ""]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: "بيانات التسجيل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الاسم",
							value: data.full_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "البريد الإلكتروني",
							value: data.email || "—",
							icon: Mail
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "رقم الجوال",
							value: data.phone || "—",
							icon: Phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "المحافظة",
							value: governorate || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "تاريخ التسجيل",
							value: new Date(data.created_at).toLocaleString("ar-SA")
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: "نشاط الفرد"
				}), activityLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "جاري تحميل النشاط..."]
				}) : activity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "مشاهدات العقارات",
							value: activity.propertyViews
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "العقارات المحفوظة",
							value: activity.favorites
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "الطلبات العقارية",
							value: activity.propertyRequests
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "حجوزات المعاينة",
							value: activity.bookings
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "تقييمات المكاتب",
							value: activity.officeReviews
						})
					]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => void deleteUser(),
				className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5 text-sm font-bold text-destructive",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRoundX, { className: "size-4" }), "حذف حساب الفرد"]
			})
		]
	});
}
function Row({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-4 rounded-xl bg-sand p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-1.5 text-xs text-muted-foreground",
			children: [Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "break-all text-left text-xs font-bold",
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
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndividualDetails, {}) })
});
//#endregion
export { SplitComponent as component };
