import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Mail, F as LoaderCircle, S as Phone, a as UserRoundX, it as ChevronUp, ot as ChevronLeft, r as User, st as ChevronDown } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAdminDirectory, i as isTodaySaudi, o as useIndividualActivity, t as AdminShell } from "./AdminShell-DpZf1xeQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.individuals-CTABCiyV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function IndividualsPage() {
	const { data, isLoading, isFetching } = useAdminDirectory();
	const individuals = data?.individuals ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-3xl bg-forest p-4 text-background",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs opacity-80",
					children: "إجمالي الأفراد"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 font-display text-3xl font-extrabold",
					children: isLoading ? "—" : individuals.length
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs opacity-80",
						children: "جدد اليوم"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-display text-2xl font-extrabold",
						children: isLoading ? "—" : individuals.filter((u) => isTodaySaudi(u.created_at)).length
					})]
				})]
			}), isFetching && !isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-[10px] opacity-70",
				children: "تحديث البيانات في الخلفية..."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : individuals.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2.5",
			children: individuals.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndividualRow, { user }, user.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
			children: "لا يوجد أفراد مسجلون حاليًا."
		})]
	});
}
function IndividualRow({ user }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const { data: activity, isLoading } = useIndividualActivity(user.id, expanded);
	const qc = useQueryClient();
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	async function deleteUser() {
		if (!window.confirm(`هل أنت متأكد من حذف حساب "${user.full_name}" نهائيًا؟`)) return;
		setDeleting(true);
		try {
			const { error } = await supabase.rpc("admin_delete_user", { _user_id: user.id });
			if (error) throw error;
			toast.success("تم حذف حساب الفرد.");
			await qc.invalidateQueries({ queryKey: ["admin-directory"] });
			await qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذر حذف الحساب.");
		} finally {
			setDeleting(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-2xl bg-surface ring-1 ring-line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex cursor-pointer items-center gap-3 p-3.5",
			onClick: () => setExpanded((v) => !v),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-11 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-sm font-bold",
							children: user.full_name
						}), isTodaySaudi(user.created_at) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold text-background",
							children: "جديد"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						dir: "ltr",
						className: "mt-0.5 truncate text-[11px] text-muted-foreground",
						children: user.email || user.phone || "بدون بيانات اتصال"
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
							label: "تاريخ التسجيل",
							value: new Date(user.created_at).toLocaleString("ar-SA")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "المحافظة",
							value: user.governorate_name || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "الجوال",
							value: user.phone || "—",
							icon: Phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
							label: "البريد",
							value: user.email || "—",
							icon: Mail
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 text-xs font-extrabold",
					children: "نشاط الحساب"
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-xl bg-sand p-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "جاري جلب النشاط..."]
				}) : activity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
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
				}) : null] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/admin/individuals/$userId",
						params: { userId: user.id },
						className: "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background",
						children: ["فتح التفاصيل", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-3.5" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void deleteUser(),
						disabled: deleting,
						className: "flex items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive disabled:opacity-50",
						children: [deleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRoundX, { className: "size-3.5" }), "حذف"]
					})]
				})
			]
		})]
	});
}
function Info({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-sand p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-[10px] text-muted-foreground",
			children: [
				Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mb-1 inline-block size-3.5" }),
				" ",
				label
			]
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
function ListSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-20 animate-pulse rounded-2xl bg-sand" }, i))
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/auth/admin",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndividualsPage, {}) })
});
//#endregion
export { SplitComponent as component };
