import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Lock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProLockDialog } from "@/components/ProLock";
import { useAuth } from "@/lib/auth";
import { RoleGuard } from "@/lib/role-guard";
import { useState } from "react";
import { FREE_FEATURES, PLAN_LABEL, PLAN_PRICE, PRO_FEATURES, useMyPlan } from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "الباقات | عقار البطين" },
      {
        name: "description",
        content:
          "قارن بين الباقة المجانية والباقة الاحترافية في عقار البطين وتعرّف على المميزات المتاحة في كل باقة.",
      },
      { property: "og:title", content: "الباقات | عقار البطين" },
      {
        property: "og:description",
        content: "الباقة المجانية والباقة الاحترافية: المميزات، الأسعار، والترقية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "office", "admin"]}>
      <PlansPage />
    </RoleGuard>
  ),
});

function PlansPage() {
  const { isOffice } = useAuth();
  const { plan, isPro, expired, isLoading } = useMyPlan();
  const [locked, setLocked] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <header>
          <h1 className="font-display text-xl font-extrabold">الباقات</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            باقتك الحالية:{" "}
            <span className="font-bold text-foreground">
              {isLoading ? "..." : PLAN_LABEL[plan]}
            </span>
            {expired && " (انتهى الاشتراك الاحترافي وعاد الحساب للمجانية)"}
          </p>
        </header>

        <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-forest" />
            <h2 className="font-display text-base font-extrabold">{PLAN_LABEL.free}</h2>
            <span className="ms-auto text-xs font-bold text-muted-foreground">
              {PLAN_PRICE.free}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            متاحة تلقائيًا لكل حساب بدون أي دفع.
          </p>
          <ul className="mt-3 space-y-1.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px]">
                <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-terracotta" />
            <h2 className="font-display text-base font-extrabold">{PLAN_LABEL.pro}</h2>
            <span className="ms-auto text-xs font-bold text-terracotta">{PLAN_PRICE.pro}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isPro
              ? "جميع المميزات مفعّلة في حسابك."
              : "المميزات التالية مقفلة في باقتك الحالية — اضغط أي ميزة لمعرفة كيفية فتحها."}
          </p>

          <ul className="mt-3 space-y-1.5">
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                {isPro ? (
                  <span className="flex items-start gap-2 text-[12px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
                    {f}
                  </span>
                ) : (
                  <button
                    onClick={() => setLocked(true)}
                    className="flex w-full items-start gap-2 rounded-xl px-1 py-0.5 text-right text-[12px] text-muted-foreground hover:bg-sand"
                  >
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                    <span>{f}</span>
                    <span className="ms-auto shrink-0 text-[10px]">🔒</span>
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!isPro && (
            <Link
              to="/office/subscription"
              className="mt-4 block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background"
            >
              الترقية إلى الباقة الاحترافية
            </Link>
          )}
        </section>

        {!isOffice && (
          <p className="rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground">
            المميزات الاحترافية مخصصة لحسابات المكاتب العقارية. إذا كنت تملك مكتبًا عقاريًا، أنشئ
            حساب مكتب ثم فعّل الباقة الاحترافية.
          </p>
        )}

        <ProLockDialog open={locked} onClose={() => setLocked(false)} />
      </div>

      <BottomNav />
    </div>
  );
}
