
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
      {
        name: "description",
        content:
          "تنبيهات ردود المكاتب وحجوزات المعاينة والعقارات المطابقة وعروض الأسعار.",
      },
      { property: "og:title", content: "الإشعارات | عقار البطين" },
      {
        property: "og:description",
        content: "تابع كل جديد يخص عقاراتك وطلباتك وعقاراتك المحفوظة.",
      },
    ],
  }),
  component: NotificationsPage,
});

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function NotificationsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const queryKey = ["notifications", userId];

  const { data, isLoading } = useQuery<NotificationRow[]>({
    queryKey,
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,type,link,is_read,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId!);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.setQueryData<NotificationRow[]>(queryKey, (rows) =>
        rows?.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "تعذّر تحديث الإشعار"),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });

      const previous = qc.getQueryData<NotificationRow[]>(queryKey);

      qc.setQueryData<NotificationRow[]>(queryKey, (rows) =>
        rows?.map((n) => ({ ...n, is_read: true })),
      );

      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }

      toast.error(
        e instanceof Error ? e.message : "تعذّر تعليم الإشعارات كمقروءة",
      );
    },
    onSuccess: () => {
      toast.success("تم تعليم جميع الإشعارات كمقروءة");
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const deleteAll = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });

      const previous = qc.getQueryData<NotificationRow[]>(queryKey);

      qc.setQueryData<NotificationRow[]>(queryKey, []);

      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }

      toast.error(
        e instanceof Error ? e.message : "تعذّر حذف جميع الإشعارات",
      );
    },
    onSuccess: () => {
      toast.success("تم حذف جميع الإشعارات");
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const unreadCount = data?.filter((n) => !n.is_read).length ?? 0;

  function openNotification(n: NotificationRow) {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }

    if (n.link) {
      window.location.href = n.link;
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-xl font-extrabold">الإشعارات</h1>

            {!!unreadCount && (
              <p className="mt-1 text-xs text-muted-foreground">
                {unreadCount} غير مقروء
              </p>
            )}
          </div>

          {!!data?.length && (
            <div className="flex gap-2">
              {!!unreadCount && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-forest-soft px-3 py-2 text-[11px] font-bold text-forest disabled:opacity-60"
                >
                  <CheckCheck className="size-3.5" />
                  مقروءة
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "هل أنت متأكد من حذف جميع الإشعارات؟",
                    )
                  ) {
                    deleteAll.mutate();
                  }
                }}
                disabled={deleteAll.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-terracotta-soft px-3 py-2 text-[11px] font-bold text-terracotta disabled:opacity-60"
              >
                <Trash2 className="size-3.5" />
                حذف الكل
              </button>
            </div>
          )}
        </div>

        {!userId ? (
          <EmptyState
            icon={Bell}
            title="سجّل الدخول لعرض إشعاراتك"
          />
        ) : isLoading && !data ? (
          <ListSkeleton />
        ) : data?.length ? (
          <div className="space-y-2.5">
            {data.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={cn(
                  "block w-full rounded-2xl p-3.5 text-right ring-1 ring-line transition",
                  n.is_read
                    ? "bg-surface"
                    : "bg-forest-soft ring-forest/20",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{n.title}</span>

                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </div>

                {n.body && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {n.body}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="لا توجد إشعارات"
            description="سننبهك عند وصول أي جديد."
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
