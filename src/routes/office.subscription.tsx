import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PlanPicker } from "@/components/PlanPicker";
import { formatDate } from "@/lib/format";
import { useMyOffice } from "@/lib/office";
import {
  FREE_FEATURES,
  FREE_PROPERTY_LIMIT,
  PLAN_LABEL,
  PRO_FEATURES,
  useMyPlan,
  useOfficePropertiesCount,
  usePlanEvents,
  useSetPlan,
  type OfficePlan,
} from "@/lib/plans";

export const Route = createFileRoute("/office/subscription")({
  head: () => ({
    meta: [
      { title: "الباقة والاشتراك | عقار البطين" },
      {
        name: "description",
        content: "باقة مكتبك الحالية ومميزاتها وحالة الاشتراك وتاريخ التجديد وخيارات الترقية.",
      },
      { property: "og:title", content: "الباقة والاشتراك | عقار البطين" },
      { property: "og:description", content: "إدارة باقة المكتب العقاري في عقار البطين." },
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
  const { plan, isPro, expired, expiresAt, startedAt, isLoading } = useMyPlan();
  const { data: count = 0 } = useOfficePropertiesCount(office?.id);
  const { data: events = [] } = usePlanEvents(office?.id);
  const setPlan = useSetPlan();
  const navigate = Route.useNavigate();

  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;
  const canRenew = daysLeft != null && daysLeft <= 7;
  const proDisabled = isPro && !expired && !canRenew;
  const proLabel = proDisabled
    ? "باقتك الحالية"
    : isPro
      ? "تجديد الاشتراك (دفع)"
      : "الترقية والدفع";

  function choose(next: OfficePlan) {
    if (!isOwner) {
      toast.error("تغيير الباقة متاح لصاحب المكتب فقط.");
      return;
    }
    if (next === "pro") {
      void navigate({ to: "/office/pay" });
      return;
    }
    if (plan === "free" && !expired) {
      toast.info("أنت على الباقة المجانية بالفعل.");
      return;
    }
    setPlan.mutate(next, {
      onSuccess: () => toast.success("تم الرجوع إلى الباقة المجانية"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تغيير الباقة"),
    });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showSearch={false} />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الباقة والاشتراك</h1>
        {isLoading && (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-forest" />
          </div>
        )}

        <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Crown className="size-4 text-terracotta" />
            ) : (
              <Sparkles className="size-4 text-forest" />
            )}
            <span className="font-display text-base font-extrabold">{PLAN_LABEL[plan]}</span>
            <span
              className={
                "ms-auto rounded-full px-2.5 py-1 text-[11px] font-bold " +
                (isPro ? "bg-forest-soft text-forest" : "bg-sand text-muted-foreground")
              }
            >
              {isPro ? "اشتراك نشط" : expired ? "منتهي — رجعت للمجانية" : "باقة مجانية"}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Row label="بداية الباقة" value={startedAt ? formatDate(startedAt) : "—"} />
            <Row
              label={isPro ? "تاريخ التجديد" : "تاريخ الانتهاء"}
              value={expiresAt ? formatDate(expiresAt) : "—"}
            />
            <Row
              label="العقارات"
              value={isPro ? `${count} (غير محدود)` : `${count} من ${FREE_PROPERTY_LIMIT}`}
            />
            <Row label="الحساب" value={office?.name ?? "—"} />
          </dl>

          {expired && (
            <p className="mt-3 rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground">
              انتهى اشتراكك الاحترافي وتم تعطيل المميزات الاحترافية فقط — بيانات المكتب والعقارات
              والمحادثات محفوظة كما هي وتعود بالكامل عند إعادة الاشتراك.
            </p>
          )}

          <ul className="mt-3 space-y-1">
            {(isPro ? PRO_FEATURES : FREE_FEATURES).slice(0, 6).map((f) => (
              <li key={f} className="text-[12px] text-muted-foreground">
                • {f}
              </li>
            ))}
          </ul>
        </div>

        <h2 className="px-1 font-display text-sm font-extrabold">الباقات المتاحة</h2>
        <PlanPicker
          current={plan}
          busyPlan={setPlan.isPending ? (setPlan.variables ?? null) : null}
          freeLabel={plan === "free" ? "باقتك الحالية" : "الرجوع إلى المجانية"}
          proLabel={proLabel}
          disableFree={plan === "free" && !expired}
          disablePro={proDisabled}
          onChoose={choose}
        />
        <p className="rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-muted-foreground">
          {proDisabled
            ? `اشتراكك الاحترافي نشط${daysLeft != null ? ` — ${daysLeft} يومًا متبقية` : ""}. يمكنك التجديد قرب انتهائه.`
            : "الدفع آمن ومشفّر عبر HyperPay (مدى، فيزا، ماستركارد). يُفعَّل اشتراكك ويُوثَّق مكتبك ✓ فور نجاح الدفع."}
        </p>

        {events.length > 0 && (
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
            <h3 className="font-display text-sm font-extrabold">سجل الاشتراك</h3>
            <ul className="mt-2 space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-[12px]">
                  <Building2 className="size-3.5 text-terracotta" />
                  <span>{e.note ?? PLAN_LABEL[e.plan as OfficePlan]}</span>
                  <span className="ms-auto text-muted-foreground">{formatDate(e.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
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
