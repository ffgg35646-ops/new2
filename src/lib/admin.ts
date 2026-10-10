import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseDateValue } from "@/lib/format";
import { appNow } from "@/lib/clock";

export type AdminIndividual = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  governorate_id: string | null;
  governorate_name: string | null;
  created_at: string;
};

export type AdminOffice = {
  id: string;
  owner_id: string;
  name: string;
  manager_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commercial_register: string | null;
  license_number: string | null;
  fal_license_number: string | null;
  governorate_id: string | null;
  governorate_name: string | null;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  plan: "free" | "pro";
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

export type AdminDirectory = {
  individuals: AdminIndividual[];
  offices: AdminOffice[];
};

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  governorate_id: string | null;
  created_at: string;
  governorates?: { name_ar: string } | null;
};

type OfficeRow = {
  id: string;
  owner_id: string;
  name: string;
  manager_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commercial_register: string | null;
  license_number: string | null;
  fal_license_number: string | null;
  governorate_id: string | null;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  plan: "free" | "pro";
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  governorates?: { name_ar: string } | null;
};

function sortNewest<T extends { created_at: string }>(rows: T[]) {
  return [...rows].sort((a, b) =>
    (parseDateValue(b.created_at)?.getTime() ?? 0) -
    (parseDateValue(a.created_at)?.getTime() ?? 0),
  );
}

export async function fetchAdminDirectory(): Promise<AdminDirectory> {
  const [rolesRes, profilesRes, officesRes] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select("user_id,role,created_at")
        .in("role", ["individual", "office"]),

      supabase
        .from("profiles")
        .select(
          "id,full_name,phone,email,governorate_id,created_at,governorates(name_ar)",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("offices")
        .select(
          "id,owner_id,name,manager_name,phone,email,address,commercial_register,license_number,fal_license_number,governorate_id,verification_status,rejection_reason,plan,plan_expires_at,created_at,updated_at,is_deleted,governorates(name_ar)",
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false }),
    ]);

  if (rolesRes.error) throw rolesRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (officesRes.error) throw officesRes.error;

  const individualIds = new Set(
    (rolesRes.data ?? [])
      .filter((r) => r.role === "individual")
      .map((r) => r.user_id),
  );

  const profiles = (profilesRes.data ?? []) as unknown as ProfileRow[];
  const offices = (officesRes.data ?? []) as unknown as OfficeRow[];

  const individuals: AdminIndividual[] = sortNewest(
    profiles
      .filter((p) => individualIds.has(p.id))
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        email: p.email,
        governorate_id: p.governorate_id,
        governorate_name:
          p.governorates?.name_ar ?? null,
        created_at: p.created_at,
      })),
  );

  const officeList: AdminOffice[] = sortNewest(
    offices.map((o) => ({
      id: o.id,
      owner_id: o.owner_id,
      name: o.name,
      manager_name: o.manager_name,
      phone: o.phone,
      email: o.email,
      address: o.address,
      commercial_register: o.commercial_register,
      license_number: o.license_number,
      fal_license_number: o.fal_license_number,
      governorate_id: o.governorate_id,
      governorate_name:
        o.governorates?.name_ar ?? null,
      verification_status: o.verification_status,
      rejection_reason: o.rejection_reason,
      plan: o.plan,
      plan_expires_at: o.plan_expires_at,
      created_at: o.created_at,
      updated_at: o.updated_at,
      is_deleted: o.is_deleted,
    })),
  );

  return {
    individuals,
    offices: officeList,
  };
}


type SessionCache<T> = {
  data: T;
  savedAt: number;
};

function readSessionCache<T>(key: string): SessionCache<T> | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as SessionCache<T>;

    if (!parsed || !parsed.data || !parsed.savedAt) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

function writeSessionCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;

  try {
    const value: SessionCache<T> = {
      data,
      savedAt: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // الكاش اختياري، وفشلُه لا يعطل لوحة الإدارة.
  }
}

export function useAdminDirectory() {
  const cached = readSessionCache<AdminDirectory>(
    "aqar-admin-directory",
  );

  const query = useQuery<AdminDirectory>({
    queryKey: ["admin-directory"],
    queryFn: fetchAdminDirectory,

    ...(cached
      ? { initialData: cached.data, initialDataUpdatedAt: cached.savedAt }
      : {}),

    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });

  useEffect(() => {
    if (query.data) {
      writeSessionCache("aqar-admin-directory", query.data);
    }
  }, [query.data]);

  return query;
}

export type AdminDashboardStats = {
  totalUsers: number;
  individualUsers: number;
  officeUsers: number;
  properties: number;
  publishedProperties: number;
  propertyRequests: number;
  bookings: number;
  openReports: number;
};

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    individualUsersRes,
    officeUsersRes,
    propertiesRes,
    publishedPropertiesRes,
    propertyRequestsRes,
    bookingsRes,
    openReportsRes,
  ] = await Promise.all([
    supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "individual"),

    supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "office"),

    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false),

    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_published", true),

    supabase
      .from("property_requests")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("viewing_bookings")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false),
  ]);

  if (individualUsersRes.error) throw individualUsersRes.error;
  if (officeUsersRes.error) throw officeUsersRes.error;
  if (propertiesRes.error) throw propertiesRes.error;
  if (publishedPropertiesRes.error)
    throw publishedPropertiesRes.error;
  if (propertyRequestsRes.error)
    throw propertyRequestsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (openReportsRes.error) throw openReportsRes.error;

  const individualUsers = individualUsersRes.count ?? 0;
  const officeUsers = officeUsersRes.count ?? 0;

  return {
    totalUsers: individualUsers + officeUsers,
    individualUsers,
    officeUsers,
    properties: propertiesRes.count ?? 0,
    publishedProperties:
      publishedPropertiesRes.count ?? 0,
    propertyRequests:
      propertyRequestsRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
    openReports: openReportsRes.count ?? 0,
  };
}

export function useAdminDashboardStats() {
  const cached = readSessionCache<AdminDashboardStats>(
    "aqar-admin-dashboard-stats",
  );

  const query = useQuery<AdminDashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: fetchAdminDashboardStats,

    ...(cached
      ? { initialData: cached.data, initialDataUpdatedAt: cached.savedAt }
      : {}),

    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });

  useEffect(() => {
    if (query.data) {
      writeSessionCache(
        "aqar-admin-dashboard-stats",
        query.data,
      );
    }
  }, [query.data]);

  return query;
}

export type IndividualActivity = {
  propertyViews: number;
  favorites: number;
  propertyRequests: number;
  bookings: number;
  officeReviews: number;
};

export async function fetchIndividualActivity(
  userId: string,
): Promise<IndividualActivity> {
  const [
    viewsRes,
    favoritesRes,
    requestsRes,
    bookingsRes,
    reviewsRes,
  ] = await Promise.all([
    supabase
      .from("property_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("property_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("viewing_bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("office_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (viewsRes.error) throw viewsRes.error;
  if (favoritesRes.error) throw favoritesRes.error;
  if (requestsRes.error) throw requestsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;

  return {
    propertyViews: viewsRes.count ?? 0,
    favorites: favoritesRes.count ?? 0,
    propertyRequests: requestsRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
    officeReviews: reviewsRes.count ?? 0,
  };
}

export function useIndividualActivity(
  userId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin-individual-activity", userId],
    queryFn: () => fetchIndividualActivity(userId),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export type OfficeActivity = {
  properties: number;
  publishedProperties: number;
  views: number;
  inquiries: number;
  bookings: number;
  reviews: number;
  staff: number;
};

export async function fetchOfficeActivity(
  officeId: string,
): Promise<OfficeActivity> {
  const [
    propertiesRes,
    inquiriesRes,
    bookingsRes,
    reviewsRes,
    staffRes,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id,is_published,views_count")
      .eq("office_id", officeId)
      .eq("is_deleted", false),

    supabase
      .from("property_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("office_id", officeId),

    supabase
      .from("viewing_bookings")
      .select("id", { count: "exact", head: true })
      .eq("office_id", officeId),

    supabase
      .from("office_reviews")
      .select("id", { count: "exact", head: true })
      .eq("office_id", officeId),

    supabase
      .from("office_staff")
      .select("id", { count: "exact", head: true })
      .eq("office_id", officeId)
      .eq("is_active", true),
  ]);

  if (propertiesRes.error) throw propertiesRes.error;
  if (inquiriesRes.error) throw inquiriesRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (staffRes.error) throw staffRes.error;

  const props = propertiesRes.data ?? [];

  return {
    properties: props.length,
    publishedProperties: props.filter(
      (p) => p.is_published,
    ).length,
    views: props.reduce(
      (sum, p) => sum + (p.views_count ?? 0),
      0,
    ),
    inquiries: inquiriesRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
    reviews: reviewsRes.count ?? 0,
    staff: staffRes.count ?? 0,
  };
}

export function useOfficeActivity(
  officeId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin-office-activity", officeId],
    queryFn: () => fetchOfficeActivity(officeId),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function isTodaySaudi(date: unknown) {
  const parsedDate = parseDateValue(date);
  if (!parsedDate) return false;

  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  );

  return formatter.format(parsedDate) ===
    formatter.format(appNow());
}
