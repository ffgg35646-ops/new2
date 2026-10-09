import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  File,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { uploadMedia } from "@/components/MediaUploader";

type Ticket = {
  id: string;
  ticket_number: number;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  read_at: string | null;
  created_at: string;
};

type SupportCenterProps = {
  open: boolean;
  onClose: () => void;
  initialTicketId?: string | null;
};

async function uploadSupportFile(file: File, userId: string) {
  return uploadMedia(file, userId, "support");
}
export function SupportChat({
  ticket,
  onBack,
}: {
  ticket: Ticket;
  onBack?: () => void;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const messages = useQuery({
    queryKey: ["support-messages", ticket.id],
    enabled: !!ticket.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select(
          "id,ticket_id,sender_id,body,file_url,file_name,file_type,read_at,created_at",
        )
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []) as SupportMessage[];
    },
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`support-ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["support-messages", ticket.id],
          });

          void qc.invalidateQueries({
            queryKey: ["support-tickets"],
          });

          void qc.invalidateQueries({
            queryKey: ["admin-support-tickets"],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticket.id, userId, qc]);

  useEffect(() => {
    if (!userId || !messages.data?.length) return;

    const unread = messages.data
      .filter(
        (message) =>
          message.sender_id !== userId && !message.read_at,
      )
      .map((message) => message.id);

    if (!unread.length) return;

    void supabase
      .from("support_messages")
      .update({
        read_at: new Date().toISOString(),
      })
      .in("id", unread);
  }, [messages.data, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("سجّل الدخول أولًا");
      }

      if (!text.trim() && !file) {
        throw new Error("اكتب رسالة أو أرفق ملفًا");
      }

      let fileUrl: string | null = null;

      if (file) {
        setUploading(true);

        try {
          fileUrl = await uploadSupportFile(file, userId);
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: userId,
          body: text.trim() || null,
          file_url: fileUrl,
          file_name: file?.name ?? null,
          file_type: file?.type ?? null,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      setText("");
      setFile(null);

      void qc.invalidateQueries({
        queryKey: ["support-messages", ticket.id],
      });

      void qc.invalidateQueries({
        queryKey: ["support-tickets"],
      });

      void qc.invalidateQueries({
        queryKey: ["admin-support-tickets"],
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

  const closed = ticket.status === "closed";

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
            aria-label="رجوع"
          >
            <ArrowRight className="size-4" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-extrabold">
            تذكرة الدعم #{ticket.ticket_number}
          </div>

          <div className="text-[10px] text-muted-foreground">
            {closed ? "مغلقة" : "مفتوحة"}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2.5">
          {messages.isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-5 animate-spin text-forest" />
            </div>
          ) : messages.data?.length ? (
            messages.data.map((message) => {
              const mine = message.sender_id === userId;

              return (
                <div
                  key={message.id}
                  className={
                    "max-w-[82%] overflow-hidden rounded-2xl text-sm " +
                    (mine
                      ? "ms-auto bg-forest text-background"
                      : "me-auto bg-sand text-foreground")
                  }
                >
                  {message.body && (
                    <div className="px-3 py-2.5">
                      {message.body}
                    </div>
                  )}

                  {message.file_url && (
                    <>
                      {message.file_type?.startsWith("image/") ? (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={message.file_url}
                            alt={message.file_name || "صورة"}
                            className="max-h-64 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 border-t border-current/10 px-3 py-3"
                        >
                          <File className="size-4" />

                          <span className="min-w-0 flex-1 truncate text-xs">
                            {message.file_name || "ملف مرفق"}
                          </span>
                        </a>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-2 px-3 pb-1 text-[9px] opacity-70">
                    <span>
                      {mine
                        ? message.read_at
                          ? "✓✓ مقروءة"
                          : "✓ تم الإرسال"
                        : ""}
                    </span>

                    <span>
                      {new Date(
                        message.created_at,
                      ).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-xs text-muted-foreground">
              اكتب رسالتك الأولى للدعم 👋
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line bg-background p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-sand px-3 py-2 text-xs">
            {file.type.startsWith("image/") ? (
              <ImagePlus className="size-4 text-forest" />
            ) : (
              <File className="size-4 text-forest" />
            )}

            <span className="min-w-0 flex-1 truncate">
              {file.name}
            </span>

            <button
              type="button"
              onClick={() => setFile(null)}
              className="grid size-6 place-items-center rounded-full"
              aria-label="إزالة الملف"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();

            if (!closed) {
              send.mutate();
            }
          }}
        >
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(event) =>
              setFile(event.target.files?.[0] ?? null)
            }
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={closed || uploading || send.isPending}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-forest disabled:opacity-50"
            aria-label="إرفاق ملف"
          >
            <Plus className="size-5" />
          </button>

          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={closed}
            placeholder={
              closed
                ? "التذكرة مغلقة"
                : "اكتب رسالتك للدعم..."
            }
            className="min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2.5 text-sm ring-1 ring-line outline-none"
          />

          <button
            type="submit"
            disabled={
              closed ||
              send.isPending ||
              uploading ||
              (!text.trim() && !file)
            }
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest text-background disabled:opacity-50"
            aria-label="إرسال"
          >
            {send.isPending || uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export function SupportCenter({
  open,
  onClose,
  initialTicketId,
}: SupportCenterProps) {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<string | null>(
    initialTicketId ?? null,
  );

  const tickets = useQuery({
    queryKey: ["support-tickets", userId],
    enabled: !!userId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(
          "id,ticket_number,user_id,status,created_at,updated_at",
        )
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as Ticket[];
    },
  });

  useEffect(() => {
    if (initialTicketId) {
      setActiveId(initialTicketId);
    }
  }, [initialTicketId]);

  useEffect(() => {
    if (!open || !userId) return;

    const channel = supabase
      .channel(`support-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["support-tickets", userId],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, userId, qc]);

  useEffect(() => {
    if (!open || !activeId || !userId) return;

    void supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .eq("type", "support_ticket");

    void qc.invalidateQueries({
      queryKey: ["unread-notifications", userId],
    });
  }, [open, activeId, userId, qc]);

  const selectedTicket = useMemo(
    () =>
      tickets.data?.find(
        (ticket) => ticket.id === activeId,
      ) ?? null,
    [tickets.data, activeId],
  );

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("سجّل الدخول أولًا");
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: userId,
          status: "open",
        })
        .select(
          "id,ticket_number,user_id,status,created_at,updated_at",
        )
        .single();

      if (error) throw error;

      return data as Ticket;
    },

    onSuccess: (ticket) => {
      void qc.invalidateQueries({
        queryKey: ["support-tickets", userId],
      });

      setActiveId(ticket.id);
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر إنشاء التذكرة",
      );
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-line px-4 py-4">
        {selectedTicket && (
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
            aria-label="رجوع"
          >
            <ArrowRight className="size-4" />
          </button>
        )}

        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">
          الدعم
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
          aria-label="إغلاق"
        >
          <X className="size-5" />
        </button>
      </header>

      {selectedTicket ? (
        <SupportChat
          ticket={selectedTicket}
          onBack={() => setActiveId(null)}
        />
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <button
            type="button"
            onClick={() => createTicket.mutate()}
            disabled={createTicket.isPending}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50"
          >
            {createTicket.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}

            تذكرة جديدة
          </button>

          {tickets.isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-5 animate-spin text-forest" />
            </div>
          ) : tickets.data?.length ? (
            <div className="space-y-2.5">
              {tickets.data.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveId(ticket.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-right ring-1 ring-line"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-xs font-extrabold text-forest">
                    #{ticket.ticket_number}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      تذكرة دعم #{ticket.ticket_number}
                    </span>

                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {ticket.status === "closed"
                        ? "مغلقة"
                        : "مفتوحة"}{" "}
                      · {formatDate(ticket.updated_at)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              لا توجد تذاكر دعم بعد.
            </div>
          )}
        </main>
      )}
    </div>
  );
}
