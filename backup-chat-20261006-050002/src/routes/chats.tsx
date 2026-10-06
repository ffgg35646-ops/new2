import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Building2, Loader2, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ChatThread } from "@/components/ChatThread";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { RoleGuard } from "@/lib/role-guard";

export const Route = createFileRoute("/chats")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search["c"] === "string" ? search["c"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "محادثاتي | عقار البطين" },
      {
        name: "description",
        content: "محادثاتك مع المكاتب العقارية حول العقارات التي استفسرت عنها.",
      },
      { property: "og:title", content: "محادثاتي | عقار البطين" },
      { property: "og:description", content: "تواصل مباشرة مع المكاتب العقارية داخل التطبيق." },
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
};

function ChatsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const { c } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeId = c ?? null;

  useEffect(() => {
    if (!userId) return;
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
  }, [userId, qc]);

  const conversations = useQuery({
    queryKey: ["my-conversations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,office_id,property_id,updated_at,properties(title),offices(name,logo_url)")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConversationRow[];
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">محادثاتي</h1>

        {activeId ? (
          <ChatThread
            conversationId={activeId}
            onBack={() => void navigate({ search: { c: undefined } })}
          />
        ) : conversations.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : conversations.data?.length ? (
          <ul className="space-y-2">
            {conversations.data.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => void navigate({ search: { c: conv.id } })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
                >
                  {conv.offices?.logo_url ? (
                    <img
                      src={conv.offices.logo_url}
                      alt=""
                      className="size-10 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                      <Building2 className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {conv.offices?.name || "مكتب عقاري"}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {conv.properties?.title ?? "محادثة عامة"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDate(conv.updated_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد محادثات بعد"
            description="ابدأ محادثة من صفحة أي عقار عبر زر «مراسلة» للتواصل مع المكتب مباشرة."
            action={
              <Link
                to="/properties"
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
              >
                تصفح العقارات
              </Link>
            }
          />
        )}
      </main>

      <BottomNav variant="individual" />
    </div>
  );
}
