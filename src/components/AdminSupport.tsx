import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SupportChat } from "@/components/SupportCenter";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

type Ticket = {
  id: string;
  ticket_number: number;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Person = {
  full_name: string;
  role: string;
};

export function AdminSupport() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<
    string | null
  >(null);

  const tickets = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(
          "id,ticket_number,user_id,status,created_at,updated_at",
        )
        .order("updated_at", {
          ascending: false,
        });

      if (error) throw error;

      return (data ?? []) as Ticket[];
    },
  });

  const people = useQuery({
    queryKey: [
      "admin-support-people",
      tickets.data?.map((ticket) => ticket.user_id),
    ],
    enabled: !!tickets.data?.length,
    queryFn: async () => {
      const ids = [
        ...new Set(
          (tickets.data ?? []).map(
            (ticket) => ticket.user_id,
          ),
        ),
      ];

      if (!ids.length) {
        return {};
      }

      const [profilesRes, rolesRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id,full_name")
            .in("id", ids),

          supabase
            .from("user_roles")
            .select("user_id,role")
            .in("user_id", ids),
        ]);

      if (profilesRes.error) {
        throw profilesRes.error;
      }

      if (rolesRes.error) {
        throw rolesRes.error;
      }

      const result: Record<string, Person> = {};

      for (const profile of profilesRes.data ??
        []) {
        const role =
          rolesRes.data?.find(
            (item) =>
              item.user_id === profile.id,
          )?.role ?? "user";

        result[profile.id] = {
          full_name:
            profile.full_name ||
            "مستخدم",
          role,
        };
      }

      return result;
    },
  });

  const selected = useMemo(
    () =>
      tickets.data?.find(
        (ticket) =>
          ticket.id === activeId,
      ) ?? null,
    [tickets.data, activeId],
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("admin-support-tickets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          void qc.invalidateQueries({
            queryKey: [
              "admin-support-tickets",
            ],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const closeTicket = useMutation({
    mutationFn: async (
      ticketId: string,
    ) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: "closed",
        })
        .eq("id", ticketId);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم إغلاق التذكرة");

      void qc.invalidateQueries({
        queryKey: [
          "admin-support-tickets",
        ],
      });
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذّر إغلاق التذكرة",
      );
    },
  });

  function roleLabel(role: string) {
    if (role === "office") return "مكتب";
    if (role === "individual") return "فرد";
    if (role === "admin") return "أدمن";
    return "مستخدم";
  }

  if (selected) {
    const person =
      people.data?.[selected.user_id];

    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <button
            type="button"
            onClick={() =>
              setActiveId(null)
            }
            className="grid size-9 place-items-center rounded-full bg-sand"
            aria-label="رجوع"
          >
            <ArrowRight className="size-4" />
          </button>

          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
            <UserRound className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">
              {person?.full_name ||
                "مستخدم"}
            </div>

            <div className="text-[10px] text-muted-foreground">
              {roleLabel(
                person?.role || "user",
              )}{" "}
              · التذكرة #
              {selected.ticket_number}
            </div>
          </div>

          {selected.status !==
            "closed" && (
            <button
              type="button"
              onClick={() =>
                closeTicket.mutate(
                  selected.id,
                )
              }
              disabled={
                closeTicket.isPending
              }
              className="rounded-full bg-terracotta-soft px-3 py-1.5 text-[10px] font-bold text-terracotta disabled:opacity-50"
            >
              {closeTicket.isPending
                ? "جاري الإغلاق"
                : "إغلاق"}
            </button>
          )}
        </div>

        <div className="min-h-[60vh] overflow-hidden rounded-3xl ring-1 ring-line">
          <SupportChat
            ticket={selected}
            onBack={() =>
              setActiveId(null)
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-extrabold">
        تذاكر الدعم
      </h2>

      {tickets.isLoading ||
      people.isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-5 animate-spin text-forest" />
        </div>
      ) : tickets.data?.length ? (
        <div className="space-y-2.5">
          {tickets.data.map((ticket) => {
            const person =
              people.data?.[ticket.user_id];

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() =>
                  setActiveId(ticket.id)
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-right ring-1 ring-line"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-xs font-extrabold text-forest">
                  #{ticket.ticket_number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {person?.full_name ||
                      "مستخدم"}
                  </span>

                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {roleLabel(
                      person?.role || "user",
                    )}{" "}
                    ·{" "}
                    {ticket.status ===
                    "closed"
                      ? "مغلقة"
                      : "مفتوحة"}{" "}
                    ·{" "}
                    {formatDate(
                      ticket.updated_at,
                    )}
                  </span>
                </span>

                <span className="text-xs text-muted-foreground">
                  ›
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-muted-foreground">
          لا توجد تذاكر دعم.
        </div>
      )}
    </section>
  );
}
