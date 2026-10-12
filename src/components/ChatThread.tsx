import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Ban,
  Flag,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Send,
  ShieldOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
type RealtimeChannel = { unsubscribe: () => void; track: (payload: Record<string, unknown>) => Promise<"ok"> };
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/components/MediaUploader";
import { useAuth } from "@/lib/auth";

type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
};

export function ChatThread({
  conversationId,
  onBack,
  title,
  readOnly = false,
}: {
  conversationId: string;
  onBack: () => void;
  title?: string;
  readOnly?: boolean;
}) {
  const { userId, isOffice } = useAuth();
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id,sender_id,body,image_url,created_at,read_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    refetchInterval: 30_000,
  });

  const block = useQuery({
    queryKey: ["conversation-block", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_blocks")
        .select("conversation_id,blocker_id,created_at")
        .eq("conversation_id", conversationId);

      if (error) throw error;

      return data ?? [];
    },
    enabled: !!conversationId && !!userId,
  });

  const blockRows = block.data ?? [];
  const myBlock = blockRows.find(
    (row) => row.blocker_id === userId
  );
  const otherBlock = blockRows.find(
    (row) => row.blocker_id !== userId
  );
  const isBlocked = blockRows.length > 0;

  useEffect(() => {
    if (!userId || readOnly) return;

    const channel = supabase.channel(
      `chat-${conversationId}`,
      {
        config: {
          presence: {
            key: userId,
          },
        },
      }
    );

    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: [
              "conversation-messages",
              conversationId,
            ],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_blocks",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["conversation-block", conversationId],
          });
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        const online = Object.keys(state).some(
          (id) => id !== userId
        );

        setOtherOnline(online);

        const typing = Object.entries(state).some(
          ([id, values]) => {
            if (id === userId) return false;

            return values.some(
              (value) =>
                typeof value === "object" &&
                value !== null &&
                "typing" in value &&
                value.typing === true,
            );
          },
        );

        setOtherTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channelRef.current = null;

      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [conversationId, userId, qc, readOnly]);

  useEffect(() => {
    // Admin review must not change customer read receipts.
    if (readOnly || !userId || !messages.data?.length) return;

    const unread = messages.data
      .filter(
        (message) =>
          message.sender_id !== userId &&
          !message.read_at,
      )
      .map((message) => message.id);

    if (!unread.length) return;

    void supabase
      .from("messages")
      .update({
        read_at: new Date().toISOString(),
      })
      .in("id", unread);
  }, [messages.data, userId, readOnly]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [messages.data?.length]);

  async function publishTyping(typing: boolean) {
    if (!channelRef.current || !userId) return;

    try {
      await channelRef.current.track({
        typing,
        online_at: new Date().toISOString(),
      });
    } catch {}
  }

  function handleTyping(value: string) {
    setText(value);
    void publishTyping(true);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      void publishTyping(false);
    }, 1200);
  }

  const toggleBlock = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("سجّل الدخول أولًا");
      }

      if (myBlock) {
        const { error } = await supabase
          .from("conversation_blocks")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("blocker_id", userId);

        if (error) throw error;
        return "unblocked";
      }

      if (otherBlock) {
        throw new Error(
          "الطرف الآخر قام بحظر هذه المحادثة",
        );
      }

      const { error } = await supabase
        .from("conversation_blocks")
        .insert({
          conversation_id: conversationId,
          blocker_id: userId,
        });

      if (error) throw error;

      return "blocked";
    },

    onSuccess: (result) => {
      void qc.invalidateQueries({
        queryKey: ["conversation-block", conversationId],
      });

      if (result === "blocked") {
        toast.success("تم حظر المحادثة");
      } else {
        toast.success("تم إلغاء حظر المحادثة");
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تنفيذ الحظر",
      );
    },
  });

  const reportMessage = useMutation({
    mutationFn: async (message: MessageRow) => {
      if (!userId) {
        throw new Error("سجّل الدخول أولًا");
      }

      const reason = window.prompt(
        "سبب البلاغ:",
        "محتوى مسيء",
      );

      if (!reason?.trim()) {
        throw new Error("تم إلغاء البلاغ");
      }

      const details = JSON.stringify({
        source: "chat",
        conversation_id: conversationId,
        message_id: message.id,
        message_body: message.body,
        message_image_url: message.image_url,
        reported_user_id: message.sender_id,
      });

      const conversationRes = await supabase
        .from("conversations")
        .select("office_id,property_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (conversationRes.error) {
        throw conversationRes.error;
      }

      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: userId,
          reason: reason.trim(),
          details,
          office_id:
            conversationRes.data?.office_id ?? null,
          property_id:
            conversationRes.data?.property_id ?? null,
          resolved: false,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم إرسال البلاغ للإدارة");
    },

    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === "تم إلغاء البلاغ"
      ) {
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر إرسال البلاغ",
      );
    },
  });

  const send = useMutation({
    mutationFn: async (payload: {
      body?: string;
      imageUrl?: string;
    }) => {
      if (!userId) {
        throw new Error("سجّل الدخول أولًا");
      }

      if (isBlocked) {
        throw new Error(
          "لا يمكن إرسال رسائل في هذه المحادثة لأنها محظورة",
        );
      }

      const { error } = await supabase.rpc(
        "send_chat_message" as never,
        {
          _conversation_id: conversationId,
          _body: payload.body ?? null,
          _image_url: payload.imageUrl ?? null,
        } as never,
      );

      if (error) {
        if (error.message.includes("CHAT_BLOCKED")) {
          throw new Error(
            "لا يمكن إرسال الرسائل لأن المحادثة محظورة. افتح خيارات المحادثة لإلغاء الحظر إذا كنت صاحب الحظر.",
          );
        }

        if (error.message.toLowerCase().includes("chat_not_available")) {
          throw new Error(
            "المحادثة السابقة ما زالت محفوظة، لكن الخادم يرفض الإرسال لأن صلاحية الدردشة غير مفعّلة لهذا المكتب. يلزم مراجعة صلاحية الدردشة في الخادم حتى يستمر إرسال الرسائل في المحادثات الحالية.",
          );
        }

        throw new Error(
          error.message || "تعذّر إرسال الرسالة",
        );
      }

      await publishTyping(false);
    },

    onSuccess: () => {
      setText("");

      void qc.invalidateQueries({
        queryKey: [
          "conversation-messages",
          conversationId,
        ],
      });

      void qc.invalidateQueries({
        queryKey: [
          "conversation-block",
          conversationId,
        ],
      });

      void qc.invalidateQueries({
        queryKey: ["my-conversations", userId],
      });

      void qc.invalidateQueries({
        queryKey: ["office-conversations"],
      });

      void qc.invalidateQueries({
        queryKey: ["unread-notifications", userId],
      });
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر إرسال الرسالة",
      );
    },
  });

  async function onPickImage(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !userId || isBlocked) return;

    setUploading(true);

    try {
      const url = await uploadMedia(
        file,
        userId,
        "chat",
      );

      send.mutate({ imageUrl: url });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر رفع الصورة",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-surface p-2 ring-1 ring-line sm:p-3">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0 flex-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest"
          >
            {readOnly ? "← لوحة الإدارة" : "← كل المحادثات"}
          </button>
          {title && (
            <div className="mt-1.5 truncate text-sm font-extrabold">{title}</div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!readOnly && otherOnline && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-semibold text-forest">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-forest" />
              متصل الآن
            </span>
          )}

          {!readOnly && (myBlock || !otherBlock) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="خيارات المحادثة"
                  title="خيارات المحادثة"
                  disabled={toggleBlock.isPending}
                  className="grid size-9 place-items-center rounded-xl bg-background text-muted-foreground ring-1 ring-line transition hover:text-foreground disabled:opacity-50"
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {myBlock ? (
                  <DropdownMenuItem
                    disabled={toggleBlock.isPending}
                    onSelect={() => toggleBlock.mutate()}
                  >
                    <ShieldOff className="ms-1 size-4" />
                    إلغاء الحظر
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={toggleBlock.isPending}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300"
                    onSelect={() => {
                      if (window.confirm("هل تريد حظر هذه المحادثة؟ يمكنك إلغاء الحظر لاحقًا من القائمة نفسها.")) {
                        toggleBlock.mutate();
                      }
                    }}
                  >
                    <Ban className="ms-1 size-4" />
                    حظر المحادثة
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {!readOnly && isBlocked && (
        <div className="mt-3 rounded-2xl bg-terracotta-soft px-3 py-2 text-center text-xs font-semibold text-terracotta">
          {myBlock
            ? "قمت بحظر هذه المحادثة. يمكنك إلغاء الحظر للمتابعة."
            : "الطرف الآخر قام بحظر هذه المحادثة."}
        </div>
      )}

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1 py-2">
        {messages.isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : messages.data?.length ? (
          messages.data.map((message) => {
            const mine =
              message.sender_id === userId;

            return (
              <div
                key={message.id}
                className={
                  "max-w-[86%] overflow-hidden rounded-2xl text-sm shadow-sm sm:max-w-[78%] " +
                  ((isOffice ? !mine : mine)
                    ? "ms-auto rounded-br-md bg-forest text-white"
                    : "me-auto rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-300")
                }
              >
                {message.image_url && (
                  <a
                    href={message.image_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={message.image_url}
                      alt="صورة"
                      loading="lazy"
                      className="max-h-64 w-full object-cover"
                    />
                  </a>
                )}

                {message.body && (
                  <div className="whitespace-pre-wrap break-words px-3 py-2.5">
                    {message.body}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 px-3 pb-1">
                  <span
                    className={
                      "text-[9px] " +
                      (mine
                        ? "text-background/70"
                        : "text-muted-foreground")
                    }
                  >
                    {mine
                      ? message.read_at
                        ? "✓✓ مقروءة"
                        : "✓ تم الإرسال"
                      : ""}
                  </span>

                  {!mine && !readOnly && (
                    <button
                      type="button"
                      onClick={() =>
                        reportMessage.mutate(message)
                      }
                      disabled={
                        reportMessage.isPending
                      }
                      className="inline-flex items-center gap-1 text-[9px] text-terracotta"
                    >
                      <Flag className="size-3" />
                      بلاغ
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-32 flex-1 items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {readOnly ? "لا توجد رسائل في هذه المحادثة." : "ابدأ المحادثة برسالتك الأولى 👋"}
          </div>
        )}

        {!readOnly && otherTyping && !isBlocked && (
          <div className="me-auto rounded-2xl rounded-bl-md bg-sand px-3 py-2 text-[11px] text-muted-foreground">
            يكتب الآن...
          </div>
        )}

        <div ref={endRef} className="h-px shrink-0" />
      </div>

      {!readOnly && <form
        className="sticky bottom-0 z-10 mt-1 flex shrink-0 items-center gap-2 border-t border-line bg-surface pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();

          const body = text.trim();

          if (body && !isBlocked) {
            send.mutate({ body });
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickImage}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={
            uploading ||
            send.isPending ||
            isBlocked
          }
          aria-label="إرسال صورة"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-forest disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
        </button>

        <input
          value={text}
          onChange={(e) =>
            handleTyping(e.target.value)
          }
          disabled={isBlocked}
          placeholder={
            isBlocked
              ? "المحادثة محظورة"
              : "اكتب رسالتك..."
          }
          aria-label="نص الرسالة"
          dir="auto"
          className="min-w-0 flex-1 rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-forest disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={
            send.isPending ||
            !text.trim() ||
            isBlocked
          }
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest text-background disabled:opacity-50"
        >
          {send.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>}
    </section>
  );
}
