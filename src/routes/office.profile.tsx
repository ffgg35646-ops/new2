import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Building2,
  Crown,
  FileCheck2,
  Loader2,
  LogOut,
  Moon,
  Pencil,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { MediaUploader } from "@/components/MediaUploader";
import { QrDialog } from "@/components/QrDialog";
import { QrCode } from "lucide-react";
import { useAuth, signOut } from "@/lib/auth";

import { useGovernorates } from "@/lib/governorate";
import { useMyOffice } from "@/lib/office";
import { useMyPlan } from "@/lib/plans";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPublicAppUrl, PUBLIC_APP_URL_HELP } from "@/lib/public-app-url";
import { SupportCenter } from "@/components/SupportCenter";
import { ProfileModal } from "@/components/ProfileModal";

export const Route = createFileRoute("/office/profile")({
  head: () => ({
    meta: [
      { title: "ملف المكتب | عقار البطين" },
      {
        name: "description",
        content: "بيانات مكتبك العقاري وترخيص فال وساعات العمل وطرق التواصل.",
      },
      { property: "og:title", content: "ملف المكتب | عقار البطين" },
      { property: "og:description", content: "ملف وإعدادات المكتب العقاري في عقار البطين." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeProfile />
    </RoleGuard>
  ),
});

const TEXT_FIELDS = [
  ["name", "اسم المكتب"],
  ["manager_name", "اسم المسؤول"],
  ["phone", "رقم الجوال"],
  ["whatsapp", "واتساب"],
  ["email", "البريد الإلكتروني"],
  ["address", "العنوان"],
  ["working_hours", "ساعات العمل"],
  ["commercial_register", "السجل التجاري"],
  ["license_number", "رقم الترخيص العقاري"],
  ["fal_license_number", "رقم رخصة فال"],
] as const;

type FormKey =
  (typeof TEXT_FIELDS)[number][0] | "description" | "governorate_id" | "license_expiry";

function OfficeProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { userId, session } = useAuth();
  const { data: membership, isLoading } = useMyOffice();
  const office = membership?.office ?? null;
  const isOwner = membership?.isOwner ?? false;
  const { isPro } = useMyPlan();
  const isVerified = office?.verification_badge === true;
  const [showQr, setShowQr] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dark, setDark] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const supportTicketId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("support")
      : null;
  const { data: governorates = [] } = useGovernorates();

  const [form, setForm] = useState<Record<FormKey, string>>({
    name: "",
    manager_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    working_hours: "",
    commercial_register: "",
    license_number: "",
    fal_license_number: "",
    description: "",
    governorate_id: "",
    license_expiry: "",
  });
  const [falDocs, setFalDocs] = useState<string[]>([]);
  const [licenseDocs, setLicenseDocs] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ofoq-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("ofoq-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  useEffect(() => {
    if (!office) return;
    setForm({
      name: office.name ?? "",
      manager_name: office.manager_name ?? "",
      phone: office.phone ?? "",
      whatsapp: office.whatsapp ?? "",
      email: office.email ?? "",
      address: office.address ?? "",
      working_hours: office.working_hours ?? "",
      commercial_register: office.commercial_register ?? "",
      license_number: office.license_number ?? "",
      fal_license_number: office.fal_license_number ?? "",
      description: office.description ?? "",
      governorate_id: office.governorate_id ?? "",
      license_expiry: office.license_expiry ?? "",
    });
    setFalDocs(office.fal_license_url ? [office.fal_license_url] : []);
    setLicenseDocs(office.real_estate_license_url ? [office.real_estate_license_url] : []);
  }, [office]);

  const save = useMutation({
    mutationFn: async () => {
      if (!office) throw new Error("مكتبك غير متاح");
      if (!isOwner) throw new Error("تعديل بيانات المكتب متاح لصاحب المكتب فقط");
      const { error } = await supabase
        .from("offices")
        .update({
          ...form,
          governorate_id: form.governorate_id || null,
          license_expiry: form.license_expiry || null,
          fal_license_url: falDocs[0] ?? null,
          real_estate_license_url: licenseDocs[0] ?? null,
        })
        .eq("id", office.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ بيانات المكتب");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["my-office-full"] });
      qc.invalidateQueries({ queryKey: ["office-governorate"] });
      qc.invalidateQueries({ queryKey: ["office"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ البيانات"),
  });

  const governorateName =
    governorates.find((g) => g.id === (office?.governorate_id ?? ""))?.name_ar ?? "—";
  const officeQrUrl = office ? getPublicAppUrl(`/offices/${office.id}`) : null;

  const readRows: [string, string][] = [
    ["اسم المكتب", office?.name ?? "—"],
    ["اسم المسؤول", office?.manager_name || "—"],
    ["رقم الجوال", office?.phone || "—"],
    ["واتساب", office?.whatsapp || "—"],
    ["البريد الإلكتروني", office?.email || "—"],
    ["المنطقة", "منطقة الرياض"],
    ["المحافظة", governorateName],
    ["العنوان", office?.address || "—"],
    ["رقم الترخيص العقاري", office?.license_number || "—"],
    ["رقم رخصة فال", office?.fal_license_number || "—"],
    ["انتهاء الترخيص", office?.license_expiry ? formatDate(office.license_expiry) : "—"],
    ["السجل التجاري", office?.commercial_register || "—"],
    ["ساعات العمل", office?.working_hours || "—"],
    ["نبذة المكتب", office?.description || "—"],
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-forest/10 text-forest">
              {office?.logo_url ? (
                <img src={office.logo_url} alt="" className="size-full object-cover" />
              ) : (
                <Building2 className="size-6" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base font-extrabold">
                {office?.name ?? "مكتبي العقاري"}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isVerified ? (
                  <>
                    <ShieldCheck className="size-3.5 text-forest" />
                    موثق
                  </>
                ) : (
                  "الحساب الأساسي"
                )}
              </div>
            </div>
            {office && (
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Link
                  to="/offices/$officeId"
                  params={{ officeId: office.id }}
                  className="text-xs font-semibold text-terracotta"
                >
                  الملف العام
                </Link>
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="text-xs font-semibold text-forest"
                >
                  الملف الشخصي
                </button>
              </div>
            )}
          </div>
          <ProfileModal
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            email={session?.user?.email ?? office?.email ?? ""}
            emailVerified={!!session?.user?.email_confirmed_at}
            avatarUrl={office?.logo_url}
            rows={readRows
              .filter(([label]) => label !== "البريد الإلكتروني")
              .map(([label, value]) => ({ label, value }))}
          />

          {office?.verification_status === "rejected" && office.rejection_reason && (
            <p className="mt-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
              سبب الرفض: {office.rejection_reason}
            </p>
          )}
          {office?.verification_status === "pending" && (
            <p className="mt-2 rounded-xl bg-sand p-2.5 text-xs text-muted-foreground">
              أكمل بيانات الترخيص العقاري ورخصة فال لتسريع توثيق المكتب.
            </p>
          )}
          {office && (
            <button
              onClick={() => {
                if (!isPro) {
                  toast.error("رمز QR ميزة احترافية — رقِّ باقتك لإنشاء رمز مكتبك.");
                  return;
                }
                if (!officeQrUrl) {
                  toast.error(PUBLIC_APP_URL_HELP);
                  return;
                }
                setShowQr(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sand py-2.5 text-xs font-bold text-forest"
            >
              <QrCode className="size-4" /> رمز QR للمكتب {!isPro && "🔒"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="h-40 animate-shimmer rounded-2xl bg-sand" />
        ) : editing ? (
          <div className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-extrabold">تعديل بيانات المكتب</h2>
              <button
                onClick={() => setEditing(false)}
                aria-label="إلغاء"
                className="grid size-7 place-items-center rounded-full bg-sand"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {TEXT_FIELDS.map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
                />
              </label>
            ))}

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">تاريخ انتهاء الترخيص</span>
              <input
                type="date"
                value={form.license_expiry}
                onChange={(e) => setForm((f) => ({ ...f, license_expiry: e.target.value }))}
                className="w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">المحافظة</span>
              <select
                value={form.governorate_id}
                onChange={(e) => setForm((f) => ({ ...f, governorate_id: e.target.value }))}
                className="w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
              >
                <option value="">اختر المحافظة</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">نبذة المكتب</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-forest"
              />
            </label>

            {userId && (
              <div className="space-y-3 rounded-xl bg-background p-3 ring-1 ring-line">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <FileCheck2 className="size-3.5 text-forest" /> مستندات التوثيق
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted-foreground">
                    صورة الترخيص العقاري
                  </span>
                  <MediaUploader
                    userId={userId}
                    folder="licenses"
                    value={licenseDocs}
                    onChange={setLicenseDocs}
                    label="ارفع صورة الترخيص العقاري"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted-foreground">
                    صورة رخصة فال
                  </span>
                  <MediaUploader
                    userId={userId}
                    folder="licenses"
                    value={falDocs}
                    onChange={setFalDocs}
                    label="ارفع صورة رخصة فال"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />} حفظ البيانات
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
            <h2 className="font-display text-sm font-extrabold">بيانات المكتب</h2>
            <dl className="divide-y divide-line">
              {readRows.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2">
                  <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-left text-xs font-semibold break-words">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <dt className="text-xs text-muted-foreground">شارة الحساب</dt>
                <dd className="text-xs font-semibold">
                  {isVerified ? "موثق" : "حساب أساسي"}
                </dd>
              </div>
            </dl>

            {(office?.fal_license_url || office?.real_estate_license_url) && (
              <div className="flex gap-2">
                {office?.real_estate_license_url && (
                  <a
                    href={office.real_estate_license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl bg-sand py-2 text-center text-xs font-semibold"
                  >
                    الترخيص العقاري
                  </a>
                )}
                {office?.fal_license_url && (
                  <a
                    href={office.fal_license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl bg-sand py-2 text-center text-xs font-semibold"
                  >
                    رخصة فال
                  </a>
                )}
              </div>
            )}

            {isOwner ? (
              <button
                onClick={() => setEditing(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-sm font-bold text-background"
              >
                <Pencil className="size-4" /> تعديل بيانات المكتب
              </button>
            ) : (
              <p className="rounded-xl bg-sand p-2.5 text-[11px] text-muted-foreground">
                تعديل بيانات المكتب متاح لصاحب المكتب فقط.
              </p>
            )}
          </div>
        )}

        {isOwner && (
          <Link
            to="/office/subscription"
            className="flex items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-line"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Crown className="size-4 text-terracotta" /> الباقة والاشتراك
            </span>
            <span className="text-xs text-terracotta">إدارة</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface p-4 text-sm font-semibold ring-1 ring-line"
        >
          تواصل مع الدعم
        </button>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-line"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Moon className="size-4 text-terracotta" /> الوضع الليلي
          </span>
          <span className="text-xs text-muted-foreground">{dark ? "مفعّل" : "معطّل"}</span>
        </button>

        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/", replace: true });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive"
        >
          <LogOut className="size-4" /> تسجيل الخروج
        </button>
      </main>

      {office && (
        <QrDialog
          open={showQr}
          onClose={() => setShowQr(false)}
          value={officeQrUrl ?? ""}
          title={office.name}
          subtitle="امسح الرمز لفتح صفحة المكتب"
          fileName={`qr-${office.name}`}
        />
      )}
      <SupportCenter
        open={supportOpen || !!supportTicketId}
        initialTicketId={supportTicketId}
        onClose={() => setSupportOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
