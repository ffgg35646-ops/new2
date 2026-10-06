import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { M as Mail, _t as Building2, h as Search, m as Send, n as Users, pt as Check } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.notifications-DNRN7xeg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminNotifications() {
	const [audience, setAudience] = (0, import_react.useState)("individual");
	const [search, setSearch] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [notificationType, setNotificationType] = (0, import_react.useState)("general");
	const [propertyNumber, setPropertyNumber] = (0, import_react.useState)("");
	const recipientsQuery = useQuery({
		queryKey: ["admin-notification-recipients"],
		staleTime: 6e5,
		gcTime: 864e5,
		queryFn: async () => {
			const [profilesRes, rolesRes, officesRes] = await Promise.all([
				supabase.from("profiles").select("id,full_name,email").order("full_name"),
				supabase.from("user_roles").select("user_id,role"),
				supabase.from("offices").select("id,name,email,owner_id,is_deleted").eq("is_deleted", false).order("name")
			]);
			if (profilesRes.error) throw profilesRes.error;
			if (rolesRes.error) throw rolesRes.error;
			if (officesRes.error) throw officesRes.error;
			const profiles = profilesRes.data ?? [];
			const roleMap = /* @__PURE__ */ new Map();
			for (const row of rolesRes.data ?? []) {
				const roles = roleMap.get(row.user_id) ?? /* @__PURE__ */ new Set();
				roles.add(row.role);
				roleMap.set(row.user_id, roles);
			}
			const profileMap = new Map(profiles.map((p) => [p.id, {
				name: p.full_name || "بدون اسم",
				email: p.email || "بدون بريد"
			}]));
			const individuals = profiles.filter((p) => {
				const roles = roleMap.get(p.id);
				return roles?.has("individual") && !roles.has("admin");
			}).map((p) => ({
				userId: p.id,
				name: p.full_name || "بدون اسم",
				email: p.email || "بدون بريد",
				kind: "individual"
			}));
			const offices = (officesRes.data ?? []).filter((o) => !!o.owner_id).map((o) => {
				const profile = profileMap.get(o.owner_id);
				return {
					userId: o.owner_id,
					officeId: o.id,
					name: o.name || "بدون اسم",
					email: o.email || profile?.email || "بدون بريد",
					kind: "office"
				};
			});
			return [...individuals, ...offices];
		}
	});
	const recipients = recipientsQuery.data ?? [];
	const visible = (0, import_react.useMemo)(() => {
		const q = search.trim().toLocaleLowerCase();
		return recipients.filter((r) => {
			if (audience !== "all" && r.kind !== audience) return false;
			if (!q) return true;
			return r.name.toLocaleLowerCase().includes(q) || r.email.toLocaleLowerCase().includes(q);
		});
	}, [
		recipients,
		audience,
		search
	]);
	const toggle = (userId) => {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(userId)) next.delete(userId);
			else next.add(userId);
			return next;
		});
	};
	function selectVisible() {
		setSelected((current) => {
			const next = new Set(current);
			for (const recipient of visible) next.add(recipient.userId);
			return next;
		});
	}
	function clearSelected() {
		setSelected(/* @__PURE__ */ new Set());
	}
	const send = useMutation({
		mutationFn: async () => {
			if (!selected.size) throw new Error("اختر مستلمًا واحدًا على الأقل");
			if (title.trim().length < 2) throw new Error("اكتب عنوان الإشعار");
			if (body.trim().length < 2) throw new Error("اكتب نص الإشعار");
			let link = "/notifications";
			let type = "admin_message";
			if (notificationType === "property") {
				const number = propertyNumber.trim();
				if (!number) throw new Error("اكتب رقم العقار المرتبط بالإشعار");
				link = `/properties/${encodeURIComponent(number)}`;
				type = "admin_property";
			}
			const { data, error } = await supabase.rpc("admin_send_notifications", {
				_user_ids: [...selected],
				_title: title.trim(),
				_body: body.trim(),
				_type: type,
				_link: link
			});
			if (error) throw error;
			return Number(data ?? selected.size);
		},
		onSuccess: (count) => {
			toast.success(`تم إرسال الإشعار إلى ${count} مستخدم`);
			setTitle("");
			setBody("");
			setPropertyNumber("");
			setSelected(/* @__PURE__ */ new Set());
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال الإشعار")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4 pb-24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "إشعارات المستخدمين"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "إرسال إشعار لفرد أو عدة أفراد أو عدة مكاتب دفعة واحدة."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-bold",
								children: "المستلمون"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-1.5",
								children: [
									[
										"individual",
										"الأفراد",
										Users
									],
									[
										"office",
										"المكاتب",
										Building2
									],
									[
										"all",
										"الكل",
										Users
									]
								].map(([value, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setAudience(value),
									className: cn("flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition", audience === value ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
								}, value))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: search,
									onChange: (e) => setSearch(e.target.value),
									placeholder: "ابحث بالاسم أو البريد الإلكتروني...",
									className: "w-full rounded-2xl bg-sand py-3 pe-10 ps-3 text-sm outline-none focus:ring-2 focus:ring-forest"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										visible.length,
										" نتيجة ظاهرة",
										selected.size ? ` · ${selected.size} محدد` : ""
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: selectVisible,
										disabled: !visible.length,
										className: "rounded-lg bg-forest-soft px-2.5 py-1.5 font-bold text-forest disabled:opacity-50",
										children: "تحديد الظاهر"
									}), !!selected.size && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: clearSelected,
										className: "rounded-lg bg-terracotta-soft px-2.5 py-1.5 font-bold text-terracotta",
										children: "إلغاء"
									})]
								})]
							}),
							recipientsQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : !visible.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
								icon: Users,
								title: "لا يوجد مستلمون مطابقون",
								description: "غيّر نوع الجمهور أو كلمة البحث."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-[360px] space-y-1.5 overflow-y-auto pe-1",
								children: visible.map((recipient) => {
									const checked = selected.has(recipient.userId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => toggle(recipient.userId),
										className: cn("flex w-full items-center gap-3 rounded-2xl p-3 text-right ring-1 transition", checked ? "bg-forest-soft ring-forest/30" : "bg-background ring-line"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("grid size-5 shrink-0 place-items-center rounded-md ring-1", checked ? "bg-forest text-background ring-forest" : "bg-surface ring-line"),
												children: checked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block truncate text-sm font-bold",
													children: recipient.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block truncate text-[11px] text-muted-foreground",
													children: recipient.email
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "shrink-0 rounded-full bg-sand px-2 py-1 text-[10px] font-semibold",
												children: recipient.kind === "office" ? "مكتب" : "فرد"
											})
										]
									}, `${recipient.kind}-${recipient.userId}`);
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-4 text-terracotta" }), "محتوى الإشعار"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: title,
								onChange: (e) => setTitle(e.target.value),
								placeholder: "عنوان الموضوع",
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 6,
								value: body,
								onChange: (e) => setBody(e.target.value),
								placeholder: "اكتب الرسالة هنا...",
								className: "w-full resize-none rounded-2xl bg-sand px-3 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setNotificationType("general"),
									className: cn("rounded-xl py-2.5 text-xs font-bold", notificationType === "general" ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
									children: "إشعار عام"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setNotificationType("property"),
									className: cn("rounded-xl py-2.5 text-xs font-bold", notificationType === "property" ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
									children: "متعلق بعقار"
								})]
							}),
							notificationType === "property" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: propertyNumber,
								onChange: (e) => setPropertyNumber(e.target.value),
								placeholder: "رقم العقار المرتبط",
								inputMode: "text",
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-background p-3 text-xs ring-1 ring-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-bold",
									children: [
										"سيتم الإرسال إلى: ",
										selected.size,
										" مستلم"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-muted-foreground",
									children: "الإشعار سيظهر داخل جرس التطبيق لدى كل مستلم."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => send.mutate(),
								disabled: send.isPending || !selected.size,
								className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), send.isPending ? "جارٍ الإرسال..." : "إرسال الإشعار"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/home",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNotifications, {})
});
//#endregion
export { SplitComponent as component };
