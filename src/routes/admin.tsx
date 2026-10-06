import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, MapPin, Plus, Save, ShieldCheck, Pencil, Trash2, Power, Package, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { VERIFICATION_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AdminSupport } from "@/components/AdminSupport";

type Tab =
  | "dashboard"
  | "offices"
  | "plans"
  | "geo"
  | "reports"
  | "support"
  | "privacy"
  | "terms";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search["tab"] === "offices" ||
      search["tab"] === "plans" ||
      search["tab"] === "geo" ||
      search["tab"] === "reports" ||
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
      <AdminPage />
    </RoleGuard>
  ),
});

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
      <AppHeader showSearch={false} />

      <main className="mx-auto w-full max-w-6xl px-4 py-5">
        {tab === "dashboard" && <AdminStats />}
        {tab === "offices" && <OfficesTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "geo" && <GeoTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "support" && <AdminSupport />}
{tab === "privacy" && <LegalAdminTab title="سياسة الخصوصية" />}
{tab === "terms" && <LegalAdminTab title="شروط الاستخدام" />}
      </main>
    </div>
  );
}

function AdminStats() {
  const stats = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [offices, individuals, properties, reports] =
        await Promise.all([
          supabase
            .from("offices")
            .select("id", { count: "exact", head: true })
            .eq("is_deleted", false),

          supabase
            .from("user_roles")
            .select("user_id", { count: "exact", head: true })
            .eq("role", "individual"),

          supabase
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("is_deleted", false)
            .eq("is_published", true),

          supabase
            .from("reports")
            .select("id", { count: "exact", head: true })
            .eq("resolved", false),
        ]);

      for (const result of [
        offices,
        individuals,
        properties,
        reports,
      ]) {
        if (result.error) throw result.error;
      }

      return {
        offices: offices.count ?? 0,
        individuals: individuals.count ?? 0,
        properties: properties.count ?? 0,
        openReports: reports.count ?? 0,
      };
    },
  });

  const cards = [
    {
      label: "المكاتب",
      value: stats.data?.offices ?? 0,
      icon: Building2,
    },
    {
      label: "الأفراد",
      value: stats.data?.individuals ?? 0,
      icon: Users,
    },
    {
      label: "العقارات المنشورة",
      value: stats.data?.properties ?? 0,
      icon: BarChart3,
    },
    {
      label: "البلاغات المفتوحة",
      value: stats.data?.openReports ?? 0,
      icon: Flag,
    },
  ];

  return (
    <section className="space-y-5" dir="rtl">
      <div>
        <h1 className="font-display text-2xl font-extrabold">
          لوحة الإدارة
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          الإحصائيات الرئيسية للمنصة.
        </p>
      </div>

      {stats.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="h-32 animate-pulse rounded-3xl bg-surface ring-1 ring-line"
            />
          ))}
        </div>
      ) : stats.isError ? (
        <div className="rounded-3xl bg-destructive/5 p-5 text-sm text-destructive ring-1 ring-line">
          تعذّر تحميل إحصائيات لوحة الإدارة.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-3xl bg-surface p-4 ring-1 ring-line"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
                <Icon className="size-5" />
              </div>

              <div className="mt-4 font-display text-3xl font-extrabold">
                {value}
              </div>

              <div className="mt-1 text-xs font-semibold text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function LegalAdminTab({ title }: { title: string }) {
  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="font-display text-xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة المحتوى القانوني الظاهر للمستخدمين.
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
        <textarea
          rows={18}
          defaultValue={
            title === "سياسة الخصوصية"
              ? "اكتب هنا سياسة الخصوصية الخاصة بمنصة عقار البطين..."
              : "اكتب هنا شروط الاستخدام الخاصة بمنصة عقار البطين..."
          }
          className="w-full rounded-2xl bg-background p-4 text-sm leading-7 outline-none ring-1 ring-line focus:ring-2 focus:ring-forest"
        />

        <button
          type="button"
          className="mt-3 w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
        >
          حفظ
        </button>
      </div>
    </section>
  );
}

function PlansTab() {
  const qc = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("0");
  const [propertyLimit, setPropertyLimit] = useState("");
  const [featuredLimit, setFeaturedLimit] = useState("0");
  const [chatEnabled, setChatEnabled] = useState(false);
  const [verificationIncluded, setVerificationIncluded] = useState(false);
  const [featuresText, setFeaturesText] = useState("");

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-package-catalog"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("package_catalog")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  function resetForm() {
    setEditingId(null);
    setName("");
    setCode("");
    setDescription("");
    setPrice("0");
    setDuration("0");
    setPropertyLimit("");
    setFeaturedLimit("0");
    setChatEnabled(false);
    setVerificationIncluded(false);
    setFeaturesText("");
  }

  function editPackage(pkg: any) {
    setEditingId(pkg.id);
    setName(pkg.name ?? "");
    setCode(pkg.code ?? "");
    setDescription(pkg.description ?? "");
    setPrice(String(pkg.price ?? 0));
    setDuration(String(pkg.duration_days ?? 0));
    setPropertyLimit(
      pkg.property_limit == null ? "" : String(pkg.property_limit)
    );
    setFeaturedLimit(String(pkg.featured_limit ?? 0));
    setChatEnabled(Boolean(pkg.chat_enabled));
    setVerificationIncluded(Boolean(pkg.verification_included));
    setFeaturesText(
      Array.isArray(pkg.features)
        ? pkg.features.map((x: unknown) => String(x)).join("\n")
        : ""
    );
  }

  const save = useMutation({
    mutationFn: async () => {
      const cleanName = name.trim();
      const cleanCode = code.trim().toLowerCase();

      if (!cleanName) throw new Error("اكتب اسم الباقة");
      if (!cleanCode) throw new Error("اكتب رمز الباقة");

      const numericPrice = Number(price);
      const numericDuration = Number(duration);
      const numericFeatured = Number(featuredLimit);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        throw new Error("السعر غير صحيح");
      }

      if (!Number.isInteger(numericDuration) || numericDuration < 0) {
        throw new Error("مدة الباقة غير صحيحة");
      }

      if (!Number.isInteger(numericFeatured) || numericFeatured < 0) {
        throw new Error("حد العقارات المميزة غير صحيح");
      }

      let numericPropertyLimit: number | null = null;
      if (propertyLimit.trim()) {
        numericPropertyLimit = Number(propertyLimit);
        if (
          !Number.isInteger(numericPropertyLimit) ||
          numericPropertyLimit < 0
        ) {
          throw new Error("حد العقارات غير صحيح");
        }
      }

      const features = featuresText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const payload = {
        code: cleanCode,
        name: cleanName,
        description: description.trim() || null,
        price: numericPrice,
        duration_days: numericDuration,
        property_limit: numericPropertyLimit,
        featured_limit: numericFeatured,
        chat_enabled: chatEnabled,
        verification_included: verificationIncluded,
        features,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("package_catalog")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { data: last } = await (supabase as any)
          .from("package_catalog")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error } = await (supabase as any)
          .from("package_catalog")
          .insert({
            ...payload,
            sort_order: Number(last?.sort_order ?? 0) + 1,
            is_active: true,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "تم تعديل الباقة" : "تمت إضافة الباقة");
      resetForm();
      void qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
      void qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "تعذّر حفظ الباقة");
    },
  });

  const toggle = useMutation({
    mutationFn: async (pkg: any) => {
      const { error } = await (supabase as any)
        .from("package_catalog")
        .update({ is_active: !pkg.is_active })
        .eq("id", pkg.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الباقة");
      void qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
      void qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
    },
    onError: () => toast.error("تعذّر تحديث حالة الباقة"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("package_catalog")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الباقة");
      void qc.invalidateQueries({ queryKey: ["admin-package-catalog"] });
      void qc.invalidateQueries({ queryKey: ["public-package-catalog"] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error
          ? "لا يمكن حذف باقة مستخدمة حاليًا. عطّلها بدلًا من حذفها."
          : "تعذّر حذف الباقة"
      );
    },
  });

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="font-display text-xl font-extrabold">
          إدارة الباقات
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          إضافة وتعديل وحذف وتعطيل الباقات، مع تحديد السعر والمدة والميزات والحدود.
        </p>
      </div>

      <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
        <h2 className="font-display text-sm font-extrabold">
          {editingId ? "تعديل الباقة" : "إضافة باقة جديدة"}
        </h2>

        <div className="mt-3 space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الباقة"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="رمز الباقة بالإنجليزية مثل: basic"
            dir="ltr"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف الباقة"
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="السعر"
              className="rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />

            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="المدة بالأيام"
              className="rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              value={propertyLimit}
              onChange={(e) => setPropertyLimit(e.target.value)}
              placeholder="حد العقارات — فارغ = غير محدود"
              className="rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />

            <input
              type="number"
              min="0"
              value={featuredLimit}
              onChange={(e) => setFeaturedLimit(e.target.value)}
              placeholder="حد العقارات المميزة"
              className="rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl bg-sand p-3 text-sm">
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => setChatEnabled(e.target.checked)}
            />
            السماح بالدردشة
          </label>

          <label className="flex items-center gap-2 rounded-xl bg-sand p-3 text-sm">
            <input
              type="checkbox"
              checked={verificationIncluded}
              onChange={(e) => setVerificationIncluded(e.target.checked)}
            />
            توثيق المكتب مع الباقة
          </label>

          <textarea
            rows={7}
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            placeholder={"مميزات الباقة — كل ميزة في سطر\nميزة 1\nميزة 2\nميزة 3"}
            className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm leading-6 outline-none focus:ring-2 focus:ring-forest"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50"
            >
              {save.isPending
                ? "جارٍ الحفظ..."
                : editingId
                  ? "حفظ التعديل"
                  : "إضافة الباقة"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-sand px-4 text-sm font-bold"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        {isLoading ? (
          <div className="rounded-2xl bg-surface p-5 text-center text-sm text-muted-foreground ring-1 ring-line">
            جارٍ تحميل الباقات...
          </div>
        ) : !packages.length ? (
          <EmptyState icon={Package} title="لا توجد باقات" />
        ) : (
          packages.map((pkg: any) => (
            <div
              key={pkg.id}
              className="rounded-3xl bg-surface p-4 ring-1 ring-line"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-extrabold">
                      {pkg.name}
                    </h3>

                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                        (pkg.is_active
                          ? "bg-forest-soft text-forest"
                          : "bg-sand text-muted-foreground")
                      }
                    >
                      {pkg.is_active ? "مفعلة" : "متوقفة"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    الرمز: {pkg.code}
                  </div>

                  <div className="mt-2 text-sm font-bold">
                    {Number(pkg.price).toLocaleString("ar-SA")} ريال
                    {Number(pkg.duration_days) > 0 &&
                      ` · ${pkg.duration_days} يوم`}
                  </div>

                  <div className="mt-1 text-[11px] text-muted-foreground">
                    العقارات:{" "}
                    {pkg.property_limit == null
                      ? "غير محدودة"
                      : pkg.property_limit}
                    {" · "}
                    المميزة: {pkg.featured_limit ?? 0}
                    {" · "}
                    الدردشة: {pkg.chat_enabled ? "نعم" : "لا"}
                    {" · "}
                    التوثيق: {pkg.verification_included ? "نعم" : "لا"}
                  </div>

                  {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pkg.features.map((f: string, i: number) => (
                        <li
                          key={`${pkg.id}-${i}`}
                          className="text-[11px] text-muted-foreground"
                        >
                          ✓ {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => editPackage(pkg)}
                    className="grid size-9 place-items-center rounded-xl bg-sand"
                  >
                    <Pencil className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggle.mutate(pkg)}
                    className="grid size-9 place-items-center rounded-xl bg-sand"
                  >
                    <Power className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `حذف الباقة «${pkg.name}»؟`
                        )
                      ) {
                        remove.mutate(pkg.id);
                      }
                    }}
                    className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
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
            {new Date(
              report.created_at,
            ).toLocaleString("ar-IQ")}
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

  React.useEffect(() => {
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
