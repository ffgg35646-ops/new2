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
  Send,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const { userId } = useAuth();
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
    if (!userId) return;

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
  }, [conversationId, userId, qc]);

  useEffect(() => {
    if (!userId || !messages.data?.length) return;

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
  }, [messages.data, userId]);

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

      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          body: payload.body ?? null,
          image_url: payload.imageUrl ?? null,
        });

      if (error) {
        if (
          error.message.includes("CHAT_BLOCKED")
        ) {
          throw new Error(
            "لا يمكن إرسال الرسائل: المحادثة محظورة",
          );
        }

        throw new Error(
          "تعذّر الإرسال — الدردشة غير متاحة لهذا المكتب حاليًا",
        );
      }

      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

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
    <section className="rounded-3xl bg-surface p-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-forest"
        >
          ← كل المحادثات
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {otherOnline ? "متصل الآن" : "غير متصل"}
          </span>

          <button
            type="button"
            disabled={toggleBlock.isPending}
            onClick={() =>
              toggleBlock.mutate()
            }
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold " +
              (myBlock
                ? "bg-sand text-forest"
                : otherBlock
                  ? "bg-sand text-muted-foreground"
                  : "bg-terracotta-soft text-terracotta")
            }
          >
            {myBlock ? (
              <ShieldOff className="size-3.5" />
            ) : (
              <Ban className="size-3.5" />
            )}

            {myBlock
              ? "إلغاء الحظر"
              : otherBlock
                ? "محظورة"
                : "حظر"}
          </button>
        </div>
      </div>

      {isBlocked && (
        <div className="mt-3 rounded-2xl bg-terracotta-soft px-3 py-2 text-center text-xs font-semibold text-terracotta">
          {myBlock
            ? "قمت بحظر هذه المحادثة. يمكنك إلغاء الحظر للمتابعة."
            : "الطرف الآخر قام بحظر هذه المحادثة."}
        </div>
      )}

      <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
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
                  "max-w-[80%] overflow-hidden rounded-2xl text-sm " +
                  (mine
                    ? "ms-auto bg-forest text-background"
                    : "me-auto bg-sand text-foreground")
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
                  <div className="px-3 py-2">
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

                  {!mine && (
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
          <p className="py-8 text-center text-xs text-muted-foreground">
            ابدأ المحادثة برسالتك الأولى 👋
          </p>
        )}

        {otherTyping && !isBlocked && (
          <div className="text-[11px] text-muted-foreground">
            يكتب الآن...
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        className="mt-3 flex items-center gap-2"
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
          className="flex-1 rounded-2xl bg-background px-3 py-2.5 text-sm ring-1 ring-line disabled:opacity-60"
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
      </form>
    </section>
  );
}
