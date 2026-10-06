import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as MessageSquare, L as LoaderCircle, Q as Crown } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { n as useMyOffice } from "./office-C4hHv7Zt.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { t as ChatThread } from "./ChatThread-C4dplor1.mjs";
import { t as CHAT_LOCK_MESSAGE } from "./ProLock-DPJbMXDq.mjs";
import { r as useMyPlan } from "./plans-CricE-8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.chat-DBfiZpZz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OfficeChatPage() {
	const { data: membership } = useMyOffice();
	const officeId = membership?.office?.id ?? null;
	const { chatEnabled, isLoading } = useMyPlan();
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const qc = useQueryClient();
	(0, import_react.useEffect)(() => {
		if (!officeId) return;
		const channel = supabase.channel(`office-convs-${officeId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "conversations",
			filter: `office_id=eq.${officeId}`
		}, () => void qc.invalidateQueries({ queryKey: ["office-conversations", officeId] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [officeId, qc]);
	const conversations = useQuery({
		queryKey: ["office-conversations", officeId],
		enabled: !!officeId && chatEnabled,
		queryFn: async () => {
			const { data, error } = await supabase.from("conversations").select("id,user_id,property_id,updated_at,properties(title)").eq("office_id", officeId).order("updated_at", { ascending: false });
			if (error) throw error;
			const rows = data ?? [];
			const ids = [...new Set(rows.map((c) => c.user_id))];
			if (ids.length) {
				const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
				const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
				for (const c of rows) {
					c.client = byId.get(c.user_id) ?? null;
					const { data: latest } = await supabase.from("messages").select("body,image_url,created_at").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
					c.lastMessage = latest ?? null;
					const { count } = await supabase.from("messages").select("id", {
						count: "exact",
						head: true
					}).eq("conversation_id", c.id).neq("sender_id", c.user_id).is("read_at", null);
					c.unreadCount = count ?? 0;
				}
			}
			return rows;
		},
		refetchInterval: 3e4
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-2xl space-y-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "الدردشة"
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid place-items-center py-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
				}) : !chatEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl bg-surface p-5 text-center ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mx-auto grid size-12 place-items-center rounded-2xl bg-terracotta-soft text-terracotta",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-base font-extrabold",
							children: "🔒 الدردشة مقفلة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground",
							children: CHAT_LOCK_MESSAGE
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/office/subscription",
							className: "mt-5 block rounded-2xl bg-forest py-3.5 font-display font-bold text-background",
							children: "ترقية الباقة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/office/requests",
							className: "mt-2 block rounded-2xl bg-sand py-3 text-xs font-semibold text-forest",
							children: "عرض طلبات التواصل الواردة"
						})
					]
				}) : activeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatThread, {
					conversationId: activeId,
					onBack: () => setActiveId(null)
				}) : conversations.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid place-items-center py-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
				}) : conversations.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: conversations.data.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setActiveId(c.id),
						className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest",
								children: (c.client?.full_name || "؟").charAt(0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-bold",
									children: c.client?.full_name || "عميل"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[11px] text-muted-foreground",
									children: c.lastMessage?.body || (c.lastMessage?.image_url ? "📷 صورة" : null) || c.properties?.title || "محادثة عامة"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex shrink-0 flex-col items-end gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-muted-foreground",
									children: formatDate(c.lastMessage?.created_at ?? c.updated_at)
								}), !!c.unreadCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid min-w-5 place-items-center rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-background",
									children: c.unreadCount > 99 ? "99+" : c.unreadCount
								})]
							})
						]
					}) }, c.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: MessageSquare,
					title: "لا توجد محادثات بعد",
					description: "ستظهر هنا محادثاتك مع العملاء المهتمين بعقاراتك."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { variant: "office" })
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeChatPage, {})
});
//#endregion
export { SplitComponent as component };
