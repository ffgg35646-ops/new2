import { RoleGuard } from "@/lib/role-guard";
import { formatDateTime } from "@/lib/format";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, MapPin, Plus, Save, ShieldCheck, Package, Building2, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AdminChrome } from "@/components/AdminChrome";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { VERIFICATION_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  isTodaySaudi,
  useAdminDashboardStats,
  useAdminDirectory,
} from "@/lib/admin";
import { AdminSupport } from "@/components/AdminSupport";
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_USE } from "@/lib/legal-content";

type Tab =
  | "dashboard"
  | "offices"
  | "geo"
  | "plans"
  | "support"
  | "privacy"
  | "terms";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab:
      search["tab"] === "offices" ||
      search["tab"] === "geo" ||
      search["tab"] === "plans" ||
      search["tab"] === "support" ||
      search["tab"] === "privacy" ||
      search["tab"] === "terms"
        ? (search["tab"] as Exclude<Tab, "dashboard">)
        : "dashboard",
  }),

  head: () => ({
    meta: [
      { title: "لوحة الإدارة | عقار البطين" },
      {
        name: "description",
        content: "لوحة إدارة منصة عقار البطين وإحصائياتها وأقسام الإدارة.",
      },
      { property: "og:title", content: "لوحة الإدارة | عقار البطين" },
      {
        property: "og:description",
        content: "لوحة إدارة منصة عقار البطين.",
      },
    ],
  }),

  component: () => (
    <RoleGuard allow={["admin"]} guestsTo="/admin/login">
      <AdminChrome>
        <AdminRouteContent />
      </AdminChrome>
    </RoleGuard>
  ),
});

function AdminRouteContent() {
  const location = useLocation();

  // /admin يعرض لوحة التحكم.
  // أي route ابن يذهب إلى Outlet بدل إعادة رسم لوحة التحكم.
  if (location.pathname === "/admin") {
    return <AdminPage />;
  }

  return <Outlet />;
}

function AdminContent() {
  const location = useLocation();

  // الصفحة الرئيسية /admin
  if (location.pathname === "/admin") {
    return <AdminPage />;
  }

  // كل route آخر يظهر هنا مباشرة.
  return <Outlet />;
}

function AdminPage() {
  const { isAdmin } = useAuth();
  const { tab } = Route.useSearch();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showSearch={false} />
        <main className="px-4 py-10">
          <EmptyState
            icon={ShieldCheck}
            title="هذه الصفحة للمشرفين فقط"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <main className="w-full px-0">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "offices" && <OfficesTab />}
        {tab === "geo" && <GeoTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "support" && <AdminSupport />}
        {tab === "privacy" && (
          <LegalAdminTab title="سياسة الخصوصية" />
        )}
        {tab === "terms" && (
          <LegalAdminTab title="شروط الاستخدام" />
        )}
      </main>
    </div>
  );
}

function AdminDashboard() {
  const directory = useAdminDirectory();
  const stats = useAdminDashboardStats();

  const individuals = directory.data?.individuals ?? [];
  const offices = directory.data?.offices ?? [];

  const pendingOffices = offices.filter(
    (office) => office.verification_status === "pending",
  );

  const cards = [
    {
      label: "الأفراد",
      value: directory.isLoading ? "—" : individuals.length,
      icon: Users,
    },
    {
      label: "المكاتب",
      value: directory.isLoading ? "—" : offices.length,
      icon: Building2,
    },
    {
      label: "قيد المراجعة",
      value: directory.isLoading ? "—" : pendingOffices.length,
      icon: ShieldCheck,
    },
    {
      label: "العقارات",
      value: stats.isLoading ? "—" : stats.data?.properties ?? 0,
      icon: BarChart3,
    },
    {
      label: "العقارات المنشورة",
      value: stats.isLoading ? "—" : stats.data?.publishedProperties ?? 0,
      icon: Package,
    },
    {
      label: "الطلبات العقارية",
      value: stats.isLoading ? "—" : stats.data?.propertyRequests ?? 0,
      icon: MapPin,
    },
    {
      label: "حجوزات المعاينة",
      value: stats.isLoading ? "—" : stats.data?.bookings ?? 0,
      icon: Plus,
    },
  ];

  return (
    <section className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display text-2xl font-extrabold">
          لوحة الإدارة
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          نظرة مباشرة على المستخدمين والمكاتب ونشاط المنصة.
        </p>
      </div>

      {(directory.isError || stats.isError) && (
        <div className="rounded-2xl bg-destructive/5 p-4 text-sm text-destructive ring-1 ring-line">
          تعذر تحميل جزء من بيانات لوحة الإدارة.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-3xl bg-surface p-4 ring-1 ring-line"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
              <Icon className="size-5" />
            </div>

            <div className="mt-4 font-display text-2xl font-extrabold">
              {value}
            </div>

            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold">
                أحدث الأفراد
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                بيانات مباشرة من حسابات المستخدمين.
              </p>
            </div>

            <Link
              to="/admin/individuals"
              className="rounded-xl bg-sand px-3 py-2 text-[11px] font-bold text-forest"
            >
              عرض الكل
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {directory.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-sand"
                />
              ))
            ) : individuals.length ? (
              individuals.slice(0, 6).map((user) => (
                <Link
                  key={user.id}
                  to="/admin/individuals/$userId"
                  params={{ userId: user.id }}
                  className="flex items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-line transition hover:bg-sand"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                    <Users className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">
                        {user.full_name}
                      </span>

                      {isTodaySaudi(user.created_at) && (
                        <span className="shrink-0 rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold text-background">
                          جديد
                        </span>
                      )}
                    </div>

                    <div
                      dir="ltr"
                      className="mt-0.5 truncate text-[10px] text-muted-foreground"
                    >
                      {user.email || user.phone || "بدون بيانات اتصال"}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-sand p-5 text-center text-sm text-muted-foreground">
                لا يوجد أفراد مسجلون حاليًا.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold">
                أحدث المكاتب
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                طلبات التسجيل وحالة التوثيق.
              </p>
            </div>

            <Link
              to="/admin/offices"
              className="rounded-xl bg-sand px-3 py-2 text-[11px] font-bold text-forest"
            >
              عرض الكل
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {directory.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-sand"
                />
              ))
            ) : offices.length ? (
              offices.slice(0, 6).map((office) => (
                <Link
                  key={office.id}
                  to="/admin/offices/$officeId"
                  params={{ officeId: office.id }}
                  className="flex items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-line transition hover:bg-sand"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
                    <Building2 className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">
                        {office.name}
                      </span>

                      {office.verification_status === "pending" && (
                        <span className="shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[9px] font-bold text-terracotta">
                          قيد المراجعة
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {office.manager_name ||
                        office.email ||
                        office.phone ||
                        "مكتب عقاري"}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-sand p-5 text-center text-sm text-muted-foreground">
                لا توجد مكاتب مسجلة حاليًا.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-forest p-4 text-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold">
              طلبات المكاتب
            </h2>
            <p className="mt-1 text-xs opacity-80">
              المكاتب التي تحتاج مراجعة واعتماد.
            </p>
          </div>

          <Link
            to="/admin/offices"
            className="rounded-xl bg-background px-3 py-2 text-[11px] font-bold text-forest"
          >
            مراجعة المكاتب
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-background/10 p-3 text-center">
            <div className="font-display text-xl font-extrabold">
              {directory.isLoading ? "—" : offices.length}
            </div>
            <div className="mt-1 text-[10px] opacity-80">إجمالي المكاتب</div>
          </div>

          <div className="rounded-2xl bg-background/10 p-3 text-center">
            <div className="font-display text-xl font-extrabold">
              {directory.isLoading ? "—" : pendingOffices.length}
            </div>
            <div className="mt-1 text-[10px] opacity-80">قيد المراجعة</div>
          </div>

          <div className="rounded-2xl bg-background/10 p-3 text-center">
            <div className="font-display text-xl font-extrabold">
              {directory.isLoading
                ? "—"
                : offices.filter(
                    (office) =>
                      office.verification_status === "verified",
                  ).length}
            </div>
            <div className="mt-1 text-[10px] opacity-80">موثقة</div>
          </div>
        </div>
      </section>
    </section>
  );
}

function LegalAdminTab({ title }: { title: string }) {
  const policyKey =
    title === "سياسة الخصوصية"
      ? "privacy_policy"
      : "terms_of_use";

  const fallback =
    policyKey === "privacy_policy"
      ? DEFAULT_PRIVACY_POLICY
      : DEFAULT_TERMS_OF_USE;

  const qc = useQueryClient();
  const [content, setContent] = useState(fallback);

  const policyQuery = useQuery({
    queryKey: ["admin-legal-content", policyKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("content")
        .eq("key", policyKey)
        .maybeSingle();

      if (error) throw error;
      return data?.content || fallback;
    },
    initialData: fallback,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (policyQuery.data != null) {
      setContent(String(policyQuery.data));
    }
  }, [policyQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      const clean = content.trim();

      if (!clean) {
        throw new Error("لا يمكن حفظ محتوى فارغ.");
      }

      const payload = {
        content: clean,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: lookupError } = await (supabase as any)
        .from("app_content")
        .select("id,key")
        .eq("key", policyKey)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        const { error: updateError } = await (supabase as any)
          .from("app_content")
          .update(payload)
          .eq("key", policyKey);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await (supabase as any)
          .from("app_content")
          .insert({
            key: policyKey,
            ...payload,
          });

        if (insertError) throw insertError;
      }

      return clean;
    },
    onSuccess: (saved) => {
      setContent(saved);

      qc.setQueryData(
        ["admin-legal-content", policyKey],
        saved,
      );

      qc.setQueryData(
        ["legal-policy", policyKey],
        saved,
      );

      toast.success(
        policyKey === "privacy_policy"
          ? "تم حفظ سياسة الخصوصية."
          : "تم حفظ شروط الاستخدام.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر حفظ المحتوى.",
      );
    },
  });

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="font-display text-xl font-extrabold">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          النص المحفوظ هنا يظهر مباشرة في نافذة {title} أثناء التسجيل.
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
        <textarea
          rows={20}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-2xl bg-background p-4 text-sm leading-7 outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
        />

        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="size-4" />
          {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </section>
  );
}

function PlansTab() {
  const qc = useQueryClient();
  const [selectedPackages, setSelectedPackages] = useState<Record<string, string>>({});

  const { data: packages = [], isLoading: packagesLoading, isError: packagesError } = useQuery({
    queryKey: ["admin-package-catalog"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("package_catalog")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        code?: string | null;
        name: string;
        description?: string | null;
        price?: number | string | null;
        duration_days?: number | string | null;
        property_limit?: number | null;
        is_active?: boolean;
      }>;
    },
  });

  const { data: offices = [], isLoading: officesLoading, isError: officesError } = useQuery({
    queryKey: ["admin-package-offices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("id,name,phone,package_id,plan,plan_expires_at,is_deleted")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        phone?: string | null;
        package_id?: string | null;
        plan?: string | null;
        plan_expires_at?: string | null;
      }>;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-package-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_plan_events")
        .select("id,office_id,created_at,action,note")
        .eq("action", "request")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; office_id: string }>;
    },
  });

  const assignPackage = useMutation({
    mutationFn: async (vars: { officeId: string; packageId: string }) => {
      const { error } = await (supabase as any).rpc("admin_set_office_package", {
        _office_id: vars.officeId,
        _package_id: vars.packageId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث باقة المكتب");
      void qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
      void qc.invalidateQueries({ queryKey: ["admin-package-offices"] });
      void qc.invalidateQueries({ queryKey: ["admin-package-requests"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "تعذّر تحديث الباقة");
    },
  });

  const pendingOfficeIds = new Set(requests.map((request) => String(request.office_id)));

  if (packagesLoading || officesLoading) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground ring-1 ring-line">
        جارٍ تحميل الباقات والمكاتب...
      </div>
    );
  }

  if (packagesError || officesError) {
    return (
      <div className="rounded-2xl bg-destructive/5 p-4 text-sm text-destructive ring-1 ring-line">
        تعذّر تحميل بيانات الباقات. حدّث الصفحة وحاول مرة أخرى.
      </div>
    );
  }

  return (
    <section className="space-y-4" dir="rtl">
      <header>
        <h1 className="font-display text-xl font-extrabold">الباقات</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          متابعة باقات المكاتب وتعيين الباقة المناسبة لكل مكتب.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <Package className="size-5 text-forest" />
          <div className="mt-2 font-display text-xl font-extrabold">{packages.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي الباقات</div>
        </div>
        <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <Building2 className="size-5 text-forest" />
          <div className="mt-2 font-display text-xl font-extrabold">{offices.length}</div>
          <div className="text-xs text-muted-foreground">المكاتب المسجلة</div>
        </div>
        <div className="col-span-2 rounded-2xl bg-surface p-3.5 ring-1 ring-line md:col-span-1">
          <ShieldCheck className="size-5 text-terracotta" />
          <div className="mt-2 font-display text-xl font-extrabold">{pendingOfficeIds.size}</div>
          <div className="text-xs text-muted-foreground">طلبات ترقية تنتظر المراجعة</div>
        </div>
      </div>

      {packages.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-2xl bg-surface p-3 ring-1 ring-line">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{pkg.name}</span>
                <span className="ms-auto text-xs font-extrabold text-forest">
                  {Number(pkg.price ?? 0) <= 0
                    ? "مجانًا"
                    : String(Number(pkg.price).toLocaleString("ar-SA")) + " ريال"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {Number(pkg.duration_days ?? 0) > 0
                  ? "المدة: " + String(pkg.duration_days) + " يوم"
                  : "بدون تاريخ انتهاء"}
                {" · "}
                العقارات: {pkg.property_limit == null ? "غير محدودة" : pkg.property_limit}
              </p>
              {!pkg.is_active && (
                <p className="mt-1 text-[10px] font-semibold text-terracotta">غير متاحة للاشتراكات الجديدة</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-2 font-display text-base font-extrabold">باقات المكاتب</h2>
        {offices.length ? (
          <div className="space-y-2.5">
            {offices.map((office) => {
              const currentPackage =
                packages.find((pkg) => String(pkg.id) === String(office.package_id)) ??
                packages.find((pkg) => String(pkg.code ?? "") === (office.plan === "pro" ? "pro" : "free"));
              const selectedPackageId =
                selectedPackages[office.id] ?? currentPackage?.id ?? "";
              const hasRequest = pendingOfficeIds.has(office.id);

              return (
                <div key={office.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{office.name}</span>
                        {hasRequest && (
                          <span className="shrink-0 rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-bold text-terracotta">
                            طلب ترقية
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {office.phone || "بدون رقم"}
                        {" · الباقة الحالية: "}
                        {currentPackage?.name ?? (office.plan === "pro" ? "احترافية" : "مجانية")}
                      </p>
                      {office.plan_expires_at && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          تاريخ الانتهاء: {formatDateTime(office.plan_expires_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      value={selectedPackageId}
                      onChange={(event) =>
                        setSelectedPackages((current) => ({
                          ...current,
                          [office.id]: event.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
                    >
                      <option value="">اختر الباقة</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id} disabled={!pkg.is_active}>
                          {pkg.name} — {Number(pkg.price ?? 0) <= 0
                            ? "مجانًا"
                            : String(Number(pkg.price).toLocaleString("ar-SA")) + " ريال"}
                          {!pkg.is_active ? " (غير متاحة)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => assignPackage.mutate({ officeId: office.id, packageId: selectedPackageId })}
                      disabled={
                        assignPackage.isPending ||
                        !selectedPackageId ||
                        selectedPackageId === currentPackage?.id ||
                        !packages.some((pkg) => String(pkg.id) === selectedPackageId && pkg.is_active)
                      }
                      className="rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assignPackage.isPending ? "جارٍ التحديث..." : "تحديث الباقة"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Building2} title="لا توجد مكاتب مسجلة" />
        )}
      </div>
    </section>
  );
}

function OfficesTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-offices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id,name,phone,verification_status,rejection_reason,commercial_register,license_number,created_at",
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: string;
      rejectionReason?: string | null;
    }) => {
      const patch: Record<string, unknown> = { verification_status: status };
      patch["rejection_reason"] = status === "rejected" ? rejectionReason?.trim() || null : null;
      const { error } = await supabase
        .from("offices")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المكتب");
      setRejectFor(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-offices"] });
    },
    onError: () => toast.error("تعذّر التحديث"),
  });

  if (!data?.length) return <EmptyState icon={ShieldCheck} title="لا توجد مكاتب مسجلة" />;

  return (
    <div className="space-y-2.5">
      {data.map((o) => (
        <div key={o.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold">{o.name}</span>
            <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold">
              {VERIFICATION_STATUS[o.verification_status]}
            </span>
          </div>
          <div dir="ltr" className="mt-0.5 text-right text-[11px] text-muted-foreground">
            {o.phone} · CR {o.commercial_register ?? "—"} · Lic {o.license_number ?? "—"}
          </div>
          {o.rejection_reason && o.verification_status === "rejected" && (
            <p className="mt-1.5 rounded-xl bg-destructive/5 p-2 text-[11px] text-destructive">
              سبب الرفض: {o.rejection_reason}
            </p>
          )}

          {rejectFor === o.id ? (
            <div className="mt-2 space-y-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="سبب الرفض (يظهر للمكتب)…"
                className="w-full rounded-xl bg-sand px-3 py-2 text-xs ring-1 ring-line outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setStatus.mutate({ id: o.id, status: "rejected", rejectionReason: reason })
                  }
                  className="flex-1 rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive"
                >
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => {
                    setRejectFor(null);
                    setReason("");
                  }}
                  className="flex-1 rounded-xl bg-sand py-2 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setStatus.mutate({ id: o.id, status: "verified" })}
                className="flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background"
              >
                توثيق
              </button>
              <button
                onClick={() => {
                  setRejectFor(o.id);
                  setReason("");
                }}
                className="flex-1 rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GeoTab() {
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);

  const [govName, setGovName] = useState("");
  const [govCode, setGovCode] = useState("");
  const [govBanner, setGovBanner] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editBanner, setEditBanner] = useState("");

  const [hood, setHood] = useState("");

  const { data: govs = [], isLoading } = useQuery({
    queryKey: ["admin-governorates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governorates")
        .select("id,name_ar,code,is_active,banner_url,neighborhoods(id,name_ar,is_active)")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  function resetEdit() {
    setEditingId(null);
    setEditName("");
    setEditCode("");
    setEditBanner("");
  }

  function startEdit(g: any) {
    setEditingId(g.id);
    setEditName(g.name_ar ?? "");
    setEditCode(g.code ?? "");
    setEditBanner(g.banner_url ?? "");
  }

  const addGov = useMutation({
    mutationFn: async () => {
      const name = govName.trim();
      const code = govCode.trim().toUpperCase();

      if (!name) throw new Error("اكتب اسم المحافظة");
      if (!code) throw new Error("اكتب كود المحافظة");

      const { data: last } = await supabase
        .from("governorates")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await supabase
        .from("governorates")
        .insert({
          name_ar: name,
          code,
          banner_url: govBanner.trim() || null,
          sort_order: Number(last?.sort_order ?? 0) + 1,
          is_active: true,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تمت إضافة المحافظة");
      setGovName("");
      setGovCode("");
      setGovBanner("");
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["governorates"] });
    },

    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "تعذّرت إضافة المحافظة"),
  });

  const updateGov = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("اختر محافظة");

      const name = editName.trim();
      const code = editCode.trim().toUpperCase();

      if (!name) throw new Error("اكتب اسم المحافظة");
      if (!code) throw new Error("اكتب كود المحافظة");

      const { error } = await supabase
        .from("governorates")
        .update({
          name_ar: name,
          code,
          banner_url: editBanner.trim() || null,
        })
        .eq("id", editingId);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم تعديل المحافظة");
      resetEdit();
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["governorates"] });
    },

    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "تعذّر تعديل المحافظة"),
  });

  const toggleGov = useMutation({
    mutationFn: async (g: any) => {
      const { error } = await supabase
        .from("governorates")
        .update({ is_active: !g.is_active })
        .eq("id", g.id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم تحديث حالة المحافظة");
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["governorates"] });
    },

    onError: () => toast.error("تعذّر تحديث حالة المحافظة"),
  });

  const deleteGov = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("governorates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم حذف المحافظة");
      setSelected(null);
      resetEdit();
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["governorates"] });
    },

    onError: () =>
      toast.error(
        "لا يمكن حذف المحافظة لأنها مرتبطة ببيانات موجودة. أوقفها بدل الحذف."
      ),
  });

  const addHood = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("اختر المحافظة");
      if (!hood.trim()) throw new Error("اكتب اسم الحي");

      const { error } = await supabase
        .from("neighborhoods")
        .insert({
          governorate_id: selected,
          name_ar: hood.trim(),
          is_active: true,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تمت إضافة الحي");
      setHood("");
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    },

    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "تعذّرت إضافة الحي"),
  });

  const toggleHood = useMutation({
    mutationFn: async (n: any) => {
      const { error } = await supabase
        .from("neighborhoods")
        .update({ is_active: !n.is_active })
        .eq("id", n.id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم تحديث حالة الحي");
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    },

    onError: () => toast.error("تعذّر تحديث حالة الحي"),
  });

  const deleteHood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neighborhoods")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم حذف الحي");
      void qc.invalidateQueries({ queryKey: ["admin-governorates"] });
      void qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    },

    onError: () =>
      toast.error(
        "لا يمكن حذف الحي لأنه مرتبط ببيانات موجودة."
      ),
  });

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="font-display text-xl font-extrabold">
          المحافظات والأحياء
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          المحافظات النشطة تظهر تلقائيًا في التسجيل والاختيارات داخل المنصة.
        </p>
      </div>

      <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          إضافة محافظة
        </h2>

        <div className="mt-3 space-y-2.5">
          <input
            value={govName}
            onChange={(e) => setGovName(e.target.value)}
            placeholder="اسم المحافظة"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <input
            value={govCode}
            onChange={(e) => setGovCode(e.target.value)}
            placeholder="كود المحافظة مثل: CAI"
            dir="ltr"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <input
            value={govBanner}
            onChange={(e) => setGovBanner(e.target.value)}
            placeholder="رابط صورة المحافظة (اختياري)"
            dir="ltr"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <button
            type="button"
            onClick={() => addGov.mutate()}
            disabled={addGov.isPending}
            className="w-full rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50"
          >
            {addGov.isPending ? "جارٍ الإضافة..." : "إضافة المحافظة"}
          </button>
        </div>
      </section>

      {editingId && (
        <section className="rounded-3xl bg-surface p-4 ring-1 ring-forest">
          <h2 className="font-display text-sm font-extrabold">
            تعديل المحافظة
          </h2>

          <div className="mt-3 space-y-2.5">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="اسم المحافظة"
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />

            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              placeholder="الكود"
              dir="ltr"
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />

            <input
              value={editBanner}
              onChange={(e) => setEditBanner(e.target.value)}
              placeholder="رابط الصورة"
              dir="ltr"
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateGov.mutate()}
                disabled={updateGov.isPending}
                className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50"
              >
                حفظ التعديل
              </button>

              <button
                type="button"
                onClick={resetEdit}
                className="rounded-xl bg-sand px-4 text-sm font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-2.5">
        {isLoading ? (
          <div className="rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground ring-1 ring-line">
            جارٍ تحميل المحافظات...
          </div>
        ) : govs.length ? (
          govs.map((g: any) => {
            const neighborhoods = Array.isArray(g.neighborhoods)
              ? g.neighborhoods
              : [];

            return (
              <div
                key={g.id}
                className="rounded-3xl bg-surface p-4 ring-1 ring-line"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-terracotta" />

                  <button
                    type="button"
                    onClick={() => {
                      setSelected(
                        selected === g.id ? null : g.id
                      );
                    }}
                    className="min-w-0 flex-1 text-right"
                  >
                    <div className="truncate text-sm font-bold">
                      {g.name_ar}
                    </div>

                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {g.code} · {neighborhoods.length} حي
                    </div>
                  </button>

                  <span
                    className={
                      "rounded-full px-2 py-1 text-[10px] font-bold " +
                      (g.is_active
                        ? "bg-forest-soft text-forest"
                        : "bg-sand text-muted-foreground")
                    }
                  >
                    {g.is_active ? "مفعلة" : "متوقفة"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="rounded-xl bg-sand py-2 text-xs font-bold"
                  >
                    تعديل
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleGov.mutate(g)}
                    className="rounded-xl bg-sand py-2 text-xs font-bold"
                  >
                    {g.is_active ? "إيقاف" : "تفعيل"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `حذف محافظة «${g.name_ar}»؟`
                        )
                      ) {
                        deleteGov.mutate(g.id);
                      }
                    }}
                    className="rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive"
                  >
                    حذف
                  </button>
                </div>

                {selected === g.id && (
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="text-xs font-bold">
                      الأحياء
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {neighborhoods.length ? (
                        neighborhoods.map((n: any) => (
                          <div
                            key={n.id}
                            className="flex items-center gap-2 rounded-xl bg-sand p-2.5"
                          >
                            <span className="min-w-0 flex-1 text-xs">
                              {n.name_ar}
                            </span>

                            <span
                              className={
                                "text-[9px] font-bold " +
                                (n.is_active
                                  ? "text-forest"
                                  : "text-muted-foreground")
                              }
                            >
                              {n.is_active
                                ? "مفعل"
                                : "متوقف"}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleHood.mutate(n)}
                              className="text-[10px] font-bold text-forest"
                            >
                              {n.is_active
                                ? "إيقاف"
                                : "تفعيل"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `حذف حي «${n.name_ar}»؟`
                                  )
                                ) {
                                  deleteHood.mutate(n.id);
                                }
                              }}
                              className="text-[10px] font-bold text-destructive"
                            >
                              حذف
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          لا توجد أحياء.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={hood}
                        onChange={(e) => setHood(e.target.value)}
                        placeholder="اسم حي جديد"
                        className="flex-1 rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
                      />

                      <button
                        type="button"
                        onClick={() => addHood.mutate()}
                        disabled={addHood.isPending}
                        className="rounded-xl bg-forest px-4 text-xs font-bold text-background"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={MapPin}
            title="لا توجد محافظات"
            description="أضف أول محافظة من النموذج أعلاه."
          />
        )}
      </section>
    </section>
  );
}

function ReportsTab() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id,reporter_id,reason,details,resolved,created_at,property_id,office_id,properties(title)",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: string;
        reporter_id: string;
        reason: string;
        details: string | null;
        resolved: boolean;
        created_at: string;
        property_id: string | null;
        office_id: string | null;
        properties: { title: string } | null;
      }>;

      const ids = new Set<string>();

      for (const row of rows) {
        ids.add(row.reporter_id);

        if (!row.details) continue;

        try {
          const details = JSON.parse(row.details) as {
            reported_user_id?: string;
          };

          if (details.reported_user_id) {
            ids.add(details.reported_user_id);
          }
        } catch {}
      }

      const profileMap = new Map<
        string,
        { full_name: string; phone: string | null }
      >();

      const roleMap = new Map<string, string>();

      if (ids.size) {
        const idList = [...ids];

        const [profilesRes, rolesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,full_name,phone")
            .in("id", idList),

          supabase
            .from("user_roles")
            .select("user_id,role")
            .in("user_id", idList),
        ]);

        for (const profile of profilesRes.data ?? []) {
          profileMap.set(profile.id, {
            full_name: profile.full_name,
            phone: profile.phone,
          });
        }

        for (const role of rolesRes.data ?? []) {
          if (!roleMap.has(role.user_id)) {
            roleMap.set(role.user_id, role.role);
          }
        }
      }

      return rows.map((row) => {
        let chatDetails: {
          source?: string;
          conversation_id?: string;
          message_id?: string;
          message_body?: string | null;
          message_image_url?: string | null;
          reported_user_id?: string;
        } = {};

        if (row.details) {
          try {
            chatDetails = JSON.parse(row.details);
          } catch {}
        }

        return {
          ...row,
          reporter_name:
            profileMap.get(row.reporter_id)?.full_name ||
            "مستخدم",
          reporter_role:
            roleMap.get(row.reporter_id) || "unknown",
          reported_name: chatDetails.reported_user_id
            ? profileMap.get(
                chatDetails.reported_user_id,
              )?.full_name || "مستخدم"
            : null,
          reported_role: chatDetails.reported_user_id
            ? roleMap.get(
                chatDetails.reported_user_id,
              ) || "unknown"
            : null,
          chatDetails,
        };
      });
    },
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reports")
        .update({ resolved: true })
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["admin-reports"],
      }),

    onError: () =>
      toast.error("تعذّر التحديث"),
  });

  if (!data?.length) {
    return (
      <EmptyState
        icon={Flag}
        title="لا توجد بلاغات"
      />
    );
  }

  function roleLabel(role: string) {
    if (role === "office") return "مكتب";
    if (role === "individual") return "فرد";
    if (role === "admin") return "أدمن";
    return "مستخدم";
  }

  return (
    <div className="space-y-2.5">
      {data.map((report) => (
        <div
          key={report.id}
          className="rounded-2xl bg-surface p-3.5 ring-1 ring-line"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">
              {report.reason}
            </span>

            {report.resolved ? (
              <span className="text-[10px] text-forest">
                تمت المعالجة
              </span>
            ) : (
              <button
                onClick={() =>
                  resolve.mutate(report.id)
                }
                className="rounded-full bg-forest px-3 py-1 text-[11px] font-bold text-background"
              >
                معالجة
              </button>
            )}
          </div>

          <div className="mt-2 rounded-xl bg-background p-2.5">
            <p className="text-xs font-bold">
              صاحب البلاغ:
            </p>

            <p className="mt-1 text-xs">
              {report.reporter_name}
              <span className="ms-1 text-[10px] text-muted-foreground">
                ({roleLabel(report.reporter_role)})
              </span>
            </p>
          </div>

          {report.reported_name && (
            <div className="mt-2 rounded-xl bg-background p-2.5">
              <p className="text-xs font-bold">
                المبلغ عليه:
              </p>

              <p className="mt-1 text-xs">
                {report.reported_name}
                <span className="ms-1 text-[10px] text-muted-foreground">
                  ({roleLabel(report.reported_role ?? "unknown")})
                </span>
              </p>
            </div>
          )}

          {report.chatDetails.source === "chat" && (
            <div className="mt-2 rounded-xl bg-sand p-2.5">
              <p className="text-[10px] font-bold text-forest">
                بلاغ من الدردشة
              </p>

              {report.chatDetails.message_body && (
                <p className="mt-1 text-xs">
                  الرسالة:
                  {" "}
                  {report.chatDetails.message_body}
                </p>
              )}

              {report.chatDetails.message_image_url && (
                <a
                  href={report.chatDetails.message_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-[11px] font-bold text-forest"
                >
                  عرض الصورة المبلغ عنها
                </a>
              )}
            </div>
          )}

          {(
            report.properties as {
              title: string;
            } | null
          )?.title && (
            <p className="mt-2 text-[11px] font-semibold text-forest">
              العقار:
              {" "}
              {(
                report.properties as {
                  title: string;
                }
              ).title}
            </p>
          )}

          {!report.chatDetails.source &&
            report.details && (
              <p className="mt-2 text-xs text-muted-foreground">
                {report.details}
              </p>
            )}

          <p className="mt-2 text-[10px] text-muted-foreground">
            {formatDateTime(report.created_at)}
          </p>
        </div>
      ))}
    </div>
  );
}


function PrivacyTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-privacy-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("key,content,updated_at")
        .eq("key", "privacy_policy")
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  const [content, setContent] = useState("");

  useEffect(() => {
    if (data?.content != null) {
      setContent(data.content);
    }
  }, [data?.content]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_content")
        .upsert(
          {
            key: "privacy_policy",
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم حفظ سياسة الخصوصية");

      void qc.invalidateQueries({
        queryKey: ["admin-privacy-policy"],
      });

      void qc.invalidateQueries({
        queryKey: ["privacy-policy"],
      });
    },

    onError: () => {
      toast.error("تعذّر حفظ سياسة الخصوصية");
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground">
        جاري تحميل سياسة الخصوصية...
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
      <div>
        <h2 className="font-display text-base font-extrabold">
          سياسة الخصوصية
        </h2>

        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          النص الذي تكتبه هنا يظهر للمستخدم داخل نافذة سياسة الخصوصية أثناء إنشاء الحساب.
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        dir="rtl"
        rows={24}
        placeholder="اكتب سياسة الخصوصية هنا..."
        className="w-full resize-y rounded-2xl bg-background px-4 py-3 text-sm leading-7 ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
      />

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50"
      >
        <Save className="size-4" />
        {save.isPending ? "جاري الحفظ..." : "حفظ سياسة الخصوصية"}
      </button>
    </section>
  );
}


function PoliciesTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-legal-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("key,content,updated_at")
        .in("key", ["privacy_policy", "terms_of_use"]);

      if (error) throw error;

      const rows = data ?? [];

      return {
        privacy:
          rows.find((row) => row.key === "privacy_policy")?.content ?? "",
        terms:
          rows.find((row) => row.key === "terms_of_use")?.content ?? "",
      };
    },
  });

  const [privacy, setPrivacy] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (!data) return;

    setPrivacy(data.privacy);
    setTerms(data.terms);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_content")
        .upsert(
          [
            {
              key: "privacy_policy",
              content: privacy,
              updated_at: new Date().toISOString(),
            },
            {
              key: "terms_of_use",
              content: terms,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "key" },
        );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("تم حفظ السياسات");

      void qc.invalidateQueries({
        queryKey: ["admin-legal-policies"],
      });

      void qc.invalidateQueries({
        queryKey: ["legal-policy"],
      });
    },

    onError: () => {
      toast.error("تعذّر حفظ السياسات");
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground">
        جاري تحميل السياسات...
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-base font-extrabold">
          سياسة الخصوصية
        </h2>

        <textarea
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          dir="rtl"
          rows={18}
          className="mt-3 w-full resize-y rounded-2xl bg-background px-4 py-3 text-sm leading-7 ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          placeholder="اكتب سياسة الخصوصية..."
        />
      </div>

      <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-base font-extrabold">
          شروط الاستخدام
        </h2>

        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          dir="rtl"
          rows={18}
          className="mt-3 w-full resize-y rounded-2xl bg-background px-4 py-3 text-sm leading-7 ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          placeholder="اكتب شروط الاستخدام..."
        />
      </div>

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50"
      >
        {save.isPending ? "جاري الحفظ..." : "حفظ السياسات"}
      </button>
    </section>
  );
}
