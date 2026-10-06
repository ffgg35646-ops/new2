import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $ as ClipboardList, D as MessageCircle, F as LoaderCircle, S as Phone, m as Send } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { i as whatsappHref, n as useMyOffice } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { d as inquiryTypeLabel, f as kindLabel, p as listingLabel, r as INQUIRY_STATUSES, t as BOOKING_STATUS, u as inquiryStatusLabel } from "./constants-Bvy1nlDs.mjs";
import { i as timeAgo, n as formatDate, r as formatPrice } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as notifyWhatsApp } from "./notify-whatsapp-BLhdy-fm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.requests-PZnxj-XZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OfficeRequests() {
	const [tab, setTab] = (0, import_react.useState)("inbox");
	const { data: membership } = useMyOffice();
	const officeId = membership?.office?.id ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "الطلبات"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
								active: tab === "inbox",
								onClick: () => setTab("inbox"),
								label: "طلبات التواصل"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
								active: tab === "bookings",
								onClick: () => setTab("bookings"),
								label: "المعاينات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
								active: tab === "market",
								onClick: () => setTab("market"),
								label: "طلبات العملاء"
							})
						]
					}),
					tab === "inbox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InquiriesInbox, { officeId }) : tab === "bookings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsInbox, { officeId }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketRequests, { officeId })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function BookingsInbox({ officeId }) {
	const qc = useQueryClient();
	const [noteFor, setNoteFor] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const { data, isLoading } = useQuery({
		queryKey: ["office-bookings", officeId],
		enabled: !!officeId,
		queryFn: async () => {
			const { data: rows, error } = await supabase.from("viewing_bookings").select("id,user_id,visit_date,visit_time,status,office_note,created_at,properties(title)").eq("office_id", officeId).order("created_at", { ascending: false }).limit(60);
			if (error) throw error;
			const bookings = rows ?? [];
			const ids = [...new Set(bookings.map((b) => b.user_id))];
			if (ids.length) {
				const { data: profiles } = await supabase.from("profiles").select("id,full_name,phone").in("id", ids);
				const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
				for (const b of bookings) b.client = byId.get(b.user_id) ?? null;
			}
			return bookings;
		}
	});
	const setStatus = useMutation({
		mutationFn: async (vars) => {
			const { error } = await supabase.from("viewing_bookings").update({
				status: vars.status,
				office_note: vars.note?.trim() || null
			}).eq("id", vars.id);
			if (error) throw error;
			return vars;
		},
		onSuccess: (vars) => {
			notifyWhatsApp("booking_status", vars.id);
			setNoteFor(null);
			setNote("");
			toast.success("تم تحديث حالة الحجز");
			qc.invalidateQueries({ queryKey: ["office-bookings"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تحديث الحجز")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {});
	if (!data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: ClipboardList,
		title: "لا توجد حجوزات معاينة",
		description: "ستظهر هنا طلبات معاينة العملاء لعقاراتك."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: data.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-sm font-bold",
						children: b.properties?.title ?? "عقار"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", b.status === "accepted" ? "bg-forest-soft text-forest" : b.status === "rejected" || b.status === "cancelled" ? "bg-terracotta-soft text-terracotta" : "bg-sand text-muted-foreground"),
						children: BOOKING_STATUS[b.status] ?? b.status
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						b.client?.full_name || "عميل",
						" · ",
						formatDate(b.visit_date),
						" ·",
						" ",
						String(b.visit_time).slice(0, 5)
					]
				}),
				b.client?.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					dir: "ltr",
					href: `tel:${b.client.phone}`,
					className: "mt-1 block text-xs text-forest",
					children: b.client.phone
				}),
				b.office_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1.5 rounded-xl bg-sand p-2 text-[11px] text-muted-foreground",
					children: ["ملاحظتك: ", b.office_note]
				}),
				b.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [noteFor === b.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: note,
					onChange: (e) => setNote(e.target.value),
					placeholder: "ملاحظة للعميل (اختياري)",
					className: "mt-2 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => noteFor === b.id ? setStatus.mutate({
							id: b.id,
							status: "accepted",
							note
						}) : setNoteFor(b.id),
						disabled: setStatus.isPending,
						className: "flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background disabled:opacity-50",
						children: noteFor === b.id ? "تأكيد القبول" : "قبول"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setStatus.mutate({
							id: b.id,
							status: "rejected",
							note
						}),
						disabled: setStatus.isPending,
						className: "flex-1 rounded-xl bg-terracotta-soft py-2 text-xs font-bold text-terracotta disabled:opacity-50",
						children: "رفض"
					})]
				})] }),
				b.status === "accepted" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setStatus.mutate({
						id: b.id,
						status: "completed"
					}),
					disabled: setStatus.isPending,
					className: "mt-2 w-full rounded-xl bg-sand py-2 text-xs font-bold text-forest disabled:opacity-50",
					children: "تمت المعاينة ✓"
				})
			]
		}, b.id))
	});
}
function TabButton({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("flex-1 rounded-full py-2 text-xs font-semibold transition", active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line"),
		children: label
	});
}
function InquiriesInbox({ officeId }) {
	const qc = useQueryClient();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const { data, isLoading } = useQuery({
		queryKey: [
			"office-inquiries",
			officeId,
			filter
		],
		enabled: !!officeId,
		queryFn: async () => {
			let q = supabase.from("property_inquiries").select("*, properties(title,property_number)").eq("office_id", officeId).order("created_at", { ascending: false }).limit(60);
			if (filter !== "all") q = q.eq("status", filter);
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	const setStatus = useMutation({
		mutationFn: async (vars) => {
			const { error } = await supabase.from("property_inquiries").update({ status: vars.status }).eq("id", vars.id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["office-inquiries"] });
			qc.invalidateQueries({ queryKey: ["new-inquiries-count"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تحديث الحالة")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
				active: filter === "all",
				onClick: () => setFilter("all"),
				label: "الكل"
			}), INQUIRY_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
				active: filter === s.value,
				onClick: () => setFilter(s.value),
				label: s.label
			}, s.value))]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2.5",
			children: data.map((q) => {
				const prop = q.properties;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm font-bold",
									children: prop?.title ?? "عقار"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] text-muted-foreground",
									children: [
										prop?.property_number,
										" · ",
										timeAgo(q.created_at)
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta",
								children: inquiryTypeLabel(q.type)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-background p-2.5 text-xs ring-1 ring-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-semibold",
									children: q.contact_name
								}),
								q.contact_phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-muted-foreground",
									children: q.contact_phone
								}),
								q.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 leading-relaxed text-muted-foreground",
									children: q.message
								})
							]
						}),
						q.contact_phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `tel:${q.contact_phone}`,
								className: "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest py-2 text-xs font-bold text-background",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3.5" }), " اتصال"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: whatsappHref(q.contact_phone, `مرحبًا ${q.contact_name}`),
								target: "_blank",
								rel: "noreferrer",
								className: "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sand py-2 text-xs font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-3.5" }), " واتساب"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: q.status,
							onChange: (e) => setStatus.mutate({
								id: q.id,
								status: e.target.value
							}),
							className: "w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line outline-none focus:ring-forest",
							children: INQUIRY_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s.value,
								children: inquiryStatusLabel(s.value)
							}, s.value))
						})
					]
				}, q.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: ClipboardList,
			title: "لا توجد طلبات على عقاراتك",
			description: "ستصل هنا طلبات المعاينة والشراء والاستفسار من العملاء."
		})]
	});
}
function FilterChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition", active ? "bg-terracotta text-background" : "bg-surface text-muted-foreground ring-1 ring-line"),
		children: label
	});
}
function MarketRequests({ officeId }) {
	const qc = useQueryClient();
	const { governorateId } = useSelectedGovernorate();
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [message, setMessage] = (0, import_react.useState)("");
	const [price, setPrice] = (0, import_react.useState)("");
	const viewed = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const { data, isLoading } = useQuery({
		queryKey: [
			"open-requests",
			governorateId,
			officeId
		],
		enabled: !!officeId && !!governorateId,
		queryFn: async () => {
			const { data: officeProperties, error: propertiesError } = await supabase.from("properties").select("kind,neighborhood").eq("office_id", officeId).eq("governorate_id", governorateId).eq("is_published", true).eq("is_deleted", false);
			if (propertiesError) throw propertiesError;
			const matches = new Set((officeProperties ?? []).map((p) => `${p.kind}::${p.neighborhood}`));
			const kinds = new Set((officeProperties ?? []).map((p) => p.kind));
			if (!kinds.size) return [];
			const { data, error } = await supabase.from("property_requests").select("*, office_offers(id,office_id)").eq("governorate_id", governorateId).eq("status", "active").order("created_at", { ascending: false }).limit(100);
			if (error) throw error;
			return (data ?? []).filter((r) => {
				if (!kinds.has(r.kind)) return false;
				if (!r.neighborhood) return true;
				return matches.has(`${r.kind}::${r.neighborhood}`);
			});
		}
	});
	const sendOffer = useMutation({
		mutationFn: async (requestId) => {
			if (!officeId) throw new Error("مكتبك غير متاح");
			if (message.trim().length < 5) throw new Error("اكتب رسالة العرض");
			const { data: offer, error } = await supabase.from("office_offers").insert({
				request_id: requestId,
				office_id: officeId,
				message: message.trim(),
				price: price ? Number(price) : null
			}).select("id").single();
			if (error) throw error;
			if (offer?.id) {
				const { error: notificationError } = await supabase.rpc("notify_new_property_offer", { _offer_id: offer.id });
				if (notificationError) console.warn("[request] offer notification failed", notificationError);
			}
		},
		onSuccess: () => {
			toast.success("تم إرسال عرضك للعميل");
			setOpenId(null);
			setMessage("");
			setPrice("");
			qc.invalidateQueries({ queryKey: ["open-requests"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال العرض")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {});
	if (!data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: ClipboardList,
		title: "لا توجد طلبات نشطة حاليًا"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: data.map((r) => {
			const sent = r.office_offers?.some((o) => o.office_id === officeId);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-bold",
							children: [
								kindLabel(r.kind),
								" · ",
								listingLabel(r.listing)
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-muted-foreground",
							children: timeAgo(r.created_at)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs leading-relaxed text-muted-foreground",
						children: r.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 text-[11px] text-muted-foreground",
						children: [r.neighborhood ? `${r.neighborhood} · ` : "", r.budget_min || r.budget_max ? `${formatPrice(r.budget_min)} - ${formatPrice(r.budget_max)} ر.س` : "بدون ميزانية محددة"]
					}),
					sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 rounded-xl bg-forest-soft py-2 text-center text-xs font-semibold text-forest",
						children: "تم إرسال عرضك"
					}) : openId === r.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 3,
								value: message,
								onChange: (e) => setMessage(e.target.value),
								placeholder: "اكتب تفاصيل العرض المناسب للعميل",
								className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: price,
								onChange: (e) => setPrice(e.target.value),
								placeholder: "السعر المقترح (اختياري)",
								className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => sendOffer.mutate(r.id),
								disabled: sendOffer.isPending,
								className: "flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:opacity-60",
								children: [sendOffer.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), "إرسال العرض"]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setOpenId(r.id);
							if (!viewed.current.has(r.id)) {
								viewed.current.add(r.id);
								supabase.rpc("mark_property_request_view", { _request_id: r.id });
							}
						},
						className: "mt-2.5 w-full rounded-xl bg-terracotta py-2.5 text-sm font-bold text-background",
						children: "إرسال عرض"
					})
				]
			}, r.id);
		})
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeRequests, {})
});
//#endregion
export { SplitComponent as component };
