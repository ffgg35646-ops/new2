import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminDirectory, type AdminOffice } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/offices")({
  head: () => ({
    meta: [{ title: "المكاتب | إدارة عقار البطين" }],
  }),
  component: OfficesRoute,
});

function OfficesRoute() {
  const location = useLocation();

  if (location.pathname !== "/admin/offices") {
    return <Outlet />;
  }

  return <OfficesPage />;
}

function OfficesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-directory"],
    queryFn: fetchAdminDirectory,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const offices = data?.offices ?? [];

  const pending = offices.filter(
    (x) => x.verification_status === "pending",
  ).length;

  const verified = offices.filter(
    (x) => x.verification_status === "verified",
  ).length;

  const rejected = offices.filter(
    (x) => x.verification_status === "rejected",
  ).length;

  return (
    <div dir="rtl" className="space-y-5 pb-8">
      <section className="overflow-hidden rounded-[30px] bg-forest p-5 text-background">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-[11px] font-bold opacity-80"
        >
          <ArrowRight className="size-3.5" />
          لوحة الإدارة
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-background/15">
            <Building2 className="size-7" />
          </div>

          <div>
            <div className="text-[10px] opacity-70">
              إدارة المستخدمين
            </div>

            <h1 className="mt-1 font-display text-2xl font-extrabold">
              المكاتب العقارية
            </h1>

            <p className="mt-1 text-xs opacity-80">
              مراجعة واعتماد وإدارة جميع المكاتب.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat title="إجمالي المكاتب" value={offices.length} />
        <Stat title="قيد المراجعة" value={pending} />
        <Stat title="موثقة" value={verified} />
        <Stat title="مرفوضة" value={rejected} />
      </div>

      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="rounded-[26px] bg-surface p-8 text-center ring-1 ring-line">
          <div className="text-sm font-bold text-destructive">
            تعذر تحميل المكاتب.
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-background"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : offices.length === 0 ? (
        <div className="rounded-[26px] bg-surface p-10 text-center text-sm text-muted-foreground ring-1 ring-line">
          لا توجد مكاتب مسجلة حاليًا.
        </div>
      ) : (
        <div className="space-y-3">
          {offices.map((office) => (
            <OfficeCard key={office.id} office={office} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfficeCard({ office }: { office: AdminOffice }) {
  const status =
    office.verification_status === "verified"
      ? {
          text: "موثق",
          icon: CheckCircle2,
          className: "bg-forest-soft text-forest",
        }
      : office.verification_status === "rejected"
        ? {
            text: "مرفوض",
            icon: XCircle,
            className: "bg-destructive/10 text-destructive",
          }
        : {
            text: "قيد المراجعة",
            icon: Clock3,
            className: "bg-terracotta-soft text-terracotta",
          };

  const StatusIcon = status.icon;

  return (
    <article className="overflow-hidden rounded-[26px] bg-surface ring-1 ring-line">
      <Link
        to="/admin/offices/$officeId"
        params={{ officeId: office.id }}
        className="block p-4 transition hover:bg-sand/60"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-terracotta-soft text-terracotta">
            <Building2 className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold">
                  {office.name || "بدون اسم"}
                </h2>

                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {office.manager_name || "بدون اسم المسؤول"}
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                  status.className,
                )}
              >
                <StatusIcon className="size-3.5" />
                {status.text}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Info
                label="البريد"
                value={office.email || "—"}
                icon={Mail}
              />

              <Info
                label="الجوال"
                value={office.phone || "—"}
                icon={Phone}
              />

              <Info
                label="المحافظة"
                value={office.governorate_name || "—"}
              />

              <Info
                label="التسجيل"
                value={formatDate(office.created_at)}
              />
            </div>
          </div>
        </div>
      </Link>

      <div className="border-t border-line bg-background/60 p-3">
        <Link
          to="/admin/offices/$officeId"
          params={{ officeId: office.id }}
          className="block w-full rounded-xl bg-forest py-3 text-center text-xs font-bold text-background"
        >
          فتح ملف المكتب
        </Link>
      </div>
    </article>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <div className="text-[10px] text-muted-foreground">
        {title}
      </div>

      <div className="mt-1 font-display text-2xl font-extrabold">
        {value}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="rounded-xl bg-sand p-2.5">
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </div>

      <div className="mt-1 truncate text-[11px] font-bold">
        {value}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("ar-SA");
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-[26px] bg-sand"
        />
      ))}
    </div>
  );
}
