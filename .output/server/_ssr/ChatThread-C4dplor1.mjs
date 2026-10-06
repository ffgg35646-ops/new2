import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { G as Flag, L as LoaderCircle, St as Ban, V as ImagePlus, d as ShieldOff, m as Send } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as uploadMedia } from "./MediaUploader-_s7o_iau.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ChatThread-C4dplor1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChatThread({ conversationId, onBack }) {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const [text, setText] = (0, import_react.useState)("");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [otherOnline, setOtherOnline] = (0, import_react.useState)(false);
	const [otherTyping, setOtherTyping] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const channelRef = (0, import_react.useRef)(null);
	const typingTimer = (0, import_react.useRef)(null);
	const messages = useQuery({
		queryKey: ["conversation-messages", conversationId],
		queryFn: async () => {
			const { data, error } = await supabase.from("messages").select("id,sender_id,body,image_url,created_at,read_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
			if (error) throw error;
			return data ?? [];
		},
		refetchInterval: 3e4
	});
	const blockRows = useQuery({
		queryKey: ["conversation-block", conversationId],
		queryFn: async () => {
			const { data, error } = await supabase.from("conversation_blocks").select("conversation_id,blocker_id,created_at").eq("conversation_id", conversationId);
			if (error) throw error;
			return data ?? [];
		},
		enabled: !!conversationId && !!userId
	}).data ?? [];
	const myBlock = blockRows.find((row) => row.blocker_id === userId);
	const otherBlock = blockRows.find((row) => row.blocker_id !== userId);
	const isBlocked = blockRows.length > 0;
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		const channel = supabase.channel(`chat-${conversationId}`, { config: { presence: { key: userId } } });
		channelRef.current = channel;
		channel.on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "messages",
			filter: `conversation_id=eq.${conversationId}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "conversation_blocks",
			filter: `conversation_id=eq.${conversationId}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["conversation-block", conversationId] });
		}).on("presence", { event: "sync" }, () => {
			const state = channel.presenceState();
			const online = Object.keys(state).some((id) => id !== userId);
			setOtherOnline(online);
			const typing = Object.entries(state).some(([id, values]) => {
				if (id === userId) return false;
				return values.some((value) => typeof value === "object" && value !== null && "typing" in value && value.typing === true);
			});
			setOtherTyping(typing);
		}).subscribe(async (status) => {
			if (status === "SUBSCRIBED") await channel.track({
				typing: false,
				online_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		});
		return () => {
			channelRef.current = null;
			if (typingTimer.current) clearTimeout(typingTimer.current);
			supabase.removeChannel(channel);
		};
	}, [
		conversationId,
		userId,
		qc
	]);
	(0, import_react.useEffect)(() => {
		if (!userId || !messages.data?.length) return;
		const unread = messages.data.filter((message) => message.sender_id !== userId && !message.read_at).map((message) => message.id);
		if (!unread.length) return;
		supabase.from("messages").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).in("id", unread);
	}, [messages.data, userId]);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			block: "end",
			behavior: "smooth"
		});
	}, [messages.data?.length]);
	async function publishTyping(typing) {
		if (!channelRef.current || !userId) return;
		try {
			await channelRef.current.track({
				typing,
				online_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		} catch {}
	}
	function handleTyping(value) {
		setText(value);
		publishTyping(true);
		if (typingTimer.current) clearTimeout(typingTimer.current);
		typingTimer.current = setTimeout(() => {
			publishTyping(false);
		}, 1200);
	}
	const toggleBlock = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول أولًا");
			if (myBlock) {
				const { error } = await supabase.from("conversation_blocks").delete().eq("conversation_id", conversationId).eq("blocker_id", userId);
				if (error) throw error;
				return "unblocked";
			}
			if (otherBlock) throw new Error("الطرف الآخر قام بحظر هذه المحادثة");
			const { error } = await supabase.from("conversation_blocks").insert({
				conversation_id: conversationId,
				blocker_id: userId
			});
			if (error) throw error;
			return "blocked";
		},
		onSuccess: (result) => {
			qc.invalidateQueries({ queryKey: ["conversation-block", conversationId] });
			if (result === "blocked") toast.success("تم حظر المحادثة");
			else toast.success("تم إلغاء حظر المحادثة");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذر تنفيذ الحظر");
		}
	});
	const reportMessage = useMutation({
		mutationFn: async (message) => {
			if (!userId) throw new Error("سجّل الدخول أولًا");
			const reason = window.prompt("سبب البلاغ:", "محتوى مسيء");
			if (!reason?.trim()) throw new Error("تم إلغاء البلاغ");
			const details = JSON.stringify({
				source: "chat",
				conversation_id: conversationId,
				message_id: message.id,
				message_body: message.body,
				message_image_url: message.image_url,
				reported_user_id: message.sender_id
			});
			const conversationRes = await supabase.from("conversations").select("office_id,property_id").eq("id", conversationId).maybeSingle();
			if (conversationRes.error) throw conversationRes.error;
			const { error } = await supabase.from("reports").insert({
				reporter_id: userId,
				reason: reason.trim(),
				details,
				office_id: conversationRes.data?.office_id ?? null,
				property_id: conversationRes.data?.property_id ?? null,
				resolved: false
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم إرسال البلاغ للإدارة");
		},
		onError: (error) => {
			if (error instanceof Error && error.message === "تم إلغاء البلاغ") return;
			toast.error(error instanceof Error ? error.message : "تعذر إرسال البلاغ");
		}
	});
	const send = useMutation({
		mutationFn: async (payload) => {
			if (!userId) throw new Error("سجّل الدخول أولًا");
			if (isBlocked) throw new Error("لا يمكن إرسال رسائل في هذه المحادثة لأنها محظورة");
			const { error } = await supabase.from("messages").insert({
				conversation_id: conversationId,
				sender_id: userId,
				body: payload.body ?? null,
				image_url: payload.imageUrl ?? null
			});
			if (error) {
				if (error.message.includes("CHAT_BLOCKED")) throw new Error("لا يمكن إرسال الرسائل: المحادثة محظورة");
				throw new Error("تعذّر الإرسال — الدردشة غير متاحة لهذا المكتب حاليًا");
			}
			await supabase.from("conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", conversationId);
			await publishTyping(false);
		},
		onSuccess: () => {
			setText("");
			qc.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
			qc.invalidateQueries({ queryKey: ["conversation-block", conversationId] });
			qc.invalidateQueries({ queryKey: ["my-conversations", userId] });
			qc.invalidateQueries({ queryKey: ["office-conversations"] });
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذّر إرسال الرسالة");
		}
	});
	async function onPickImage(e) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file || !userId || isBlocked) return;
		setUploading(true);
		try {
			const url = await uploadMedia(file, userId, "chat");
			send.mutate({ imageUrl: url });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "تعذّر رفع الصورة");
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-3xl bg-surface p-3 ring-1 ring-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onBack,
					className: "text-xs font-semibold text-forest",
					children: "← كل المحادثات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-muted-foreground",
						children: otherOnline ? "متصل الآن" : "غير متصل"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: toggleBlock.isPending,
						onClick: () => toggleBlock.mutate(),
						className: "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold " + (myBlock ? "bg-sand text-forest" : otherBlock ? "bg-sand text-muted-foreground" : "bg-terracotta-soft text-terracotta"),
						children: [myBlock ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "size-3.5" }), myBlock ? "إلغاء الحظر" : otherBlock ? "محظورة" : "حظر"]
					})]
				})]
			}),
			isBlocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 rounded-2xl bg-terracotta-soft px-3 py-2 text-center text-xs font-semibold text-terracotta",
				children: myBlock ? "قمت بحظر هذه المحادثة. يمكنك إلغاء الحظر للمتابعة." : "الطرف الآخر قام بحظر هذه المحادثة."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 max-h-[55vh] space-y-2 overflow-y-auto",
				children: [
					messages.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid place-items-center py-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
					}) : messages.data?.length ? messages.data.map((message) => {
						const mine = message.sender_id === userId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[80%] overflow-hidden rounded-2xl text-sm " + (mine ? "ms-auto bg-forest text-background" : "me-auto bg-sand text-foreground"),
							children: [
								message.image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: message.image_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: message.image_url,
										alt: "صورة",
										loading: "lazy",
										className: "max-h-64 w-full object-cover"
									})
								}),
								message.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3 py-2",
									children: message.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 px-3 pb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] " + (mine ? "text-background/70" : "text-muted-foreground"),
										children: mine ? message.read_at ? "✓✓ مقروءة" : "✓ تم الإرسال" : ""
									}), !mine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => reportMessage.mutate(message),
										disabled: reportMessage.isPending,
										className: "inline-flex items-center gap-1 text-[9px] text-terracotta",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-3" }), "بلاغ"]
									})]
								})
							]
						}, message.id);
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-8 text-center text-xs text-muted-foreground",
						children: "ابدأ المحادثة برسالتك الأولى 👋"
					}),
					otherTyping && !isBlocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted-foreground",
						children: "يكتب الآن..."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3 flex items-center gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					const body = text.trim();
					if (body && !isBlocked) send.mutate({ body });
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/*",
						hidden: true,
						onChange: onPickImage
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => fileRef.current?.click(),
						disabled: uploading || send.isPending || isBlocked,
						"aria-label": "إرسال صورة",
						className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-forest disabled:opacity-50",
						children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: text,
						onChange: (e) => handleTyping(e.target.value),
						disabled: isBlocked,
						placeholder: isBlocked ? "المحادثة محظورة" : "اكتب رسالتك...",
						className: "flex-1 rounded-2xl bg-background px-3 py-2.5 text-sm ring-1 ring-line disabled:opacity-60"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: send.isPending || !text.trim() || isBlocked,
						className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-forest text-background disabled:opacity-50",
						children: send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
					})
				]
			})
		]
	});
}
//#endregion
export { ChatThread as t };
