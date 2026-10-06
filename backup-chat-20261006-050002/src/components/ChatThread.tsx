import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/components/MediaUploader";
import { useAuth } from "@/lib/auth";

type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
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
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const messages = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,body,image_url,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => void qc.invalidateQueries({ queryKey: ["conversation-messages", conversationId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: async (payload: { body?: string; imageUrl?: string }) => {
      if (!userId) throw new Error("سجّل الدخول أولًا");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: payload.body ?? null,
        image_url: payload.imageUrl ?? null,
      });
      if (error) throw new Error("تعذّر الإرسال — الدردشة غير متاحة لهذا المكتب حاليًا");
    },
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال الرسالة"),
  });

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, userId, "chat");
      send.mutate({ imageUrl: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-surface p-3 ring-1 ring-line">
      <button onClick={onBack} className="text-xs font-semibold text-forest">
        ← كل المحادثات
      </button>

      <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
        {messages.isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : messages.data?.length ? (
          messages.data.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                className={
                  "max-w-[80%] overflow-hidden rounded-2xl text-sm " +
                  (mine ? "ms-auto bg-forest text-background" : "me-auto bg-sand text-foreground")
                }
              >
                {m.image_url && (
                  <a href={m.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={m.image_url}
                      alt="صورة"
                      loading="lazy"
                      className="max-h-64 w-full object-cover"
                    />
                  </a>
                )}
                {m.body && <div className="px-3 py-2">{m.body}</div>}
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            ابدأ المحادثة برسالتك الأولى 👋
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = text.trim();
          if (body) send.mutate({ body });
        }}
      >
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || send.isPending}
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
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 rounded-2xl bg-background px-3 py-2.5 text-sm ring-1 ring-line"
        />
        <button
          type="submit"
          disabled={send.isPending || !text.trim()}
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
