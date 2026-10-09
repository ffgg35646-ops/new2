import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type OfficeRow = {
  id: string;
  owner_id: string;
  package_id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  manager_name: string | null;
  commercial_register: string | null;
  license_number: string | null;
  fal_license_number: string | null;
  fal_license_url: string | null;
  real_estate_license_url: string | null;
  license_expiry: string | null;
  rejection_reason: string | null;
  governorate_id: string | null;
  address: string | null;
  working_hours: string | null;
  experience_years: number;
  verification_status: string;
  completed_requests_count?: number;
  rating_avg: number | string;
  reviews_count: number;
};

export function useMyOffice() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["my-office-full", userId],
    enabled: !!userId,
    queryFn: async () => {
      const owned = await supabase
        .from("offices")
        .select("*")
        .eq("owner_id", userId!)
        .maybeSingle();
      if (owned.error) throw owned.error;
      if (owned.data) {
        return { office: owned.data as unknown as OfficeRow, isOwner: true, staff: null };
      }

      const staff = await supabase
        .from("office_staff")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_active", true)
        .maybeSingle();
      if (staff.error) throw staff.error;
      if (!staff.data) return { office: null, isOwner: false, staff: null };

      const office = await supabase
        .from("offices")
        .select("*")
        .eq("id", staff.data.office_id)
        .maybeSingle();
      if (office.error) throw office.error;
      return {
        office: (office.data as unknown as OfficeRow) ?? null,
        isOwner: false,
        staff: staff.data,
      };
    },
  });
}

export function useNewInquiriesCount(officeId?: string | null) {
  return useQuery({
    queryKey: ["new-inquiries-count", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const [received, acceptedInquiries, acceptedRequests] = await Promise.all([
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("office_id", officeId!)
          .eq("status", "new"),
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("office_id", officeId!)
          .eq("status", "accepted"),
        supabase.rpc("office_accepted_property_requests" as never),
      ]);

      if (received.error) throw received.error;
      if (acceptedInquiries.error) throw acceptedInquiries.error;
      if (acceptedRequests.error) throw acceptedRequests.error;

      const acceptedMarketCount = Array.isArray(acceptedRequests.data)
        ? acceptedRequests.data.length
        : 0;

      return (received.count ?? 0) + (acceptedInquiries.count ?? 0) + acceptedMarketCount;
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}

export function useOfficeStaff(officeId?: string | null) {
  return useQuery({
    queryKey: ["office-staff", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_staff")
        .select("*")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

async function copyToClipboard(url: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {}
  try {
    const el = document.createElement("textarea");
    el.value = url;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export async function shareLink(title: string, url: string): Promise<ShareResult> {
  const absolute = new URL(url, window.location.origin).toString();

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url: absolute });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "cancelled";
    }
  }

  return (await copyToClipboard(absolute)) ? "copied" : "failed";
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, "").replace(/^0+/, "");
  const intl = digits.startsWith("966") ? digits : `966${digits.replace(/^966/, "")}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
