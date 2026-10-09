import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProLockDialog } from "@/components/ProLock";
import { useAuth } from "@/lib/auth";
import { RoleGuard } from "@/lib/role-guard";
import { FREE_PROPERTY_LIMIT, useMyPlan, usePackages } from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "الباقات | عقار البطين" },
      {
        name: "description",
        content: "الباقات المتاحة للمكاتب العقارية ومميزاتها وأسعارها.",
      },
      { property: "og:title", content: "الباقات | عقار البطين" },
      {
        property: "og:description",
        content: "الباقات المتاحة للمكاتب العقارية.",
      },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office", "admin"]}>
      <PlansPage />
    </RoleGuard>
  ),
});

function PlansPage() {
  const { isOffice } = useAuth();
  const { data: catalog = [], isLoading } = usePackages(true);
  const { package: currentPackage, isPaid } = useMyPlan();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <header>
          <h1 className="font-display text-xl font-extrabold">الباقات</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            الباقات المتاحة للمكاتب العقارية.
          </p>
        </header>

        {isLoading ? (
          <div className="rounded-3xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line">
            جارٍ تحميل الباقات...
          </div>
        ) : catalog.length ? (
          <div className="space-y-3">
            {catalog.map((pkg) => {
              const current = currentPackage?.id === pkg.id;
              const packageIsPaid = pkg.code === "pro" || Number(pkg.price ?? 0) > 0;
              const displayedPropertyLimit =
                pkg.property_limit ?? (packageIsPaid ? null : FREE_PROPERTY_LIMIT);

              return (
                <section
                  key={pkg.id}
                  className={
                    "rounded-3xl bg-surface p-4 ring-1 ring-line " +
                    (current ? "ring-2 ring-forest" : "")
                  }
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-forest" />

                    <h2 className="font-display text-base font-extrabold">
                      {pkg.name}
                    </h2>

                    {current && (
                      <span className="ms-auto rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest">
                        باقتك الحالية
                      </span>
                    )}
                  </div>

                  <div className="mt-2 font-display text-xl font-extrabold text-forest">
                    {pkg.price === 0
                      ? "مجانًا"
                      : `${pkg.price.toLocaleString("ar-SA")} ريال`}
                  </div>

                  {pkg.duration_days > 0 && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      مدة الاشتراك: {pkg.duration_days} يوم
                    </div>
                  )}

                  {pkg.description && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {pkg.description}
                    </p>
                  )}

                  <div className="mt-3 text-[11px] text-muted-foreground">
                    العقارات:{" "}
                    {pkg.property_limit == null
                      ? "غير محدودة"
                      : pkg.property_limit}
                    {" · "}
                    المميزة: {pkg.featured_limit}
                    {" · "}
                    الدردشة: {pkg.chat_enabled ? "مفعلة" : "غير متاحة"}
                    {" · "}
                    التوثيق: {pkg.verification_included ? "مشمول" : "غير مشمول"}
                  </div>

                  {pkg.features.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px]">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isOffice && !current && (
                    <Link
                      to={
                        pkg.price > 0
                          ? "/office/pay"
                          : "/office/subscription"
                      }
                      search={
                        pkg.price > 0
                          ? { package: pkg.id }
                          : undefined
                      }
                      className="mt-4 block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background"
                    >
                      {pkg.price > 0 ? "الاشتراك في الباقة" : "اختيار الباقة"}
                    </Link>
                  )}


                </section>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-sand p-4 text-center text-sm text-muted-foreground">
            لا توجد باقات متاحة حاليًا.
          </p>
        )}


        {isPaid && currentPackage && (
          <p className="rounded-2xl bg-sand p-3 text-[11px] text-muted-foreground">
            باقتك الحالية: {currentPackage.name}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
