import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as LoaderCircle, Q as Crown, _t as Building2 } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { n as useMyOffice } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as usePackages, i as useOfficePropertiesCount, o as usePlanEvents, r as useMyPlan, s as useSetPackage } from "./plans-CricE-8e.mjs";
import { t as Route } from "./office.subscription-ByOodPJC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.subscription-CrdRNz3X.js
var import_jsx_runtime = require_jsx_runtime();
function Subscription() {
	const { data: membership } = useMyOffice();
	const office = membership?.office ?? null;
	const isOwner = membership?.isOwner ?? false;
	const { package: currentPackage, expired, expiresAt, startedAt, propertyLimit, isLoading } = useMyPlan();
	const { data: packages = [] } = usePackages(true);
	const { data: count = 0 } = useOfficePropertiesCount(office?.id);
	const { data: events = [] } = usePlanEvents(office?.id);
	const setPackage = useSetPackage();
	const navigate = Route.useNavigate();
	function choose(pkg) {
		if (!isOwner) {
			toast.error("تغيير الباقة متاح لصاحب المكتب فقط.");
			return;
		}
		if (currentPackage?.id === pkg.id) {
			if (pkg.price > 0) navigate({
				to: "/office/pay",
				search: { package: pkg.id }
			});
			else toast.info("أنت على هذه الباقة بالفعل.");
			return;
		}
		if (pkg.price > 0) {
			navigate({
				to: "/office/pay",
				search: { package: pkg.id }
			});
			return;
		}
		setPackage.mutate(pkg.id, {
			onSuccess: () => toast.success("تم اختيار الباقة"),
			onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تغيير الباقة")
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-2xl space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "الباقة والاشتراك"
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid place-items-center py-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-4 text-terracotta" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-display text-base font-extrabold",
											children: currentPackage?.name ?? "الباقة"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ms-auto rounded-full bg-forest-soft px-2 py-1 text-[10px] font-bold text-forest",
											children: expired ? "منتهية" : "نشطة"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-3 grid grid-cols-2 gap-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "بداية الاشتراك",
											value: startedAt ? formatDate(startedAt) : "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "الانتهاء",
											value: expiresAt ? formatDate(expiresAt) : "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "العقارات",
											value: propertyLimit == null ? `${count} — غير محدود` : `${count} من ${propertyLimit}`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
											label: "المكتب",
											value: office?.name ?? "—"
										})
									]
								}),
								expired && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground",
									children: "انتهت الباقة المدفوعة. اختر أي باقة مدفوعة لإعادة التفعيل."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "px-1 font-display text-sm font-extrabold",
							children: "الباقات المتاحة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: packages.map((pkg) => {
								const current = currentPackage?.id === pkg.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "rounded-3xl bg-surface p-4 ring-1 ring-line " + (current ? "ring-2 ring-forest" : ""),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-terracotta" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-display text-base font-extrabold",
													children: pkg.name
												}),
												current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ms-auto rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest",
													children: "الحالية"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 text-lg font-extrabold text-forest",
											children: pkg.price === 0 ? "مجانًا" : `${pkg.price.toLocaleString("ar-SA")} ريال`
										}),
										pkg.duration_days > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[11px] text-muted-foreground",
											children: [pkg.duration_days, " يوم"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "mt-3 space-y-1",
											children: pkg.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "text-[12px] text-muted-foreground",
												children: ["✓ ", f]
											}, f))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => choose(pkg),
											disabled: setPackage.isPending,
											className: "mt-4 w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50",
											children: current && pkg.price > 0 ? "تجديد / دفع" : current ? "باقتك الحالية" : pkg.price > 0 ? "الاشتراك والدفع" : "اختيار الباقة"
										})
									]
								}, pkg.id);
							})
						}),
						events.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-sm font-extrabold",
								children: "سجل الاشتراك"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-2",
								children: events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-2 text-[12px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5 text-terracotta" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: e.note ?? e.plan }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ms-auto text-muted-foreground",
											children: formatDate(e.created_at)
										})
									]
								}, e.id))
							})]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/office",
						className: "block rounded-2xl bg-sand p-3 text-center text-xs font-semibold text-forest",
						children: "العودة إلى لوحة المكتب"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { variant: "office" })
		]
	});
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-sand p-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[10px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-0.5 font-semibold",
			children: value
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Subscription, {})
});
//#endregion
export { SplitComponent as component };
