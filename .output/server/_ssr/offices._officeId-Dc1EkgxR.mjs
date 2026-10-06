import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { S as useParams, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Phone, Ct as BadgeCheck, J as FileCheckCorner, O as MessageCircle, _t as Building2, c as Star, j as MapPin, nt as Clock, o as UserPlus, p as Share2, pt as Check, vt as Bell, wt as ArrowRight, yt as BellOff } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { i as whatsappHref, t as shareLink } from "./office-C4hHv7Zt.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { a as LISTING_TYPES, l as VERIFICATION_STATUS } from "./constants-Bvy1nlDs.mjs";
import { i as timeAgo } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as effectivePlan } from "./plans-CricE-8e.mjs";
import { i as useFavorites, n as PropertyCard, t as PROPERTY_SELECT } from "./properties-B1QAcK-Q.mjs";
import { n as googleMapsUrl, t as getCurrentPosition } from "./location-C7S-OTk4.mjs";
import { i as useToggleFollow, r as useSetOfficeNotifications, t as useFollowState } from "./follows-CiwpByax.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offices._officeId-Dc1EkgxR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OfficePage() {
	const { officeId } = useParams({ from: "/offices/$officeId" });
	const [listing, setListing] = (0, import_react.useState)(null);
	const { favoriteIds, toggleFavorite } = useFavorites();
	const { userId } = useAuth();
	const [distance, setDistance] = (0, import_react.useState)(null);
	const [distanceLoading, setDistanceLoading] = (0, import_react.useState)(false);
	const { data: followState } = useFollowState(officeId);
	const isFollowing = followState?.following ?? false;
	const notifyOn = followState?.notify ?? false;
	const setNotify = useSetOfficeNotifications();
	const toggleFollow = useToggleFollow();
	const { data: office, isLoading } = useQuery({
		queryKey: ["office", officeId],
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,name,logo_url,plan,plan_expires_at,verification_status,address,phone,whatsapp,description,working_hours,license_number,fal_license_number,rating_avg,reviews_count,experience_years,latitude,longitude,updated_at,governorates(name_ar)").eq("id", officeId).eq("verification_status", "verified").maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const { data: properties } = useQuery({
		queryKey: [
			"office-properties",
			officeId,
			listing
		],
		queryFn: async () => {
			let q = supabase.from("properties").select(PROPERTY_SELECT).eq("office_id", officeId).eq("is_published", true).eq("is_deleted", false);
			if (listing) q = q.eq("listing", listing);
			const { data, error } = await q.order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: totalCount } = useQuery({
		queryKey: ["office-properties-count", officeId],
		queryFn: async () => {
			const { count, error } = await supabase.from("properties").select("id", {
				count: "exact",
				head: true
			}).eq("office_id", officeId).eq("is_published", true).eq("is_deleted", false);
			if (error) throw error;
			return count ?? 0;
		}
	});
	const { data: followersCount } = useQuery({
		queryKey: ["office-followers-count", officeId],
		queryFn: async () => {
			const { count, error } = await supabase.from("follows").select("id", {
				count: "exact",
				head: true
			}).eq("office_id", officeId);
			if (error) throw error;
			return count ?? 0;
		}
	});
	const { data: latestProperty } = useQuery({
		queryKey: ["office-latest-property", officeId],
		queryFn: async () => {
			const { data, error } = await supabase.from("properties").select("created_at").eq("office_id", officeId).eq("is_published", true).eq("is_deleted", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	async function calculateDistance() {
		if (!office?.latitude || !office?.longitude) {
			toast.error("موقع المكتب غير مضاف");
			return;
		}
		setDistanceLoading(true);
		try {
			const current = await getCurrentPosition();
			const toRad = (value) => value * Math.PI / 180;
			const earthRadius = 6371;
			const dLat = toRad(office.latitude - current.lat);
			const dLng = toRad(office.longitude - current.lng);
			const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(current.lat)) * Math.cos(toRad(office.latitude)) * Math.sin(dLng / 2) ** 2;
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			setDistance(earthRadius * c);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذّر حساب المسافة");
		} finally {
			setDistanceLoading(false);
		}
	}
	const { data: staff } = useQuery({
		queryKey: ["office-public-staff", officeId],
		queryFn: async () => {
			const { data, error } = await supabase.from("office_staff").select("id,name,job_title,phone").eq("office_id", officeId).eq("is_active", true);
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: reviews } = useQuery({
		queryKey: ["office-reviews", officeId],
		queryFn: async () => {
			const { data, error } = await supabase.from("office_reviews").select("id,rating,comment,created_at").eq("office_id", officeId).order("created_at", { ascending: false }).limit(10);
			if (error) throw error;
			return data ?? [];
		}
	});
	async function onShare() {
		const url = `${window.location.origin}/offices/${officeId}`;
		const res = await shareLink(office?.name ?? "مكتب عقاري", url);
		if (res === "copied") toast.success("تم نسخ رابط المكتب");
		if (res === "failed") toast.error("تعذّر مشاركة الرابط، انسخه من شريط العنوان");
	}
	function onToggleFollow() {
		if (!userId) {
			toast.error("سجّل الدخول لمتابعة المكتب");
			return;
		}
		toggleFollow.mutate({
			officeId,
			following: !!isFollowing
		}, {
			onSuccess: (nowFollowing) => toast.success(nowFollowing ? "تمت متابعة المكتب" : "تم إلغاء المتابعة"),
			onError: (e) => toast.error(e.message)
		});
	}
	const verified = office?.verification_status === "verified";
	const isPro = effectivePlan(office) === "pro";
	const lastActivity = office ? [office.updated_at, latestProperty?.created_at ?? null].filter(Boolean).sort().at(-1) ?? office.updated_at : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-20 flex items-center gap-2 bg-background/95 px-4 py-3 backdrop-blur",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/offices",
				className: "grid size-9 place-items-center rounded-full bg-sand",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display font-bold",
				children: "ملف المكتب"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 space-y-5 px-4 pb-10",
			children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : !office ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: BadgeCheck,
				title: "المكتب غير موجود"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-forest-soft font-display text-2xl font-extrabold text-forest",
								children: office.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: office.logo_url,
									alt: office.name,
									className: "size-full object-cover"
								}) : office.name.charAt(0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "truncate font-display text-lg font-extrabold",
											children: office.name
										}),
										verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4 shrink-0 text-forest" }),
										isPro && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta",
											children: "احترافي"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", verified ? "bg-forest-soft text-forest" : "bg-sand text-muted-foreground"),
									children: VERIFICATION_STATUS[office.verification_status] ?? "قيد المراجعة"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-2 gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 fill-terracotta text-terracotta" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: Number(office.rating_avg ?? 0).toFixed(1)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground",
											children: [
												"(",
												office.reviews_count ?? 0,
												" تقييم)"
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5 text-forest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: totalCount ?? 0
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "عقار معروض"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5 text-forest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: office.experience_years ?? 0
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "سنوات خبرة"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-3.5 text-forest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: followersCount ?? 0
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "متابع"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "col-span-2 flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5 text-forest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "آخر نشاط:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: lastActivity ? timeAgo(lastActivity) : "—"
										})
									]
								}),
								(office.license_number || office.fal_license_number) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "col-span-2 flex items-center gap-1.5 rounded-xl bg-background px-2.5 py-2 ring-1 ring-line",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "size-3.5 text-forest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "رقم الترخيص:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono font-bold",
											children: office.fal_license_number || office.license_number
										})
									]
								})
							]
						}),
						office.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted-foreground",
							children: office.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 space-y-1 text-xs text-muted-foreground",
							children: [
								office.working_hours && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5" }),
										" ",
										office.working_hours
									]
								}),
								(office.address || office.governorates) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), [office.governorates?.name_ar, office.address].filter(Boolean).join(" · ")]
								}),
								office.latitude != null && office.longitude != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: googleMapsUrl(office.latitude, office.longitude),
										target: "_blank",
										rel: "noreferrer",
										className: "flex-1 rounded-xl bg-forest-soft py-2 text-center text-xs font-bold text-forest",
										children: "فتح الموقع على الخريطة"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => void calculateDistance(),
										disabled: distanceLoading,
										className: "flex-1 rounded-xl bg-sand py-2 text-xs font-bold ring-1 ring-line disabled:opacity-60",
										children: distanceLoading ? "جاري الحساب..." : distance != null ? `${distance.toFixed(1)} كم` : "احسب المسافة"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-3 gap-2",
							children: [
								office.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `tel:${office.phone}`,
									className: "flex items-center justify-center gap-1.5 rounded-2xl bg-forest py-3 text-xs font-bold text-background",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" }), " اتصال"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-2xl bg-sand py-3 text-center text-xs text-muted-foreground",
									children: "لا يوجد رقم"
								}),
								(office.whatsapp || office.phone) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: whatsappHref(office.whatsapp || office.phone, `مرحبًا ${office.name}، لدي استفسار عن عروضكم العقارية.`),
									target: "_blank",
									rel: "noreferrer",
									className: "flex items-center justify-center gap-1.5 rounded-2xl bg-forest-soft py-3 text-xs font-bold text-forest",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }), " واتساب"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => void onShare(),
									className: "flex items-center justify-center gap-1.5 rounded-2xl bg-sand py-3 text-xs font-bold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), " مشاركة"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onToggleFollow,
							disabled: toggleFollow.isPending,
							"aria-pressed": !!isFollowing,
							className: cn("mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition disabled:opacity-60", isFollowing ? "bg-forest-soft text-forest ring-1 ring-forest/30" : "bg-terracotta text-background"),
							children: isFollowing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " متابَع"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), " متابعة"] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setNotify.mutate({
								officeId,
								notify: !notifyOn
							}, {
								onSuccess: (on) => toast.success(on ? "تم تفعيل إشعارات هذا المكتب" : "تم إيقاف إشعارات هذا المكتب"),
								onError: (e) => toast.error(e.message)
							}),
							disabled: setNotify.isPending,
							"aria-pressed": notifyOn,
							className: cn("mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition disabled:opacity-60", notifyOn ? "bg-forest-soft text-forest ring-1 ring-forest/30" : "bg-sand text-foreground ring-1 ring-line"),
							children: [notifyOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "size-4" }), notifyOn ? "إشعارات هذا المكتب مفعّلة" : "تفعيل إشعارات هذا المكتب"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-center text-[10px] leading-relaxed text-muted-foreground",
							children: "عند التفعيل ستصلك إشعارات بالعقارات الجديدة والعروض والتحديثات المهمة من هذا المكتب."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "عروض المكتب"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: !listing,
								onClick: () => setListing(null),
								label: "الكل"
							}), LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: listing === l.value,
								onClick: () => setListing(l.value),
								label: l.label
							}, l.value))]
						}),
						properties?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: properties.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyCard, {
								property: p,
								isFavorite: favoriteIds.has(p.id),
								onToggleFavorite: toggleFavorite
							}, p.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "لا توجد عروض مطابقة حاليًا."
						})
					]
				}),
				!!staff?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-extrabold",
						children: "المسوّقون العقاريون"
					}), staff.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-2xl bg-surface p-3.5 ring-1 ring-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-bold",
							children: s.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-muted-foreground",
							children: s.job_title ?? "مسوّق عقاري"
						})] }), s.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `tel:${s.phone}`,
							className: "text-xs font-semibold text-terracotta",
							children: "اتصال"
						})]
					}, s.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-extrabold",
							children: "آراء العملاء"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewForm, { officeId }),
						reviews?.length ? reviews.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-xs font-bold text-terracotta",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 fill-terracotta" }),
									" ",
									r.rating
								]
							}), r.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: r.comment
							})]
						}, r.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "لا توجد تقييمات بعد — كن أول من يقيّم هذا المكتب."
						})
					]
				})
			] })
		})]
	});
}
function ReviewForm({ officeId }) {
	const { userId, isOffice } = useAuth();
	const qc = useQueryClient();
	const [rating, setRating] = (0, import_react.useState)(0);
	const [comment, setComment] = (0, import_react.useState)("");
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	const { data: mine } = useQuery({
		queryKey: [
			"my-office-review",
			officeId,
			userId
		],
		enabled: !!userId && !isOffice,
		queryFn: async () => {
			const { data } = await supabase.from("office_reviews").select("rating,comment").eq("office_id", officeId).eq("user_id", userId).maybeSingle();
			if (data && !loaded) {
				setRating(data.rating);
				setComment(data.comment ?? "");
				setLoaded(true);
			}
			return data;
		}
	});
	const submit = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول لتقييم المكتب");
			if (rating < 1) throw new Error("اختر عدد النجوم أولًا");
			const { error } = await supabase.from("office_reviews").upsert({
				office_id: officeId,
				user_id: userId,
				rating,
				comment: comment.trim() || null
			}, { onConflict: "office_id,user_id" });
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success(mine ? "تم تحديث تقييمك" : "شكرًا! تم نشر تقييمك");
			qc.invalidateQueries({ queryKey: ["office-reviews", officeId] });
			qc.invalidateQueries({ queryKey: ["office", officeId] });
			qc.invalidateQueries({ queryKey: ["my-office-review", officeId] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال التقييم")
	});
	if (!userId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/auth/individual",
		className: "block rounded-2xl bg-sand p-3 text-center text-xs font-semibold text-forest",
		children: "سجّل الدخول لتقييم هذا المكتب"
	});
	if (isOffice) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs font-semibold text-muted-foreground",
				children: mine ? "عدّل تقييمك" : "قيّم تجربتك مع هذا المكتب"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-row-reverse justify-end gap-1",
				children: [
					1,
					2,
					3,
					4,
					5
				].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setRating(n),
					"aria-label": `${n} نجوم`,
					className: "p-0.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-6", n <= rating ? "fill-terracotta text-terracotta" : "text-muted-foreground") })
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: comment,
				onChange: (e) => setComment(e.target.value),
				rows: 2,
				placeholder: "اكتب رأيك (اختياري)…",
				className: "mt-2 w-full rounded-xl bg-sand px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => submit.mutate(),
				disabled: submit.isPending,
				className: "mt-2 w-full rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:opacity-60",
				children: mine ? "تحديث التقييم" : "إرسال التقييم"
			})
		]
	});
}
function Chip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition", active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line"),
		children: label
	});
}
//#endregion
export { OfficePage as component };
