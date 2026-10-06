import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { C as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { ft as Bell } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { t as BottomNav } from "./BottomNav-DyvwyVUV.mjs";
import { n as ListSkeleton, t as EmptyState } from "./EmptyState-C5iUqUGB.mjs";
import { i as timeAgo } from "./format-B7MVuK_u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-DVu62K5f.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotificationsPage() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false).then(({ error }) => {
			if (error) {
				console.warn("[notifications] mark all read failed", error);
				return;
			}
			qc.invalidateQueries({ queryKey: ["unread-notifications", userId] });
			qc.invalidateQueries({ queryKey: ["notifications", userId] });
		});
		const channel = supabase.channel(`notifications-page-${userId}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "notifications",
			filter: `user_id=eq.${userId}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["notifications", userId] });
			qc.invalidateQueries({ queryKey: ["unread-notifications", userId] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, qc]);
	const { data, isLoading } = useQuery({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
			if (error) throw error;
			return data ?? [];
		}
	});
	const markRead = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
			qc.invalidateQueries({ queryKey: ["unread-notifications"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 space-y-4 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "الإشعارات"
				}), !userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Bell,
					title: "سجّل الدخول لعرض إشعاراتك"
				}) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2.5",
					children: data.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							if (!n.is_read) markRead.mutate(n.id);
							if (n.link) router.history.push(n.link);
						},
						className: cn("block w-full rounded-2xl p-3.5 text-right ring-1 ring-line", n.is_read ? "bg-surface" : "bg-forest-soft"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold",
								children: n.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground",
								children: timeAgo(n.created_at)
							})]
						}), n.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: n.body
						})]
					}, n.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Bell,
					title: "لا توجد إشعارات",
					description: "سننبهك عند وصول أي جديد."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { NotificationsPage as component };
