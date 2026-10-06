import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | عقار البطين" },
      { name: "description", content: "تنبيهات العروض الجديدة وحالة حجوزاتك وطلباتك." },
      { property: "og:title", content: "الإشعارات | عقار البطين" },
      { property: "og:description", content: "تابع كل جديد يخص عقاراتك وطلباتك." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الإشعارات</h1>
        {!userId ? (
          <EmptyState icon={Bell} title="سجّل الدخول لعرض إشعاراتك" />
        ) : isLoading ? (
          <ListSkeleton />
        ) : data?.length ? (
          <div className="space-y-2.5">
            {data.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead.mutate(n.id);
                  if (n.link) router.history.push(n.link);
                }}
                className={cn(
                  "block w-full rounded-2xl p-3.5 text-right ring-1 ring-line",
                  n.is_read ? "bg-surface" : "bg-forest-soft",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="سننبهك عند وصول أي جديد." />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
