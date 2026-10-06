import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth, t as signOut } from "./auth-DfdXUDDw.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as Crown, M as LogOut, T as Moon, V as Heart, dt as Building2, f as ShieldCheck, ft as Bell, l as Sparkles, ot as ChevronLeft, r as User, ut as CalendarDays } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { t as BOOKING_STATUS } from "./constants-Bvy1nlDs.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as SupportCenter } from "./SupportCenter-bJ8YAs81.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-Dk1Z_Nnw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	const navigate = useNavigate();
	const { userId, profile, isAdmin, isOffice } = useAuth();
	const [dark, setDark] = (0, import_react.useState)(false);
	const [supportOpen, setSupportOpen] = (0, import_react.useState)(false);
	const supportTicketId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("support") : null;
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
	const qc = useQueryClient();
	const cancelBooking = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("viewing_bookings").update({ status: "cancelled" }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم إلغاء الحجز");
			qc.invalidateQueries({ queryKey: ["bookings"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إلغاء الحجز")
	});
	const { data: bookings } = useQuery({
		queryKey: ["bookings", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("viewing_bookings").select("id,visit_date,visit_time,status,properties(title),offices(name)").order("visit_date", { ascending: false }).limit(10);
			if (error) throw error;
			return data ?? [];
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 space-y-5 px-4 py-4",
				children: !userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: User,
					title: "لم تسجّل الدخول بعد",
					description: "سجّل الدخول للوصول لحجوزاتك ومفضلتك وطلباتك.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth/individual",
						className: "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "تسجيل الدخول"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex items-center gap-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-14 place-items-center rounded-2xl bg-forest-soft font-display text-xl font-extrabold text-forest",
							children: (profile?.full_name || "؟").charAt(0)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-base font-bold",
							children: profile?.full_name || "مستخدم"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							dir: "ltr",
							className: "text-xs text-muted-foreground",
							children: profile?.phone || profile?.email || ""
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/favorites",
								icon: Heart,
								label: "المفضلة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/request",
								icon: CalendarDays,
								label: "طلباتي العقارية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/offices",
								icon: Building2,
								label: "المكاتب العقارية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/offices/following",
								icon: Bell,
								label: "المكاتب التي أتابعها · إشعارات المكاتب"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/properties",
								icon: Building2,
								label: "جميع العقارات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/extras",
								icon: Sparkles,
								label: "الإضافات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSupportOpen(true),
								className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-[18px] text-terracotta" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm",
										children: "تواصل مع الدعم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "ms-auto size-4 text-muted-foreground" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/plans",
								icon: Crown,
								label: "الباقات"
							}),
							isOffice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/office",
								icon: Building2,
								label: "لوحة مكتبي"
							}),
							isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavRow, {
								to: "/admin",
								icon: ShieldCheck,
								label: "لوحة الإدارة"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "حجوزات المعاينة"
						}), bookings?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: bookings.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate text-sm font-bold",
											children: b.properties?.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta",
											children: BOOKING_STATUS[b.status]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 text-xs text-muted-foreground",
										children: [
											b.offices?.name,
											" · ",
											formatDate(b.visit_date),
											" ",
											"· ",
											String(b.visit_time).slice(0, 5)
										]
									}),
									b.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => cancelBooking.mutate(b.id),
										disabled: cancelBooking.isPending,
										className: "mt-2 w-full rounded-xl bg-terracotta-soft py-2 text-xs font-bold text-terracotta disabled:opacity-50",
										children: "إلغاء الحجز"
									})
								]
							}, b.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "لا توجد حجوزات حتى الآن."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: toggleTheme,
						className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-[18px] text-terracotta" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: "الوضع الليلي"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ms-auto text-xs text-muted-foreground",
								children: dark ? "مفعّل" : "معطّل"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: async () => {
							await signOut();
							navigate({ to: "/" });
						},
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-bold text-destructive ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " تسجيل الخروج"]
					})
				] })
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
function NavRow({ to, icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[18px] text-terracotta" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "ms-auto size-4 text-muted-foreground" })
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountPage, {})
});
//#endregion
export { SplitComponent as component };
