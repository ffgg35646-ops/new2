import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Building2, Loader2, MessageSquare, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ConversationRoom } from "@/components/ConversationRoom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, timeAgo, parseDateValue } from "@/lib/format";
import { RoleGuard } from "@/lib/role-guard";

export const Route = createFileRoute("/chats")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search["c"] === "string" ? search["c"] : undefined,
    office: typeof search["office"] === "string" ? search["office"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الدردشة | عقار البطين" },
      {
        name: "description",
        content: "ابحث عن مكتب عقاري وراسل المكتب، مع سجل المحادثات والرسائل.",
      },
      { property: "og:title", content: "الدردشة | عقار البطين" },
      { property: "og:description", content: "محادثاتك مع المكاتب العقارية داخل عقار البطين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]} guestsTo="/auth/individual">
      <ChatsPage />
    </RoleGuard>
  ),
});

type ConversationRow = {
  id: string;
  office_id: string;
  property_id: string | null;
  updated_at: string;
  status?: string;
  requested_by?: string;
  requested_at?: string;
  properties: { title: string } | null;
  offices: { name: string; logo_url: string | null } | null;
  lastMessage?: {
    body: string | null;
    image_url: string | null;
    created_at: string;
  } | null;
  unreadCount?: number;
};

type ChatOfficeRow = {
  id: string;
  name: string;
  logo_url: string | null;
  rating_avg?: number | string | null;
  reviews_count?: number | null;
  completed_requests_count?: number;
  is_pro_current?: boolean;
  verification_badge?: boolean;
  updated_at: string;
};

function ChatsPage() {
  const { userId, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { c, office: officeTargetId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeId = c ?? null;
  const [officeSearch, setOfficeSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [listMode, setListMode] = useState<"conversations" | "offices">("conversations");
  const [chatSection, setChatSection] = useState<"conversations" | "requests">("conversations");
  const startRequestedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || isAdmin) return;
    const channel = supabase
      .channel(`my-convs-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${userId}` },
        () => void qc.invalidateQueries({ queryKey: ["my-conversations", userId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc, isAdmin]);

  const chatOffices = useQuery({
    queryKey: ["chat-offices", userId],
    enabled: !!userId && !isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("id,name,logo_url,plan,plan_expires_at,package_id,updated_at,rating_avg,reviews_count,completed_requests_count,is_pro_current,verification_badge")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as ChatOfficeRow[];
    },
  });

  const startChat = useMutation({
    mutationFn: async (officeId: string) => {
      if (!userId) throw new Error("سجّل الدخول لبدء المحادثة");

      // Chat is free for every office plan. Reuse an existing conversation whenever possible.
      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("office_id", officeId)
        .neq("status", "declined")
        .limit(1)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing?.id) return String(existing.id);

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, office_id: officeId, property_id: null })
        .select("id")
        .single();
      if (error) throw error;
      return String(created.id);
    },
    onSuccess: (conversationId) => {
      startRequestedFor.current = null;
      void qc.invalidateQueries({ queryKey: ["my-conversations", userId] });
      void navigate({ search: { c: conversationId, office: undefined } });
    },
    onError: (error) => {
      startRequestedFor.current = null;
      toast.error(error instanceof Error ? error.message : "تعذّر بدء المحادثة");
      void navigate({ search: { c: undefined, office: undefined } });
    },
  });

  useEffect(() => {
    if (isAdmin || !officeTargetId || !userId || activeId || startChat.isPending) return;
    if (startRequestedFor.current === officeTargetId) return;
    startRequestedFor.current = officeTargetId;
    startChat.mutate(officeTargetId);
  }, [officeTargetId, userId, activeId, startChat.isPending, isAdmin]);

  const conversations = useQuery({
    queryKey: ["my-conversations", userId],
    enabled: !!userId && !isAdmin,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,office_id,property_id,updated_at,status,requested_by,requested_at,properties(title),offices(name,logo_url)")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as ConversationRow[];
      await Promise.all(
        rows.map(async (conversation) => {
          const { data: latest, error: latestError } = await supabase
            .from("messages")
            .select("body,image_url,created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestError) throw latestError;
          conversation.lastMessage = latest ?? null;

          const { count, error: unreadError } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conversation.id)
            .neq("sender_id", userId!)
            .is("read_at", null);
          if (unreadError) throw unreadError;
          conversation.unreadCount = count ?? 0;
        }),
      );
      return rows.sort((a, b) => {
        const aTime = (parseDateValue(a.lastMessage?.created_at ?? a.updated_at)?.getTime() ?? 0);
        const bTime = (parseDateValue(b.lastMessage?.created_at ?? b.updated_at)?.getTime() ?? 0);
        return bTime - aTime;
      });
    },
  });

  const normalizedSearch = officeSearch.trim().toLocaleLowerCase("ar");
  const matchingOffices = (chatOffices.data ?? []).filter((office) =>
    office.name.toLocaleLowerCase("ar").includes(normalizedSearch),
  );
  const normalizedConversationSearch = conversationSearch.trim().toLocaleLowerCase("ar");
  const activeConversations = (conversations.data ?? []).filter(
    (conversation) => conversation.status !== "pending" && conversation.status !== "declined",
  );
  const pendingRequests = (conversations.data ?? []).filter(
    (conversation) => conversation.status === "pending",
  );
  const matchingConversations = activeConversations.filter((conversation) =>
    [
      conversation.offices?.name,
      conversation.lastMessage?.body,
      conversation.properties?.title,
    ].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(normalizedConversationSearch)),
  );
  const matchingRequests = pendingRequests.filter((conversation) =>
    [
      conversation.offices?.name,
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
      void qc.invalidateQueries({ queryKey: ["my-conversations", userId] });
      toast.success(action === "accept" ? "تم قبول طلب المراسلة" : "تم رفض طلب المراسلة");
      if (action === "accept") {
        setChatSection("conversations");
        void navigate({ search: { c: conversationId, office: undefined } });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "تعذّر التعامل مع طلب المراسلة");
    },
  });

  return (
    <div
      className={
        "mx-auto flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background " +
        (isAdmin ? "max-w-6xl" : "max-w-md")
      }
    >
      <AppHeader showSearch={false} />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-4">
        {activeId ? (
          <ConversationRoom
            conversationId={activeId}
            title={
              isAdmin
                ? "مراجعة محادثة — وضع القراءة فقط"
                : conversations.data?.find((conversation) => conversation.id === activeId)?.offices?.name ?? "محادثة المكتب"
            }
            readOnly={isAdmin}
            onBack={() =>
              isAdmin
                ? void navigate({ to: "/admin", search: { tab: "dashboard" } })
                : void navigate({ search: { c: undefined, office: undefined } })
            }
          />
        ) : isAdmin ? (
          <section className="space-y-3 rounded-3xl bg-surface p-5 ring-1 ring-line">
            <h1 className="font-display text-lg font-extrabold">مراجعة محادثة</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              افتح رابط المحادثة الذي يحتوي على معرّف c لمراجعتها كمسؤول. العرض هنا للقراءة فقط.
            </p>
            <Link
              to="/admin"
              search={{ tab: "dashboard" }}
              className="block rounded-2xl bg-forest py-3 text-center text-sm font-bold text-background"
            >
              العودة إلى لوحة الإدارة
            </Link>
          </section>
        ) : officeTargetId || startChat.isPending ? (
          <div className="grid place-items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-forest" />
            جارٍ فتح المحادثة...
          </div>
        ) : (
          <section className="flex min-h-[360px] max-h-[68dvh] flex-none flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className="shrink-0 border-b border-line p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                    <MessageSquare className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-lg font-extrabold">الدردشات</h1>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">محادثاتك في مكان واحد</p>
                  </div>
                </div>
                {chatSection === "conversations" ? (
                  <button
                    type="button"
                    onClick={() => setListMode((mode) => mode === "offices" ? "conversations" : "offices")}
                    aria-label={listMode === "offices" ? "عرض المحادثات الحالية" : "استكشف المكاتب العقارية"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest-soft px-3 py-2 text-[11px] font-bold text-forest transition hover:bg-forest/10"
                  >
                    {listMode === "offices" ? <MessageSquare className="size-3.5" /> : <Building2 className="size-3.5" />}
                    {listMode === "offices" ? "محادثات حالية" : "استكشف المكاتب"}
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-forest-soft px-3 py-1.5 text-xs font-bold text-forest">
                    {activeConversations.length} محادثة
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-background p-1 ring-1 ring-line">
                <button
                  type="button"
                  onClick={() => {
                    setChatSection("conversations");
                    setListMode("conversations");
                  }}
                  className={"flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition " + (chatSection === "conversations" ? "bg-forest text-background shadow-sm" : "text-muted-foreground")}
                >
                  <span>محادثات حالية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatSection("requests")}
                  className={"flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition " + (chatSection === "requests" ? "bg-forest text-background shadow-sm" : "text-muted-foreground")}
                >
                  <span>طلبات المراسلة</span>
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={chatSection === "requests" || listMode === "conversations" ? conversationSearch : officeSearch}
                  onChange={(event) => (chatSection === "requests" || listMode === "conversations") ? setConversationSearch(event.target.value) : setOfficeSearch(event.target.value)}
                  placeholder={chatSection === "requests" ? "ابحث في طلبات المراسلة..." : listMode === "conversations" ? "ابحث باسم المكتب أو رسالة..." : "ابحث عن مكتب عقاري..."}
                  aria-label={chatSection === "requests" ? "البحث في طلبات المراسلة" : listMode === "conversations" ? "البحث في المحادثات" : "البحث عن مكتب"}
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
                    {matchingRequests.map((conv) => {
                      const isIncoming = conv.requested_by !== userId;
                      return (
                        <li key={conv.id} className="rounded-2xl border border-line bg-background p-3">
                          <button
                            type="button"
                            onClick={() => void navigate({ search: { c: conv.id, office: undefined } })}
                            className="flex w-full items-center gap-3 text-right"
                          >
                            {conv.offices?.logo_url ? (
                              <img src={conv.offices.logo_url} alt="" loading="lazy" className="size-11 shrink-0 rounded-2xl object-cover" />
                            ) : (
                              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                                <Building2 className="size-5" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{conv.offices?.name || "مكتب عقاري"}</span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {conv.lastMessage?.body || (conv.lastMessage?.image_url ? "📷 صورة" : null) || conv.properties?.title || "طلب مراسلة جديد"}
                              </span>
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(conv.lastMessage?.created_at ?? conv.requested_at ?? conv.updated_at)}</span>
                          </button>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                            {isIncoming ? (
                              <>
                                <span className="text-[10px] font-semibold text-terracotta">طلب جديد</span>
                                <div className="flex items-center gap-2">
                                  <button type="button" disabled={resolveMessageRequest.isPending} onClick={() => resolveMessageRequest.mutate({ conversationId: conv.id, action: "decline" })} className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-muted-foreground disabled:opacity-50">رفض</button>
                                  <button type="button" disabled={resolveMessageRequest.isPending} onClick={() => resolveMessageRequest.mutate({ conversationId: conv.id, action: "accept" })} className="rounded-xl bg-forest px-3 py-2 text-xs font-bold text-background disabled:opacity-50">قبول</button>
                                </div>
                              </>
                            ) : (
                              <span className="rounded-full bg-forest-soft px-3 py-1.5 text-[10px] font-bold text-forest">بانتظار رد المكتب</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="grid min-h-full content-center justify-items-center gap-3 px-5 py-8 text-center">
                    <span className="grid size-16 place-items-center rounded-3xl bg-forest-soft text-forest">
                      <MessageSquare className="size-8" />
                    </span>
                    <h2 className="font-display text-base font-extrabold">{conversationSearch.trim() ? "لا توجد نتائج مطابقة" : "لا توجد طلبات مراسلة جديدة"}</h2>
                  </div>
                )
              ) : listMode === "conversations" ? (
                conversations.isLoading ? (
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
                    {matchingConversations.map((conv) => (
                      <li key={conv.id}>
                        <button
                          type="button"
                          onClick={() => void navigate({ search: { c: conv.id, office: undefined } })}
                          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-background p-3.5 text-right transition hover:border-forest/40 hover:bg-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                        >
                          {conv.offices?.logo_url ? (
                            <img src={conv.offices.logo_url} alt="" loading="lazy" className="size-11 shrink-0 rounded-2xl object-cover" />
                          ) : (
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                              <Building2 className="size-5" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{conv.offices?.name || "مكتب عقاري"}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                              {conv.lastMessage?.body || (conv.lastMessage?.image_url ? "📷 صورة" : null) || conv.properties?.title || "ابدأ المحادثة"}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[10px] text-muted-foreground">{formatDate(conv.lastMessage?.created_at ?? conv.updated_at)}</span>
                            {!!conv.unreadCount && (
                              <span className="grid min-w-5 place-items-center rounded-full bg-terracotta px-1.5 py-0.5 text-[9px] font-bold text-background">
                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                              </span>
                            )}
                            {!conv.unreadCount && (
                              <span className="text-[9px] text-muted-foreground">{timeAgo(conv.lastMessage?.created_at ?? conv.updated_at)}</span>
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
                      {conversationSearch.trim() ? "لا توجد نتائج مطابقة" : "محادثاتك هتظهر هنا"}
                    </h2>
                    <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                      {conversationSearch.trim() ? "جرّب اسم مكتب أو كلمة من الرسالة." : "لسه مفيش محادثات. استكشف المكاتب العقارية وابدأ أول محادثة، وكل رسائلك هتظهر داخل المساحة دي."}
                    </p>
                    {!conversationSearch.trim() && (
                      <>
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
                        <button
                          type="button"
                          onClick={() => setListMode("offices")}
                          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-xs font-bold text-background"
                        >
                          <Building2 className="size-4" /> استكشف المكاتب
                        </button>
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {chatOffices.isLoading ? (
                    <div className="grid place-items-center py-8">
                      <Loader2 className="size-5 animate-spin text-forest" />
                    </div>
                  ) : chatOffices.isError ? (
                    <p role="alert" className="rounded-2xl bg-terracotta-soft p-3 text-xs text-terracotta">
                      تعذّر تحميل المكاتب العقارية. حدّث الصفحة وحاول مجددًا.
                    </p>
                  ) : matchingOffices.length ? (
                    <ul className="space-y-2">
                      {matchingOffices.slice(0, 30).map((office) => (
                        <li key={office.id} className="flex items-center gap-3 rounded-2xl border border-line bg-background p-3">
                          {office.logo_url ? (
                            <img src={office.logo_url} alt="" loading="lazy" className="size-10 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                              <Building2 className="size-5" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 truncate text-sm font-bold">
                              {office.name}

                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                              <Star className="size-3 fill-terracotta text-terracotta" />
                              {Number(office.rating_avg ?? 0).toFixed(1)}
                              <span>· {office.completed_requests_count ?? 0} طلب مكتمل</span>
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              startRequestedFor.current = null;
                              void navigate({ search: { c: undefined, office: office.id } });
                            }}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-forest px-3 py-2.5 text-xs font-bold text-background"
                          >
                            <MessageSquare className="size-3.5" /> شات
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="grid min-h-40 place-items-center gap-2 px-4 text-center">
                      <Building2 className="size-8 text-muted-foreground" />
                      <p className="text-sm font-bold">لا توجد مكاتب عقارية مطابقة لبحثك</p>
                      <p className="text-xs text-muted-foreground">جرّب البحث باسم آخر</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      {!isAdmin && <BottomNav variant="individual" />}
    </div>
  );
}
