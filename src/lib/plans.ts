import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyOffice } from "@/lib/office";

export type OfficePlan = "free" | "pro";

export type OfficePackage = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  property_limit: number | null;
  chat_enabled: boolean;
  featured_limit: number;
  verification_included: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

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
  "عقارات غير محدودة",
  "توثيق المكتب ✓",
  "دردشة خاصة ومستقلة مع كل عميل",
  "إرسال الصور داخل المحادثة",
  "معرفة العقار الذي يستفسر عنه العميل",
  "رمز QR للمكتب والعقار",
  "تمييز حتى 3 عقارات",
  "أولوية ظهور المكتب",
  "كل مميزات الباقة المجانية",
];

function normalizePackage(row: any): OfficePackage {
  return {
    id: String(row.id),
    code: row.code ?? null,
    name: String(row.name ?? "باقة"),
    description: row.description ?? null,
    price: Number(row.price ?? 0),
    duration_days:
      String(row.code ?? "").toLowerCase() === "pro"
        ? 30
        : Number(row.duration_days ?? 0),
    property_limit:
      row.property_limit == null ? null : Number(row.property_limit),
    chat_enabled: Boolean(row.chat_enabled),
    featured_limit: Number(row.featured_limit ?? 0),
    verification_included: Boolean(row.verification_included),
    features: Array.isArray(row.features)
      ? row.features.map((x: unknown) => String(x))
      : [],
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function effectivePlan(
  office?: {
    plan?: OfficePlan | string | null;
    plan_expires_at?: string | null;
  } | null,
): OfficePlan {
  if (!office || office.plan !== "pro" || !office.plan_expires_at) return "free";
  const expiry = new Date(office.plan_expires_at).getTime();
  return Number.isFinite(expiry) && expiry > Date.now() ? "pro" : "free";
}

export function usePackages(activeOnly = true) {
  return useQuery({
    queryKey: ["public-package-catalog", activeOnly],
    queryFn: async () => {
      let q = (supabase as any)
        .from("package_catalog")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (activeOnly) q = q.eq("is_active", true);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as unknown[];
      return rows.map(normalizePackage);
    },
  });
}

export function useMyPlan() {
  const { data: membership, isLoading } = useMyOffice();
  const office = membership?.office as any;

  const packageId = office?.package_id ?? null;

  const packageQuery = useQuery({
    queryKey: ["my-package", packageId, office?.plan, office?.plan_expires_at ?? null],
    enabled: !!office,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      let packageRow: any = null;

      if (packageId) {
        const { data, error } = await (supabase as any)
          .from("package_catalog")
          .select("*")
          .eq("id", packageId)
          .maybeSingle();

        if (error) throw error;
        packageRow = data;
      }

      const expiryTime = office?.plan_expires_at
        ? new Date(office.plan_expires_at).getTime()
        : Number.NaN;
      const packageLooksPaid =
        office?.plan === "pro" ||
        String(packageRow?.code ?? "") === "pro" ||
        Number(packageRow?.price ?? 0) > 0;
      const hasExpiredPaidPlan =
        packageLooksPaid &&
        (!Number.isFinite(expiryTime) || expiryTime <= Date.now());

      // حتى لو لم يعمل Cron بعد، اعرض الباقة المجانية بمجرد انتهاء مدة Pro.
      if (hasExpiredPaidPlan || !packageRow) {
        const fallbackCode = hasExpiredPaidPlan
          ? "free"
          : office?.plan === "pro"
            ? "pro"
            : "free";

        const { data, error } = await (supabase as any)
          .from("package_catalog")
          .select("*")
          .eq("code", fallbackCode)
          .maybeSingle();

        if (error) throw error;
        if (data) return normalizePackage(data);
      }

      return packageRow ? normalizePackage(packageRow) : null;
    },
  });

  const pkg = packageQuery.data;

  const expiryTime = office?.plan_expires_at
    ? new Date(office.plan_expires_at).getTime()
    : Number.NaN;
  const packageLooksPaid =
    office?.plan === "pro" ||
    pkg?.code === "pro" ||
    Number(pkg?.price ?? 0) > 0;
  const expired =
    packageLooksPaid &&
    (!Number.isFinite(expiryTime) || expiryTime <= Date.now());

  const currentPlan: OfficePlan =
    expired
      ? "free"
      : office?.plan === "pro" ||
          pkg?.code === "pro" ||
          Number(pkg?.price ?? 0) > 0
        ? "pro"
        : "free";

  return {
    isLoading: isLoading || packageQuery.isLoading,
    office: office ?? null,
    package: pkg,
    plan: currentPlan,
    isPro: currentPlan === "pro",
    isPaid: Number(pkg?.price ?? 0) > 0,
    expired,
    expiresAt: office?.plan_expires_at ?? null,
    startedAt: office?.plan_started_at ?? null,
    propertyLimit:
      currentPlan === "pro"
        ? pkg?.property_limit ?? null
        : FREE_PROPERTY_LIMIT,
    chatEnabled:
      !expired && Boolean(pkg?.chat_enabled),
    featuredLimit:
      expired
        ? 0
        : Number(pkg?.featured_limit ?? 0),
    verificationIncluded:
      !expired && Boolean(pkg?.verification_included),
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
        .neq("is_deleted", true);

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
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetPackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await (supabase as any).rpc(
        "set_office_package",
        { _package_id: packageId }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-office-full"] });
      void qc.invalidateQueries({ queryKey: ["my-package"] });
      void qc.invalidateQueries({ queryKey: ["office-plan-events"] });
    },
  });
}

export function useSetPlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (plan: OfficePlan) => {
      const { data, error } = await (supabase as any)
        .from("package_catalog")
        .select("id")
        .eq("code", plan)
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) throw new Error("الباقة غير موجودة");

      const result = await (supabase as any).rpc(
        "set_office_package",
        { _package_id: data.id }
      );

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-office-full"] });
      void qc.invalidateQueries({ queryKey: ["my-package"] });
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

  if (raw.includes("property_limit")) {
    const limit = raw.match(/property_limit[:_ ]*(\d+)/)?.[1] ?? String(FREE_PROPERTY_LIMIT);
    return `باقتك تسمح بـ ${limit} عقارات فقط. اختر باقة أخرى لزيادة الحد.`;
  }

  if (raw.includes("package_not_available")) {
    return "هذه الباقة غير متاحة حاليًا.";
  }

  return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}
