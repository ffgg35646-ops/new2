import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { V as Heart, _t as BadgeCheck, c as Star, dt as Building2, ft as Bell, k as MapPin, pt as BellOff, vt as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useToggleFollow, n as useFollowedOffices, r as useSetOfficeNotifications } from "./follows-CiwpByax.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offices.following-H_KIwJ4o.js
var import_jsx_runtime = require_jsx_runtime();
function FollowingPage() {
	const { userId } = useAuth();
	const { data: offices, isLoading } = useFollowedOffices();
	const toggle = useToggleFollow();
	const setNotify = useSetOfficeNotifications();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 flex items-center gap-2 bg-background/95 px-4 py-3 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/account",
					className: "grid size-9 place-items-center rounded-full bg-sand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display font-bold",
					children: "المكاتب التي أتابعها · إشعارات المكاتب"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 space-y-3 px-4",
				children: !userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Heart,
					title: "سجّل الدخول لعرض متابعاتك",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth/individual",
						className: "rounded-2xl bg-forest px-5 py-2.5 text-sm font-bold text-background",
						children: "تسجيل الدخول"
					})
				}) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : !offices?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Building2,
					title: "لا تتابع أي مكتب حتى الآن",
					description: "تابع المكاتب العقارية لمتابعة عروضها الجديدة.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/offices",
						className: "rounded-2xl bg-forest px-5 py-2.5 text-sm font-bold text-background",
						children: "استعراض المكاتب"
					})
				}) : offices.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-3xl bg-surface p-3.5 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-forest-soft font-display text-xl font-extrabold text-forest",
								children: o.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: o.logo_url,
									alt: o.name,
									className: "size-full object-cover",
									loading: "lazy"
								}) : o.name.trim().charAt(0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "truncate font-display text-sm font-extrabold",
										children: o.name
									}), o.verification_status === "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4 shrink-0 text-forest" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-terracotta text-terracotta" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold text-foreground",
													children: Number(o.rating_avg ?? 0).toFixed(1)
												}),
												"(",
												o.reviews_count ?? 0,
												")"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3 text-forest" }),
												o.properties_count,
												" عقار"
											]
										}),
										(o.governorates?.name_ar || o.address) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), [o.governorates?.name_ar, o.address].filter(Boolean).join(" · ")]
										})
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setNotify.mutate({
								officeId: o.id,
								notify: !o.notify
							}, {
								onSuccess: (on) => toast.success(on ? "تم تفعيل إشعارات المكتب" : "تم إيقاف إشعارات المكتب"),
								onError: (e) => toast.error(e.message)
							}),
							disabled: setNotify.isPending,
							"aria-pressed": o.notify,
							className: "mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold disabled:opacity-60 " + (o.notify ? "bg-forest-soft text-forest ring-1 ring-forest/30" : "bg-sand text-muted-foreground"),
							children: [o.notify ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "size-4" }), o.notify ? "الإشعارات مفعّلة" : "الإشعارات موقوفة"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/offices/$officeId",
								params: { officeId: o.id },
								className: "rounded-2xl bg-forest py-2.5 text-center text-xs font-bold text-background",
								children: "صفحة المكتب"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: toggle.isPending,
								onClick: () => {
									toggle.mutate({
										officeId: o.id,
										following: true
									}, {
										onSuccess: () => toast.success("تم إلغاء المتابعة"),
										onError: (e) => toast.error(e.message)
									});
								},
								className: "rounded-2xl bg-sand py-2.5 text-center text-xs font-bold disabled:opacity-60",
								children: "إلغاء المتابعة"
							})]
						})
					]
				}, o.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { FollowingPage as component };
