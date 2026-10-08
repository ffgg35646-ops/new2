import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Crown, Loader2, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";
import { effectivePlan } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type OfficeCardData = {
  id: string;
  name: string;
  logo_url: string | null;
  verification_status: string;
  updated_at: string;
  properties_count?: number;
  rating?: number | null;
  rating_avg?: number | null;
  plan?: string | null;
  plan_expires_at?: string | null;
};

export function OfficeCard({ office }: { office: OfficeCardData }) {
  const isPro = effectivePlan(office) === "pro";
  const { userId } = useAuth();
  const navigate = useNavigate();

  const startChat = useMutation({
    mutationFn: async () => {
      if (!userId) {
        await navigate({ to: "/auth/individual" });
        throw new Error("سجّل الدخول لبدء المحادثة");
      }

      const { data: plan, error: planError } = await supabase.rpc(
        "office_effective_plan",
        { _office_id: office.id },
      );

      if (planError) throw planError;

      const chatResult = plan as {
        plan?: string;
        expires_at?: string | null;
      } | null;

      if (
        chatResult?.plan !== "pro" ||
        (chatResult.expires_at &&
          new Date(chatResult.expires_at).getTime() <= Date.now())
      ) {
        throw new Error("الدردشة غير متاحة لهذا المكتب حاليًا");
      }

      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("office_id", office.id)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) return existing.id;

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          office_id: office.id,
          property_id: null,
        })
        .select("id")
        .single();

      if (error) throw new Error("تعذّر بدء المحادثة");
      return created.id;
    },
    onSuccess: (id) => {
      void navigate({ to: "/chats", search: { c: id } });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "تعذّر بدء المحادثة";
      if (message !== "سجّل الدخول لبدء المحادثة") toast.error(message);
    },
  });

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line animate-rise-in">
      {office.logo_url ? (
        <img
          src={office.logo_url}
          alt={office.name}
          className="size-11 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid size-11 place-items-center rounded-xl bg-forest-soft font-display font-extrabold text-forest">
          {office.name.trim().charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-sm font-bold">{office.name}</span>
          {office.verification_status === "verified" && (
            <ShieldCheck className="size-4 shrink-0 text-forest" />
          )}
          {isPro && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
              <Crown className="size-3" /> احترافي
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {(office.rating_avg ?? office.rating) != null ? (
            <>
              <Star className="size-3 fill-terracotta text-terracotta" />
              {Number(office.rating_avg ?? office.rating ?? 0).toFixed(1)} ·{" "}
            </>
          ) : null}
          {office.properties_count ?? 0} عقارًا · {timeAgo(office.updated_at)}
        </div>
      </div>

      {isPro ? (
        <button
          type="button"
          onClick={() => startChat.mutate()}
          disabled={startChat.isPending}
          className="ms-auto flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-background disabled:opacity-60"
        >
          {startChat.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MessageCircle className="size-3.5" />
          )}
          مراسلة
        </button>
      ) : (
        <Link
          to="/offices/$officeId"
          params={{ officeId: office.id }}
          className="ms-auto shrink-0 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-background"
        >
          دخول المكتب
        </Link>
      )}
    </div>
  );
}
