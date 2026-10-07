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
  officeVerificationStatus: "pending" | "verified" | "rejected" | null;
  officeRejectionReason: string | null;
};

const AUTH_QUERY_TIMEOUT_MS = 5000;

function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = AUTH_QUERY_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("AUTH_QUERY_TIMEOUT"));
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function loadSession(): Promise<SessionInfo> {
  const sessionResult = await withTimeout(supabase.auth.getSession());
  if (sessionResult.error) throw sessionResult.error;

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

  if (rolesRes?.error) throw rolesRes.error;
  if (profileRes?.error) throw profileRes.error;
  if (officeRes?.error) throw officeRes.error;

  const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
  const office = officeRes.data ?? null;

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

    return () => sub.subscription.unsubscribe();
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
