import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Crown, Loader2, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ChatThread } from "@/components/ChatThread";
import { EmptyState } from "@/components/EmptyState";
import { CHAT_LOCK_MESSAGE } from "@/components/ProLock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { useMyOffice } from "@/lib/office";
import { useMyPlan } from "@/lib/plans";
import { RoleGuard } from "@/lib/role-guard";

export const Route = createFileRoute("/office/chat")({
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
        content: "سجل المحادثات والعملاء لمكتبك العقاري ضمن الباقة الاحترافية.",
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
  properties: { title: string } | null;
  client?: { full_name: string } | null;
};

function OfficeChatPage() {
  const { data: membership } = useMyOffice();
  const officeId = membership?.office?.id ?? null;
  const { isPro, isLoading } = useMyPlan();
  const [activeId, setActiveId] = useState<string | null>(null);
  const qc = useQueryClient();

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
    enabled: !!officeId && isPro,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,user_id,property_id,updated_at,properties(title)")
        .eq("office_id", officeId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationRow[];
      const ids = [...new Set(rows.map((c) => c.user_id))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", ids);
        const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
        for (const c of rows) c.client = byId.get(c.user_id) ?? null;
      }
      return rows;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الدردشة</h1>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : !isPro ? (
          <section className="rounded-3xl bg-surface p-5 text-center ring-1 ring-line">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-terracotta-soft text-terracotta">
              <Crown className="size-6" />
            </span>
            <h2 className="mt-3 font-display text-base font-extrabold">🔒 الدردشة مقفلة</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {CHAT_LOCK_MESSAGE}
            </p>
            <Link
              to="/office/subscription"
              className="mt-5 block rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
            >
              ترقية الباقة
            </Link>
            <Link
              to="/office/requests"
              className="mt-2 block rounded-2xl bg-sand py-3 text-xs font-semibold text-forest"
            >
              عرض طلبات التواصل الواردة
            </Link>
          </section>
        ) : activeId ? (
          <ChatThread conversationId={activeId} onBack={() => setActiveId(null)} />
        ) : conversations.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : conversations.data?.length ? (
          <ul className="space-y-2">
            {conversations.data.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest">
                    {(c.client?.full_name || "؟").charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {c.client?.full_name || "عميل"}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {c.properties?.title ?? "محادثة عامة"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDate(c.updated_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد محادثات بعد"
            description="ستظهر هنا محادثاتك مع العملاء المهتمين بعقاراتك."
          />
        )}
      </div>

      <BottomNav variant="office" />
    </div>
  );
}
