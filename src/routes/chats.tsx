import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Building2, Crown, Loader2, MessageSquare, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ChatThread } from "@/components/ChatThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, timeAgo } from "@/lib/format";
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
        content: "ابحث عن مكتب احترافي وراسل المكتب، مع سجل المحادثات والرسائل.",
      },
      { property: "og:title", content: "الدردشة | عقار البطين" },
      { property: "og:description", content: "محادثاتك مع المكاتب العقارية الاحترافية داخل عقار البطين." },
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
  properties: { title: string } | null;
  offices: { name: string; logo_url: string | null } | null;
  lastMessage?: {
    body: string | null;
    image_url: string | null;
    created_at: string;
  } | null;
  unreadCount?: number;
};

type ProOfficeRow = {
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

  const proOffices = useQuery({
    queryKey: ["chat-pro-offices", userId],
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
      return ((data ?? []) as unknown as ProOfficeRow[])
        .filter((row) => row.is_pro_current === true);
    },
  });

  const startChat = useMutation({
    mutationFn: async (officeId: string) => {
      if (!userId) throw new Error("سجّل الدخول لبدء المحادثة");

      const { data: planData, error: planError } = await supabase.rpc(
        "office_effective_plan",
        { _office_id: officeId },
      );
      if (planError) throw planError;
      const plan = planData as {
        plan?: string;
        expires_at?: string | null;
        chat_enabled?: boolean;
      } | null;
      // office_effective_plan runs on the server and is the authority for expiry.
      if (plan?.plan !== "pro" || plan.chat_enabled !== true) {
        throw new Error("الدردشة متاحة للمكاتب المشتركة في الباقة الاحترافية السارية فقط.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("office_id", officeId)
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
        .select("id,office_id,property_id,updated_at,properties(title),offices(name,logo_url)")
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
        const aTime = new Date(a.lastMessage?.created_at ?? a.updated_at).getTime();
        const bTime = new Date(b.lastMessage?.created_at ?? b.updated_at).getTime();
        return bTime - aTime;
      });
    },
  });

  const normalizedSearch = officeSearch.trim().toLocaleLowerCase("ar");
  const matchingOffices = (proOffices.data ?? []).filter((office) =>
    office.name.toLocaleLowerCase("ar").includes(normalizedSearch),
  );

  return (
    <div
      className={
        "mx-auto flex min-h-screen w-full flex-col bg-background " +
        (isAdmin ? "max-w-6xl" : "max-w-md pb-24")
      }
    >
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-4 px-4 py-4">
        {activeId ? (
          <ChatThread
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
          <>
            <header>
              <h1 className="font-display text-xl font-extrabold">الدردشة</h1>
              
            </header>

            <section className="space-y-3 rounded-3xl bg-surface p-3.5 ring-1 ring-line">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={officeSearch}
                  onChange={(event) => setOfficeSearch(event.target.value)}
                  placeholder="اكتب اسم المكتب الاحترافي..."
                  className="w-full rounded-2xl bg-background py-3 pe-10 ps-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {proOffices.isLoading ? (
                <div className="grid place-items-center py-6">
                  <Loader2 className="size-5 animate-spin text-forest" />
                </div>
              ) : proOffices.isError ? (
                <p role="alert" className="rounded-xl bg-terracotta-soft p-3 text-xs text-terracotta">
                  تعذّر تحميل المكاتب الاحترافية. حدّث الصفحة وحاول مجددًا.
                </p>
              ) : matchingOffices.length ? (
                <ul className="space-y-2">
                  {matchingOffices.slice(0, 30).map((office) => (
                    <li key={office.id} className="flex items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-line">
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
                          <Crown className="size-3.5 shrink-0 text-terracotta" />
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
              ) : null}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold">محادثاتي</h2>
                {!!conversations.data?.length && (
                  <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-bold text-forest">
                    {conversations.data.length} محادثة
                  </span>
                )}
              </div>

              {conversations.isLoading ? (
                <div className="grid place-items-center py-8">
                  <Loader2 className="size-5 animate-spin text-forest" />
                </div>
              ) : conversations.data?.length ? (
                <ul className="space-y-2">
                  {conversations.data.map((conv, index) => (
                    <li key={conv.id}>
                      <button
                        onClick={() => void navigate({ search: { c: conv.id, office: undefined } })}
                        className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-soft text-xs font-extrabold text-forest">
                          {index + 1}
                        </span>
                        {conv.offices?.logo_url ? (
                          <img src={conv.offices.logo_url} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-forest">
                            <Building2 className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">
                            {conv.offices?.name || "مكتب عقاري"}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {conv.lastMessage?.body ||
                              (conv.lastMessage?.image_url ? "📷 صورة" : null) ||
                              conv.properties?.title ||
                              "ابدأ المحادثة"}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(conv.lastMessage?.created_at ?? conv.updated_at)}
                          </span>
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
                <div className="py-4 text-center">
                  <Link to="/offices" className="text-sm font-semibold text-forest underline underline-offset-4">
                    ادخل لصفحه المكاتب العقاريه
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      {!isAdmin && <BottomNav variant="individual" />}
    </div>
  );
}
