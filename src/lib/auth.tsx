import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Session } from "@/lib/backend-client";
import { supabase } from "@/integrations/supabase/client";
import { clearPersistedQueryCache } from "@/lib/query-cache";

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
  officeVerificationStatus: "pending" | "verified" | "rejected" | null;
  officeRejectionReason: string | null;
};

const AUTH_QUERY_TIMEOUT_MS = 5000;

function withTimeout<T>(
  promise: PromiseLike<T>,
  fallback: T,
  timeoutMs = AUTH_QUERY_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(fallback), timeoutMs);

    Promise.resolve(promise).then(finish, () => finish(fallback));
  });
}

async function loadSession(): Promise<SessionInfo> {
  const sessionResult = await withTimeout(
    supabase.auth.getSession(),
    {
      data: { session: null },
      error: null,
    },
  );

  const session = sessionResult.data.session ?? null;

  if (!session) {
    return {
      session: null,
      userId: null,
      roles: [],
      profile: null,
      officeId: null,
      officeVerificationStatus: null,
      officeRejectionReason: null,
    };
  }

  const [rolesRes, profileRes, officeRes] = await Promise.all([
    withTimeout(
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id),
      null,
    ),

    withTimeout(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle(),
      null,
    ),

    withTimeout(
      supabase
        .from("offices")
        .select("id,verification_status,rejection_reason")
        .eq("owner_id", session.user.id)
        .maybeSingle(),
      null,
    ),
  ]);

  const roles = (rolesRes?.data ?? []).map((r) => r.role as AppRole);
  const office = officeRes?.data ?? null;

  const metadata =
    session.user.user_metadata as Record<string, unknown>;
  const dbProfile =
    (profileRes?.data as SessionInfo["profile"]) ?? null;
  const fallbackProfile: SessionInfo["profile"] = {
    id: session.user.id,
    full_name:
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : "",
    phone:
      typeof metadata.phone === "string"
        ? metadata.phone
        : session.user.phone ?? null,
    email: session.user.email ?? null,
    avatar_url:
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : null,
    governorate_id: null,
  };

  const profile = dbProfile
    ? {
        ...fallbackProfile,
        ...dbProfile,
        full_name:
          dbProfile.full_name || fallbackProfile.full_name,
        phone: dbProfile.phone || fallbackProfile.phone,
        email: dbProfile.email || fallbackProfile.email,
        avatar_url: dbProfile.avatar_url || fallbackProfile.avatar_url,
      }
    : fallbackProfile;

  // الـsession نفسه يحمل الدور القادم من users.role في MongoDB.
  // نستخدمه أولًا حتى لا يتحول admin إلى individual عند تأخر user_roles.
  const sessionRole = metadata.role;
  const validSessionRole =
    sessionRole === "admin" ||
    sessionRole === "office" ||
    sessionRole === "individual"
      ? sessionRole
      : null;

  if (roles.length === 0) {
    if (validSessionRole) {
      roles.push(validSessionRole);
    } else if (office?.id) {
      roles.push("office");
    } else if (profileRes?.data) {
      roles.push("individual");
    }
  }

  return {
    session,
    userId: session.user.id,
    roles,
    profile,
    officeId: office?.id ?? null,
    officeVerificationStatus:
      (office?.verification_status as
        | "pending"
        | "verified"
        | "rejected"
        | null) ?? null,
    officeRejectionReason: office?.rejection_reason ?? null,
  };
}

export function useAuth() {
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        qc.invalidateQueries({ queryKey: ["session"] });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  const query = useQuery({
    queryKey: ["session"],
    queryFn: loadSession,
    staleTime: 10 * 60_000,
    gcTime: 24 * 60 * 60_000,
    refetchOnWindowFocus: false,
  });

  const info = query.data;

  return {
    ...query,
    session: info?.session ?? null,
    userId: info?.userId ?? null,
    roles: info?.roles ?? [],
    profile: info?.profile ?? null,
    officeId: info?.officeId ?? null,
    officeVerificationStatus:
      info?.officeVerificationStatus ?? null,
    officeRejectionReason:
      info?.officeRejectionReason ?? null,
    isOffice: (info?.roles ?? []).includes("office"),
    isAdmin: (info?.roles ?? []).includes("admin"),
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
