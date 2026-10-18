import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { formatDateTime } from "@/lib/format";
import {
  useMyPlan,
  useOfficePropertiesCount,
  usePackages,
  usePlanEvents,
  useSetPackage,
} from "@/lib/plans";
import { useMyOffice } from "@/lib/office";

export const Route = createFileRoute("/office/subscription")({
  head: () => ({
    meta: [
      { title: "الباقة والاشتراك | عقار البطين" },
      {
        name: "description",
        content: "الباقة الحالية والباقات المتاحة لمكتبك العقاري.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <Subscription />
    </RoleGuard>
  ),
});

function Subscription() {
  const { data: membership } = useMyOffice();
  const office = membership?.office ?? null;
  const isOwner = membership?.isOwner ?? false;

  const { package: currentPackage, expired, expiresAt, startedAt, propertyLimit, isLoading } =
    useMyPlan();

  const { data: packages = [] } = usePackages(true);
  const { data: count = 0 } = useOfficePropertiesCount(office?.id);
  const { data: events = [] } = usePlanEvents(office?.id);
  const setPackage = useSetPackage();
  const navigate = Route.useNavigate();

  function choose(pkg: (typeof packages)[number]) {
    if (!isOwner) {
      toast.error("تغيير الباقة متاح لصاحب المكتب فقط.");
      return;
    }

    if (currentPackage?.id === pkg.id) {
      if (pkg.price > 0) {
        void navigate({
          to: "/office/pay",
          search: { package: pkg.id },
        });
      } else {
        toast.info("أنت على هذه الباقة بالفعل.");
      }
      return;
    }

    if (pkg.price > 0) {
      void navigate({
        to: "/office/pay",
        search: { package: pkg.id },
      });
      return;
    }

    setPackage.mutate(pkg.id, {
      onSuccess: () => toast.success("تم اختيار الباقة"),
      onError: (e) =>
        toast.error(
          e instanceof Error ? e.message : "تعذّر تغيير الباقة"
        ),
    });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">
          الباقة والاشتراك
        </h1>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-terracotta" />
                <span className="font-display text-base font-extrabold">
                  {currentPackage?.name ?? "الباقة"}
                </span>

                <span className="ms-auto rounded-full bg-forest-soft px-2 py-1 text-[10px] font-bold text-forest">
                  {expired ? "منتهية" : "نشطة"}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Row
                  label="بداية الاشتراك"
                  value={startedAt ? formatDateTime(startedAt) : "—"}
                />

                <Row
                  label="الانتهاء"
                  value={expiresAt ? formatDateTime(expiresAt) : "—"}
                />

                <Row
                  label="العقارات"
                  value={
                    propertyLimit == null
                      ? `${count} — غير محدود`
                      : `${count} من ${propertyLimit}`
                  }
                />

                <Row
                  label="المكتب"
                  value={office?.name ?? "—"}
                />
              </dl>

              {expired && (
                <p className="mt-3 rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground">
                  انتهت الباقة المدفوعة. اختر أي باقة مدفوعة لإعادة التفعيل.
                </p>
              )}
            </section>

            <h2 className="px-1 font-display text-sm font-extrabold">
              الباقات المتاحة
            </h2>

            <div className="space-y-3">
              {packages.map((pkg) => {
                const current = currentPackage?.id === pkg.id;

                return (
                  <section
                    key={pkg.id}
                    className={
                      "rounded-3xl bg-surface p-4 ring-1 ring-line " +
                      (current ? "ring-2 ring-forest" : "")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-terracotta" />

                      <h3 className="font-display text-base font-extrabold">
                        {pkg.name}
                      </h3>

                      {current && (
                        <span className="ms-auto rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest">
                          الحالية
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-lg font-extrabold text-forest">
                      {pkg.price === 0
                        ? "مجانًا"
                        : `${pkg.price.toLocaleString("ar-SA")} ريال`}
                    </div>

                    {pkg.duration_days > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        {pkg.duration_days} يوم
                      </div>
                    )}

                    <ul className="mt-3 space-y-1">
                      {pkg.features.map((f) => (
                        <li
                          key={f}
                          className="text-[12px] text-muted-foreground"
                        >
                          ✓ {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => choose(pkg)}
                      disabled={setPackage.isPending}
                      className="mt-4 w-full rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50"
                    >
                      {current && pkg.price > 0
                        ? "تجديد / دفع"
                        : current
                          ? "باقتك الحالية"
                          : pkg.price > 0
                            ? "الاشتراك والدفع"
                            : "اختيار الباقة"}
                    </button>
                  </section>
                );
              })}
            </div>

            {events.length > 0 && (
              <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
                <h3 className="font-display text-sm font-extrabold">
                  سجل الاشتراك
                </h3>

                <ul className="mt-2 space-y-2">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <Building2 className="size-3.5 text-terracotta" />
                      <span>{e.note ?? e.plan}</span>
                      <span className="ms-auto text-muted-foreground">
                        {formatDateTime(e.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <Link
          to="/office"
          className="block rounded-2xl bg-sand p-3 text-center text-xs font-semibold text-forest"
        >
          العودة إلى لوحة المكتب
        </Link>
      </div>

      <BottomNav variant="office" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand p-2.5">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
