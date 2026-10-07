
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronDown,
  Mail,
  Search,
  Send,
  Users,
  Building2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { RoleGuard } from "@/lib/role-guard";
import { cn } from "@/lib/utils";

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
    <RoleGuard allow={["admin"]} guestsTo="/auth/admin">
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-4 px-4 py-4 pb-24">
        <div>
          <h1 className="font-display text-xl font-extrabold">
            إشعارات المستخدمين
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            إرسال إشعار لفرد أو عدة أفراد أو عدة مكاتب دفعة واحدة.
          </p>
        </div>

        {/* الجمهور */}
        <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="text-sm font-bold">المستلمون</div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["individual", "الأفراد", Users],
                ["office", "المكاتب", Building2],
                ["all", "الكل", Users],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition",
                  audience === value
                    ? "bg-forest text-background"
                    : "bg-sand text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              className="w-full rounded-2xl bg-sand py-3 pe-10 ps-3 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">
              {visible.length} نتيجة ظاهرة
              {selected.size ? ` · ${selected.size} محدد` : ""}
            </span>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={selectVisible}
                disabled={!visible.length}
                className="rounded-lg bg-forest-soft px-2.5 py-1.5 font-bold text-forest disabled:opacity-50"
              >
                تحديد الظاهر
              </button>

              {!!selected.size && (
                <button
                  type="button"
                  onClick={clearSelected}
                  className="rounded-lg bg-terracotta-soft px-2.5 py-1.5 font-bold text-terracotta"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>

          {recipientsQuery.isLoading ? (
            <ListSkeleton />
          ) : !visible.length ? (
            <EmptyState
              icon={Users}
              title="لا يوجد مستلمون مطابقون"
              description="غيّر نوع الجمهور أو كلمة البحث."
            />
          ) : (
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pe-1">
              {visible.map((recipient) => {
                const checked = selected.has(recipient.userId);

                return (
                  <button
                    key={`${recipient.kind}-${recipient.userId}`}
                    type="button"
                    onClick={() => toggle(recipient.userId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl p-3 text-right ring-1 transition",
                      checked
                        ? "bg-forest-soft ring-forest/30"
                        : "bg-background ring-line",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md ring-1",
                        checked
                          ? "bg-forest text-background ring-forest"
                          : "bg-surface ring-line",
                      )}
                    >
                      {checked && <Check className="size-3.5" />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {recipient.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {recipient.email}
                      </span>
                    </span>

                    <span className="shrink-0 rounded-full bg-sand px-2 py-1 text-[10px] font-semibold">
                      {recipient.kind === "office" ? "مكتب" : "فرد"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* الرسالة */}
        <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Mail className="size-4 text-terracotta" />
            محتوى الإشعار
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الموضوع"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب الرسالة هنا..."
            className="w-full resize-none rounded-2xl bg-sand px-3 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-forest"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNotificationType("general")}
              className={cn(
                "rounded-xl py-2.5 text-xs font-bold",
                notificationType === "general"
                  ? "bg-forest text-background"
                  : "bg-sand text-muted-foreground",
              )}
            >
              إشعار عام
            </button>

            <button
              type="button"
              onClick={() => setNotificationType("property")}
              className={cn(
                "rounded-xl py-2.5 text-xs font-bold",
                notificationType === "property"
                  ? "bg-forest text-background"
                  : "bg-sand text-muted-foreground",
              )}
            >
              متعلق بعقار
            </button>
          </div>

          {notificationType === "property" && (
            <input
              value={propertyNumber}
              onChange={(e) => setPropertyNumber(e.target.value)}
              placeholder="رقم العقار المرتبط"
              inputMode="text"
              className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          )}

          <div className="rounded-2xl bg-background p-3 text-xs ring-1 ring-line">
            <div className="font-bold">
              سيتم الإرسال إلى: {selected.size} مستلم
            </div>
            <div className="mt-1 text-muted-foreground">
              الإشعار سيظهر داخل جرس التطبيق لدى كل مستلم.
            </div>
          </div>

          <button
            type="button"
            onClick={() => send.mutate()}
            disabled={send.isPending || !selected.size}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            <Send className="size-4" />
            {send.isPending ? "جارٍ الإرسال..." : "إرسال الإشعار"}
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
