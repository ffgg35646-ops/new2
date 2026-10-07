
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  Mail,
  Search,
  Send,
  Users,
  Building2,
  X,
  Loader2,
  Megaphone,
  UserRound,
  Building,
  CheckCheck,
  UsersRound,
  SendHorizontal,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { RoleGuard } from "@/lib/role-guard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "إشعارات المستخدمين | لوحة الإدارة" },
      {
        name: "description",
        content: "إرسال إشعارات جماعية أو لمستخدمين ومكاتب محددة.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]} guestsTo="/home">
      <AdminNotifications />
    </RoleGuard>
  ),
});

type Audience = "all" | "individual" | "office";

type Recipient = {
  userId: string;
  name: string;
  email: string;
  kind: "individual" | "office";
  officeId?: string;
};


function AdminInbox() {
  const { userId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const inbox = useQuery({
    queryKey: ["admin-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,type,link,is_read,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-notifications-page-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["admin-notifications", userId],
          });
          void qc.invalidateQueries({
            queryKey: ["unread-notifications", userId],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["admin-notifications", userId],
      });
      void qc.invalidateQueries({
        queryKey: ["unread-notifications", userId],
      });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId!)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["admin-notifications", userId],
      });
      void qc.invalidateQueries({
        queryKey: ["unread-notifications", userId],
      });
    },
  });

  return (
    <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-extrabold">
            الإشعارات الواردة
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            بلاغات ودعم وطلبات تسجيل وتحديثات الإدارة.
          </p>
        </div>

        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
          className="rounded-xl bg-sand px-3 py-2 text-[10px] font-bold disabled:opacity-50"
        >
          {markAll.isPending ? "جارٍ..." : "تمييز الكل كمقروء"}
        </button>
      </div>

      {inbox.isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : inbox.isError ? (
        <div className="rounded-2xl bg-destructive/5 p-4 text-xs text-destructive">
          تعذر تحميل الإشعارات الواردة.
          <div className="mt-1 break-words opacity-80">
            {inbox.error instanceof Error
              ? inbox.error.message
              : "خطأ غير معروف"}
          </div>
        </div>
      ) : inbox.data?.length ? (
        <div className="space-y-2">
          {inbox.data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.is_read) {
                  await markRead.mutateAsync(n.id);
                }

                if (n.link) {
                  router.history.push(n.link);
                }
              }}
              className={cn(
                "block w-full rounded-2xl p-3.5 text-right ring-1 ring-line",
                n.is_read
                  ? "bg-background"
                  : "bg-forest-soft",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">
                  {n.title}
                </span>
                {!n.is_read && (
                  <span className="rounded-full bg-terracotta px-2 py-0.5 text-[9px] font-bold text-background">
                    جديد
                  </span>
                )}
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
        <div className="py-10 text-center text-xs text-muted-foreground">
          لا توجد إشعارات واردة.
        </div>
      )}
    </section>
  );
}

function AdminNotifications() {
  const [audience, setAudience] = useState<Audience>("individual");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [notificationType, setNotificationType] = useState<"general" | "property">(
    "general",
  );
  const [propertyNumber, setPropertyNumber] = useState("");

  const recipientsQuery = useQuery<Recipient[]>({
    queryKey: ["admin-notification-recipients"],
    staleTime: 10 * 60_000,
    gcTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const [profilesRes, rolesRes, officesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,email")
          .order("full_name"),
        supabase
          .from("user_roles")
          .select("user_id,role"),
        supabase
          .from("offices")
          .select("id,name,email,owner_id,is_deleted")
          .eq("is_deleted", false)
          .order("name"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (officesRes.error) throw officesRes.error;

      const profiles = profilesRes.data ?? [];
      const roleMap = new Map<string, Set<string>>();

      for (const row of rolesRes.data ?? []) {
        const roles = roleMap.get(row.user_id) ?? new Set<string>();
        roles.add(row.role);
        roleMap.set(row.user_id, roles);
      }

      const profileMap = new Map(
        profiles.map((p) => [
          p.id,
          {
            name: p.full_name || "بدون اسم",
            email: p.email || "بدون بريد",
          },
        ]),
      );

      const individuals: Recipient[] = profiles
        .filter((p) => {
          const roles = roleMap.get(p.id);
          return (
            roles?.has("individual") &&
            !roles.has("admin")
          );
        })
        .map((p) => ({
          userId: p.id,
          name: p.full_name || "بدون اسم",
          email: p.email || "بدون بريد",
          kind: "individual",
        }));

      const offices: Recipient[] = (officesRes.data ?? [])
        .filter((o) => !!o.owner_id)
        .map((o) => {
          const profile = profileMap.get(o.owner_id!);

          return {
            userId: o.owner_id!,
            officeId: o.id,
            name: o.name || "بدون اسم",
            email: o.email || profile?.email || "بدون بريد",
            kind: "office" as const,
          };
        });

      return [...individuals, ...offices];
    },
  });

  const recipients = recipientsQuery.data ?? [];

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();

    return recipients.filter((r) => {
      if (audience !== "all" && r.kind !== audience) return false;
      if (!q) return true;

      return (
        r.name.toLocaleLowerCase().includes(q) ||
        r.email.toLocaleLowerCase().includes(q)
      );
    });
  }, [recipients, audience, search]);

  const toggle = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(userId)) next.delete(userId);
      else next.add(userId);

      return next;
    });
  };

  function selectVisible() {
    setSelected((current) => {
      const next = new Set(current);

      for (const recipient of visible) {
        next.add(recipient.userId);
      }

      return next;
    });
  }

  function clearSelected() {
    setSelected(new Set());
  }

  const send = useMutation({
    mutationFn: async () => {
      if (!selected.size) {
        throw new Error("اختر مستلمًا واحدًا على الأقل");
      }

      if (title.trim().length < 2) {
        throw new Error("اكتب عنوان الإشعار");
      }

      if (body.trim().length < 2) {
        throw new Error("اكتب نص الإشعار");
      }

      let link = "/notifications";
      let type = "admin_message";

      if (notificationType === "property") {
        const number = propertyNumber.trim();

        if (!number) {
          throw new Error("اكتب رقم العقار المرتبط بالإشعار");
        }

        link = `/properties/${encodeURIComponent(number)}`;
        type = "admin_property";
      }

      const { data, error } = await supabase.rpc(
        "admin_send_notifications" as never,
        {
          _user_ids: [...selected],
          _title: title.trim(),
          _body: body.trim(),
          _type: type,
          _link: link,
        } as never,
      );

      if (error) throw error;

      return Number(data ?? selected.size);
    },

    onSuccess: (count) => {
      toast.success(`تم إرسال الإشعار إلى ${count} مستخدم`);
      setTitle("");
      setBody("");
      setPropertyNumber("");
      setSelected(new Set());
    },

    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "تعذّر إرسال الإشعار",
      ),
  });

  return (
    <div dir="rtl" className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[34px] bg-surface ring-1 ring-line">
        <div className="relative overflow-hidden bg-forest px-6 py-7 text-background">
          <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-background/10" />
          <div className="pointer-events-none absolute -bottom-16 right-10 size-48 rounded-full bg-background/5" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1.5 text-[10px] font-bold">
                <Megaphone className="size-3.5" />
                مركز الإشعارات
              </div>

              <h1 className="mt-4 font-display text-2xl font-extrabold md:text-3xl">
                إرسال رسالة داخل التطبيق
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-7 opacity-80">
                اختر الجمهور، حدد المستلمين، ثم أرسل إشعارًا يظهر لهم مباشرة داخل التطبيق.
              </p>
            </div>

            <div className="hidden size-16 shrink-0 place-items-center rounded-3xl bg-background/10 md:grid">
              <SendHorizontal className="size-7" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          <SummaryCard
            icon={UserRound}
            label="أفراد"
            value={recipients.filter((x) => x.kind === "individual").length}
          />
          <SummaryCard
            icon={Building}
            label="مكاتب"
            value={recipients.filter((x) => x.kind === "office").length}
          />
          <SummaryCard
            icon={UsersRound}
            label="الظاهر"
            value={visible.length}
          />
          <SummaryCard
            icon={CheckCheck}
            label="محدد"
            value={selected.size}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="rounded-[30px] bg-surface p-5 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UsersRound className="size-5 text-forest" />
                <h2 className="font-display text-lg font-extrabold">
                  اختر المستلمين
                </h2>
              </div>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                يمكنك تحديد أفراد أو مكاتب أو جميع الحسابات المتاحة.
              </p>
            </div>

            <div className="rounded-2xl bg-forest-soft px-3 py-2 text-xs font-bold text-forest">
              {selected.size} محدد
            </div>
          </div>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ["individual", "الأفراد", UserRound],
                ["office", "المكاتب", Building],
                ["all", "الكل", UsersRound],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition",
                  audience === value
                    ? "bg-forest text-background shadow-sm"
                    : "bg-background text-muted-foreground ring-1 ring-line hover:bg-sand",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المستخدم أو البريد..."
              className="w-full rounded-2xl bg-background px-11 py-3.5 text-sm outline-none ring-1 ring-line transition focus:ring-2 focus:ring-forest"
            />
            {!!search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-sand"
                aria-label="مسح البحث"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {visible.length} مستلم ظاهر
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectVisible}
                disabled={!visible.length}
                className="rounded-xl bg-forest-soft px-3 py-2 text-[10px] font-extrabold text-forest disabled:opacity-50"
              >
                تحديد الكل الظاهر
              </button>

              {!!selected.size && (
                <button
                  type="button"
                  onClick={clearSelected}
                  className="rounded-xl bg-terracotta-soft px-3 py-2 text-[10px] font-extrabold text-terracotta"
                >
                  إلغاء التحديد
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pe-1">
            {recipientsQuery.isLoading && !recipientsQuery.data ? (
              <div className="grid min-h-56 place-items-center rounded-3xl bg-background ring-1 ring-line">
                <Loader2 className="size-5 animate-spin text-forest" />
              </div>
            ) : !visible.length ? (
              <EmptyState
                icon={UsersRound}
                title="لا يوجد مستلمون مطابقون"
                description="غيّر نوع الجمهور أو كلمة البحث."
              />
            ) : (
              visible.map((recipient) => {
                const checked = selected.has(recipient.userId);

                return (
                  <button
                    key={`${recipient.kind}-${recipient.userId}`}
                    type="button"
                    onClick={() => toggle(recipient.userId)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl p-3.5 text-right ring-1 transition",
                      checked
                        ? "bg-forest-soft ring-forest/30"
                        : "bg-background ring-line hover:bg-sand",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-2xl",
                        checked
                          ? "bg-forest text-background"
                          : recipient.kind === "office"
                            ? "bg-terracotta-soft text-terracotta"
                            : "bg-sand text-muted-foreground",
                      )}
                    >
                      {checked ? (
                        <Check className="size-4" />
                      ) : recipient.kind === "office" ? (
                        <Building className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {recipient.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {recipient.email}
                      </span>
                    </span>

                    <span className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      {recipient.kind === "office" ? "مكتب" : "فرد"}
                    </span>

                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-0.5" />
                  </button>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[30px] bg-surface p-5 ring-1 ring-line">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-forest-soft text-forest">
                <Mail className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold">
                  محتوى الإشعار
                </h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  اكتب الرسالة كما ستظهر للمستلم داخل التطبيق.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الإشعار"
                className="w-full rounded-2xl bg-background px-4 py-3.5 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
              />

              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب نص الرسالة..."
                className="w-full resize-none rounded-2xl bg-background px-4 py-3.5 text-sm leading-7 outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
              />
            </div>
          </section>

          <section className="rounded-[30px] bg-surface p-5 ring-1 ring-line">
            <h2 className="font-display text-base font-extrabold">
              نوع الإشعار
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNotificationType("general")}
                className={cn(
                  "rounded-2xl px-4 py-3 text-xs font-extrabold transition",
                  notificationType === "general"
                    ? "bg-forest text-background"
                    : "bg-background text-muted-foreground ring-1 ring-line",
                )}
              >
                إشعار عام
              </button>

              <button
                type="button"
                onClick={() => setNotificationType("property")}
                className={cn(
                  "rounded-2xl px-4 py-3 text-xs font-extrabold transition",
                  notificationType === "property"
                    ? "bg-forest text-background"
                    : "bg-background text-muted-foreground ring-1 ring-line",
                )}
              >
                مرتبط بعقار
              </button>
            </div>

            {notificationType === "property" && (
              <input
                value={propertyNumber}
                onChange={(e) => setPropertyNumber(e.target.value)}
                placeholder="رقم العقار المرتبط"
                className="mt-3 w-full rounded-2xl bg-background px-4 py-3.5 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
              />
            )}

            <div className="mt-4 rounded-2xl bg-forest-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold">عدد المستلمين</span>
                <span className="font-display text-xl font-extrabold text-forest">
                  {selected.size}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                سيظهر الإشعار داخل جرس التطبيق لدى الحسابات المحددة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => send.mutate()}
              disabled={send.isPending || !selected.size}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-4 font-display font-extrabold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {send.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {send.isPending ? "جارٍ الإرسال..." : "إرسال الإشعار"}
            </button>
          </section>
        </div>
      </div>

      <AdminInbox />

    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Icon className="size-4 text-forest" />
        <span className="font-display text-xl font-extrabold">
          {value}
        </span>
      </div>
    </div>
  );
}
}
