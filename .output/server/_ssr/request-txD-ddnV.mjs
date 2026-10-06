import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as ClipboardList, F as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as useNeighborhoods, r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { i as whatsappHref } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { a as LISTING_TYPES, c as REQUEST_STATUS, o as PROPERTY_KINDS } from "./constants-Bvy1nlDs.mjs";
import { n as formatDate, r as formatPrice } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as MediaUploader } from "./MediaUploader-_s7o_iau.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/request-txD-ddnV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var OFFER_STATUS = {
	sent: "جديد",
	accepted: "مقبول ✓",
	rejected: "مرفوض"
};
function RequestPage() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const { governorateId } = useSelectedGovernorate();
	const { data: neighborhoods = [] } = useNeighborhoods(governorateId);
	const [kind, setKind] = (0, import_react.useState)("land");
	const [listing, setListing] = (0, import_react.useState)("sale");
	const [neighborhood, setNeighborhood] = (0, import_react.useState)("");
	const [budgetMin, setBudgetMin] = (0, import_react.useState)("");
	const [budgetMax, setBudgetMax] = (0, import_react.useState)("");
	const [areaMin, setAreaMin] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [durationDays, setDurationDays] = (0, import_react.useState)(7);
	const [attachment, setAttachment] = (0, import_react.useState)([]);
	const { data: myRequests, isLoading } = useQuery({
		queryKey: ["my-requests", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("property_requests").select("*, office_offers(id,message,price,status,created_at,offices(name,phone,whatsapp),properties(id,title))").order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const setOfferStatus = useMutation({
		mutationFn: async (vars) => {
			const { error } = await supabase.from("office_offers").update({ status: vars.status }).eq("id", vars.id);
			if (error) throw error;
		},
		onSuccess: (_, vars) => {
			toast.success(vars.status === "accepted" ? "تم قبول العرض" : "تم رفض العرض");
			qc.invalidateQueries({ queryKey: ["my-requests"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تحديث العرض")
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول لنشر الطلب");
			if (description.trim().length < 10) throw new Error("اكتب وصفًا أوضح لطلبك");
			const { data: createdRequest, error } = await supabase.from("property_requests").insert({
				user_id: userId,
				governorate_id: governorateId,
				kind,
				listing,
				neighborhood: neighborhood || null,
				budget_min: budgetMin ? Number(budgetMin) : null,
				budget_max: budgetMax ? Number(budgetMax) : null,
				area_min: areaMin ? Number(areaMin) : null,
				description: description.trim(),
				attachment_url: attachment[0] ?? null,
				expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1e3).toISOString()
			}).select("id").single();
			if (error) throw error;
			if (createdRequest?.id) {
				const { error: notifyError } = await supabase.rpc("notify_matching_offices_for_request", { _request_id: createdRequest.id });
				if (notifyError) console.warn("[request] matching-office notification failed", notifyError);
			}
		},
		onSuccess: () => {
			toast.success("تم نشر طلبك، ستصلك عروض المكاتب");
			setDescription("");
			setBudgetMin("");
			setBudgetMax("");
			setDurationDays(7);
			setAttachment([]);
			qc.invalidateQueries({ queryKey: ["my-requests"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر نشر الطلب")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-5 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "اطلب عقارًا"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "اكتب ما تبحث عنه، وسترسل لك المكاتب العقارية عروضها مباشرة."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "نوع العقار",
								children: PROPERTY_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: kind === k.value,
									onClick: () => setKind(k.value),
									label: k.label
								}, k.value))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "نوع العرض",
								children: LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: listing === l.value,
									onClick: () => setListing(l.value),
									label: l.label
								}, l.value))
							}),
							!!neighborhoods.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, {
								label: "الحي المفضل",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: !neighborhood,
									onClick: () => setNeighborhood(""),
									label: "أي حي"
								}), neighborhoods.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									active: neighborhood === n.name_ar,
									onClick: () => setNeighborhood(n.name_ar),
									label: n.name_ar
								}, n.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									label: "الميزانية من",
									value: budgetMin,
									onChange: setBudgetMin
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									label: "الميزانية إلى",
									value: budgetMax,
									onChange: setBudgetMax
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "أقل مساحة مطلوبة (م²)",
								value: areaMin,
								onChange: setAreaMin
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-[11px] text-muted-foreground",
									children: "مدة صلاحية الطلب"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: durationDays,
									onChange: (e) => setDurationDays(Number(e.target.value)),
									className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 7,
										children: "7 أيام"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 30,
										children: "30 يومًا"
									})]
								})]
							}),
							userId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
								children: "مرفق الطلب"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaUploader, {
								userId,
								folder: "requests",
								value: attachment,
								onChange: (urls) => setAttachment(urls.slice(0, 1)),
								label: "إرفاق مخطط أو صورة (اختياري)"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-[11px] text-muted-foreground",
									children: "وصف الطلب"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									rows: 4,
									value: description,
									onChange: (e) => setDescription(e.target.value),
									placeholder: "مثال: أبحث عن أرض سكنية بمساحة لا تقل عن 500م في حي الروضة، شارع 20م.",
									className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
								})]
							}),
							userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => create.mutate(),
								disabled: create.isPending,
								className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60",
								children: [create.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " نشر الطلب"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/auth/individual",
								className: "block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background",
								children: "سجّل الدخول لنشر الطلب"
							})
						]
					}),
					userId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "طلباتي"
						}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : myRequests?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: myRequests.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-bold",
											children: [
												PROPERTY_KINDS.find((k) => k.value === r.kind)?.label,
												" ·",
												" ",
												LISTING_TYPES.find((l) => l.value === r.listing)?.label
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest",
											children: REQUEST_STATUS[r.status]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1.5 line-clamp-2 text-xs text-muted-foreground",
										children: r.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex items-center justify-between text-[11px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.budget_min || r.budget_max ? `${formatPrice(r.budget_min)} - ${formatPrice(r.budget_max)} ر.س` : "بدون ميزانية محددة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											r.office_offers?.length ?? 0,
											" عرض ·",
											" ",
											r.views_count ?? 0,
											" مكتب شاهد · ",
											formatDate(r.created_at)
										] })]
									}),
									r.attachment_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: r.attachment_url,
										target: "_blank",
										rel: "noreferrer",
										className: "mt-2 block rounded-xl bg-sand px-3 py-2 text-center text-xs font-semibold text-forest",
										children: "عرض المرفق"
									}),
									(r.office_offers ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 space-y-2 border-t border-line pt-3",
										children: r.office_offers.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl bg-sand p-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "truncate text-xs font-bold",
														children: o.offices?.name ?? "مكتب عقاري"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", o.status === "accepted" ? "bg-forest-soft text-forest" : o.status === "rejected" ? "bg-terracotta-soft text-terracotta" : "bg-surface text-muted-foreground"),
														children: OFFER_STATUS[o.status] ?? o.status
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-xs text-muted-foreground",
													children: o.message
												}),
												o.price != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs font-bold text-forest",
													children: [formatPrice(o.price), " ر.س"]
												}),
												o.properties && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/properties/$propertyId",
													params: { propertyId: o.properties.id },
													className: "mt-1 block text-[11px] font-semibold text-forest underline underline-offset-2",
													children: ["العقار المقترح: ", o.properties.title]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 flex gap-2",
													children: [o.status === "sent" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setOfferStatus.mutate({
															id: o.id,
															status: "accepted"
														}),
														disabled: setOfferStatus.isPending,
														className: "flex-1 rounded-lg bg-forest py-1.5 text-[11px] font-bold text-background disabled:opacity-50",
														children: "قبول"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setOfferStatus.mutate({
															id: o.id,
															status: "rejected"
														}),
														disabled: setOfferStatus.isPending,
														className: "flex-1 rounded-lg bg-terracotta-soft py-1.5 text-[11px] font-bold text-terracotta disabled:opacity-50",
														children: "رفض"
													})] }), (o.offices?.whatsapp || o.offices?.phone) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: whatsappHref(o.offices.whatsapp || o.offices.phone, `مرحبًا، بخصوص عرضكم على طلبي العقاري في تطبيق بيتي الخاص`),
														target: "_blank",
														rel: "noreferrer",
														className: "flex-1 rounded-lg bg-surface py-1.5 text-center text-[11px] font-bold text-forest ring-1 ring-line",
														children: "تواصل واتساب"
													})]
												})
											]
										}, o.id))
									})
								]
							}, r.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							icon: ClipboardList,
							title: "لا توجد طلبات بعد"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Row({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-1.5 text-xs font-semibold text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children
	})] });
}
function Pill({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", active ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
		children: label
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			inputMode: "numeric",
			value,
			onChange: (e) => onChange(e.target.value),
			className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestPage, {})
});
//#endregion
export { SplitComponent as component };
