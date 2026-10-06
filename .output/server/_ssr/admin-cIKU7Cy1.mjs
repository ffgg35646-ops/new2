import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { C as Pencil, F as LoaderCircle, H as Flag, b as Power, f as ShieldCheck, i as UserRound, k as MapPin, s as Trash2, vt as ArrowRight, w as Package } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { l as VERIFICATION_STATUS } from "./constants-Bvy1nlDs.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as SupportChat } from "./SupportCenter-bJ8YAs81.mjs";
import { t as Route } from "./admin-Da_cGKlm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-cIKU7Cy1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminSupport() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const tickets = useQuery({
		queryKey: ["admin-support-tickets"],
		queryFn: async () => {
			const { data, error } = await supabase.from("support_tickets").select("id,ticket_number,user_id,status,created_at,updated_at").order("updated_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const people = useQuery({
		queryKey: ["admin-support-people", tickets.data?.map((ticket) => ticket.user_id)],
		enabled: !!tickets.data?.length,
		queryFn: async () => {
			const ids = [...new Set((tickets.data ?? []).map((ticket) => ticket.user_id))];
			if (!ids.length) return /* @__PURE__ */ new Map();
			const [profilesRes, rolesRes] = await Promise.all([supabase.from("profiles").select("id,full_name").in("id", ids), supabase.from("user_roles").select("user_id,role").in("user_id", ids)]);
			if (profilesRes.error) throw profilesRes.error;
			if (rolesRes.error) throw rolesRes.error;
			const result = /* @__PURE__ */ new Map();
			for (const profile of profilesRes.data ?? []) {
				const role = rolesRes.data?.find((item) => item.user_id === profile.id)?.role ?? "user";
				result.set(profile.id, {
					full_name: profile.full_name || "مستخدم",
					role
				});
			}
			return result;
		}
	});
	const selected = (0, import_react.useMemo)(() => tickets.data?.find((ticket) => ticket.id === activeId) ?? null, [tickets.data, activeId]);
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		const channel = supabase.channel("admin-support-tickets").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_tickets"
		}, () => {
			qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, qc]);
	const closeTicket = useMutation({
		mutationFn: async (ticketId) => {
			const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم إغلاق التذكرة");
			qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذّر إغلاق التذكرة");
		}
	});
	function roleLabel(role) {
		if (role === "office") return "مكتب";
		if (role === "individual") return "فرد";
		if (role === "admin") return "أدمن";
		return "مستخدم";
	}
	if (selected) {
		const person = people.data?.get(selected.user_id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setActiveId(null),
						className: "grid size-9 place-items-center rounded-full bg-sand",
						"aria-label": "رجوع",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate text-sm font-bold",
							children: person?.full_name || "مستخدم"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[10px] text-muted-foreground",
							children: [
								roleLabel(person?.role || "user"),
								" ",
								"· التذكرة #",
								selected.ticket_number
							]
						})]
					}),
					selected.status !== "closed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => closeTicket.mutate(selected.id),
						disabled: closeTicket.isPending,
						className: "rounded-full bg-terracotta-soft px-3 py-1.5 text-[10px] font-bold text-terracotta disabled:opacity-50",
						children: closeTicket.isPending ? "جاري الإغلاق" : "إغلاق"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-[60vh] overflow-hidden rounded-3xl ring-1 ring-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupportChat, {
					ticket: selected,
					onBack: () => setActiveId(null)
				})
			})]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-base font-extrabold",
			children: "تذاكر الدعم"
		}), tickets.isLoading || people.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid place-items-center py-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
		}) : tickets.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2.5",
			children: tickets.data.map((ticket) => {
				const person = people.data?.get(ticket.user_id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setActiveId(ticket.id),
					className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-right ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-xs font-extrabold text-forest",
							children: ["#", ticket.ticket_number]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-bold",
								children: person?.full_name || "مستخدم"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 block text-[10px] text-muted-foreground",
								children: [
									roleLabel(person?.role || "user"),
									" ",
									"·",
									" ",
									ticket.status === "closed" ? "مغلقة" : "مفتوحة",
									" ",
									"·",
									" ",
									formatDate(ticket.updated_at)
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "›"
						})
					]
				}, ticket.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "py-16 text-center text-sm text-muted-foreground",
			children: "لا توجد تذاكر دعم."
		})]
	});
}
function AdminPage() {
	const { isAdmin } = useAuth();
	const { tab } = Route.useSearch();
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "px-4 py-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: ShieldCheck,
				title: "هذه الصفحة للمشرفين فقط"
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto w-full max-w-6xl px-4 py-5",
			children: [
				tab === "dashboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminStats, {}),
				tab === "offices" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficesTab, {}),
				tab === "plans" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlansTab, {}),
				tab === "geo" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeoTab, {}),
				tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportsTab, {}),
				tab === "support" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminSupport, {}),
				tab === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalAdminTab, { title: "سياسة الخصوصية" }),
				tab === "terms" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalAdminTab, { title: "شروط الاستخدام" })
			]
		})]
	});
}
function AdminStats() {
	const stats = useQuery({
		queryKey: ["admin-dashboard-stats"],
		queryFn: async () => {
			const [offices, individuals, properties, reports] = await Promise.all([
				supabase.from("offices").select("id", {
					count: "exact",
					head: true
				}).eq("is_deleted", false),
				supabase.from("user_roles").select("user_id", {
					count: "exact",
					head: true
				}).eq("role", "individual"),
				supabase.from("properties").select("id", {
					count: "exact",
					head: true
				}).eq("is_deleted", false).eq("is_published", true),
				supabase.from("reports").select("id", {
					count: "exact",
					head: true
				}).eq("resolved", false)
			]);
			for (const result of [
				offices,
				individuals,
				properties,
				reports
			]) if (result.error) throw result.error;
			return {
				offices: offices.count ?? 0,
				individuals: individuals.count ?? 0,
				properties: properties.count ?? 0,
				openReports: reports.count ?? 0
			};
		}
	});
	const cards = [
		{
			label: "المكاتب",
			value: stats.data?.offices ?? 0,
			icon: Building2
		},
		{
			label: "الأفراد",
			value: stats.data?.individuals ?? 0,
			icon: Users
		},
		{
			label: "العقارات المنشورة",
			value: stats.data?.properties ?? 0,
			icon: BarChart3
		},
		{
			label: "البلاغات المفتوحة",
			value: stats.data?.openReports ?? 0,
			icon: Flag
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-5",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-extrabold",
			children: "لوحة الإدارة"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "الإحصائيات الرئيسية للمنصة."
		})] }), stats.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 gap-3 md:grid-cols-4",
			children: cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-32 animate-pulse rounded-3xl bg-surface ring-1 ring-line" }, card.label))
		}) : stats.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-3xl bg-destructive/5 p-5 text-sm text-destructive ring-1 ring-line",
			children: "تعذّر تحميل إحصائيات لوحة الإدارة."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 gap-3 md:grid-cols-4",
			children: cards.map(({ label, value, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 font-display text-3xl font-extrabold",
						children: value
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs font-semibold text-muted-foreground",
						children: label
					})
				]
			}, label))
		})]
	});
}
function LegalAdminTab({ title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-xl font-extrabold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "إدارة المحتوى القانوني الظاهر للمستخدمين."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				rows: 18,
				defaultValue: title === "سياسة الخصوصية" ? "اكتب هنا سياسة الخصوصية الخاصة بمنصة عقار البطين..." : "اكتب هنا شروط الاستخدام الخاصة بمنصة عقار البطين...",
				className: "w-full rounded-2xl bg-background p-4 text-sm leading-7 outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background",
				children: "حفظ"
			})]
		})]
	});
}
function PlansTab() {
	const qc = useQueryClient();
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [price, setPrice] = (0, import_react.useState)("0");
	const [duration, setDuration] = (0, import_react.useState)("0");
	const [propertyLimit, setPropertyLimit] = (0, import_react.useState)("");
	const [featuredLimit, setFeaturedLimit] = (0, import_react.useState)("0");
	const [chatEnabled, setChatEnabled] = (0, import_react.useState)(false);
	const [verificationIncluded, setVerificationIncluded] = (0, import_react.useState)(false);
	const [featuresText, setFeaturesText] = (0, import_react.useState)("");
	const { data: packages = [], isLoading } = useQuery({
		queryKey: ["admin-package-catalog"],
		queryFn: async () => {
			const { data, error } = await supabase.from("package_catalog").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	function resetForm() {
		setEditingId(null);
		setName("");
		setCode("");
		setDescription("");
		setPrice("0");
		setDuration("0");
		setPropertyLimit("");
		setFeaturedLimit("0");
		setChatEnabled(false);
		setVerificationIncluded(false);
		setFeaturesText("");
	}
	function editPackage(pkg) {
		setEditingId(pkg.id);
		setName(pkg.name ?? "");
		setCode(pkg.code ?? "");
		setDescription(pkg.description ?? "");
		setPrice(String(pkg.price ?? 0));
		setDuration(String(pkg.duration_days ?? 0));
		setPropertyLimit(pkg.property_limit == null ? "" : String(pkg.property_limit));
		setFeaturedLimit(String(pkg.featured_limit ?? 0));
		setChatEnabled(Boolean(pkg.chat_enabled));
		setVerificationIncluded(Boolean(pkg.verification_included));
		setFeaturesText(Array.isArray(pkg.features) ? pkg.features.map((x) => String(x)).join("\n") : "");
	}
	const save = useMutation({
		mutationFn: async () => {
			const cleanName = name.trim();
			const cleanCode = code.trim().toLowerCase();
			if (!cleanName) throw new Error("اكتب اسم الباقة");
			if (!cleanCode) throw new Error("اكتب رمز الباقة");
			const numericPrice = Number(price);
			const numericDuration = Number(duration);
			const numericFeatured = Number(featuredLimit);
			if (!Number.isFinite(numericPrice) || numericPrice < 0) throw new Error("السعر غير صحيح");
			if (!Number.isInteger(numericDuration) || numericDuration < 0) throw new Error("مدة الباقة غير صحيحة");
			if (!Number.isInteger(numericFeatured) || numericFeatured < 0) throw new Error("حد العقارات المميزة غير صحيح");
			let numericPropertyLimit = null;
			if (propertyLimit.trim()) {
				numericPropertyLimit = Number(propertyLimit);
				if (!Number.isInteger(numericPropertyLimit) || numericPropertyLimit < 0) throw new Error("حد العقارات غير صحيح");
			}
			const features = featuresText.split("\n").map((x) => x.trim()).filter(Boolean);
			const payload = {
				code: cleanCode,
				name: cleanName,
				description: description.trim() || null,
				price: numericPrice,
				duration_days: numericDuration,
				property_limit: numericPropertyLimit,
				featured_limit: numericFeatured,
				chat_enabled: chatEnabled,
				verification_included: verificationIncluded,
				features
			};
			if (editingId) {
				const { error } = await supabase.from("package_catalog").update(payload).eq("id", editingId);
				if (error) throw error;
			} else {
				const { data: last } = await supabase.from("package_catalog").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
				const { error } = await supabase.from("package_catalog").insert({
					...payload,
					sort_order: Number(last?.sort_order ?? 0) + 1,
					is_active: true
				});
				if (error) throw error;
			}
		},
		onSuccess: () => {
			toast.success(editingId ? "تم تعديل الباقة" : "تمت إضافة الباقة");
			resetForm();
			qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
			qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
		},
		onError: (e) => {
			toast.error(e instanceof Error ? e.message : "تعذّر حفظ الباقة");
		}
	});
	const toggle = useMutation({
		mutationFn: async (pkg) => {
			const { error } = await supabase.from("package_catalog").update({ is_active: !pkg.is_active }).eq("id", pkg.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة الباقة");
			qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
			qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
		},
		onError: () => toast.error("تعذّر تحديث حالة الباقة")
	});
	const remove = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("package_catalog").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم حذف الباقة");
			qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
			qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
		},
		onError: (e) => {
			toast.error(e instanceof Error ? "لا يمكن حذف باقة مستخدمة حاليًا. عطّلها بدلًا من حذفها." : "تعذّر حذف الباقة");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		dir: "rtl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-extrabold",
				children: "إدارة الباقات"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "إضافة وتعديل وحذف وتعطيل الباقات، مع تحديد السعر والمدة والميزات والحدود."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: editingId ? "تعديل الباقة" : "إضافة باقة جديدة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "اسم الباقة",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: code,
							onChange: (e) => setCode(e.target.value),
							placeholder: "رمز الباقة بالإنجليزية مثل: basic",
							dir: "ltr",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							rows: 2,
							value: description,
							onChange: (e) => setDescription(e.target.value),
							placeholder: "وصف الباقة",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0",
								value: price,
								onChange: (e) => setPrice(e.target.value),
								placeholder: "السعر",
								className: "rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0",
								value: duration,
								onChange: (e) => setDuration(e.target.value),
								placeholder: "المدة بالأيام",
								className: "rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0",
								value: propertyLimit,
								onChange: (e) => setPropertyLimit(e.target.value),
								placeholder: "حد العقارات — فارغ = غير محدود",
								className: "rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0",
								value: featuredLimit,
								onChange: (e) => setFeaturedLimit(e.target.value),
								placeholder: "حد العقارات المميزة",
								className: "rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 rounded-xl bg-sand p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: chatEnabled,
								onChange: (e) => setChatEnabled(e.target.checked)
							}), "السماح بالدردشة"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 rounded-xl bg-sand p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: verificationIncluded,
								onChange: (e) => setVerificationIncluded(e.target.checked)
							}), "توثيق المكتب مع الباقة"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							rows: 7,
							value: featuresText,
							onChange: (e) => setFeaturesText(e.target.value),
							placeholder: "مميزات الباقة — كل ميزة في سطر\nميزة 1\nميزة 2\nميزة 3",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm leading-6 outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => save.mutate(),
								disabled: save.isPending,
								className: "flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50",
								children: save.isPending ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة الباقة"
							}), editingId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: resetForm,
								className: "rounded-xl bg-sand px-4 text-sm font-bold",
								children: "إلغاء"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "space-y-2.5",
				children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground ring-1 ring-line",
					children: "جارٍ تحميل الباقات..."
				}) : !packages.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Package,
					title: "لا توجد باقات"
				}) : packages.map((pkg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display text-sm font-extrabold",
										children: pkg.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full px-2 py-0.5 text-[10px] font-bold " + (pkg.is_active ? "bg-forest-soft text-forest" : "bg-sand text-muted-foreground"),
										children: pkg.is_active ? "مفعلة" : "متوقفة"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 text-xs text-muted-foreground",
									children: ["الرمز: ", pkg.code]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 text-sm font-bold",
									children: [
										Number(pkg.price).toLocaleString("ar-SA"),
										" ريال",
										Number(pkg.duration_days) > 0 && ` · ${pkg.duration_days} يوم`
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 text-[11px] text-muted-foreground",
									children: [
										"العقارات:",
										" ",
										pkg.property_limit == null ? "غير محدودة" : pkg.property_limit,
										" · ",
										"المميزة: ",
										pkg.featured_limit ?? 0,
										" · ",
										"الدردشة: ",
										pkg.chat_enabled ? "نعم" : "لا",
										" · ",
										"التوثيق: ",
										pkg.verification_included ? "نعم" : "لا"
									]
								}),
								Array.isArray(pkg.features) && pkg.features.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 space-y-1",
									children: pkg.features.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "text-[11px] text-muted-foreground",
										children: ["✓ ", f]
									}, `${pkg.id}-${i}`))
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 flex-col gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => editPackage(pkg),
									className: "grid size-9 place-items-center rounded-xl bg-sand",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => toggle.mutate(pkg),
									className: "grid size-9 place-items-center rounded-xl bg-sand",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										if (window.confirm(`حذف الباقة «${pkg.name}»؟`)) remove.mutate(pkg.id);
									},
									className: "grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						})]
					})
				}, pkg.id))
			})
		]
	});
}
function OfficesTab() {
	const qc = useQueryClient();
	const { data } = useQuery({
		queryKey: ["admin-offices"],
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,name,phone,verification_status,rejection_reason,commercial_register,license_number,created_at").eq("is_deleted", false).order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const [rejectFor, setRejectFor] = (0, import_react.useState)(null);
	const [reason, setReason] = (0, import_react.useState)("");
	const setStatus = useMutation({
		mutationFn: async ({ id, status, rejectionReason }) => {
			const patch = { verification_status: status };
			patch["rejection_reason"] = status === "rejected" ? rejectionReason?.trim() || null : null;
			const { error } = await supabase.from("offices").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة المكتب");
			setRejectFor(null);
			setReason("");
			qc.invalidateQueries({ queryKey: ["admin-offices"] });
		},
		onError: () => toast.error("تعذّر التحديث")
	});
	if (!data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: ShieldCheck,
		title: "لا توجد مكاتب مسجلة"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: data.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm font-bold",
						children: o.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold",
						children: VERIFICATION_STATUS[o.verification_status]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					dir: "ltr",
					className: "mt-0.5 text-right text-[11px] text-muted-foreground",
					children: [
						o.phone,
						" · CR ",
						o.commercial_register ?? "—",
						" · Lic ",
						o.license_number ?? "—"
					]
				}),
				o.rejection_reason && o.verification_status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1.5 rounded-xl bg-destructive/5 p-2 text-[11px] text-destructive",
					children: ["سبب الرفض: ", o.rejection_reason]
				}),
				rejectFor === o.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: reason,
						onChange: (e) => setReason(e.target.value),
						placeholder: "سبب الرفض (يظهر للمكتب)…",
						className: "w-full rounded-xl bg-sand px-3 py-2 text-xs ring-1 ring-line outline-none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setStatus.mutate({
								id: o.id,
								status: "rejected",
								rejectionReason: reason
							}),
							className: "flex-1 rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive",
							children: "تأكيد الرفض"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setRejectFor(null);
								setReason("");
							},
							className: "flex-1 rounded-xl bg-sand py-2 text-xs font-bold",
							children: "إلغاء"
						})]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setStatus.mutate({
							id: o.id,
							status: "verified"
						}),
						className: "flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background",
						children: "توثيق"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setRejectFor(o.id);
							setReason("");
						},
						className: "flex-1 rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive",
						children: "رفض"
					})]
				})
			]
		}, o.id))
	});
}
function GeoTab() {
	const qc = useQueryClient();
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [govName, setGovName] = (0, import_react.useState)("");
	const [govCode, setGovCode] = (0, import_react.useState)("");
	const [govBanner, setGovBanner] = (0, import_react.useState)("");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editName, setEditName] = (0, import_react.useState)("");
	const [editCode, setEditCode] = (0, import_react.useState)("");
	const [editBanner, setEditBanner] = (0, import_react.useState)("");
	const [hood, setHood] = (0, import_react.useState)("");
	const { data: govs = [], isLoading } = useQuery({
		queryKey: ["admin-governorates"],
		queryFn: async () => {
			const { data, error } = await supabase.from("governorates").select("id,name_ar,code,is_active,banner_url,neighborhoods(id,name_ar,is_active)").order("sort_order", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	function resetEdit() {
		setEditingId(null);
		setEditName("");
		setEditCode("");
		setEditBanner("");
	}
	function startEdit(g) {
		setEditingId(g.id);
		setEditName(g.name_ar ?? "");
		setEditCode(g.code ?? "");
		setEditBanner(g.banner_url ?? "");
	}
	const addGov = useMutation({
		mutationFn: async () => {
			const name = govName.trim();
			const code = govCode.trim().toUpperCase();
			if (!name) throw new Error("اكتب اسم المحافظة");
			if (!code) throw new Error("اكتب كود المحافظة");
			const { data: last } = await supabase.from("governorates").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
			const { error } = await supabase.from("governorates").insert({
				name_ar: name,
				code,
				banner_url: govBanner.trim() || null,
				sort_order: Number(last?.sort_order ?? 0) + 1,
				is_active: true
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تمت إضافة المحافظة");
			setGovName("");
			setGovCode("");
			setGovBanner("");
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["governorates"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّرت إضافة المحافظة")
	});
	const updateGov = useMutation({
		mutationFn: async () => {
			if (!editingId) throw new Error("اختر محافظة");
			const name = editName.trim();
			const code = editCode.trim().toUpperCase();
			if (!name) throw new Error("اكتب اسم المحافظة");
			if (!code) throw new Error("اكتب كود المحافظة");
			const { error } = await supabase.from("governorates").update({
				name_ar: name,
				code,
				banner_url: editBanner.trim() || null
			}).eq("id", editingId);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تعديل المحافظة");
			resetEdit();
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["governorates"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تعديل المحافظة")
	});
	const toggleGov = useMutation({
		mutationFn: async (g) => {
			const { error } = await supabase.from("governorates").update({ is_active: !g.is_active }).eq("id", g.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة المحافظة");
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["governorates"] });
		},
		onError: () => toast.error("تعذّر تحديث حالة المحافظة")
	});
	const deleteGov = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("governorates").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم حذف المحافظة");
			setSelected(null);
			resetEdit();
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["governorates"] });
		},
		onError: () => toast.error("لا يمكن حذف المحافظة لأنها مرتبطة ببيانات موجودة. أوقفها بدل الحذف.")
	});
	const addHood = useMutation({
		mutationFn: async () => {
			if (!selected) throw new Error("اختر المحافظة");
			if (!hood.trim()) throw new Error("اكتب اسم الحي");
			const { error } = await supabase.from("neighborhoods").insert({
				governorate_id: selected,
				name_ar: hood.trim(),
				is_active: true
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تمت إضافة الحي");
			setHood("");
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["neighborhoods"] });
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّرت إضافة الحي")
	});
	const toggleHood = useMutation({
		mutationFn: async (n) => {
			const { error } = await supabase.from("neighborhoods").update({ is_active: !n.is_active }).eq("id", n.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم تحديث حالة الحي");
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["neighborhoods"] });
		},
		onError: () => toast.error("تعذّر تحديث حالة الحي")
	});
	const deleteHood = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم حذف الحي");
			qc.invalidateQueries({ queryKey: ["admin-governorates"] });
			qc.invalidateQueries({ queryKey: ["neighborhoods"] });
		},
		onError: () => toast.error("لا يمكن حذف الحي لأنه مرتبط ببيانات موجودة.")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		dir: "rtl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-extrabold",
				children: "المحافظات والأحياء"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "المحافظات النشطة تظهر تلقائيًا في التسجيل والاختيارات داخل المنصة."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: "إضافة محافظة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: govName,
							onChange: (e) => setGovName(e.target.value),
							placeholder: "اسم المحافظة",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: govCode,
							onChange: (e) => setGovCode(e.target.value),
							placeholder: "كود المحافظة مثل: CAI",
							dir: "ltr",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: govBanner,
							onChange: (e) => setGovBanner(e.target.value),
							placeholder: "رابط صورة المحافظة (اختياري)",
							dir: "ltr",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => addGov.mutate(),
							disabled: addGov.isPending,
							className: "w-full rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50",
							children: addGov.isPending ? "جارٍ الإضافة..." : "إضافة المحافظة"
						})
					]
				})]
			}),
			editingId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-surface p-4 ring-1 ring-forest",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-sm font-extrabold",
					children: "تعديل المحافظة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: editName,
							onChange: (e) => setEditName(e.target.value),
							placeholder: "اسم المحافظة",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: editCode,
							onChange: (e) => setEditCode(e.target.value),
							placeholder: "الكود",
							dir: "ltr",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: editBanner,
							onChange: (e) => setEditBanner(e.target.value),
							placeholder: "رابط الصورة",
							dir: "ltr",
							className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => updateGov.mutate(),
								disabled: updateGov.isPending,
								className: "flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50",
								children: "حفظ التعديل"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: resetEdit,
								className: "rounded-xl bg-sand px-4 text-sm font-bold",
								children: "إلغاء"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "space-y-2.5",
				children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground ring-1 ring-line",
					children: "جارٍ تحميل المحافظات..."
				}) : govs.length ? govs.map((g) => {
					const neighborhoods = Array.isArray(g.neighborhoods) ? g.neighborhoods : [];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-terracotta" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											setSelected(selected === g.id ? null : g.id);
										},
										className: "min-w-0 flex-1 text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "truncate text-sm font-bold",
											children: g.name_ar
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-0.5 text-[10px] text-muted-foreground",
											children: [
												g.code,
												" · ",
												neighborhoods.length,
												" حي"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full px-2 py-1 text-[10px] font-bold " + (g.is_active ? "bg-forest-soft text-forest" : "bg-sand text-muted-foreground"),
										children: g.is_active ? "مفعلة" : "متوقفة"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => startEdit(g),
										className: "rounded-xl bg-sand py-2 text-xs font-bold",
										children: "تعديل"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => toggleGov.mutate(g),
										className: "rounded-xl bg-sand py-2 text-xs font-bold",
										children: g.is_active ? "إيقاف" : "تفعيل"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											if (window.confirm(`حذف محافظة «${g.name_ar}»؟`)) deleteGov.mutate(g.id);
										},
										className: "rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive",
										children: "حذف"
									})
								]
							}),
							selected === g.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 border-t border-line pt-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-bold",
										children: "الأحياء"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 space-y-1.5",
										children: neighborhoods.length ? neighborhoods.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 rounded-xl bg-sand p-2.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "min-w-0 flex-1 text-xs",
													children: n.name_ar
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[9px] font-bold " + (n.is_active ? "text-forest" : "text-muted-foreground"),
													children: n.is_active ? "مفعل" : "متوقف"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => toggleHood.mutate(n),
													className: "text-[10px] font-bold text-forest",
													children: n.is_active ? "إيقاف" : "تفعيل"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => {
														if (window.confirm(`حذف حي «${n.name_ar}»؟`)) deleteHood.mutate(n.id);
													},
													className: "text-[10px] font-bold text-destructive",
													children: "حذف"
												})
											]
										}, n.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											children: "لا توجد أحياء."
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: hood,
											onChange: (e) => setHood(e.target.value),
											placeholder: "اسم حي جديد",
											className: "flex-1 rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => addHood.mutate(),
											disabled: addHood.isPending,
											className: "rounded-xl bg-forest px-4 text-xs font-bold text-background",
											children: "إضافة"
										})]
									})
								]
							})
						]
					}, g.id);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: MapPin,
					title: "لا توجد محافظات",
					description: "أضف أول محافظة من النموذج أعلاه."
				})
			})
		]
	});
}
function ReportsTab() {
	const qc = useQueryClient();
	const { data } = useQuery({
		queryKey: ["admin-reports"],
		queryFn: async () => {
			const { data, error } = await supabase.from("reports").select("id,reporter_id,reason,details,resolved,created_at,property_id,office_id,properties(title)").order("created_at", { ascending: false });
			if (error) throw error;
			const rows = data ?? [];
			const ids = /* @__PURE__ */ new Set();
			for (const row of rows) {
				ids.add(row.reporter_id);
				if (!row.details) continue;
				try {
					const details = JSON.parse(row.details);
					if (details.reported_user_id) ids.add(details.reported_user_id);
				} catch {}
			}
			const profileMap = /* @__PURE__ */ new Map();
			const roleMap = /* @__PURE__ */ new Map();
			if (ids.size) {
				const idList = [...ids];
				const [profilesRes, rolesRes] = await Promise.all([supabase.from("profiles").select("id,full_name,phone").in("id", idList), supabase.from("user_roles").select("user_id,role").in("user_id", idList)]);
				for (const profile of profilesRes.data ?? []) profileMap.set(profile.id, {
					full_name: profile.full_name,
					phone: profile.phone
				});
				for (const role of rolesRes.data ?? []) if (!roleMap.has(role.user_id)) roleMap.set(role.user_id, role.role);
			}
			return rows.map((row) => {
				let chatDetails = {};
				if (row.details) try {
					chatDetails = JSON.parse(row.details);
				} catch {}
				return {
					...row,
					reporter_name: profileMap.get(row.reporter_id)?.full_name || "مستخدم",
					reporter_role: roleMap.get(row.reporter_id) || "unknown",
					reported_name: chatDetails.reported_user_id ? profileMap.get(chatDetails.reported_user_id)?.full_name || "مستخدم" : null,
					reported_role: chatDetails.reported_user_id ? roleMap.get(chatDetails.reported_user_id) || "unknown" : null,
					chatDetails
				};
			});
		}
	});
	const resolve = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
		onError: () => toast.error("تعذّر التحديث")
	});
	if (!data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Flag,
		title: "لا توجد بلاغات"
	});
	function roleLabel(role) {
		if (role === "office") return "مكتب";
		if (role === "individual") return "فرد";
		if (role === "admin") return "أدمن";
		return "مستخدم";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: data.map((report) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl bg-surface p-3.5 ring-1 ring-line",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold",
						children: report.reason
					}), report.resolved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-forest",
						children: "تمت المعالجة"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => resolve.mutate(report.id),
						className: "rounded-full bg-forest px-3 py-1 text-[11px] font-bold text-background",
						children: "معالجة"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 rounded-xl bg-background p-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold",
						children: "صاحب البلاغ:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs",
						children: [report.reporter_name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ms-1 text-[10px] text-muted-foreground",
							children: [
								"(",
								roleLabel(report.reporter_role),
								")"
							]
						})]
					})]
				}),
				report.reported_name && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 rounded-xl bg-background p-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold",
						children: "المبلغ عليه:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs",
						children: [report.reported_name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ms-1 text-[10px] text-muted-foreground",
							children: [
								"(",
								roleLabel(report.reported_role ?? "unknown"),
								")"
							]
						})]
					})]
				}),
				report.chatDetails.source === "chat" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 rounded-xl bg-sand p-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold text-forest",
							children: "بلاغ من الدردشة"
						}),
						report.chatDetails.message_body && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs",
							children: [
								"الرسالة:",
								" ",
								report.chatDetails.message_body
							]
						}),
						report.chatDetails.message_image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: report.chatDetails.message_image_url,
							target: "_blank",
							rel: "noreferrer",
							className: "mt-2 block text-[11px] font-bold text-forest",
							children: "عرض الصورة المبلغ عنها"
						})
					]
				}),
				report.properties?.title && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-[11px] font-semibold text-forest",
					children: [
						"العقار:",
						" ",
						report.properties.title
					]
				}),
				!report.chatDetails.source && report.details && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted-foreground",
					children: report.details
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[10px] text-muted-foreground",
					children: new Date(report.created_at).toLocaleString("ar-IQ")
				})
			]
		}, report.id))
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/admin/login",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPage, {})
});
//#endregion
export { SplitComponent as component };
