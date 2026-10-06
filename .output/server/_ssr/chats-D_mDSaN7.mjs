import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as MessageSquare, F as LoaderCircle, dt as Building2 } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { t as Route } from "./chats-BwhXhj08.mjs";
import { t as ChatThread } from "./ChatThread-C4dplor1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chats-D_mDSaN7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChatsPage() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const { c } = Route.useSearch();
	const navigate = Route.useNavigate();
	const activeId = c ?? null;
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		const channel = supabase.channel(`my-convs-${userId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "conversations",
			filter: `user_id=eq.${userId}`
		}, () => void qc.invalidateQueries({ queryKey: ["my-conversations", userId] })).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, qc]);
	const conversations = useQuery({
		queryKey: ["my-conversations", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("conversations").select("id,office_id,property_id,updated_at,properties(title),offices(name,logo_url)").eq("user_id", userId).order("updated_at", { ascending: false });
			if (error) throw error;
			const rows = data ?? [];
			await Promise.all(rows.map(async (conversation) => {
				const { data: latest } = await supabase.from("messages").select("body,image_url,created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
				conversation.lastMessage = latest ?? null;
				const { count } = await supabase.from("messages").select("id", {
					count: "exact",
					head: true
				}).eq("conversation_id", conversation.id).neq("sender_id", userId).is("read_at", null);
				conversation.unreadCount = count ?? 0;
			}));
			return rows;
		},
		refetchInterval: 3e4
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "محادثاتي"
				}), activeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatThread, {
					conversationId: activeId,
					onBack: () => void navigate({ search: { c: void 0 } })
				}) : conversations.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid place-items-center py-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
				}) : conversations.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: conversations.data.map((conv) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void navigate({ search: { c: conv.id } }),
						className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line",
						children: [
							conv.offices?.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: conv.offices.logo_url,
								alt: "",
								className: "size-10 shrink-0 rounded-xl object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-bold",
									children: conv.offices?.name || "مكتب عقاري"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[11px] text-muted-foreground",
									children: conv.lastMessage?.body || (conv.lastMessage?.image_url ? "📷 صورة" : null) || conv.properties?.title || "محادثة عامة"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex shrink-0 flex-col items-end gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-muted-foreground",
									children: formatDate(conv.lastMessage?.created_at ?? conv.updated_at)
								}), !!conv.unreadCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid min-w-5 place-items-center rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-background",
									children: conv.unreadCount > 99 ? "99+" : conv.unreadCount
								})]
							})
						]
					}) }, conv.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: MessageSquare,
					title: "لا توجد محادثات بعد",
					description: "ابدأ محادثة من صفحة أي عقار عبر زر «مراسلة» للتواصل مع المكتب مباشرة.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/properties",
						className: "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background",
						children: "تصفح العقارات"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { variant: "individual" })
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["individual", "admin"],
	guestsTo: "/auth/individual",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatsPage, {})
});
//#endregion
export { SplitComponent as component };
