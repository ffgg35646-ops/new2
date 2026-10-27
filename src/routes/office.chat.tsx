import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Loader2, MessageSquare, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ConversationRoom } from "@/components/ConversationRoom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useMyOffice } from "@/lib/office";
import { RoleGuard } from "@/lib/role-guard";

export const Route = createFileRoute("/office/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search["c"] === "string" ? search["c"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الدردشة مع العملاء | عقار البطين" },
      {
        name: "description",
        content:
          "محادثات مكتبك العقاري مع العملاء داخل عقار البطين، مرتبطة بالعقار الذي استفسر عنه كل عميل.",
      },
      { property: "og:title", content: "الدردشة مع العملاء | عقار البطين" },
      {
        property: "og:description",
        content: "سجل المحادثات والعملاء لمكتبك العقاري.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeChatPage />
    </RoleGuard>
  ),
});

type ConversationRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  updated_at: string;
  status?: string;
  requested_by?: string;
  requested_at?: string;
  properties: { title: string } | null;
  client?: { full_name: string } | null;
  lastMessage?: {
    body: string | null;
    image_url: string | null;
    created_at: string;
  } | null;
  unreadCount?: number;
};

function OfficeChatPage() {
  const { data: membership } = useMyOffice();
  const { userId } = useAuth();
  const { c } = Route.useSearch();
  const navigate = Route.useNavigate();
  const officeId = membership?.office?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(c ?? null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [chatSection, setChatSection] = useState<"conversations" | "requests">("conversations");
  const qc = useQueryClient();

  useEffect(() => {
    setActiveId(c ?? null);
  }, [c]);

  useEffect(() => {
    if (!officeId) return;
    const channel = supabase
      .channel(`office-convs-${officeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `office_id=eq.${officeId}`,
        },
        () => void qc.invalidateQueries({ queryKey: ["office-conversations", officeId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [officeId, qc]);

  const conversations = useQuery({
    queryKey: ["office-conversations", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,user_id,property_id,updated_at,status,requested_by,requested_at,properties(title)")
        .eq("office_id", officeId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationRow[];

      const ids = [...new Set(rows.map((c) => c.user_id))];

      if (ids.length) {
        const { data: clientData, error: clientError } = await supabase.rpc(
          "office_chat_clients" as never,
          { _office_id: officeId! } as never,
        );
        if (clientError) throw clientError;

        const clients = Array.isArray(clientData)
          ? clientData as Array<{ id: string; full_name: string }>
          : [];
        const byId = new Map(clients.map((client) => [client.id, client]));

        for (const c of rows) {
          c.client = byId.get(c.user_id) ?? { full_name: "عميل" };

          const { data: latest } = await supabase
            .from("messages")
            .select("body,image_url,created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          c.lastMessage = latest ?? null;

          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("sender_id", c.user_id)
            .is("read_at", null);

          c.unreadCount = count ?? 0;
        }
      }

      return rows;
    },
    refetchInterval: 30_000,
  });

  const normalizedConversationSearch = conversationSearch.trim().toLocaleLowerCase("ar");
  const activeConversations = (conversations.data ?? []).filter(
    (conversation) => conversation.status !== "pending" && conversation.status !== "declined",
  );
  const pendingRequests = (conversations.data ?? []).filter(
    (conversation) => conversation.status === "pending",
  );
  const incomingRequestCount = pendingRequests.filter(
    (conversation) => conversation.requested_by !== userId,
  ).length;
  const matchingConversations = activeConversations.filter((conversation) =>
    [
      conversation.client?.full_name,
      conversation.lastMessage?.body,
      conversation.properties?.title,
    ].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(normalizedConversationSearch)),
  );
  const matchingRequests = pendingRequests.filter((conversation) =>
    [
      conversation.client?.full_name,
      conversation.lastMessage?.body,
      conversation.properties?.title,
    ].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(normalizedConversationSearch)),
  );

  const resolveMessageRequest = useMutation({
    mutationFn: async ({ conversationId, action }: { conversationId: string; action: "accept" | "decline" }) => {
      const { data, error } = await supabase.rpc("resolve_chat_request", {
        _conversation_id: conversationId,
        _action: action,
      });
      if (error) throw error;
      return { conversationId, action, status: data };
    },
    onSuccess: ({ conversationId, action }) => {
      void qc.invalidateQueries({ queryKey: ["office-conversations", officeId] });
      toast.success(action === "accept" ? "تم قبول طلب المراسلة" : "تم رفض طلب المراسلة");
      if (action === "accept") {
        setChatSection("conversations");
        setActiveId(conversationId);
        void navigate({ search: { c: conversationId } });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "تعذّر التعامل مع طلب المراسلة");
    },
  });

  return (
    <div className="mx-auto flex h-dvh min-h-0 w-full max-w-md min-w-0 flex-col overflow-hidden bg-background">
      <AppHeader showSearch={false} />

      <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-4 py-4">
        {activeId ? (
          <ConversationRoom
            conversationId={activeId}
            title={conversations.data?.find((conversation) => conversation.id === activeId)?.client?.full_name ?? "العميل"}
            onBack={() => {
              setActiveId(null);
              void navigate({ search: { c: undefined } });
            }}
          />
        ) : (
          <section className="flex min-h-[360px] max-h-[68dvh] flex-none flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className="shrink-0 border-b border-line p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                    <MessageSquare className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-lg font-extrabold">محادثات العملاء</h1>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">كل رسائل العملاء في مكان واحد</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-forest-soft px-3 py-1.5 text-xs font-bold text-forest">
                  {activeConversations.length} محادثة
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-background p-1 ring-1 ring-line">
                <button
                  type="button"
                  onClick={() => setChatSection("conversations")}
                  className={"flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition " + (chatSection === "conversations" ? "bg-forest text-background shadow-sm" : "text-muted-foreground")}
                >
                  <span>محادثات حالية</span>
                  <span className="rounded-full bg-background/20 px-1.5 py-0.5 text-[10px]">{activeConversations.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatSection("requests")}
                  className={"flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition " + (chatSection === "requests" ? "bg-forest text-background shadow-sm" : "text-muted-foreground")}
                >
                  <span>طلبات المراسلة</span>
                  <span className="rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] text-background">{incomingRequestCount}</span>
                </button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder={chatSection === "requests" ? "ابحث في طلبات المراسلة..." : "ابحث باسم العميل أو محتوى الرسالة..."}
                  aria-label={chatSection === "requests" ? "البحث في طلبات المراسلة" : "البحث في محادثات العملاء"}
                  className="w-full rounded-2xl bg-background py-3 pe-10 ps-3 text-sm ring-1 ring-line outline-none transition focus:ring-2 focus:ring-forest"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
              {chatSection === "requests" ? (
                conversations.isLoading ? (
                  <div className="grid min-h-full place-items-center py-8">
                    <Loader2 className="size-5 animate-spin text-forest" />
                  </div>
                ) : conversations.isError ? (
                  <div className="grid min-h-full content-center justify-items-center gap-3 p-5 text-center">
                    <MessageSquare className="size-8 text-terracotta" />
                    <p className="text-sm font-bold">تعذّر تحميل طلبات المراسلة</p>
                    <p className="text-xs text-muted-foreground">تحقق من الاتصال وحاول مجددًا.</p>
                  </div>
                ) : matchingRequests.length ? (
                  <ul className="space-y-2">
                    {matchingRequests.map((conversation) => {
                      const isIncoming = conversation.requested_by !== userId;
                      return (
                        <li key={conversation.id} className="rounded-2xl border border-line bg-background p-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(conversation.id);
                              void navigate({ search: { c: conversation.id } });
                            }}
                            className="flex w-full items-center gap-3 text-right"
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft font-display text-base font-extrabold text-forest">
                              {(conversation.client?.full_name || "؟").charAt(0)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{conversation.client?.full_name || "عميل"}</span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {conversation.lastMessage?.body || (conversation.lastMessage?.image_url ? "📷 صورة" : null) || conversation.properties?.title || "طلب مراسلة جديد"}
                              </span>
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(conversation.lastMessage?.created_at ?? conversation.requested_at ?? conversation.updated_at)}</span>
                          </button>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                            {isIncoming ? (
                              <>
                                <span className="text-[10px] font-semibold text-terracotta">طلب جديد</span>
                                <div className="flex items-center gap-2">
                                  <button type="button" disabled={resolveMessageRequest.isPending} onClick={() => resolveMessageRequest.mutate({ conversationId: conversation.id, action: "decline" })} className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-muted-foreground disabled:opacity-50">رفض</button>
                                  <button type="button" disabled={resolveMessageRequest.isPending} onClick={() => resolveMessageRequest.mutate({ conversationId: conversation.id, action: "accept" })} className="rounded-xl bg-forest px-3 py-2 text-xs font-bold text-background disabled:opacity-50">قبول</button>
                                </div>
                              </>
                            ) : (
                              <span className="rounded-full bg-forest-soft px-3 py-1.5 text-[10px] font-bold text-forest">بانتظار رد العميل</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="grid min-h-full content-center justify-items-center gap-3 px-5 py-8 text-center">
                    <span className="grid size-16 place-items-center rounded-3xl bg-forest-soft text-forest"><MessageSquare className="size-8" /></span>
                    <h2 className="font-display text-base font-extrabold">{conversationSearch.trim() ? "لا توجد نتائج مطابقة" : "لا توجد طلبات مراسلة جديدة"}</h2>
                  </div>
                )
              ) : conversations.isLoading ? (
                <div className="grid min-h-full place-items-center py-8">
                  <Loader2 className="size-5 animate-spin text-forest" />
                </div>
              ) : conversations.isError ? (
                <div className="grid min-h-full content-center justify-items-center gap-3 p-5 text-center">
                  <MessageSquare className="size-8 text-terracotta" />
                  <p className="text-sm font-bold">تعذّر تحميل المحادثات</p>
                  <p className="text-xs text-muted-foreground">تحقق من الاتصال وحاول مجددًا.</p>
                </div>
              ) : matchingConversations.length ? (
                <ul className="space-y-2">
                  {matchingConversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(conversation.id);
                          void navigate({ search: { c: conversation.id } });
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-background p-3.5 text-right transition hover:border-forest/40 hover:bg-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft font-display text-base font-extrabold text-forest">
                          {(conversation.client?.full_name || "؟").charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{conversation.client?.full_name || "عميل"}</span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {conversation.lastMessage?.body || (conversation.lastMessage?.image_url ? "📷 صورة" : null) || conversation.properties?.title || "محادثة عامة"}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(conversation.lastMessage?.created_at ?? conversation.updated_at)}
                          </span>
                          {!!conversation.unreadCount && (
                            <span className="grid min-w-5 place-items-center rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-background">
                              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid min-h-full content-center justify-items-center gap-3 px-5 py-8 text-center">
                  <span className="relative grid size-16 place-items-center rounded-3xl bg-forest-soft text-forest">
                    <MessageSquare className="size-8" />
                    <span className="absolute -left-1 -top-1 grid size-6 place-items-center rounded-full bg-terracotta text-background">
                      <span className="text-xs font-bold">+</span>
                    </span>
                  </span>
                  <h2 className="font-display text-base font-extrabold">
                    {conversationSearch.trim() ? "لا توجد نتائج مطابقة" : "محادثات العملاء هتظهر هنا"}
                  </h2>
                  <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                    {conversationSearch.trim() ? "جرّب اسم عميل أو كلمة من الرسالة." : "لسه مفيش رسائل واردة. أول ما يبدأ عميل محادثة مع المكتب، هتظهر هنا داخل القائمة."}
                  </p>
                  {!conversationSearch.trim() && (
                    <div className="mt-2 w-full max-w-xs space-y-2" aria-hidden="true">
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-background p-3 opacity-45">
                        <span className="size-10 rounded-2xl bg-forest-soft" />
                        <span className="flex-1 space-y-2">
                          <span className="block h-2.5 w-2/5 rounded-full bg-line" />
                          <span className="block h-2 w-4/5 rounded-full bg-line" />
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-background p-3 opacity-25">
                        <span className="size-10 rounded-2xl bg-forest-soft" />
                        <span className="flex-1 space-y-2">
                          <span className="block h-2.5 w-1/3 rounded-full bg-line" />
                          <span className="block h-2 w-3/5 rounded-full bg-line" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <BottomNav variant="office" />
    </div>
  );
}