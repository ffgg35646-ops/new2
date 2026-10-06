import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { F as LoaderCircle, U as File, m as Send, t as X, vt as ArrowRight, x as Plus, z as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as formatDate } from "./format-B7MVuK_u.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SupportCenter-bJ8YAs81.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function uploadSupportFile(file, userId) {
	if (file.size > 20971520) throw new Error("حجم الملف يتجاوز 20 ميجابايت");
	const ext = file.name.split(".").pop()?.replace(/[^\w.-]/g, "") || "bin";
	const path = `${userId}/support/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage.from("property-media").upload(path, file, {
		contentType: file.type || "application/octet-stream",
		upsert: false
	});
	if (error) throw error;
	const { data, error: signError } = await supabase.storage.from("property-media").createSignedUrl(path, 31536e3);
	if (signError) throw signError;
	return data.signedUrl;
}
function SupportChat({ ticket, onBack }) {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const [text, setText] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const messages = useQuery({
		queryKey: ["support-messages", ticket.id],
		enabled: !!ticket.id,
		queryFn: async () => {
			const { data, error } = await supabase.from("support_messages").select("id,ticket_id,sender_id,body,file_url,file_name,file_type,read_at,created_at").eq("ticket_id", ticket.id).order("created_at", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		const channel = supabase.channel(`support-ticket-${ticket.id}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_messages",
			filter: `ticket_id=eq.${ticket.id}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["support-messages", ticket.id] });
			qc.invalidateQueries({ queryKey: ["support-tickets"] });
			qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [
		ticket.id,
		userId,
		qc
	]);
	(0, import_react.useEffect)(() => {
		if (!userId || !messages.data?.length) return;
		const unread = messages.data.filter((message) => message.sender_id !== userId && !message.read_at).map((message) => message.id);
		if (!unread.length) return;
		supabase.from("support_messages").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).in("id", unread);
	}, [messages.data, userId]);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [messages.data?.length]);
	const send = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول أولًا");
			if (!text.trim() && !file) throw new Error("اكتب رسالة أو أرفق ملفًا");
			let fileUrl = null;
			if (file) {
				setUploading(true);
				try {
					fileUrl = await uploadSupportFile(file, userId);
				} finally {
					setUploading(false);
				}
			}
			const { error } = await supabase.from("support_messages").insert({
				ticket_id: ticket.id,
				sender_id: userId,
				body: text.trim() || null,
				file_url: fileUrl,
				file_name: file?.name ?? null,
				file_type: file?.type ?? null
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setText("");
			setFile(null);
			qc.invalidateQueries({ queryKey: ["support-messages", ticket.id] });
			qc.invalidateQueries({ queryKey: ["support-tickets"] });
			qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذّر إرسال الرسالة");
		}
	});
	const closed = ticket.status === "closed";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex min-h-0 flex-1 flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3 border-b border-line px-4 py-3",
				children: [onBack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onBack,
					className: "grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line",
					"aria-label": "رجوع",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-display text-sm font-extrabold",
						children: ["تذكرة الدعم #", ticket.ticket_number]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground",
						children: closed ? "مغلقة" : "مفتوحة"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2.5",
					children: [messages.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid place-items-center py-16",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
					}) : messages.data?.length ? messages.data.map((message) => {
						const mine = message.sender_id === userId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[82%] overflow-hidden rounded-2xl text-sm " + (mine ? "ms-auto bg-forest text-background" : "me-auto bg-sand text-foreground"),
							children: [
								message.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3 py-2.5",
									children: message.body
								}),
								message.file_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: message.file_type?.startsWith("image/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: message.file_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: message.file_url,
										alt: message.file_name || "صورة",
										className: "max-h-64 w-full object-cover"
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: message.file_url,
									target: "_blank",
									rel: "noreferrer",
									className: "flex items-center gap-2 border-t border-current/10 px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-xs",
										children: message.file_name || "ملف مرفق"
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 px-3 pb-1 text-[9px] opacity-70",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mine ? message.read_at ? "✓✓ مقروءة" : "✓ تم الإرسال" : "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(message.created_at).toLocaleTimeString("ar-SA", {
										hour: "2-digit",
										minute: "2-digit"
									}) })]
								})
							]
						}, message.id);
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-16 text-center text-xs text-muted-foreground",
						children: "اكتب رسالتك الأولى للدعم 👋"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-line bg-background p-3",
				children: [file && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center gap-2 rounded-xl bg-sand px-3 py-2 text-xs",
					children: [
						file.type.startsWith("image/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4 text-forest" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, { className: "size-4 text-forest" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate",
							children: file.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFile(null),
							className: "grid size-6 place-items-center rounded-full",
							"aria-label": "إزالة الملف",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex items-center gap-2",
					onSubmit: (event) => {
						event.preventDefault();
						if (!closed) send.mutate();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							hidden: true,
							onChange: (event) => setFile(event.target.files?.[0] ?? null)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => fileRef.current?.click(),
							disabled: closed || uploading || send.isPending,
							className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-forest disabled:opacity-50",
							"aria-label": "إرفاق ملف",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: text,
							onChange: (event) => setText(event.target.value),
							disabled: closed,
							placeholder: closed ? "التذكرة مغلقة" : "اكتب رسالتك للدعم...",
							className: "min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2.5 text-sm ring-1 ring-line outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: closed || send.isPending || uploading || !text.trim() && !file,
							className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-forest text-background disabled:opacity-50",
							"aria-label": "إرسال",
							children: send.isPending || uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
						})
					]
				})]
			})
		]
	});
}
function SupportCenter({ open, onClose, initialTicketId }) {
	const { userId } = useAuth();
	const qc = useQueryClient();
	const [activeId, setActiveId] = (0, import_react.useState)(initialTicketId ?? null);
	const tickets = useQuery({
		queryKey: ["support-tickets", userId],
		enabled: !!userId && open,
		queryFn: async () => {
			const { data, error } = await supabase.from("support_tickets").select("id,ticket_number,user_id,status,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (initialTicketId) setActiveId(initialTicketId);
	}, [initialTicketId]);
	(0, import_react.useEffect)(() => {
		if (!open || !userId) return;
		const channel = supabase.channel(`support-list-${userId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_tickets",
			filter: `user_id=eq.${userId}`
		}, () => {
			qc.invalidateQueries({ queryKey: ["support-tickets", userId] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [
		open,
		userId,
		qc
	]);
	(0, import_react.useEffect)(() => {
		if (!open || !activeId || !userId) return;
		supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false).eq("type", "support_ticket");
		qc.invalidateQueries({ queryKey: ["unread-notifications", userId] });
	}, [
		open,
		activeId,
		userId,
		qc
	]);
	const selectedTicket = (0, import_react.useMemo)(() => tickets.data?.find((ticket) => ticket.id === activeId) ?? null, [tickets.data, activeId]);
	const createTicket = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("سجّل الدخول أولًا");
			const { data, error } = await supabase.from("support_tickets").insert({
				user_id: userId,
				status: "open"
			}).select("id,ticket_number,user_id,status,created_at,updated_at").single();
			if (error) throw error;
			return data;
		},
		onSuccess: (ticket) => {
			qc.invalidateQueries({ queryKey: ["support-tickets", userId] });
			setActiveId(ticket.id);
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذّر إنشاء التذكرة");
		}
	});
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[100] flex min-h-screen flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center gap-3 border-b border-line px-4 py-4",
			children: [
				selectedTicket && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setActiveId(null),
					className: "grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line",
					"aria-label": "رجوع",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "min-w-0 flex-1 truncate font-display text-lg font-extrabold",
					children: "الدعم"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line",
					"aria-label": "إغلاق",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})
			]
		}), selectedTicket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupportChat, {
			ticket: selectedTicket,
			onBack: () => setActiveId(null)
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => createTicket.mutate(),
				disabled: createTicket.isPending,
				className: "mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50",
				children: [createTicket.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "تذكرة جديدة"]
			}), tickets.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid place-items-center py-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-forest" })
			}) : tickets.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2.5",
				children: tickets.data.map((ticket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setActiveId(ticket.id),
					className: "flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-right ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-xs font-extrabold text-forest",
						children: ["#", ticket.ticket_number]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-sm font-bold",
							children: ["تذكرة دعم #", ticket.ticket_number]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 block text-[10px] text-muted-foreground",
							children: [
								ticket.status === "closed" ? "مغلقة" : "مفتوحة",
								" ",
								"· ",
								formatDate(ticket.updated_at)
							]
						})]
					})]
				}, ticket.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-16 text-center text-sm text-muted-foreground",
				children: "لا توجد تذاكر دعم بعد."
			})]
		})]
	});
}
//#endregion
export { SupportChat as n, SupportCenter as t };
