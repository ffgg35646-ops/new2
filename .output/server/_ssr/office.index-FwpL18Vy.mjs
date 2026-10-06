import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as House, Q as Crown, S as Plus, U as Heart, Y as Eye, _t as Building2, f as ShieldCheck, gt as CalendarDays, it as ClipboardList } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { n as useMyOffice, r as useNewInquiriesCount } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { d as inquiryTypeLabel, l as VERIFICATION_STATUS, t as BOOKING_STATUS } from "./constants-Bvy1nlDs.mjs";
import { i as timeAgo, n as formatDate } from "./format-B7MVuK_u.mjs";
import { r as useMyPlan } from "./plans-CricE-8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.index-FwpL18Vy.js
var import_jsx_runtime = require_jsx_runtime();
function OfficeDashboard() {
	const { data: membership } = useMyOffice();
	const office = membership?.office ?? null;
	const isOwner = membership?.isOwner ?? false;
	const { data: newRequests = 0 } = useNewInquiriesCount(office?.id);
	const { package: currentPackage, expired, expiresAt, propertyLimit } = useMyPlan();
	const { data: stats } = useQuery({
		queryKey: ["office-stats", office?.id],
		enabled: !!office?.id,
		queryFn: async () => {
			const [props, bookings, inquiries] = await Promise.all([
				supabase.from("properties").select("id,views_count,favorites_count,is_published").eq("office_id", office.id).eq("is_deleted", false),
				supabase.from("viewing_bookings").select("id,visit_date,visit_time,status,properties(title)").eq("office_id", office.id).order("visit_date", { ascending: false }).limit(5),
				supabase.from("property_inquiries").select("id,type,status,contact_name,created_at,properties(title)").eq("office_id", office.id).order("created_at", { ascending: false }).limit(5)
			]);
			const rows = props.data ?? [];
			return {
				total: rows.length,
				published: rows.filter((r) => r.is_published).length,
				views: rows.reduce((a, r) => a + (r.views_count ?? 0), 0),
				favorites: rows.reduce((a, r) => a + (r.favorites_count ?? 0), 0),
				bookings: bookings.data ?? [],
				inquiries: inquiries.data ?? []
			};
		}
	});
	if (membership && !office) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 px-4 py-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Building2,
					title: "هذه اللوحة للمكاتب العقارية",
					description: "سجّل حساب مكتب عقاري للوصول إلى لوحة التحكم.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth/office",
						className: "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "تسجيل مكتب عقاري"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-5 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-3xl bg-forest p-4 text-background",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs opacity-80",
								children: "مرحبًا بك"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-display text-lg font-extrabold",
								children: office?.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1.5 rounded-full bg-background/15 px-2.5 py-1 text-[11px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5" }), VERIFICATION_STATUS[office?.verification_status ?? "pending"]]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1.5 rounded-full bg-background/15 px-2.5 py-1 text-[11px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-3.5" }), currentPackage?.name ?? "الباقة"]
									}),
									!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-background/15 px-2.5 py-1 text-[11px]",
										children: "حساب موظف"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs opacity-90",
								children: [
									stats?.published ?? 0,
									" إعلان نشط — ",
									newRequests,
									" طلب جديد — ",
									stats?.views ?? 0,
									" مشاهدة — ",
									stats?.favorites ?? 0,
									" عملية حفظ"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-4 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								icon: House,
								label: "نشط",
								value: stats?.published ?? 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								icon: ClipboardList,
								label: "طلبات جديدة",
								value: newRequests
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								icon: Eye,
								label: "مشاهدات",
								value: stats?.views ?? 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								icon: Heart,
								label: "حفظ",
								value: stats?.favorites ?? 0
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/office/subscription",
						className: "flex items-center justify-between rounded-2xl bg-surface p-3.5 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-4 text-terracotta" }), " الباقة والاشتراك"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: expired ? "انتهى الاشتراك — ترقية" : propertyLimit == null ? `تجديد ${expiresAt ? formatDate(expiresAt) : ""}` : propertyLimit == null ? `${stats?.total ?? 0} عقار` : `${stats?.total ?? 0}/${propertyLimit} عقارات`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/office/properties/new",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " إضافة عرض"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/office/properties",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: "إدارة العروض"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/office/chat",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: ["الدردشة", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								children: propertyLimit == null ? "" : "🔒"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/plans",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: "الباقات"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/office/requests",
							className: "relative flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: ["الطلبات", newRequests > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-terracotta px-2 py-0.5 text-[10px] text-background",
								children: newRequests
							})]
						}), isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/office/subscription",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-4" }), " الباقة والاشتراك"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/office/profile",
							className: "flex items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-display font-bold ring-1 ring-line",
							children: "ملف المكتب"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "آخر طلبات العملاء"
						}), stats?.inquiries.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: stats.inquiries.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/office/requests",
								className: "block rounded-2xl bg-surface p-3.5 ring-1 ring-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-sm font-bold",
										children: q.properties?.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta",
										children: inquiryTypeLabel(q.type)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [
										q.contact_name,
										" · ",
										timeAgo(q.created_at)
									]
								})]
							}, q.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "لا توجد طلبات بعد."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "آخر حجوزات المعاينة"
						}), stats?.bookings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: stats.bookings.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-sm font-bold",
										children: b.properties?.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta",
										children: BOOKING_STATUS[b.status]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3.5" }),
										" ",
										formatDate(b.visit_date),
										" ·",
										" ",
										String(b.visit_time).slice(0, 5)
									]
								})]
							}, b.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "لا توجد حجوزات بعد."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Stat({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-3 text-center ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mx-auto size-4 text-terracotta" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 font-display text-lg font-extrabold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] text-muted-foreground",
				children: label
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeDashboard, {})
});
//#endregion
export { SplitComponent as component };
