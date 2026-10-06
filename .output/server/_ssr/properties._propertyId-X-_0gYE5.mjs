import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Maximize, C as Phone, G as Flag, L as LoaderCircle, O as MessageCircle, U as Heart, bt as BedDouble, f as ShieldCheck, gt as CalendarDays, j as MapPin, m as Send, p as Share2, t as X, tt as Compass, v as Ruler, wt as ArrowRight, xt as Bath } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { i as whatsappHref, t as shareLink } from "./office-C4hHv7Zt.mjs";
import { f as kindLabel, h as stateLabel, i as INQUIRY_TYPES, m as rentPeriodLabel, p as listingLabel } from "./constants-Bvy1nlDs.mjs";
import { i as timeAgo, n as formatDate, r as formatPrice, t as formatArea } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useFavorites, n as PropertyCard, t as PROPERTY_SELECT } from "./properties-B1QAcK-Q.mjs";
import { n as googleMapsUrl } from "./location-C7S-OTk4.mjs";
import { t as notifyWhatsApp } from "./notify-whatsapp-BLhdy-fm.mjs";
import { t as Route } from "./properties._propertyId-BBXCoXrJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties._propertyId-X-_0gYE5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REPORT_REASONS = [
	"معلومات غير صحيحة",
	"العقار غير متوفر",
	"سعر مضلّل",
	"صور غير حقيقية",
	"محتوى غير لائق",
	"احتيال أو نصب"
];
function PropertyDetail() {
	const { propertyId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { userId, profile, isOffice } = useAuth();
	const { favoriteIds, toggleFavorite } = useFavorites();
	const [bookingDate, setBookingDate] = (0, import_react.useState)("");
	const [inquiryType, setInquiryType] = (0, import_react.useState)(INQUIRY_TYPES[0].value);
	const [inquiryMessage, setInquiryMessage] = (0, import_react.useState)("");
	const [inquiryPhone, setInquiryPhone] = (0, import_react.useState)("");
	const [showReport, setShowReport] = (0, import_react.useState)(false);
	const [reportReason, setReportReason] = (0, import_react.useState)("");
	const [reportDetails, setReportDetails] = (0, import_react.useState)("");
	const [lightboxIndex, setLightboxIndex] = (0, import_react.useState)(null);
	const { data, isLoading } = useQuery({
		queryKey: ["property", propertyId],
		queryFn: async () => {
			const fields = "*, governorates(name_ar), offices(id,name,logo_url,phone,whatsapp,working_hours,license_number,verification_status,rating_avg,reviews_count), property_images(id,url,sort_order), agent:office_staff(id,name,job_title,phone)";
			const byId = await supabase.from("properties").select(fields).eq("id", propertyId).maybeSingle();
			if (byId.error) throw byId.error;
			if (byId.data) return byId.data;
			const byNumber = await supabase.from("properties").select(fields).eq("property_number", propertyId).maybeSingle();
			if (byNumber.error) throw byNumber.error;
			return byNumber.data;
		}
	});
	const { data: similar } = useQuery({
		queryKey: [
			"similar-properties",
			propertyId,
			data?.kind,
			data?.governorate_id
		],
		enabled: !!data?.id,
		queryFn: async () => {
			const { data: rows, error } = await supabase.from("properties").select(PROPERTY_SELECT).eq("office_id", data.office_id).eq("is_published", true).eq("is_deleted", false).neq("id", data.id).order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(4);
			if (error) throw error;
			return rows ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (!data?.id) return;
		supabase.from("property_views").insert({
			property_id: data.id,
			user_id: userId ?? null
		});
	}, [data?.id, userId]);
	const book = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول لحجز معاينة");
			if (!bookingDate) throw new Error("اختر تاريخ ووقت المعاينة");
			const { data: row, error } = await supabase.from("viewing_bookings").insert({
				property_id: data.id,
				user_id: userId,
				office_id: data.office_id,
				visit_date: bookingDate.slice(0, 10),
				visit_time: bookingDate.slice(11, 16)
			}).select("id").single();
			if (error) throw error;
			if (row) notifyWhatsApp("booking_created", row.id);
		},
		onSuccess: () => {
			toast.success("تم إرسال طلب المعاينة للمكتب");
			setBookingDate("");
			qc.invalidateQueries({ queryKey: ["bookings"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الحجز")
	});
	const inquire = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول لإرسال الطلب");
			const phone = (inquiryPhone || profile?.phone || "").trim();
			if (!phone) throw new Error("أضف رقم جوال للتواصل");
			const { data: row, error } = await supabase.from("property_inquiries").insert({
				property_id: data.id,
				office_id: data.office_id,
				user_id: userId,
				type: inquiryType,
				contact_name: profile?.full_name || "عميل",
				contact_phone: phone,
				message: inquiryMessage.trim() || null
			}).select("id").single();
			if (error) throw error;
			if (row) notifyWhatsApp("inquiry_created", row.id);
		},
		onSuccess: () => {
			toast.success("تم إرسال طلبك للمكتب");
			setInquiryMessage("");
			qc.invalidateQueries({ queryKey: ["office-inquiries"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال الطلب")
	});
	const startChat = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول لبدء المحادثة");
			const officeId = data.office_id;
			const { data: plan } = await supabase.rpc("office_effective_plan", { _office_id: officeId });
			if (plan !== "pro") throw new Error("الدردشة غير متاحة لهذا المكتب — تواصل عبر الاتصال أو واتساب");
			const { data: existing } = await supabase.from("conversations").select("id").eq("user_id", userId).eq("office_id", officeId).limit(1).maybeSingle();
			if (existing) return existing.id;
			const { data: created, error } = await supabase.from("conversations").insert({
				user_id: userId,
				office_id: officeId,
				property_id: data.id
			}).select("id").single();
			if (error) throw new Error("تعذّر بدء المحادثة");
			return created.id;
		},
		onSuccess: (id) => void navigate({
			to: "/chats",
			search: { c: id }
		}),
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر بدء المحادثة")
	});
	const report = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول للإبلاغ");
			if (!reportReason) throw new Error("اختر سبب البلاغ");
			const { error } = await supabase.from("reports").insert({
				reporter_id: userId,
				property_id: propertyId,
				reason: reportReason,
				details: reportDetails.trim() || null
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم إرسال البلاغ للإدارة");
			setShowReport(false);
			setReportReason("");
			setReportDetails("");
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الإرسال")
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto h-screen w-full max-w-md animate-shimmer bg-sand" });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-sm",
		children: "العقار غير موجود"
	});
	const images = [...data.cover_url ? [{
		id: "cover",
		url: data.cover_url
	}] : [], ...data.property_images ?? []];
	const office = data.offices;
	const agent = data.agent;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "no-scrollbar flex snap-x snap-mandatory overflow-x-auto",
						children: images.length ? images.map((img, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setLightboxIndex(index),
							className: "w-full shrink-0 snap-center",
							"aria-label": "عرض الصورة بالحجم الكامل",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: img.url,
								alt: data.title,
								className: "aspect-[4/3] w-full object-cover"
							})
						}, img.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid aspect-[4/3] w-full place-items-center bg-sand text-sm text-muted-foreground",
							children: "لا توجد صور"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/home" }),
						"aria-label": "رجوع",
						className: "absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-background/90 ring-1 ring-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => toggleFavorite(data.id),
						"aria-label": "المفضلة",
						className: "absolute top-4 left-4 grid size-9 place-items-center rounded-full bg-background/90 ring-1 ring-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-4", favoriteIds.has(data.id) ? "fill-terracotta text-terracotta" : "") })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-5 px-4 py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-xl leading-tight font-extrabold",
								children: data.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 rounded-full bg-terracotta-soft px-2.5 py-1 text-[11px] font-semibold text-terracotta",
								children: listingLabel(data.listing)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								data.neighborhood,
								" · ",
								data.governorates?.name_ar,
								" ·",
								" ",
								timeAgo(data.created_at)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 font-display text-2xl font-extrabold text-forest",
							children: [
								formatPrice(data.price),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base",
									children: "ر.س"
								}),
								data.listing === "rent" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm font-bold text-muted-foreground",
									children: [
										" ",
										"/ ",
										rentPeriodLabel(data.rent_period)
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: data.property_number
								}),
								" · ",
								stateLabel(data.state),
								" ·",
								" ",
								data.views_count,
								" مشاهدة · ",
								images.length,
								" صورة · أُضيف ",
								formatDate(data.created_at)
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: Maximize,
								label: "المساحة",
								value: formatArea(data.area)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: Compass,
								label: "النوع",
								value: kindLabel(data.kind)
							}),
							["villa", "apartment"].includes(data.kind) && data.rooms != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: BedDouble,
								label: "الغرف",
								value: String(data.rooms)
							}),
							["villa", "apartment"].includes(data.kind) && data.bathrooms != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: Bath,
								label: "دورات المياه",
								value: String(data.bathrooms)
							}),
							data.street_width != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: Ruler,
								label: "عرض الشارع",
								value: `${data.street_width} م`
							}),
							data.facing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: Compass,
								label: "الواجهة",
								value: data.facing
							}),
							data.age_years != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
								icon: CalendarDays,
								label: "عمر العقار",
								value: `${data.age_years} سنة`
							})
						]
					}),
					data.latitude != null && data.longitude != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: googleMapsUrl(data.latitude, data.longitude),
						target: "_blank",
						rel: "noreferrer",
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-soft py-3.5 font-display font-bold text-forest",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" }), " الموقع على الخريطة"]
					}),
					data.video_url && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-base font-bold",
							children: "فيديو العقار"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-3xl bg-black ring-1 ring-line",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: data.video_url,
								controls: true,
								playsInline: true,
								preload: "metadata",
								className: "aspect-video w-full"
							})
						})]
					}),
					data.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-bold",
						children: "الوصف"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground",
						children: data.description
					})] }),
					office && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [office.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: office.logo_url,
								alt: "",
								className: "size-11 rounded-xl object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-11 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest",
								children: office.name.charAt(0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 font-display text-sm font-bold",
										children: [office.name, office.verification_status === "verified" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4 text-forest" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted-foreground",
										children: [Number(office.rating_avg) > 0 ? `تقييم ${Number(office.rating_avg).toFixed(1)} (${office.reviews_count})` : "بدون تقييمات", office.license_number ? ` · ترخيص ${office.license_number}` : ""]
									}),
									office.working_hours && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground",
										children: office.working_hours
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/offices/$officeId",
										params: { officeId: office.id },
										className: "text-xs text-terracotta",
										children: "عرض صفحة المكتب"
									})
								]
							})]
						}), agent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-background p-3 text-xs ring-1 ring-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-semibold",
								children: ["المسوّق المسؤول: ", agent.name]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-muted-foreground",
								children: [agent.job_title || "مسوّق عقاري", agent.phone ? ` · ${agent.phone}` : ""]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2.5 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "flex items-center gap-2 font-display text-base font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4 text-terracotta" }), " إرسال طلب للمكتب"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: INQUIRY_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setInquiryType(t.value),
									className: cn("rounded-full px-3.5 py-1.5 text-xs font-semibold transition", inquiryType === t.value ? "bg-forest text-background" : "bg-background text-muted-foreground ring-1 ring-line"),
									children: t.label
								}, t.value))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: inquiryPhone || profile?.phone || "",
								onChange: (e) => setInquiryPhone(e.target.value),
								placeholder: "رقم الجوال للتواصل",
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 3,
								value: inquiryMessage,
								onChange: (e) => setInquiryMessage(e.target.value),
								placeholder: "اكتب تفاصيل طلبك (اختياري)",
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => inquire.mutate(),
								disabled: inquire.isPending,
								className: "w-full rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60",
								children: "إرسال الطلب"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2.5 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "flex items-center gap-2 font-display text-base font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4 text-terracotta" }), " حجز معاينة"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "datetime-local",
								value: bookingDate,
								onChange: (e) => setBookingDate(e.target.value),
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => book.mutate(),
								disabled: book.isPending,
								className: "w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
								children: "إرسال طلب المعاينة"
							})
						]
					}),
					!!similar?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-base font-bold",
							children: "عقارات أخرى من نفس المكتب"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: similar.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
								property: p,
								isFavorite: favoriteIds.has(p.id),
								onToggleFavorite: toggleFavorite
							}, p.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: async () => {
							if (await shareLink(data.title, window.location.href) === "copied") toast.success("تم نسخ رابط العقار");
						},
						className: "flex w-full items-center justify-center gap-1.5 rounded-2xl bg-sand py-3 text-sm font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), " مشاركة العقار"]
					}),
					showReport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "سبب البلاغ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: REPORT_REASONS.map((reason) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setReportReason(reason),
									className: "rounded-full px-3 py-1.5 text-[11px] font-semibold transition " + (reportReason === reason ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
									children: reason
								}, reason))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: reportDetails,
								onChange: (e) => setReportDetails(e.target.value),
								rows: 2,
								placeholder: "تفاصيل إضافية (اختياري)…",
								className: "mt-2 w-full rounded-xl bg-sand px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => report.mutate(),
									disabled: report.isPending,
									className: "flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background disabled:opacity-60",
									children: "إرسال البلاغ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowReport(false),
									className: "flex-1 rounded-xl bg-sand py-2 text-xs font-bold",
									children: "إلغاء"
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							if (!userId) {
								toast.error("سجّل الدخول للإبلاغ");
								return;
							}
							setShowReport(true);
						},
						className: "flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-3.5" }), " الإبلاغ عن هذا العرض"]
					})
				]
			}),
			lightboxIndex !== null && images[lightboxIndex] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "عرض صورة العقار",
				onClick: () => setLightboxIndex(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setLightboxIndex(null),
						className: "absolute top-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white",
						"aria-label": "إغلاق الصورة",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: images[lightboxIndex].url,
						alt: data.title,
						onClick: (e) => e.stopPropagation(),
						className: "max-h-[92vh] max-w-full object-contain"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-xs text-white",
						children: [
							lightboxIndex + 1,
							" / ",
							images.length
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed bottom-0 z-30 mx-auto flex w-full max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur",
				children: userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					!isOffice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => startChat.mutate(),
						disabled: startChat.isPending,
						className: "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60",
						children: [startChat.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), "مراسلة"]
					}),
					office?.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `tel:${office.phone}`,
						className: "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" }), " اتصال"]
					}),
					(office?.whatsapp || office?.phone) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: whatsappHref(office.whatsapp || office.phone, `مرحبًا، لدي استفسار عن العقار ${data.property_number}`),
						target: "_blank",
						rel: "noreferrer",
						className: "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sand py-3.5 font-display font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }), " واتساب"]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/auth/individual",
					className: "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" }), " سجّل الدخول للتواصل"]
				})
			})
		]
	});
}
function Spec({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-3 text-center ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mx-auto size-4 text-terracotta" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 text-sm font-bold",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] text-muted-foreground",
				children: label
			})
		]
	});
}
//#endregion
export { PropertyDetail as component };
