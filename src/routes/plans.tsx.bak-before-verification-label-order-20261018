import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Check, Sparkles } from "lucide-react";
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
    <RoleGuard allow={["office"]}>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catalog.map((pkg) => {
              const current = currentPackage?.id === pkg.id;
              const packageIsPaid = pkg.code === "pro" || Number(pkg.price ?? 0) > 0;
              const displayedPropertyLimit = packageIsPaid
                ? pkg.property_limit ?? null
                : FREE_PROPERTY_LIMIT;
              const isProPackage = pkg.code === "pro";
              const pinnedPropertyFeature = "تثبيت العقارات: تثبيت حتى 3 عقارات في أعلى صفحة المكتب";
              const repostFeature = "إعادة نشر العقارات: تحديث تاريخ الإعلان لإعادة إبرازه كل ٢٤ ساعة";
              const displayedFeatures = [
                ...(pkg.features ?? [])
                  .filter((feature) => !/دردشة|الدردشة/.test(feature))
                  .map((feature) => /تمييز حتى 3 عقارات/.test(feature) ? pinnedPropertyFeature : feature),
                ...(isProPackage ? [pinnedPropertyFeature, repostFeature] : []),
                ...(!packageIsPaid ? ["دردشة مجانية مع العملاء"] : []),
              ].filter((feature, index, all) => all.indexOf(feature) === index);

              return (
                <section
                  key={pkg.id}
                  className={
                    "relative flex h-full flex-col overflow-hidden rounded-3xl p-4 shadow-sm ring-1 transition " +
                    (packageIsPaid
                      ? "bg-gradient-to-br from-forest/10 via-surface to-surface ring-forest/30"
                      : "bg-surface ring-line") +
                    (current ? " ring-2 ring-forest" : "")
                  }
                >
                  <div className="flex items-start gap-2">
                    <span className={"grid size-10 shrink-0 place-items-center rounded-2xl " + (packageIsPaid ? "bg-forest text-background" : "bg-sand text-forest")}>
                      <Sparkles className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">

                    <h2 className="font-display text-base font-extrabold">
                      {pkg.name}
                    </h2>

                    {current && (
                      <span className="mt-1 inline-flex rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest">
                        باقتك الحالية
                      </span>
                    )}
                    {!current && packageIsPaid && (
                      <span className="mt-1 inline-flex rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-bold text-terracotta">
                        مزايا احترافية
                      </span>
                    )}
                    </div>
                  </div>

                  <div className="mt-4 font-display text-2xl font-extrabold text-forest">
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

                  <details className="mt-4 group rounded-2xl bg-background/70 ring-1 ring-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-forest [&::-webkit-details-marker]:hidden">
                      <span>عرض التفاصيل</span>
                      <span className="text-lg leading-none transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                    </summary>
                    <div className="space-y-3 border-t border-line/70 px-3 pb-3 pt-3">
                      <div className="rounded-xl bg-surface p-3 text-[11px] leading-6 text-muted-foreground">
                        العقارات:{" "}
                        {displayedPropertyLimit == null
                          ? "غير محدودة"
                          : displayedPropertyLimit}
                        {" · "}
                        المميزة: {pkg.featured_limit}
                        {" · "}
                        التوثيق: {pkg.verification_included ? "مشمول" : "غير مشمول"}
                      </div>
                      {displayedFeatures.length > 0 && (
                        <ul className="space-y-2">
                          {displayedFeatures.map((f) => (
                            <li key={f} className="flex items-start gap-2 rounded-xl bg-surface px-2.5 py-2 text-xs leading-5">
                              <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
                              <span>
                                {/^توثيق المكتب(?:\s*✓)?$/.test(f.trim()) ? (
                                  <>
                                    توثيق المكتب ✓{" "}
                                    <BadgeCheck
                                      className="inline size-4 align-[-3px] text-blue-600"
                                      aria-label="علامة توثيق المكتب"
                                    />
                                  </>
                                ) : f}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>

                  {isOffice && !current && (
                    pkg.price > 0 ? (
                      <Link
                        to="/office/pay"
                        search={{ package: pkg.id }}
                        className="mt-5 block rounded-2xl bg-forest py-3 text-center text-sm font-display font-bold text-background shadow-sm transition hover:opacity-90"
                      >
                        الاشتراك في الباقة
                      </Link>
                    ) : (
                      <Link
                        to="/office/subscription"
                        className="mt-5 block rounded-2xl bg-surface py-3 text-center text-sm font-display font-bold text-forest ring-1 ring-forest/25 transition hover:bg-forest-soft"
                      >
                        اختيار الباقة
                      </Link>
                    )
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
