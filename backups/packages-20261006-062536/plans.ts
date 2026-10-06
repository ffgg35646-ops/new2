import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOffice } from "@/lib/office";

export type OfficePlan = "free" | "pro";

export const FREE_PROPERTY_LIMIT = 5;

export const PLAN_LABEL: Record<OfficePlan, string> = {
  free: "الباقة المجانية",
  pro: "الباقة الاحترافية",
};

export const PLAN_PRICE: Record<OfficePlan, string> = {
  free: "0 ريال",
  pro: "199 ريال / شهريًا",
};

export const FREE_FEATURES = [
  "إنشاء صفحة خاصة بالمكتب",
  "الظهور في قسم المكاتب العقارية",
  "إضافة حتى 5 عقارات",
  "استقبال المتابعين والتقييمات",
  "اتصال وواتساب",
  "مشاركة صفحة المكتب",
  "إحصائيات أساسية",
];

export const PRO_FEATURES = [
  "عقارات غير محدودة (المجانية حتى 5)",
  "توثيق المكتب ✓ — يُمنح مع الاشتراك",
  "دردشة خاصة ومستقلة مع كل عميل داخل التطبيق",
  "إرسال الصور داخل المحادثة",
  "معرفة العقار الذي يستفسر عنه كل عميل في محادثته",
  "رمز QR للمكتب ولكل عقار — يفتح الصفحة عند مسحه",
  "تمييز حتى 3 عقارات لتظهر أعلى القوائم وصفحة مكتبك ⭐",
  "أولوية ظهور مكتبك في قسم المكاتب العقارية",
  "كل مميزات الباقة المجانية",
];

export function effectivePlan(
  office?: {
    plan?: OfficePlan | string | null;
    plan_expires_at?: string | null;
  } | null,
): OfficePlan {
  if (!office || office.plan !== "pro") return "free";
  if (!office.plan_expires_at) return "pro";
  return new Date(office.plan_expires_at).getTime() > Date.now() ? "pro" : "free";
}

export function useMyPlan() {
  const { data: membership, isLoading } = useMyOffice();
  const office = membership?.office as
    | { plan?: OfficePlan; plan_expires_at?: string | null; plan_started_at?: string }
    | null
    | undefined;

  const plan = effectivePlan(office ?? null);
  const expired = office?.plan === "pro" && plan === "free";

  return {
    isLoading,
    office: office ?? null,
    plan,
    isPro: plan === "pro",
    expired,
    expiresAt: office?.plan_expires_at ?? null,
    startedAt: office?.plan_started_at ?? null,
  };
}

export function useOfficePropertiesCount(officeId?: string | null) {
  return useQuery({
    queryKey: ["office-properties-count", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("office_id", officeId!)
        .eq("is_deleted", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePlanEvents(officeId?: string | null) {
  return useQuery({
    queryKey: ["office-plan-events", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_plan_events")
        .select("*")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: OfficePlan) => {
      const { error } = await supabase.rpc("set_office_plan", { _plan: plan });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-office-full"] });
      void qc.invalidateQueries({ queryKey: ["office-plan-events"] });
    },
  });
}

export function useRequestUpgrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("request_pro_upgrade");
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["office-plan-events"] });
    },
  });
}

export function planErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");
  if (raw.includes("free_plan_property_limit"))
    return `الباقة المجانية تسمح بـ ${FREE_PROPERTY_LIMIT} عقارات فقط. رقِّ إلى الباقة الاحترافية لعقارات غير محدودة.`;
  return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}
