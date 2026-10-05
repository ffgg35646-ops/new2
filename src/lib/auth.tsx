import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "individual" | "office" | "admin";

export type SessionInfo = {
  session: Session | null;
  userId: string | null;
  roles: AppRole[];
  profile: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    governorate_id: string | null;
  } | null;
  officeId: string | null;
};

async function loadSession(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getSession();
  const session = data.session ?? null;
  if (!session) return { session: null, userId: null, roles: [], profile: null, officeId: null };

  const [rolesRes, profileRes, officeRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", session.user.id),
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
    supabase.from("offices").select("id").eq("owner_id", session.user.id).maybeSingle(),
  ]);

  return {
    session,
    userId: session.user.id,
    roles: (rolesRes.data ?? []).map((r) => r.role as AppRole),
    profile: (profileRes.data as SessionInfo["profile"]) ?? null,
    officeId: officeRes.data?.id ?? null,
  };
}

export function useAuth() {
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        qc.invalidateQueries({ queryKey: ["session"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const query = useQuery({
    queryKey: ["session"],
    queryFn: loadSession,
    staleTime: 30_000,
  });

  const info = query.data;
  return {
    ...query,
    session: info?.session ?? null,
    userId: info?.userId ?? null,
    roles: info?.roles ?? [],
    profile: info?.profile ?? null,
    officeId: info?.officeId ?? null,
    isOffice: (info?.roles ?? []).includes("office"),
    isAdmin: (info?.roles ?? []).includes("admin"),
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
