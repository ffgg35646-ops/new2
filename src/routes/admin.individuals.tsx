import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Mail,
  Phone,
  User,
} from "lucide-react";
import {
  isTodaySaudi,
  useAdminDirectory,
  type AdminIndividual,
} from "@/lib/admin";
import { formatDate as formatSaudiDate } from "@/lib/format";

export const Route = createFileRoute("/admin/individuals")({
  head: () => ({
    meta: [{ title: "الأفراد | إدارة عقار البطين" }],
  }),
  component: IndividualsRoute,
});

function IndividualsRoute() {
  const location = useLocation();

  if (location.pathname !== "/admin/individuals") {
    return <Outlet />;
  }

  return <IndividualsPage />;
}

function IndividualsPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useAdminDirectory();

  const individuals = data?.individuals ?? [];

  const today = individuals.filter((user) => isTodaySaudi(user.created_at)).length;

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
            <User className="size-7" />
          </div>

          <div>
            <div className="text-[10px] opacity-70">
              إدارة المستخدمين
            </div>

            <h1 className="mt-1 font-display text-2xl font-extrabold">
              الأفراد
            </h1>

            <p className="mt-1 text-xs opacity-80">
              إدارة حسابات الأفراد المسجلين.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          title="إجمالي الأفراد"
          value={individuals.length}
        />

        <Stat
          title="مسجلون اليوم"
          value={today}
        />
      </div>

      {isLoading && !data ? (
        <Skeleton />
      ) : isError ? (
        <div className="rounded-[26px] bg-surface p-8 text-center ring-1 ring-line">
          <div className="text-sm font-bold text-destructive">
            تعذر تحميل الأفراد.
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-background"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : individuals.length === 0 ? (
        <div className="rounded-[26px] bg-surface p-10 text-center text-sm text-muted-foreground ring-1 ring-line">
          لا يوجد أفراد مسجلون حاليًا.
        </div>
      ) : (
        <div className="space-y-3">
          {individuals.map((user) => (
            <IndividualCard
              key={user.id}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IndividualCard({
  user,
}: {
  user: AdminIndividual;
}) {
  return (
    <article className="overflow-hidden rounded-[26px] bg-surface ring-1 ring-line">
      <Link
        to="/admin/individuals/$userId"
        params={{ userId: user.id }}
        className="block p-4 transition hover:bg-sand/60"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
            <User className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold">
                  {user.full_name || "بدون اسم"}
                </h2>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  حساب فرد
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-bold text-forest">
                فرد
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Info
                label="البريد"
                value={user.email || "—"}
                icon={Mail}
              />

              <Info
                label="الجوال"
                value={user.phone || "—"}
                icon={Phone}
              />

              <Info
                label="المحافظة"
                value={user.governorate_name || "—"}
              />

              <Info
                label="التسجيل"
                value={formatDate(user.created_at)}
              />
            </div>
          </div>
        </div>
      </Link>

      <div className="border-t border-line bg-background/60 p-3">
        <Link
          to="/admin/individuals/$userId"
          params={{ userId: user.id }}
          className="block w-full rounded-xl bg-forest py-3 text-center text-xs font-bold text-background"
        >
          فتح ملف الفرد
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
  return formatSaudiDate(value);
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
